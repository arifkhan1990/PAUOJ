import type { SeedProblem } from "./seed-problems";

export const SQL_PROBLEMS_BASIC_TEXTDATE: SeedProblem[] = [
  {
    slug: "sql-product-search",
    title: "Product keyword search",
    statement: `দোকানের সার্চ বারে কেউ \`book\` লিখলে 'SQL Handbook'-এর মতো প্রোডাক্ট উঠে আসা উচিত, আবার \`code\` লিখলে 'Clean Code'। সার্চ টিম যাচাই করতে চায় ব্যাকএন্ড ঠিক কোন কোন প্রোডাক্ট মেলাবে — ক্রেতা ছোট হাতের অক্ষরে লেখে, অথচ প্রোডাক্টের নাম বাঁধাই করা বড় হাতের অক্ষরে, তাই অক্ষরের কেস গুরুত্বপূর্ণ নয়। \`products\` থেকে এমন প্রোডাক্ট বের করো যার নামে \`book\` **বা** \`code\` শব্দটি আছে (নামের যেকোনো জায়গায়); \`name\` ও \`price_cents\` দাও, নাম অনুযায়ী সাজাও।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`name\` ও \`price_cents\` — নাম অনুযায়ী সাজানো।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## কেন দরকার
দোকানের সার্চ বার প্রতিদিন শত শত query পায়। ব্যবহারকারী ছোট হাতের অক্ষরে \`book\` লেখে, অথচ প্রোডাক্টের নাম সাজানো থাকে \`SQL Handbook\`-এর মতো বড়-ছোট মেশানো অক্ষরে। তাই মিলাতে হয় কেস উপেক্ষা করে, আর শব্দটি নামের যেকোনো জায়গায় — শুরুতে, মাঝে বা শেষে — থাকতে পারে ধরে।

## মূল ধারণা
\`LIKE '%book%'\` — শুরুর \`%\` মানে "আগে যা খুশি", শেষের \`%\` মানে "পরে যা খুশি"। কেস বাদ দিতে দুপাশেই \`lower()\` চালাও: \`lower(name) LIKE '%book%'\`। একাধিক শব্দ মেলাতে \`OR\` দিয়ে প্যাটার্ন জোড়া দাও — \`AND\` দিলে দুই শব্দই থাকতে হতো। আরেকটা wildcard আছে: \`_\` ঠিক এক অক্ষর মেলায়।

## ধাপে ধাপে
১. \`products\` থেকে \`name\`, \`price_cents\` নাও।
২. \`lower(name) LIKE '%book%'\` শর্ত দাও।
৩. \`OR lower(name) LIKE '%code%'\` যোগ করো।
৪. \`ORDER BY name\`।

## কোডে দেখি
\`\`\`sql
SELECT name, price_cents
FROM products
WHERE lower(name) LIKE '%book%'
   OR lower(name) LIKE '%code%'
ORDER BY name;
\`\`\`

## কমপ্লেক্সিটি
\`LIKE\` প্যাটার্ন মেলাতে টেবিলের প্রতিটি নাম পুরোটা পড়ে — \`O(n·m)\` (সারি × প্যাটার্নের সংখ্যা)। বড় টেবিলে ফুল-টেক্সট ইনডেক্স লাগে, এই সাইজে স্ক্যানই ঠিক।

## সাধারণ ভুল
\`LIKE 'book%'\` লিখে শুধু শুরুর ম্যাচ খোঁজা; \`lower()\` না দিয়ে কেসে আটকে যাওয়া — SQLite-র \`LIKE\` ASCII-তে কেস-ইনসেনসিটিভ হলেও সব ইঞ্জিনে তা নয়, তাই \`lower()\` অভ্যাস করো; \`OR\`-এর জায়গায় \`AND\` বসিয়ে দুই শব্দই থাকতে বাধ্য করা।`,
    difficulty: "EASY",
    points: 150,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    category: "SQL Basics",
    subcategory: "Text search",
    referencePython: "",
    referenceSql: `SELECT name, price_cents FROM products WHERE lower(name) LIKE '%book%' OR lower(name) LIKE '%code%' ORDER BY name;`,
    tests: [
      {
        input: ``,
        expectedOutput: `Clean Code	180000
SQL Handbook	95000`,
        isSample: true
      },
      {
        input: `update products set name='Coding Notebook' where id=11;`,
        expectedOutput: `Clean Code	180000
Coding Notebook	110000
SQL Handbook	95000`,
        isSample: true
      },
      {
        input: `insert into products (id,vendor_id,category_id,name,price_cents,stock,rating) values (15,6,4,'Recipe Book',30000,10,4.0);`,
        expectedOutput: `Clean Code	180000
Recipe Book	30000
SQL Handbook	95000`,
        isSample: false
      },
      {
        input: `update products set name='SQL Guide' where id=5;`,
        expectedOutput: `Clean Code	180000`,
        isSample: false
      },
      {
        input: `update products set name='Pocket Notebook' where id=2;`,
        expectedOutput: `Clean Code	180000
Pocket Notebook	220000
SQL Handbook	95000`,
        isSample: false
      },
    ],
  },
  {
    slug: "sql-q1-signups",
    title: "Q1 signups",
    statement: `গ্রোথ টিমের ত্রৈমাসিক রিপোর্টে দরকার ২০২৬ সালের প্রথম কোয়ার্টারে (১ জানুয়ারি থেকে ৩১ মার্চ) যারা নতুন অ্যাকাউন্ট খুলেছে তাদের তালিকা — পরের কোয়ার্টারের টার্গেট সেট করতে তুলনা লাগবে। \`customers\` থেকে সেই কাস্টমারদের \`name\` ও \`signup_date\` বের করো; আগে যে আগে সাইন-আপ করেছে সে আগে, একই তারিখে সাইন-আপ হলে নাম অনুযায়ী।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`name\` ও \`signup_date\` — প্রথমে \`signup_date\`, একই তারিখে \`name\` অনুযায়ী।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## কেন দরকার
গ্রোথ টিম প্রতি কোয়ার্টারে গোনে — এই তিন মাসে কতজন নতুন কাস্টমার এসেছে। ShopSphere-এ তারিখ \`YYYY-MM-DD\` ফরম্যাটের টেক্সট, আর ISO ফরম্যাটের আশীর্বাদ হলো: টেক্সট তুলনাও ক্যালেন্ডারের ক্রম মেনে চলে। তাই তারিখের রেঞ্জ আলাদা কোনো ফাংশন ছাড়াই সরাসরি তুলনা দিয়ে বের করা যায়।

## মূল ধারণা
রেঞ্জ দেওয়ার দুই পথ: \`BETWEEN '2026-01-01' AND '2026-03-31'\` (দুই মাথাসহ, পড়তে সহজ), বা \`>= '2026-01-01' AND < '2026-04-01'\` (হাফ-ওপেন রেঞ্জ — তারিখের সাথে সময় থাকলেও নিরাপদ, কারণ \`'2026-03-31 10:00'\` টেক্সট তুলনায় \`'2026-03-31'\`-এর পরে বসে)। রিপোর্ট ডিটারমিনিস্টিক করতে \`ORDER BY\`-তে দুই কলাম: আগে \`signup_date\`, টাই হলে \`name\` — নাহলে একই তারিখে ক্রম যেকোনো হতে পারে, আর টেস্ট র‍্যান্ডমলি ফেইল করে।

## ধাপে ধাপে
১. \`customers\` থেকে \`name\`, \`signup_date\` নাও।
২. কোয়ার্টারের শুরু ও শেষের তারিখ দিয়ে রেঞ্জ ফিল্টার করো — বছরটাও চেক করছো, শুধু মাস নয়।
৩. \`ORDER BY signup_date, name\` — টাই-ব্রেকার সহ।

## কোডে দেখি
\`\`\`sql
SELECT name, signup_date
FROM customers
WHERE signup_date >= '2026-01-01'
  AND signup_date <  '2026-04-01'
ORDER BY signup_date, name;
\`\`\`

## কমপ্লেক্সিটি
টেবিল স্ক্যান \`O(n)\`, সাজানো \`O(n log n)\`। তারিখ কলামে ইনডেক্স থাকলে রেঞ্জ ফিল্টার প্রায় ফ্রি।

## সাধারণ ভুল
\`MONTH(signup_date) IN (1,2,3)\` লিখে বছরের চেক ভুলে যাওয়া — ২০২৫-এর জানুয়ারিও ঢুকে পড়বে; হাফ-ওপেন রেঞ্জে \`< '2026-01-01'\` লিখে শুরুর দিনটাই বাদ দেওয়া; \`ORDER BY signup_date\` একা দিয়ে সমান তারিখে ক্রম অনির্দিষ্ট রাখা।`,
    difficulty: "EASY",
    points: 150,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    category: "SQL Basics",
    subcategory: "Date filtering",
    referencePython: "",
    referenceSql: `SELECT name, signup_date FROM customers WHERE signup_date >= '2026-01-01' AND signup_date < '2026-04-01' ORDER BY signup_date, name;`,
    tests: [
      {
        input: ``,
        expectedOutput: `Rahim	2026-01-12
Karim	2026-02-03
Nusrat	2026-02-21
Sajid	2026-03-05
Mim	2026-03-18`,
        isSample: true
      },
      {
        input: `update customers set signup_date='2026-03-25' where id=6;`,
        expectedOutput: `Rahim	2026-01-12
Karim	2026-02-03
Nusrat	2026-02-21
Sajid	2026-03-05
Mim	2026-03-18
Tanvir	2026-03-25`,
        isSample: true
      },
      {
        input: `update customers set signup_date='2026-04-10' where id in (1,2);`,
        expectedOutput: `Nusrat	2026-02-21
Sajid	2026-03-05
Mim	2026-03-18`,
        isSample: false
      },
      {
        input: `update customers set signup_date='2026-01-01' where id=5;`,
        expectedOutput: `Mim	2026-01-01
Rahim	2026-01-12
Karim	2026-02-03
Nusrat	2026-02-21
Sajid	2026-03-05`,
        isSample: false
      },
      {
        input: `update customers set signup_date='2026-02-21' where id=4;`,
        expectedOutput: `Rahim	2026-01-12
Karim	2026-02-03
Nusrat	2026-02-21
Sajid	2026-02-21
Mim	2026-03-18`,
        isSample: false
      },
    ],
  },
];
