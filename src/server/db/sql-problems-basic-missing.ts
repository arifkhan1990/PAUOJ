import type { SeedProblem } from "./seed-problems";

export const SQL_PROBLEMS_BASIC_MISSING: SeedProblem[] = [
  {
    slug: "sql-unsold-products",
    title: "Dead stock",
    statement: `এখনো একটাও paid/shipped অর্ডারে বিক্রি হয়নি এমন প্রোডাক্টের নাম, ভেন্ডরের নাম আর বর্তমান স্টক বের করো; প্রোডাক্টের নাম অনুযায়ী সাজাও।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`name\`, \`vendor\`, \`stock\`।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## কেন দরকার
দোকানের সব প্রোডাক্ট বিক্রি হয় না। কোন প্রোডাক্ট একবারও বিক্রি হয়নি—এই তালিকাই dead stock। ম্যানেজার এই তালিকা দেখে দাম কমায়, প্রোমোশন দেয় বা নতুন অর্ডার বন্ধ করে।

## মূল ধারণা
\`NOT EXISTS\` একটি correlated subquery: প্রতিটি প্রোডাক্টের জন্য দেখে, তার আইডি দিয়ে কোনো paid/shipped order_item আছে কি না। না থাকলে প্রোডাক্টটি ফলাফলে আসে। \`LEFT JOIN ... WHERE oi.id IS NULL\` দিয়েও করা যায়, কিন্তু \`NOT EXISTS\` সাধারণত পড়তে পরিষ্কার এবং NULL নিয়ে কম ঝামেলা করে।

## ধাপে ধাপে
১. products-এর সাথে vendors জোড়া লাগাও।
২. subquery-তে order_items আর orders জোড়া লাগিয়ে শুধু \`paid\`/\`shipped\` রাখো।
৩. বাইরের query-তে \`WHERE NOT EXISTS (...)\` দাও।
৪. নাম অনুযায়ী সাজাও, যাতে ফলাফল প্রতিবার একই থাকে।

## কোডে দেখি
\`\`\`sql
SELECT p.name, v.name AS vendor, p.stock
FROM products p
JOIN vendors v ON v.id = p.vendor_id
WHERE NOT EXISTS (
  SELECT 1
  FROM order_items oi
  JOIN orders o ON o.id = oi.order_id
  WHERE oi.product_id = p.id
    AND o.status IN ('paid', 'shipped')
)
ORDER BY p.name;
\`\`\`

## কমপ্লেক্সিটি
order_items-এ \`product_id\`/\`order_id\` index থাকলে প্রায় \`O(n log m)\`; না থাকলে প্রতিটি প্রোডাক্টের জন্য স্ক্যান হয়।

## সাধারণ ভুল
\`cancelled\`/\`pending\` অর্ডারও গোনা; \`LEFT JOIN\`-এর পর ভুল টেবিলে \`IS NULL\` চেক করা; \`NOT IN\` ব্যবহার করা যখন subquery NULL ফেরাতে পারে।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    category: "SQL Basics",
    subcategory: "NULL & CASE",
    referencePython: "",
    referenceSql: `SELECT p.name, v.name AS vendor, p.stock
FROM products p JOIN vendors v ON v.id=p.vendor_id
WHERE NOT EXISTS (SELECT 1 FROM order_items oi JOIN orders o ON o.id=oi.order_id
  WHERE oi.product_id=p.id AND o.status IN ('paid','shipped'))
ORDER BY p.name;`,
    tests: [
      {
        input: ``,
        expectedOutput: `Dune	BookBazar	12
Webcam	TechNest	2
Wireless Mouse	GadgetPoint	3`,
        isSample: true
      },
      {
        input: `update orders set status='cancelled' where id in (3,9,10);`,
        expectedOutput: `Cotton Panjabi	StyleHub	14
Denim Jacket	StyleHub	7
Dune	BookBazar	12
Leather Wallet	StyleHub	25
Webcam	TechNest	2
Wireless Mouse	GadgetPoint	3`,
        isSample: true
      },
      {
        input: `delete from order_items where order_id=10; delete from orders where id=10;`,
        expectedOutput: `Denim Jacket	StyleHub	7
Dune	BookBazar	12
Webcam	TechNest	2
Wireless Mouse	GadgetPoint	3`,
        isSample: false
      },
      {
        input: `insert into orders (id,customer_id,ordered_at,status) values (11,6,'2026-11-05','paid'); insert into order_items (id,order_id,product_id,quantity,unit_price_cents) values (16,11,13,1,210000);`,
        expectedOutput: `Webcam	TechNest	2
Wireless Mouse	GadgetPoint	3`,
        isSample: false
      },
      {
        input: `update orders set status='cancelled' where id=4;`,
        expectedOutput: `27in Monitor	TechNest	5
Dune	BookBazar	12
Laptop Stand	GadgetPoint	11
Webcam	TechNest	2
Wireless Mouse	GadgetPoint	3`,
        isSample: false
      },
    ],
  },
  {
    slug: "sql-stock-health",
    title: "Stock health buckets",
    statement: `প্রতিটি প্রোডাক্টকে স্টক অনুযায়ী bucket-এ ভাগ করো: স্টক ০ হলে \`out_of_stock\`, ১০-এর কম হলে \`low_stock\`, নাহলে \`healthy\`। প্রতিটি bucket-এ কতটি প্রোডাক্ট আছে বের করো; bucket নাম অনুযায়ী সাজাও।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`status\`, \`product_count\`।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## কেন দরকার
শুধু সংখ্যা দেখলে বোঝা যায় না কোথায় সমস্যা। স্টককে কয়েকটি অর্থপূর্ণ bucket-এ ভাগ করলে ইনভেন্টরি রিপোর্ট এক নজরে পড়া যায়।

## মূল ধারণা
\`CASE WHEN ... THEN ... ELSE ... END\` একটি নতুন কলাম তৈরি করে। তারপর সেই কলাম দিয়েই \`GROUP BY\` করা যায়। শর্তের ক্রম গুরুত্বপূর্ণ: \`stock = 0\` শর্তটি \`stock < 10\`-এর আগে রাখতে হবে, নাহলে ০ স্টকও low bucket-এ পড়বে।

## ধাপে ধাপে
১. \`CASE\` দিয়ে status কলাম বানাও।
২. status ধরে \`COUNT(*)\`।
৩. status অনুযায়ী সাজাও, যাতে আউটপুট নির্ভরযোগ্য হয়।

## কোডে দেখি
\`\`\`sql
SELECT
  CASE
    WHEN stock = 0 THEN 'out_of_stock'
    WHEN stock < 10 THEN 'low_stock'
    ELSE 'healthy'
  END AS status,
  COUNT(*) AS product_count
FROM products
GROUP BY status
ORDER BY status;
\`\`\`

## কমপ্লেক্সিটি
একবার স্ক্যান, তারপর ছোট গ্রুপ — \`O(n log k)\`।

## সাধারণ ভুল
শর্তের ক্রম উল্টে দেওয়া; \`ELSE\` বাদ দেওয়া (NULL স্টক থাকলে NULL bucket হয়); \`GROUP BY\`-তে alias ব্যবহার করে কিছু ডায়ালেক্টে সমস্যা — এখানে alias সাপোর্টেড।`,
    difficulty: "EASY",
    points: 150,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    category: "SQL Basics",
    subcategory: "NULL & CASE",
    referencePython: "",
    referenceSql: `SELECT CASE WHEN stock = 0 THEN 'out_of_stock'
       WHEN stock < 10 THEN 'low_stock' ELSE 'healthy' END AS status,
       COUNT(*) AS product_count
FROM products GROUP BY status ORDER BY status;`,
    tests: [
      {
        input: ``,
        expectedOutput: `healthy	7
low_stock	7`,
        isSample: true
      },
      {
        input: `update products set stock=0 where id in (4,5);`,
        expectedOutput: `healthy	6
low_stock	6
out_of_stock	2`,
        isSample: true
      },
      {
        input: `update products set stock=0 where id<=5;`,
        expectedOutput: `healthy	5
low_stock	4
out_of_stock	5`,
        isSample: false
      },
      {
        input: `update products set stock=20 where stock<10;`,
        expectedOutput: `healthy	14`,
        isSample: false
      },
      {
        input: `update products set stock=9 where stock>=10;`,
        expectedOutput: `low_stock	14`,
        isSample: false
      },
    ],
  },
];
