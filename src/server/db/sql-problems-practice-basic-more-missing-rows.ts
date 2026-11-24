import type { SeedProblem } from "./seed-problems";

export const SQL_PROBLEMS_PRACTICE_BASIC_MORE_MISSING_ROWS: SeedProblem[] = [
  {
    slug: "sql-practice-missing-rows-hard",
    title: "Vendors with nothing delivered",
    statement: `অপারেশন টিম দেখতে চায় কোন ভেন্ডরের একটাও প্রোডাক্ট এখনো কোনো কাস্টমারের হাতে পৌঁছায়নি — অর্থাৎ তাদের কোনো প্রোডাক্ট এমন কোনো অর্ডারে নেই যার shipment \`delivered\`। সেসব ভেন্ডরের \`vendor\` (নাম), \`city\` আর তাদের ক্যাটালগে মোট কতটা প্রোডাক্ট আছে (\`product_count\`, শূন্যও হতে পারে) বের করো; নাম অনুযায়ী সাজাও।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`vendor\`, \`city\`, \`product_count\` — নাম অনুযায়ী।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## ধারণা
এবারের anti-join লম্বা: ভেন্ডর → প্রোডাক্ট → order_items → orders → shipments — পাঁচ ধাপের শৃঙ্খল, শেষ শর্ত \`delivered\`। \`NOT EXISTS\`-এর ভেতরে পুরো শৃঙ্খলটা চালিয়ে জিজ্ঞেস করা হয়: এই ভেন্ডরের কোনো প্রোডাক্ট কি delivered shipment-এর অর্ডারে পড়েছে? বাইরের কাউন্টটা আলাদা সাবকোয়েরিতে — ক্যাটালগ খালি ভেন্ডরও (কাউন্ট ০) ফলে থাকবে।

## ধাপে ধাপে
১. \`FROM vendors v\` — কাউন্ট আনো \`(SELECT COUNT(*) FROM products p WHERE p.vendor_id = v.id) AS product_count\`।
২. \`WHERE NOT EXISTS (...)\` — ভেতরে \`products p JOIN order_items oi ON oi.product_id = p.id JOIN orders o ON o.id = oi.order_id JOIN shipments s ON s.order_id = o.id AND s.status = 'delivered'\`, শর্ত \`WHERE p.vendor_id = v.id\`।
৩. \`ORDER BY v.name\`।

## কোডে দেখি
\`\`\`sql
SELECT v.name AS vendor, v.city,
       (SELECT COUNT(*) FROM products p WHERE p.vendor_id = v.id) AS product_count
FROM vendors v
WHERE NOT EXISTS (
  SELECT 1
  FROM products p
  JOIN order_items oi ON oi.product_id = p.id
  JOIN orders o ON o.id = oi.order_id
  JOIN shipments s ON s.order_id = o.id AND s.status = 'delivered'
  WHERE p.vendor_id = v.id
)
ORDER BY v.name;
\`\`\`

## সাধারণ ভুল
শৃঙ্খলের কোনো জোড়া বাদ দিয়ে প্রোডাক্ট-আইডি সরাসরি orders-এ খোঁজা; \`delivered\` শর্ত না দিয়ে যেকোনো shipment-কেই ঢোকানো; কাউন্টের জন্য \`JOIN products\` করে খালি-ক্যাটালগ ভেন্ডর হারানো; কেউ না-পাওয়া মানেই query ভুল নয় — ডেটাতে সত্যিই সবাই ডেলিভার করে থাকতে পারে, প্রথম স্যাম্পলই সেটা যাচাই করে নাও।`,
    difficulty: "HARD",
    points: 250,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    category: "SQL Basics",
    subcategory: "NULL & CASE",
    referencePython: "",
    referenceSql: `SELECT v.name AS vendor, v.city, (SELECT COUNT(*) FROM products p WHERE p.vendor_id = v.id) AS product_count FROM vendors v WHERE NOT EXISTS (SELECT 1 FROM products p JOIN order_items oi ON oi.product_id = p.id JOIN orders o ON o.id = oi.order_id JOIN shipments s ON s.order_id = o.id AND s.status = 'delivered' WHERE p.vendor_id = v.id) ORDER BY v.name;`,
    tests: [
      {
        input: ``,
        expectedOutput: `GadgetPoint	Sylhet	2
PaperTrail	Rajshahi	0`,
        isSample: true
      },
      {
        input: `update shipments set status='delivered' where order_id=4;`,
        expectedOutput: `PaperTrail	Rajshahi	0`,
        isSample: true
      },
      {
        input: `insert into products (id,vendor_id,category_id,name,price_cents,stock,rating) values (15,6,4,'Paper Notebook',60000,50,4.2);`,
        expectedOutput: `GadgetPoint	Sylhet	2
PaperTrail	Rajshahi	1`,
        isSample: false
      },
      {
        input: `update shipments set status='shipped' where order_id=1;`,
        expectedOutput: `GadgetPoint	Sylhet	2
PaperTrail	Rajshahi	0
TechNest	Dhaka	4`,
        isSample: false
      },
      {
        input: `delete from shipments where order_id=6;`,
        expectedOutput: `GadgetPoint	Sylhet	2
HomeCraft	Khulna	2
PaperTrail	Rajshahi	0`,
        isSample: false
      },
    ],
  },
  {
    slug: "sql-practice-missing-rows-challenge",
    title: "Never referred anyone",
    statement: `রেফারেল প্রোগ্রাম অডিট চলছে: \`customers\` থেকে যেসব কাস্টমার কখনো কাউকে refer করেনি — অর্থাৎ \`referrals\`-এ কোনো সারির \`referred_by\`-তে তাদের আইডি নেই — তাদের \`name\` ও \`city\` বের করো; নাম অনুযায়ী সাজাও। সাবধান: \`referrals\`-এ এমন সারিও আছে যার \`referred_by\` NULL — নিজের সমাধান যাচাই করার সময় সেটার কথা মাথায় রেখো।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`name\`, \`city\` — নাম অনুযায়ী।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## ধারণা
'কেউ আমাকে refer করেনি' আর 'আমি কাউকে refer করিনি' — দুই ভিন্ন প্রশ্ন; এখানে দ্বিতীয়টা। হাত বেঁধে \`id NOT IN (SELECT referred_by FROM referrals)\` লিখতে ইচ্ছে করে — কিন্তু সাবকোয়েরির তালিকায় একটা NULL থাকলে (এই টেবিলে আছেই) \`NOT IN\`-এর প্রতিটি তুলনা NULL-ফল দেয়, কোনো সারিই শর্ত মেলায় না, ফল নীরবে খালি। \`NOT EXISTS\` এই বিষে পড়ে না: সে সংযোগ \`referred_by = c.id\` দিয়ে সরাসরি খোঁজে।

## ধাপে ধাপে
১. \`FROM customers c\`।
২. \`WHERE NOT EXISTS (SELECT 1 FROM referrals r WHERE r.referred_by = c.id)\`।
৩. \`ORDER BY c.name\`।

## কোডে দেখি
\`\`\`sql
SELECT c.name, c.city
FROM customers c
WHERE NOT EXISTS (SELECT 1 FROM referrals r WHERE r.referred_by = c.id)
ORDER BY c.name;
\`\`\`

## সাধারণ ভুল
\`NOT IN\` লিখে খালি ফল পাওয়া — NULL-বিষ নীরবে বসে থাকে, query 'ঠিকই' চলে যায়; \`referred_by\`-এর বদলে \`customer_id\` দিয়ে উল্টো প্রশ্নের ('কাউকে refer করা হয়নি') উত্তর বানানো; যদি একান্তই \`NOT IN\` লাগে, ভেতরে \`WHERE referred_by IS NOT NULL\` জুড়ে বিষ বের করতে হবে।`,
    difficulty: "MEDIUM",
    points: 225,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    category: "SQL Basics",
    subcategory: "NULL & CASE",
    referencePython: "",
    referenceSql: `SELECT c.name, c.city FROM customers c WHERE NOT EXISTS (SELECT 1 FROM referrals r WHERE r.referred_by = c.id) ORDER BY c.name;`,
    tests: [
      {
        input: ``,
        expectedOutput: `Mim	Khulna
Nusrat	Dhaka
Sajid	Sylhet
Tanvir	Dhaka`,
        isSample: true
      },
      {
        input: `update referrals set referred_by=3 where customer_id=6;`,
        expectedOutput: `Mim	Khulna
Sajid	Sylhet
Tanvir	Dhaka`,
        isSample: true
      },
      {
        input: `update referrals set referred_by=6 where customer_id=4;`,
        expectedOutput: `Mim	Khulna
Nusrat	Dhaka
Sajid	Sylhet`,
        isSample: false
      },
      {
        input: `insert into customers (id,name,city,signup_date) values (7,'Salma','Dhaka','2026-05-01');`,
        expectedOutput: `Mim	Khulna
Nusrat	Dhaka
Sajid	Sylhet
Salma	Dhaka
Tanvir	Dhaka`,
        isSample: false
      },
      {
        input: `update referrals set referred_by=NULL where customer_id=2; delete from referrals where customer_id=3;`,
        expectedOutput: `Mim	Khulna
Nusrat	Dhaka
Rahim	Dhaka
Sajid	Sylhet
Tanvir	Dhaka`,
        isSample: false
      },
    ],
  },
];
