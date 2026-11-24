import type { SeedProblem } from "./seed-problems";

export const SQL_PROBLEMS_PRACTICE_BASIC_TEXT_DATES_TIME: SeedProblem[] = [
  {
    slug: "sql-practice-text-dates-time-easy",
    title: "SKU pattern scan",
    statement: `ওয়্যারহাউসের স্ক্যানার মনিটর সিরিজের ভ্যারিয়েন্ট গুনছে — SKU নম্বরগুলো \`MON-\` দিয়ে শুরু হয়। \`product_variants\` থেকে সেই ভ্যারিয়েন্টগুলোর \`sku\`, \`price_cents\` ও \`stock\` বের করো; SKU অনুযায়ী সাজাও।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`sku\`, \`price_cents\`, \`stock\` — SKU অনুযায়ী সাজানো।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## ধারণা
\`GLOB 'MON-*'\` — GLOB-এ wildcard হলো \`*\` (যেকোনো কিছু) আর \`?\` (ঠিক এক অক্ষর), \`LIKE\`-এর \`%\`/\`_\` নয়। বড় কথা: GLOB **কেস-সেনসিটিভ** — \`mon-*\` লিখলে কিছুই মেলে না, অথচ SQLite-র LIKE ASCII-তে কেস নিজেই মেনে নেয়। SKU-র মতো ফাইলনেম-ধাঁচের আইডেন্টিফায়ারে তাই GLOB-ই স্বাভাবিক পছন্দ।

## ধাপে ধাপে
১. \`WHERE sku GLOB 'MON-*'\`।
২. \`ORDER BY sku\`।

## কোডে দেখি
\`\`\`sql
SELECT sku, price_cents, stock
FROM product_variants
WHERE sku GLOB 'MON-*'
ORDER BY sku;
\`\`\`

## সাধারণ ভুল
\`LIKE\`-এর \`%\` GLOB-এ লিখে (\`MON-%\`) খালি ফল পাওয়া; \`mon-*\` ছোট হাতের লিখে কিছু না পাওয়া; দুপাশে \`*\` দিয়ে (\`*MON-*\`) শুরুর শর্ত নরম করা; \`ORDER BY\` ছাড়া প্রতিবার ভিন্ন ক্রম।`,
    difficulty: "EASY",
    points: 150,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    category: "SQL Basics",
    subcategory: "Text, dates & time",
    referencePython: "",
    referenceSql: `SELECT sku, price_cents, stock FROM product_variants WHERE sku GLOB 'MON-*' ORDER BY sku;`,
    tests: [
      {
        input: ``,
        expectedOutput: `MON-27-BLK	1850000	3
MON-32-BLK	2350000	2`,
        isSample: true
      },
      {
        input: `insert into product_variants (id,product_id,sku,size,color,price_cents,stock) values (13,3,'MON-24-GRY','24in','gray',1650000,5);`,
        expectedOutput: `MON-24-GRY	1650000	5
MON-27-BLK	1850000	3
MON-32-BLK	2350000	2`,
        isSample: true
      },
      {
        input: `update product_variants set sku='mon-27-BLK' where id=3;`,
        expectedOutput: `MON-32-BLK	2350000	2`,
        isSample: false
      },
      {
        input: `update product_variants set stock=0 where id=4;`,
        expectedOutput: `MON-27-BLK	1850000	3
MON-32-BLK	2350000	0`,
        isSample: false
      },
      {
        input: `insert into product_variants (id,product_id,sku,size,color,price_cents,stock) values (14,9,'MON-STAND-BLK','standard','black',150000,9);`,
        expectedOutput: `MON-27-BLK	1850000	3
MON-32-BLK	2350000	2
MON-STAND-BLK	150000	9`,
        isSample: false
      },
    ],
  },
  {
    slug: "sql-practice-text-dates-time-medium",
    title: "Stale undelivered orders",
    statement: `অপস টিমের নিয়ম — কার্যকর অর্ডার ১৪ দিনের বেশি পুরনো হলে আর অপেক্ষা চলে না। রিপোর্ট তারিখ ২০২৬-১১-১৫ ধরে এমন অর্ডার বের করো যার স্ট্যাটাস \`paid\`/\`shipped\`, বয়স ১৪ দিনের বেশি, আর এখনো \`delivered\` হয়নি — \`order_id\`, \`customer\`, \`ordered_at\` ও পূর্ণ দিনে বয়স \`age_days\`; বয়স বেশি থেকে কম, সমান হলে অর্ডার আইডি অনুযায়ী।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`order_id\`, \`customer\`, \`ordered_at\`, \`age_days\` — বয়স নিচের ক্রমে, সমান হলে \`order_id\` অনুযায়ী।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## ধারণা
বয়স মাপতে \`julianday\` — রিপোর্ট তারিখ থেকে অর্ডারের তারিখ বিয়োগ করলে দিনের ব্যবধান পাওয়া যায়, \`CAST(... AS INTEGER)\` ভগ্নাংশ ফেলে পূর্ণ দিন রাখে। সীমার শর্তে একই এক্সপ্রেশন আবার লিখতে হয় — \`age_days\` alias \`WHERE\`-এ ধরা যায় না, কারণ \`WHERE\` \`SELECT\`-এর আগে চলে। আর 'এখনো delivered হয়নি' মানে হয় শিপমেন্ট নেই, নয় শিপমেন্ট \`delivered\` নয় — দুই-ই \`NOT EXISTS\`-এর ভেতরে এক শর্তে বসে যায়।

## ধাপে ধাপে
১. বয়সের সীমা: \`julianday('2026-11-15') - julianday(o.ordered_at) > 14\`।
২. \`NOT EXISTS (SELECT 1 FROM shipments s WHERE s.order_id = o.id AND s.status = 'delivered')\`।
৩. \`CAST(... AS INTEGER) AS age_days\` সিলেক্টে বসাও।
৪. \`ORDER BY age_days DESC, o.id\`।

## কোডে দেখি
\`\`\`sql
SELECT o.id AS order_id, c.name AS customer, o.ordered_at,
       CAST(julianday('2026-11-15') - julianday(o.ordered_at) AS INTEGER) AS age_days
FROM orders o
JOIN customers c ON c.id = o.customer_id
WHERE o.status IN ('paid','shipped')
  AND julianday('2026-11-15') - julianday(o.ordered_at) > 14
  AND NOT EXISTS (
    SELECT 1 FROM shipments s
    WHERE s.order_id = o.id AND s.status = 'delivered'
  )
ORDER BY age_days DESC, o.id;
\`\`\`

## সাধারণ ভুল
\`WHERE age_days > 14\` লিখে অস্তিত্বহীন alias-এ আটকানো; ১৪ দিনের সীমা \`>=\` দিয়ে ঠিক ১৪ দিন-পূর্ণ অর্ডারও তুলে নেওয়া; \`NOT EXISTS\`-এর ভেতরে \`s.status='delivered'\` ভুলে delivered অর্ডারও তালিকায় আনা; \`CAST\` ছাড়া ভগ্নাংশ-সহ বয়স ছাপা।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    category: "SQL Basics",
    subcategory: "Text, dates & time",
    referencePython: "",
    referenceSql: `SELECT o.id AS order_id, c.name AS customer, o.ordered_at, CAST(julianday('2026-11-15') - julianday(o.ordered_at) AS INTEGER) AS age_days FROM orders o JOIN customers c ON c.id = o.customer_id WHERE o.status IN ('paid','shipped') AND julianday('2026-11-15') - julianday(o.ordered_at) > 14 AND NOT EXISTS (SELECT 1 FROM shipments s WHERE s.order_id = o.id AND s.status = 'delivered') ORDER BY age_days DESC, o.id;`,
    tests: [
      {
        input: ``,
        expectedOutput: `4	Rahim	2026-10-10	36
7	Mim	2026-10-22	24`,
        isSample: true
      },
      {
        input: `update shipments set status='delivered', delivered_at='2026-10-14' where id=3;`,
        expectedOutput: `7	Mim	2026-10-22	24`,
        isSample: true
      },
      {
        input: `update shipments set status='delivered', delivered_at='2026-11-01' where id=5;`,
        expectedOutput: `4	Rahim	2026-10-10	36`,
        isSample: false
      },
      {
        input: `update orders set ordered_at='2026-10-30' where id=10;`,
        expectedOutput: `4	Rahim	2026-10-10	36
7	Mim	2026-10-22	24
10	Tanvir	2026-10-30	16`,
        isSample: false
      },
      {
        input: `update shipments set status='delivered' where id=5; insert into orders (id,customer_id,ordered_at,status) values (11,6,'2026-10-25','paid'); insert into order_items (id,order_id,product_id,quantity,unit_price_cents) values (16,11,13,1,210000);`,
        expectedOutput: `4	Rahim	2026-10-10	36
11	Tanvir	2026-10-25	21`,
        isSample: false
      },
    ],
  },
];
