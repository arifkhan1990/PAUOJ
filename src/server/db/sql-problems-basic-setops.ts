import type { SeedProblem } from "./seed-problems";

export const SQL_PROBLEMS_BASIC_SETOPS: SeedProblem[] = [
  {
    slug: "sql-marketplace-cities",
    title: "Marketplace cities",
    statement: `ShopSphere-এর লজিস্টিক টিম কুরিয়ার পার্টনারের জন্য কভারেজ ম্যাপ বানাচ্ছে। ভেন্ডররা যেসব শহর থেকে মাল পাঠায় আর কাস্টমাররা যেসব শহরে থাকে — দুই দিক মিলিয়ে একটাই ইউনিক শহরের তালিকা দরকার, নাহলে ম্যাপে একই শহর বারবার চলে আসে। \`vendors\` আর \`customers\` — দুই টেবিলের \`city\` এক করে বের করো; প্রতিটি শহর একবারই আসবে, নাম অনুযায়ী সাজাও।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`city\` — শহরের নাম অনুযায়ী সাজানো, কোনো শহর দুইবার নয়।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## কেন দরকার
কভারেজ ম্যাপের মতো অনেক রিপোর্টে দুই ভিন্ন টেবিল থেকে একই ধরনের তালিকা জোড়া দিতে হয়। ভেন্ডর যেসব শহর থেকে মাল পাঠায় আর কাস্টমার যেসব শহরে থাকে — দুটো আলাদা করে বসালে একই শহর দুইবার চলে আসে। \`UNION\` দুই query-র ফল এক স্তূপে মেশায় আর ডুপ্লিকেট নিজেই বাদ দেয়, তাই কভারেজ তালিকা একবারেই তৈরি হয়।

## মূল ধারণা
\`UNION\` দুই SELECT-এর সারি উপরে-নিচে জোড়া দেয় এবং একই সারি একবারই রাখে; \`UNION ALL\` ডুপ্লিকেটও রাখে। শহরের নাম দুই টেবিলেই বহুবার আছে (একাধিক ভেন্ডর একই শহরে), তাই এখানে \`UNION\`-ই দরকার। জোড়া দেওয়ার সময় দুপাশের কলাম সংখ্যা ও ধরন মিলতে হয় — দুপাশেই একটি করে \`city\`। \`ORDER BY\` লেখে পুরো ফলাফলের শেষে, কারণ সাজানো হয় জোড়া দেওয়ার *পরের* সেটটাকে।

## ধাপে ধাপে
১. ভেন্ডরের শহর: \`SELECT city FROM vendors\`।
২. কাস্টমারের শহর: \`SELECT city FROM customers\`।
৩. মাঝে \`UNION\` বসাও — ডুপ্লিকেট নিজেই বাদ পড়বে।
৪. শেষে \`ORDER BY city\` দিয়ে তালিকা সাজাও।

## কোডে দেখি
\`\`\`sql
SELECT city FROM vendors
UNION
SELECT city FROM customers
ORDER BY city;
\`\`\`

## কমপ্লেক্সিটি
দুই টেবিলের সব সারি একবার পড়ে ডুপ্লিকেট বাদ দিতে হয়, তাই \`O(n log n)\` — এই সাইজের ডেটায় মুহূর্তেই চলে।

## সাধারণ ভুল
\`UNION ALL\` লিখে ডুপ্লিকেট রেখে দেওয়া; দুই SELECT-এর ভিতরে আলাদা আলাদা \`ORDER BY\` দেওয়া (শুধু শেষে একবার লাগে); UNION-এর দুপাশে কলাম সংখ্যা না মেলানো।`,
    difficulty: "EASY",
    points: 150,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    category: "SQL Basics",
    subcategory: "Set operations",
    referencePython: "",
    referenceSql: `SELECT city FROM vendors UNION SELECT city FROM customers ORDER BY city;`,
    tests: [
      {
        input: ``,
        expectedOutput: `Chattogram
Dhaka
Khulna
Rajshahi
Sylhet`,
        isSample: true
      },
      {
        input: `insert into vendors (id,name,city,rating) values (7,'CraftCorner','Barisal',4.4);`,
        expectedOutput: `Barisal
Chattogram
Dhaka
Khulna
Rajshahi
Sylhet`,
        isSample: true
      },
      {
        input: `update vendors set city='Cumilla' where id=6;`,
        expectedOutput: `Chattogram
Cumilla
Dhaka
Khulna
Sylhet`,
        isSample: false
      },
      {
        input: `delete from vendors where id=6;`,
        expectedOutput: `Chattogram
Dhaka
Khulna
Sylhet`,
        isSample: false
      },
      {
        input: `update customers set city='Cumilla' where id=5;`,
        expectedOutput: `Chattogram
Cumilla
Dhaka
Khulna
Rajshahi
Sylhet`,
        isSample: false
      },
    ],
  },
  {
    slug: "sql-unreviewed-buyers",
    title: "Buyers without a review",
    statement: `ShopSphere-এর ইনগেজমেন্ট টিম 'রিভিউ লিখো, পুরস্কার পাও' ক্যাম্পেইন চালাবে। টার্গেট তারাই যারা অর্ডার দিয়েছে কিন্তু কোনোদিন একটি রিভিউও লেখেনি — কেনা প্রোডাক্টের অভিজ্ঞতা তাদের কাছে জানার মতো আছে। \`orders\`-এ অন্তত একটি অর্ডার আছে কিন্তু \`reviews\` টেবিলে কোনো রেকর্ড নেই — এমন কাস্টমারের নাম বের করো (\`NOT EXISTS\` বা \`EXCEPT\` দুই পথেই পারবে), নাম অনুযায়ী সাজাও।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`name\` — নাম অনুযায়ী সাজানো।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## কেন দরকার
মার্কেটপ্লেসে রিভিউ হলো সোশ্যাল প্রুফ — কিন্তু সব ক্রেতা তা লেখে না। ইনগেজমেন্ট টিম জানতে চায় কারা কেনা করেছে অথচ একটি রিভিউও দেয়নি, যাতে ঠিক তাদেরই টার্গেট করে রিমাইন্ডার যায়। এই "আছে এক টেবিলে, নেই আরেক টেবিলে" ধরনের প্রশ্নের নাম anti-join — ডেটা কোয়ালিটি নজরদারিরও একটা বড় অংশ।

## মূল ধারণা
দুইটি পথ আছে। \`NOT EXISTS\` — বাইরের প্রতিটি কাস্টমারের জন্য ভেতরের ছোট query চেক করে: এই কাস্টমারের অর্ডার আছে কি, রিভিউ আছে কি। দুই শর্ত AND দিয়ে জুড়ে যায়: \`EXISTS\` (অর্ডার আছে) আর \`NOT EXISTS\` (রিভিউ নেই)। \`EXCEPT\` দিয়েও লেখা যায় — প্রথম সেট থেকে দ্বিতীয় সেটে যা আছে তা বাদ যায় — কিন্তু EXCEPT পুরো সারি মেলায়, তাই নাম দিয়ে করলে একই নামের দুইজন মানুষ একসাথে হারাতে পারে। আইডি-ভিত্তিক \`NOT EXISTS\` সেজন্যই নিরাপদ।

## ধাপে ধাপে
১. \`customers\` থেকে নাম নাও।
২. \`EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id)\` — অন্তত একটি অর্ডার আছে।
৩. \`AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.customer_id = c.id)\` — একটি রিভিউও নেই।
৪. \`ORDER BY name\`।

## কোডে দেখি
\`\`\`sql
SELECT c.name
FROM customers c
WHERE EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id)
  AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.customer_id = c.id)
ORDER BY c.name;
\`\`\`

## কমপ্লেক্সিটি
প্রতি কাস্টমারের জন্য দুইটি ছোট সাবকোয়েরি চলে — নমিনাল \`O(n·m)\`, তবে ইনডেক্স থাকলে বাস্তবে প্রায় লিনিয়ার।

## সাধারণ ভুল
শুধু \`NOT EXISTS\` দিয়ে অর্ডার-নেই কাস্টমারও রেখে দেওয়া (অর্ডার-আছে শর্তটা ভুলে যাওয়া); \`NOT IN\` ব্যবহার করে NULL-এর ফাঁদে পড়া — সাবকোয়েরিতে একটি NULL থাকলে \`NOT IN\` কোনো সারিই ফেরত দেয় না; EXCEPT-এ নাম মিলিয়ে একই নামের আলাদা দুইজন কাস্টমার গুলিয়ে ফেলা।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    category: "SQL Basics",
    subcategory: "Set operations",
    referencePython: "",
    referenceSql: `SELECT c.name FROM customers c WHERE EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id) AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.customer_id = c.id) ORDER BY c.name;`,
    tests: [
      {
        input: ``,
        expectedOutput: `Sajid
Tanvir`,
        isSample: true
      },
      {
        input: `insert into reviews (id,product_id,customer_id,rating,created_at) values (7,14,6,4,'2026-11-05');`,
        expectedOutput: `Sajid`,
        isSample: true
      },
      {
        input: `delete from reviews where customer_id=5;`,
        expectedOutput: `Mim
Sajid
Tanvir`,
        isSample: false
      },
      {
        input: `insert into reviews (id,product_id,customer_id,rating,created_at) values (7,8,4,3,'2026-11-01');`,
        expectedOutput: `Tanvir`,
        isSample: false
      },
      {
        input: `insert into customers (id,name,city,signup_date) values (7,'Farhana','Barisal','2026-05-11'); insert into orders (id,customer_id,ordered_at,status) values (11,7,'2026-11-05','paid');`,
        expectedOutput: `Farhana
Sajid
Tanvir`,
        isSample: false
      },
    ],
  },
];
