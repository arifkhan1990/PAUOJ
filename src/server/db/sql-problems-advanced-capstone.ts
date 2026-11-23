import type { SeedProblem } from "./seed-problems";

export const SQL_PROBLEMS_ADVANCED_CAPSTONE: SeedProblem[] = [
  {
    slug: "sql-adv-vendor-scorecard",
    title: "Vendor scorecard",
    statement: `প্রতিটি ভেন্ডরের paid/shipped রেভিনিউ (সেন্টে), কতটি আলাদা অর্ডার, গড় অর্ডার ভ্যালু (সেন্টে, পূর্ণসংখ্যা) আর রেভিনিউ অনুযায়ী rank বের করো; rank অনুযায়ী সাজাও।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`vendor\`, \`revenue_cents\`, \`order_count\`, \`avg_order_cents\`, \`revenue_rank\`।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## কেন দরকার
ভেন্ডর পেমেন্ট বা পারফরম্যান্স রিভিউয়ের সময় একটাই সংখ্যা যথেষ্ট নয়। কত বিক্রি, কত অর্ডার, প্রতিটি অর্ডার গড়ে কত—একসাথে দেখলে ভালো-খারাপ ভেন্ডর চেনা যায়।

## মূল ধারণা
দুই স্তরের aggregation: প্রথমে প্রতি ভেন্ডর-প্রতি অর্ডারের মোট বের করো, তারপর ভেন্ডর ধরে যোগ/গণনা করো। একই query-তে ভেন্ডর ধরে সরাসরি \`COUNT(DISTINCT order_id)\` করলেও হয়, কিন্তু দুই স্তরের CTE-তে গড় অর্ডার ভ্যালু পরিষ্কারভাবে পাওয়া যায়। \`RANK() OVER (ORDER BY revenue_cents DESC)\` rank দেয়; টাই হলে একই rank।

## ধাপে ধাপে
১. vendors → products → order_items → orders জোড়া লাগাও।
২. paid/shipped ফিল্টার করে ভেন্ডর+অর্ডার ধরে \`SUM\`।
৩. দ্বিতীয় CTE-তে ভেন্ডর ধরে revenue, count, average।
৪. window \`RANK\` দিয়ে সাজাও।

## কোডে দেখি
\`\`\`sql
WITH vendor_orders AS (
  SELECT v.id AS vendor_id, v.name AS vendor, o.id AS order_id,
         SUM(oi.quantity * oi.unit_price_cents) AS order_cents
  FROM vendors v
  JOIN products p ON p.vendor_id = v.id
  JOIN order_items oi ON oi.product_id = p.id
  JOIN orders o ON o.id = oi.order_id
  WHERE o.status IN ('paid', 'shipped')
  GROUP BY v.id, o.id
), totals AS (
  SELECT vendor_id, vendor,
         SUM(order_cents) AS revenue_cents,
         COUNT(*) AS order_count,
         CAST(ROUND(AVG(order_cents), 0) AS INTEGER) AS avg_order_cents
  FROM vendor_orders
  GROUP BY vendor_id, vendor
)
SELECT vendor, revenue_cents, order_count, avg_order_cents,
       RANK() OVER (ORDER BY revenue_cents DESC) AS revenue_rank
FROM totals
ORDER BY revenue_rank, vendor;
\`\`\`

## কমপ্লেক্সিটি
\`O(n log n)\`।

## সাধারণ ভুল
প্রতি আইটেমে \`COUNT(*)\` করে ফেলা (অর্ডার নয়, আইটেম গোনা হয়); \`COUNT(DISTINCT order_id)\` বাদ দেওয়া; গড়ে \`ROUND\` না করে ভগ্নাংশ রাখা।`,
    difficulty: "HARD",
    points: 350,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    premiumModuleSlug: "advanced-sql",
    category: "SQL Advanced",
    subcategory: "Capstone",
    referencePython: "",
    referenceSql: `WITH vendor_orders AS (
  SELECT v.id AS vendor_id, v.name AS vendor, o.id AS order_id,
         SUM(oi.quantity*oi.unit_price_cents) AS order_cents
  FROM vendors v JOIN products p ON p.vendor_id=v.id
  JOIN order_items oi ON oi.product_id=p.id JOIN orders o ON o.id=oi.order_id
  WHERE o.status IN ('paid','shipped') GROUP BY v.id, o.id
), totals AS (
  SELECT vendor_id, vendor, SUM(order_cents) AS revenue_cents, COUNT(*) AS order_count,
         CAST(ROUND(AVG(order_cents), 0) AS INTEGER) AS avg_order_cents
  FROM vendor_orders GROUP BY vendor_id, vendor
)
SELECT vendor, revenue_cents, order_count, avg_order_cents,
       RANK() OVER (ORDER BY revenue_cents DESC) AS revenue_rank
FROM totals ORDER BY revenue_rank, vendor;`,
    tests: [
      {
        input: ``,
        expectedOutput: `TechNest	3190000	3	1063333	1
StyleHub	1100000	3	366667	2
HomeCraft	540000	2	270000	3
BookBazar	465000	2	232500	4
GadgetPoint	150000	1	150000	5`,
        isSample: true
      },
      {
        input: `update orders set status='cancelled' where id in (3,6);`,
        expectedOutput: `TechNest	3190000	3	1063333	1
StyleHub	500000	2	250000	2
HomeCraft	220000	1	220000	3
BookBazar	180000	1	180000	4
GadgetPoint	150000	1	150000	5`,
        isSample: true
      },
      {
        input: `delete from order_items where order_id=10; delete from orders where id=10;`,
        expectedOutput: `TechNest	3190000	3	1063333	1
StyleHub	720000	2	360000	2
HomeCraft	540000	2	270000	3
BookBazar	465000	2	232500	4
GadgetPoint	150000	1	150000	5`,
        isSample: false
      },
      {
        input: `insert into orders (id,customer_id,ordered_at,status) values (11,6,'2026-11-05','paid'); insert into order_items (id,order_id,product_id,quantity,unit_price_cents) values (16,11,13,1,210000);`,
        expectedOutput: `TechNest	3190000	3	1063333	1
StyleHub	1100000	3	366667	2
BookBazar	675000	3	225000	3
HomeCraft	540000	2	270000	4
GadgetPoint	150000	1	150000	5`,
        isSample: false
      },
      {
        input: `update orders set status='cancelled' where id in (3,9,10);`,
        expectedOutput: `TechNest	3190000	3	1063333	1
HomeCraft	540000	2	270000	2
BookBazar	465000	2	232500	3
GadgetPoint	150000	1	150000	4`,
        isSample: false
      },
    ],
  },
  {
    slug: "sql-adv-cohort-retention",
    title: "Cohort retention",
    statement: `কাস্টমারদের signup মাস ধরে cohort বানাও। প্রতিটি cohort-এ মোট কাস্টমার, paid/shipped অর্ডারে অন্তত দুটি অর্ডার করা কাস্টমার (repeat) আর repeat rate শতাংশে (এক দশমিক) বের করো; মাস অনুযায়ী সাজাও।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`cohort\` (YYYY-MM), \`customers\`, \`repeat_customers\`, \`repeat_rate_pct\`।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## কেন দরকার
নতুন কাস্টমার এসেছে—এটাই যথেষ্ট নয়। তারা ফিরে কিনছে কি না সেটাই ব্যবসার টেকসইতা। Signup মাস ধরে ভাগ করলে বোঝা যায় কোন মাসের কাস্টমাররা বেশি loyal।

## মূল ধারণা
প্রথমে প্রতিটি কাস্টমারের জন্য signup মাস আর paid/shipped অর্ডার সংখ্যা বের করো (\`LEFT JOIN\` যাতে একটাও অর্ডার না থাকলেও কাস্টমার বাদ না পড়ে)। তারপর cohort ধরে group করে \`COUNT(*)\`, conditional \`SUM(CASE WHEN ...)\` আর শতাংশ।

## ধাপে ধাপে
১. customers → orders LEFT JOIN, শুধু paid/shipped শর্ত JOIN-এ।
২. \`substr(signup_date, 1, 7)\` দিয়ে cohort।
৩. কাস্টমার ধরে \`COUNT(DISTINCT o.id)\`।
৪. cohort ধরে repeat গণনা ও শতাংশ।

## কোডে দেখি
\`\`\`sql
WITH customer_orders AS (
  SELECT c.id,
         substr(c.signup_date, 1, 7) AS cohort,
         COUNT(DISTINCT o.id) AS order_count
  FROM customers c
  LEFT JOIN orders o
    ON o.customer_id = c.id
   AND o.status IN ('paid', 'shipped')
  GROUP BY c.id
)
SELECT cohort,
       COUNT(*) AS customers,
       SUM(CASE WHEN order_count >= 2 THEN 1 ELSE 0 END) AS repeat_customers,
       ROUND(
         100.0 * SUM(CASE WHEN order_count >= 2 THEN 1 ELSE 0 END) / COUNT(*),
         1
       ) AS repeat_rate_pct
FROM customer_orders
GROUP BY cohort
ORDER BY cohort;
\`\`\`

## কমপ্লেক্সিটি
\`O(n log n)\`।

## সাধারণ ভুল
\`LEFT JOIN\`-এর শর্ত \`WHERE\`-এ দেওয়া (তাহলে অর্ডারহীন কাস্টমার বাদ পড়ে); \`COUNT(*)\` দিয়ে অর্ডার গোনা; শতাংশে integer division।`,
    difficulty: "HARD",
    points: 350,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    premiumModuleSlug: "advanced-sql",
    category: "SQL Advanced",
    subcategory: "Capstone",
    referencePython: "",
    referenceSql: `WITH customer_orders AS (
  SELECT c.id, substr(c.signup_date,1,7) AS cohort, COUNT(DISTINCT o.id) AS order_count
  FROM customers c LEFT JOIN orders o ON o.customer_id=c.id AND o.status IN ('paid','shipped')
  GROUP BY c.id
)
SELECT cohort, COUNT(*) AS customers,
       SUM(CASE WHEN order_count >= 2 THEN 1 ELSE 0 END) AS repeat_customers,
       ROUND(100.0 * SUM(CASE WHEN order_count >= 2 THEN 1 ELSE 0 END) / COUNT(*), 1) AS repeat_rate_pct
FROM customer_orders GROUP BY cohort ORDER BY cohort;`,
    tests: [
      {
        input: ``,
        expectedOutput: `2026-01	1	1	100.0
2026-02	2	1	50.0
2026-03	2	0	0.0
2026-04	1	0	0.0`,
        isSample: true
      },
      {
        input: `update orders set status='cancelled' where id in (3,6);`,
        expectedOutput: `2026-01	1	1	100.0
2026-02	2	0	0.0
2026-03	2	0	0.0
2026-04	1	0	0.0`,
        isSample: true
      },
      {
        input: `insert into orders (id,customer_id,ordered_at,status) values (11,6,'2026-11-05','paid'); insert into order_items (id,order_id,product_id,quantity,unit_price_cents) values (16,11,13,1,210000);`,
        expectedOutput: `2026-01	1	1	100.0
2026-02	2	1	50.0
2026-03	2	0	0.0
2026-04	1	1	100.0`,
        isSample: false
      },
      {
        input: `update orders set status='cancelled' where id in (1,4,6);`,
        expectedOutput: `2026-01	1	0	0.0
2026-02	2	1	50.0
2026-03	2	0	0.0
2026-04	1	0	0.0`,
        isSample: false
      },
      {
        input: `update orders set status='cancelled' where id in (3,9,10);`,
        expectedOutput: `2026-01	1	1	100.0
2026-02	2	0	0.0
2026-03	2	0	0.0
2026-04	1	0	0.0`,
        isSample: false
      },
    ],
  },
];
