import type { SeedProblem } from "./seed-problems";

export const SQL_PROBLEMS_PRACTICE_BASIC_MORE_SET_OPERATIONS: SeedProblem[] = [
  {
    slug: "sql-practice-set-operations-hard",
    title: "Two-sided cities",
    statement: `মার্কেটপ্লেস-বিস্তার টিম জানতে চায় কোন কোন শহরে আমাদের দুই দিকই আছে — অন্তত একজন ভেন্ডর এবং অন্তত একজন কাস্টমার। \`vendors\` আর \`customers\` — দুই টেবিলেই যেসব \`city\` আছে, প্রতি শহরে \`vendors\` (ভেন্ডর সংখ্যা) ও \`customers\` (কাস্টমার সংখ্যা) বের করো; শহর অনুযায়ী সাজাও। যে শহরে শুধু এক দিক আছে, সে তালিকায় আসবে না।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`city\`, \`vendors\`, \`customers\` — শহর অনুযায়ী।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## ধারণা
দুই দিকের মোহনা \`INTERSECT\`: \`SELECT city FROM vendors INTERSECT SELECT city FROM customers\` — উভয় পাশে যে শহরগুলো আছে, ডুপ্লিকেট সরিয়ে ইউনিক। এরপর সেটিকে derived টেবিল বানিয়ে প্রতি শহরে দুই দিকের কাউন্ট আলাদা correlated সাবকোয়েরিতে গুনলেই হয় — এক শহরে যত ভেন্ডর/কাস্টমারই থাকুক, সারি থাকবে শহর-প্রতি একটাই, কোনো জোড়া-ফ্যান-আউট নেই।

## ধাপে ধাপে
১. \`(SELECT city FROM vendors INTERSECT SELECT city FROM customers) AS t\` — দুই-দিকের শহর।
২. \`(SELECT COUNT(*) FROM vendors v WHERE v.city = t.city) AS vendors\`।
৩. একইভাবে \`customers\`-এর কাউন্ট।
৪. \`ORDER BY t.city\`।

## কোডে দেখি
\`\`\`sql
SELECT t.city,
       (SELECT COUNT(*) FROM vendors v WHERE v.city = t.city) AS vendors,
       (SELECT COUNT(*) FROM customers c WHERE c.city = t.city) AS customers
FROM (SELECT city FROM vendors INTERSECT SELECT city FROM customers) AS t
ORDER BY t.city;
\`\`\`

## সাধারণ ভুল
\`UNION\` দিয়ে সব শহর এনে এক-দিকের শহরও তালিকায় টানা — প্রশ্ন দুই দিকের ছেদ; দুই টেবিল জুড়ে একসাথে গোনার চেষ্টা — ভেন্ডর×কাস্টমার জোড়ে ফ্যান-আউট; INTERSECT-এর দুই পাশে কলাম সংখ্যা না মেলালো সরাসরি error; derived টেবিলে alias না দিয়ে বাইরের কাউন্টগুলো ঠিকঠাক বাঁধতে না পারা।`,
    difficulty: "HARD",
    points: 250,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    category: "SQL Basics",
    subcategory: "Set operations",
    referencePython: "",
    referenceSql: `SELECT t.city, (SELECT COUNT(*) FROM vendors v WHERE v.city = t.city) AS vendors, (SELECT COUNT(*) FROM customers c WHERE c.city = t.city) AS customers FROM (SELECT city FROM vendors INTERSECT SELECT city FROM customers) AS t ORDER BY t.city;`,
    tests: [
      {
        input: ``,
        expectedOutput: `Chattogram	1	1
Dhaka	2	3
Khulna	1	1
Sylhet	1	1`,
        isSample: true
      },
      {
        input: `insert into customers (id,name,city,signup_date) values (7,'Salma','Rajshahi','2026-05-01');`,
        expectedOutput: `Chattogram	1	1
Dhaka	2	3
Khulna	1	1
Rajshahi	1	1
Sylhet	1	1`,
        isSample: true
      },
      {
        input: `update vendors set city='Khulna' where id=6;`,
        expectedOutput: `Chattogram	1	1
Dhaka	2	3
Khulna	2	1
Sylhet	1	1`,
        isSample: false
      },
      {
        input: `insert into vendors (id,name,city,rating) values (7,'GadgetGhoroa','Dhaka',4.5);`,
        expectedOutput: `Chattogram	1	1
Dhaka	3	3
Khulna	1	1
Sylhet	1	1`,
        isSample: false
      },
      {
        input: `update customers set city='Rajshahi' where id=1;`,
        expectedOutput: `Chattogram	1	1
Dhaka	2	2
Khulna	1	1
Rajshahi	1	1
Sylhet	1	1`,
        isSample: false
      },
    ],
  },
  {
    slug: "sql-practice-set-operations-challenge",
    title: "One row per reachable customer",
    statement: `ইমেইল ক্যাম্পেইনের তালিকা বানাচ্ছে মার্কেটিং টিম: যেসব কাস্টমার হয় এখনো একটা \`active\` কার্ট রাখছে, নয়তো কখনো ৫-স্টার রিভিউ লিখেছে — এই দুই দলের ইউনিয়ন লাগবে। একই কাস্টমার দুই দলেই পড়লে তালিকায় একবারই থাকবে। তাদের \`name\` ও \`city\` বের করো; নাম অনুযায়ী সাজাও।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`name\`, \`city\` — নাম অনুযায়ী; কেউ দুইবার নয়।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## ধারণা
দুই সূত্র থেকে আসা একই সারি একবার রাখতে \`UNION\` — সেট-অপারেটর ডুপ্লিকেট সরিয়ে দেয়; \`UNION ALL\` সরায় না। বেস ডেটাতেই এমন একজন আছে যার একদিকে active কার্ট, অন্যদিকে ৫-স্টার রিভিউ — \`UNION ALL\` লিখলেই সে দুইবার ছাপা হয়ে যাবে, আর লুকানো টেস্টে আরও বেশি। প্রতিটি দিক \`IN (সাবকোয়েরি)\` দিয়ে ছাঁকা, মাঝখানে \`UNION\`।

## ধাপে ধাপে
১. প্রথম দল: \`WHERE cu.id IN (SELECT customer_id FROM carts WHERE status = 'active')\`।
২. দ্বিতীয় দল: \`WHERE cu.id IN (SELECT customer_id FROM reviews WHERE rating = 5)\`।
৩. মাঝখানে \`UNION\` — ALL নয়।
৪. শেষে \`ORDER BY name, city\`।

## কোডে দেখি
\`\`\`sql
SELECT cu.name, cu.city
FROM customers cu
WHERE cu.id IN (SELECT customer_id FROM carts WHERE status = 'active')
UNION
SELECT cu.name, cu.city
FROM customers cu
WHERE cu.id IN (SELECT customer_id FROM reviews WHERE rating = 5)
ORDER BY name, city;
\`\`\`

## সাধারণ ভুল
\`UNION ALL\` লিখে দুই-দলে থাকা কাস্টমারকে দুইবার ছাপা; দুই পাশের কলাম সংখ্যা/ক্রম না মেলানো; \`ORDER BY\` কোনো এক পাশের ভেতরে ঢুকিয়ে দেওয়া — কম্পাউন্ড SELECT-এ ক্রম নির্ধারণ করে একদম শেষেরটাই; কার্টের 'active' ছাঁকনি ভুলে সব কার্ট-মালিককে টেনে আনা।`,
    difficulty: "MEDIUM",
    points: 225,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    category: "SQL Basics",
    subcategory: "Set operations",
    referencePython: "",
    referenceSql: `SELECT cu.name, cu.city FROM customers cu WHERE cu.id IN (SELECT customer_id FROM carts WHERE status = 'active') UNION SELECT cu.name, cu.city FROM customers cu WHERE cu.id IN (SELECT customer_id FROM reviews WHERE rating = 5) ORDER BY name, city;`,
    tests: [
      {
        input: ``,
        expectedOutput: `Mim	Khulna
Nusrat	Dhaka
Rahim	Dhaka
Tanvir	Dhaka`,
        isSample: true
      },
      {
        input: `insert into carts (id,customer_id,status,created_at,updated_at) values (9,4,'active','2026-11-12 09:00','2026-11-12 09:10');`,
        expectedOutput: `Mim	Khulna
Nusrat	Dhaka
Rahim	Dhaka
Sajid	Sylhet
Tanvir	Dhaka`,
        isSample: true
      },
      {
        input: `update carts set status='abandoned' where id=6;`,
        expectedOutput: `Mim	Khulna
Nusrat	Dhaka
Rahim	Dhaka`,
        isSample: false
      },
      {
        input: `insert into reviews (id,product_id,customer_id,rating,created_at) values (7,3,2,5,'2026-11-12');`,
        expectedOutput: `Karim	Chattogram
Mim	Khulna
Nusrat	Dhaka
Rahim	Dhaka
Tanvir	Dhaka`,
        isSample: false
      },
      {
        input: `delete from reviews where id in (3,5);`,
        expectedOutput: `Rahim	Dhaka
Tanvir	Dhaka`,
        isSample: false
      },
    ],
  },
];
