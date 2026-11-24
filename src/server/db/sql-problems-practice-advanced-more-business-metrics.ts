import type { SeedProblem } from "./seed-problems";

export const SQL_PROBLEMS_PRACTICE_ADVANCED_MORE_BUSINESS_METRICS: SeedProblem[] = [
  {
    slug: "sql-practice-business-metrics-hard",
    title: "Repeat buyer rate by city",
    statement: `সিটি মার্কেটিং টিম জানতে চায় কোন শহরে কাস্টমার ফিরে আসে। প্রতিটি শহরের সব কাস্টমার ধরো; যাদের ২ বা বেশি paid/shipped অর্ডার তারা repeat buyer। বের করো: শহরের কাস্টমার সংখ্যা, repeat buyer সংখ্যা, repeat rate (শতকরা, ১ দশমিক), আর repeat buyer-দের অর্ডারগুলোর গড় মান (সেন্টে, পূর্ণসংখ্যা)। repeat buyer না থাকা শহরে গড় NULL হবে। আউটপুট কলাম: city, customers, repeat_buyers, repeat_rate_pct, repeat_avg_order_cents। শহরের নাম অনুযায়ী সাজাও।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`city\`, \`customers\`, \`repeat_buyers\`, \`repeat_rate_pct\`, \`repeat_avg_order_cents\`, নাম অনুযায়ী। repeat না থাকলে গড় \`\\N\`।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## ধারণা
তিন স্তরের CTE: প্রথমে অর্ডার-ভিত্তিক মান, তারপর কাস্টমার-ভিত্তিক স্ট্যাট (কতটা অর্ডার, মোট খরচ), শেষে শহরে গুনে ফেলা। “প্রতি অর্ডারের মান” আগে বের না করে সরাসরি শহরে গুনলে কাস্টমারের অর্ডার-সংখ্যা হারিয়ে যায় — এই স্তরভাগ আসল কাজ।

## ধাপে ধাপে
১. cust_orders: প্রতি paid/shipped অর্ডারের customer, city, cents (GROUP BY order)।
২. cust_stats: কাস্টমার ধরে paid_orders ও total_cents।
৩. city_stats: মোট কাস্টমার, repeat ফ্ল্যাগ ধরে repeat_buyers/repeat_cents/repeat_orders।
৪. rate = 100*repeat_buyers/customers; গড় = repeat_cents/repeat_orders (শূন্য হলে NULL)।

## কোডে দেখি
\`\`\`sql
WITH cust_orders AS (
  SELECT o.id, cu.id AS customer_id, cu.city,
         SUM(oi.quantity*oi.unit_price_cents) AS cents
  FROM orders o JOIN customers cu ON cu.id=o.customer_id
  JOIN order_items oi ON oi.order_id=o.id
  WHERE o.status IN ('paid','shipped') GROUP BY o.id, cu.id, cu.city),
cust_stats AS (
  SELECT customer_id, city, COUNT(*) AS paid_orders, SUM(cents) AS total_cents
  FROM cust_orders GROUP BY customer_id, city),
city_stats AS (
  SELECT city, COUNT(*) AS customers,
         SUM(CASE WHEN paid_orders >= 2 THEN 1 ELSE 0 END) AS repeat_buyers,
         SUM(CASE WHEN paid_orders >= 2 THEN total_cents ELSE 0 END) AS repeat_cents,
         SUM(CASE WHEN paid_orders >= 2 THEN paid_orders ELSE 0 END) AS repeat_orders
  FROM cust_stats GROUP BY city)
SELECT city, customers, repeat_buyers,
       ROUND(100.0*repeat_buyers/customers, 1) AS repeat_rate_pct,
       CAST(ROUND(repeat_cents*1.0/NULLIF(repeat_orders,0), 0) AS INTEGER) AS repeat_avg_order_cents
FROM city_stats ORDER BY city;
\`\`\`

## সাধারণ ভুল
অর্ডার না গুনে আইটেম গুনলে একই অর্ডারের একাধিক আইটেম আলাদা “অর্ডার” হয়ে repeat-এ ভুয়া বাড়তি দেখায়; repeat_rate-এ ভাগ করতে গিয়ে মোট কাস্টমারের বদলে buyer সংখ্যা দেওয়া; repeat_orders=0 হলে গড়ের ভাগ শূন্য দিয়ে হয় — NULL আসা-ই সঠিক।`,
    difficulty: "HARD",
    points: 320,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    premiumModuleSlug: "advanced-sql",
    category: "SQL Advanced",
    subcategory: "Analytics",
    referencePython: "",
    referenceSql: `WITH cust_orders AS (
  SELECT o.id, cu.id AS customer_id, cu.city, SUM(oi.quantity*oi.unit_price_cents) AS cents
  FROM orders o JOIN customers cu ON cu.id=o.customer_id
  JOIN order_items oi ON oi.order_id=o.id
  WHERE o.status IN ('paid','shipped') GROUP BY o.id, cu.id, cu.city),
cust_stats AS (
  SELECT customer_id, city, COUNT(*) AS paid_orders, SUM(cents) AS total_cents
  FROM cust_orders GROUP BY customer_id, city),
city_stats AS (
  SELECT city, COUNT(*) AS customers,
         SUM(CASE WHEN paid_orders >= 2 THEN 1 ELSE 0 END) AS repeat_buyers,
         SUM(CASE WHEN paid_orders >= 2 THEN total_cents ELSE 0 END) AS repeat_cents,
         SUM(CASE WHEN paid_orders >= 2 THEN paid_orders ELSE 0 END) AS repeat_orders
  FROM cust_stats GROUP BY city)
SELECT city, customers, repeat_buyers,
       ROUND(100.0*repeat_buyers/customers, 1) AS repeat_rate_pct,
       CAST(ROUND(repeat_cents*1.0/NULLIF(repeat_orders,0), 0) AS INTEGER) AS repeat_avg_order_cents
FROM city_stats ORDER BY city;`,
    tests: [
      {
        input: ``,
        expectedOutput: `Chattogram	1	0	0.0	\\N
Dhaka	3	2	66.7	843000
Khulna	1	0	0.0	\\N`,
        isSample: true
      },
      {
        input: `update orders set status='cancelled' where id=6;`,
        expectedOutput: `Chattogram	1	0	0.0	\\N
Dhaka	3	2	66.7	902500
Khulna	1	0	0.0	\\N`,
        isSample: true
      },
      {
        input: `insert into orders (id,customer_id,ordered_at,status) values (11,2,'2026-11-04','paid'); insert into order_items (id,order_id,product_id,quantity,unit_price_cents) values (16,11,5,1,95000);`,
        expectedOutput: `Chattogram	1	1	100.0	137500
Dhaka	3	2	66.7	843000
Khulna	1	0	0.0	\\N`,
        isSample: false
      },
      {
        input: `update orders set status='paid' where id=2;`,
        expectedOutput: `Chattogram	1	1	100.0	180000
Dhaka	3	2	66.7	843000
Khulna	1	0	0.0	\\N`,
        isSample: false
      },
      {
        input: `insert into customers (id,name,city,signup_date) values (7,'Farhana','Dhaka','2026-11-01'); insert into orders (id,customer_id,ordered_at,status) values (12,7,'2026-11-03','paid'); insert into order_items (id,order_id,product_id,quantity,unit_price_cents) values (17,12,4,1,180000);`,
        expectedOutput: `Chattogram	1	0	0.0	\\N
Dhaka	4	2	50.0	843000
Khulna	1	0	0.0	\\N`,
        isSample: false
      },
    ],
  },
  {
    slug: "sql-practice-business-metrics-challenge",
    title: "New vs returning revenue",
    statement: `প্রতি মাসের রেভিনিউ দুই ভাগে ভাঙো: যে অর্ডারটি ওই কাস্টমারের সার্বিক প্রথম paid/shipped অর্ডার তার টাকা “নতুন কাস্টমার”, বাকি সব “ফিরে আসা”। প্রতি মাসের জন্য বের করো নতুন কাস্টমার-রেভিনিউ, ফিরে আসা রেভিনিউ এবং ফিরে আসার অংশ (মোটের শতকরা, ১ দশমিক)। সতর্কতা: “প্রথম অর্ডার” মানতে হবে কাস্টমারের সবচেয়ে পুরনো paid/shipped অর্ডারটি — মাস ধরে নয়। আউটপুট কলাম: month, new_customer_cents, returning_cents, returning_pct। মাস অনুযায়ী সাজাও।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`month\` (\`YYYY-MM\`), \`new_customer_cents\`, \`returning_cents\`, \`returning_pct\`, মাস অনুযায়ী।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## ধারণা
সব অর্ডারের মধ্যে কোনটি “কাস্টমারের প্রথম” তা বের করতে হবে সার্বিকভাবে: \`ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY ordered_at, id)\` — rn=1 মানেই সে মাসের নতুন কাস্টমারের প্রথম কেনা। মাস ধরে MIN করলে ভুল হয়, কারণ একই মাসের পরের অর্ডারগুলোও “প্রথম মাস”-এ পড়ে যায়।

## ধাপে ধাপে
১. order_totals: প্রতি paid/shipped অর্ডারের customer, ordered_at, month, cents।
২. ranked: কাস্টমার ধরে ordered_at, id ক্রমে rn।
৩. month ধরে GROUP BY: rn=1 → new, rn>1 → returning।
৪. returning_pct = 100*returning/মোট, ORDER BY month।

## কোডে দেখি
\`\`\`sql
WITH order_totals AS (
  SELECT o.id, o.customer_id, o.ordered_at, substr(o.ordered_at,1,7) AS month,
         SUM(oi.quantity*oi.unit_price_cents) AS cents
  FROM orders o JOIN order_items oi ON oi.order_id=o.id
  WHERE o.status IN ('paid','shipped')
  GROUP BY o.id, o.customer_id, o.ordered_at, month),
ranked AS (
  SELECT *, ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY ordered_at, id) AS rn
  FROM order_totals)
SELECT month,
       SUM(CASE WHEN rn=1 THEN cents ELSE 0 END) AS new_customer_cents,
       SUM(CASE WHEN rn>1 THEN cents ELSE 0 END) AS returning_cents,
       ROUND(100.0*SUM(CASE WHEN rn>1 THEN cents ELSE 0 END)/SUM(cents), 1) AS returning_pct
FROM ranked GROUP BY month ORDER BY month;
\`\`\`

## সাধারণ ভুল
প্রতি মাসে MIN(month)=মাস মিলিয়ে “নতুন” ঠাওয়া — তাতে একই মাসের পরের অর্ডারও নতুন হয়ে যায় আর returning সবসময় 0 আসে; signup_date দিয়ে ঠাওয়া (paid অর্ডার না-হলে সে কখনোই নতুন কাস্টমার রেভিনিউ দেয় না); টাই-এর সময় id টাই-ব্রেক না দিলে কে “প্রথম” অনির্দিষ্ট হয়ে যায়।`,
    difficulty: "HARD",
    points: 340,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    premiumModuleSlug: "advanced-sql",
    category: "SQL Advanced",
    subcategory: "Analytics",
    referencePython: "",
    referenceSql: `WITH order_totals AS (
  SELECT o.id, o.customer_id, o.ordered_at, substr(o.ordered_at,1,7) AS month,
         SUM(oi.quantity*oi.unit_price_cents) AS cents
  FROM orders o JOIN order_items oi ON oi.order_id=o.id
  WHERE o.status IN ('paid','shipped')
  GROUP BY o.id, o.customer_id, o.ordered_at, month),
ranked AS (
  SELECT *, ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY ordered_at, id) AS rn
  FROM order_totals)
SELECT month,
       SUM(CASE WHEN rn=1 THEN cents ELSE 0 END) AS new_customer_cents,
       SUM(CASE WHEN rn>1 THEN cents ELSE 0 END) AS returning_cents,
       ROUND(100.0*SUM(CASE WHEN rn>1 THEN cents ELSE 0 END)/SUM(cents), 1) AS returning_pct
FROM ranked GROUP BY month ORDER BY month;`,
    tests: [
      {
        input: ``,
        expectedOutput: `2026-10	2340000	2725000	53.8
2026-11	380000	0	0.0`,
        isSample: true
      },
      {
        input: `insert into orders (id,customer_id,ordered_at,status) values (11,2,'2026-11-04','paid'); insert into order_items (id,order_id,product_id,quantity,unit_price_cents) values (16,11,5,1,95000);`,
        expectedOutput: `2026-10	2340000	2725000	53.8
2026-11	380000	95000	20.0`,
        isSample: true
      },
      {
        input: `update orders set status='cancelled' where id=1;`,
        expectedOutput: `2026-10	3450000	725000	17.4
2026-11	380000	0	0.0`,
        isSample: false
      },
      {
        input: `update orders set ordered_at='2026-09-15' where id=8;`,
        expectedOutput: `2026-09	180000	0	0.0
2026-10	2160000	2725000	55.8
2026-11	380000	0	0.0`,
        isSample: false
      },
      {
        input: `insert into orders (id,customer_id,ordered_at,status) values (12,6,'2026-11-05','paid'); insert into order_items (id,order_id,product_id,quantity,unit_price_cents) values (17,12,6,1,240000);`,
        expectedOutput: `2026-10	2340000	2725000	53.8
2026-11	380000	240000	38.7`,
        isSample: false
      },
    ],
  },
];
