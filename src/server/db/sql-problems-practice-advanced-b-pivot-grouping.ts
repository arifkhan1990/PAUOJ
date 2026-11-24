import type { SeedProblem } from "./seed-problems";

export const SQL_PROBLEMS_PRACTICE_ADVANCED_B_PIVOT_GROUPING: SeedProblem[] = [
  {
    slug: "sql-practice-pivot-grouping-easy",
    title: "Cart status by city",
    statement: `মার্কেটিং টিম শহর ধরে কার্টের অবস্থা দেখতে চায় — কোন শহরের কয়টা কার্ট converted (কেনাকাটা শেষ), কয়টা abandoned (ফেলে রাখা), কয়টা এখনো active। carts আর customers জোড়া লাগিয়ে শহর ধরে শর্তসাপেক্ষ যোগফল (SUM + CASE) দিয়ে বের করো। আউটপুট: city, converted, abandoned, active, total (ওই শহরের মোট কার্ট)। শহরের নাম অনুযায়ী সাজাও।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`city\`, \`converted\`, \`abandoned\`, \`active\`, \`total\`।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## ধারণা
pivot-এর মানক কৌশল conditional aggregation: GROUP BY-তে সারি-দল (শহর) ঠিক রেখে প্রতিটি স্ট্যাটাসের জন্য \`SUM(CASE WHEN status = ... THEN 1 ELSE 0 END)\` বসাও — শর্ত মেটলে সারিটা সেই কলামের যোগে 1 হিসেবে পড়ে, নাহলে 0। এক স্ক্যানেই তিনটি কলাম। কার্টের মালিকের শহর লাগলে customers-এর সাথে JOIN; GROUP BY শুধু শহর ধরবে — status নয়, নাহলে স্ট্যাটাস সারিতে নেমে এসে pivot নষ্ট হয়।

## ধাপে ধাপে
১. carts ⋈ customers।
২. GROUP BY city।
৩. তিন স্ট্যাটাসের তিনটি CASE-যোগফল + COUNT(*) মোট।
৪. ORDER BY city।

## কোডে দেখি
\`\`\`sql
SELECT cu.city,
       SUM(CASE WHEN ca.status = 'converted' THEN 1 ELSE 0 END) AS converted,
       SUM(CASE WHEN ca.status = 'abandoned' THEN 1 ELSE 0 END) AS abandoned,
       SUM(CASE WHEN ca.status = 'active' THEN 1 ELSE 0 END) AS active,
       COUNT(*) AS total
FROM carts ca
JOIN customers cu ON cu.id = ca.customer_id
GROUP BY cu.city
ORDER BY cu.city;
\`\`\`

## সাধারণ ভুল
GROUP BY-তে status-ও রেখে pivot নষ্ট করা; CASE-এ ELSE 0 বাদ দিয়ে অনুপস্থিত স্ট্যাটাসে NULL যোগফল; স্ট্যাটাসের বানান ভুল — ঐ কলাম নীরবে 0 থাকে, আউটপুট ভাঙে না তাই ধরা কঠিন; ORDER BY ছাড়া শহরের ক্রম অনির্দিষ্ট হওয়া।`,
    difficulty: "EASY",
    points: 200,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    premiumModuleSlug: "advanced-sql",
    category: "SQL Advanced",
    subcategory: "Pivot & grouping",
    referencePython: "",
    referenceSql: `SELECT cu.city,
       SUM(CASE WHEN ca.status = 'converted' THEN 1 ELSE 0 END) AS converted,
       SUM(CASE WHEN ca.status = 'abandoned' THEN 1 ELSE 0 END) AS abandoned,
       SUM(CASE WHEN ca.status = 'active' THEN 1 ELSE 0 END) AS active,
       COUNT(*) AS total
FROM carts ca
JOIN customers cu ON cu.id = ca.customer_id
GROUP BY cu.city
ORDER BY cu.city;`,
    tests: [
      {
        input: ``,
        expectedOutput: `Chattogram	1	1	0	2
Dhaka	2	0	2	4
Khulna	1	0	0	1
Sylhet	0	1	0	1`,
        isSample: true
      },
      {
        input: `update carts set status='converted' where id=6;`,
        expectedOutput: `Chattogram	1	1	0	2
Dhaka	3	0	1	4
Khulna	1	0	0	1
Sylhet	0	1	0	1`,
        isSample: true
      },
      {
        input: `update carts set status='abandoned' where id=3;`,
        expectedOutput: `Chattogram	1	1	0	2
Dhaka	1	1	2	4
Khulna	1	0	0	1
Sylhet	0	1	0	1`,
        isSample: false
      },
      {
        input: `insert into carts (id,customer_id,status,created_at,updated_at) values (9,4,'active','2026-11-20 10:00','2026-11-20 10:30');`,
        expectedOutput: `Chattogram	1	1	0	2
Dhaka	2	0	2	4
Khulna	1	0	0	1
Sylhet	0	1	1	2`,
        isSample: false
      },
      {
        input: `insert into carts (id,customer_id,status,created_at,updated_at) values (10,5,'abandoned','2026-11-21 09:00','2026-11-21 09:10');`,
        expectedOutput: `Chattogram	1	1	0	2
Dhaka	2	0	2	4
Khulna	1	1	0	2
Sylhet	0	1	0	1`,
        isSample: false
      },
    ],
  },
  {
    slug: "sql-practice-pivot-grouping-medium",
    title: "Category revenue with grand total",
    statement: `ফাইন্যান্স টিম ক্যাটাগরি ধরে paid/shipped বিক্রির রিপোর্ট চায় — সাথে সব ক্যাটাগরি মিলিয়ে একটা মোট-সারি (grand total)। বড় ডেটাবেসে ROLLUP/GROUPING SETS এই কাজ করে; SQLite-এ সেই বিকল্প ভিন্ন স্তরের SELECT-কে \`UNION ALL\` দিয়ে জোড়া দেওয়া। প্রতিটি ক্যাটাগরির জন্য এক সারি: category, revenue_cents (সেই ক্যাটাগরির order_items-এর যোগফল), order_count (ওই ক্যাটাগরিতে বিক্রি হওয়া **আলাদা অর্ডারের** সংখ্যা), customer_count (**আলাদা কাস্টমারের** সংখ্যা)। শেষ সারিতে category = 'ALL' — সেখানে চারটির মানই পুরো ডেটা ধরে **নতুন করে হিসাব** হবে, ক্যাটাগরির সারি যোগ করে নয়। বিক্রি নেই এমন ক্যাটাগরি আসবে না। ক্যাটাগরির সারিগুলো revenue_cents (বেশি থেকে কম), টাই হলে category অনুযায়ী; 'ALL' সারিটি সবার শেষে বসবে।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`category\`, \`revenue_cents\`, \`order_count\`, \`customer_count\` — শেষ সারিতে \`ALL\`।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## ধারণা
মোট-সহ ভাঙন বানানোর SQLite-বিকল্প: ভাঙনের SELECT (GROUP BY category) আর মোটের SELECT (GROUP BY ছাড়া) দুটোকে UNION ALL দিয়ে জোড়া। আসল ফাঁদ মোট-সারিতে: order_count বা customer_count যদি ক্যাটাগরির সারি থেকে যোগ করো, তাহলে একই অর্ডারের একাধিক ক্যাটাগরির পণ্য থাকলে সেই অর্ডার দুইবার গোনা হয় (ফিক্সচারে order 6-এ Books ও Home দুই ক্যাটাগরিরই পণ্য আছে)। মোট-সারি বানাতে হবে মূল সারি থেকে COUNT(DISTINCT ...) নতুন করে। revenue_cents অবশ্য সরল যোগফলেই মিলবে — দ্বিগুণ হয় শুধু "আলাদা গণনা"-র কলাম। 'ALL' সারিকে শেষে রাখতে একটা sort key (is_total) সাথে ঘুরিয়ে নাও।

## ধাপে ধাপে
১. sales CTE: orders ⋈ order_items ⋈ products ⋈ categories ⋈ customers, paid/shipped ফিল্টার, প্রতি সারিতে category, order_id, customer_id, cents।
২. per_category: GROUP BY category — SUM(cents), COUNT(DISTINCT order_id), COUNT(DISTINCT customer_id), is_total = 0।
৩. grand: GROUP BY ছাড়া একই aggregate, is_total = 1।
৪. UNION ALL দিয়ে জোড়া; ORDER BY is_total, revenue_cents DESC, category — 'ALL' শেষে।

## কোডে দেখি
\`\`\`sql
WITH sales AS (
  SELECT c.name AS category, o.id AS order_id, cu.id AS customer_id,
         oi.quantity * oi.unit_price_cents AS cents
  FROM orders o
  JOIN order_items oi ON oi.order_id = o.id
  JOIN products p ON p.id = oi.product_id
  JOIN categories c ON c.id = p.category_id
  JOIN customers cu ON cu.id = o.customer_id
  WHERE o.status IN ('paid', 'shipped')
), per_category AS (
  SELECT category, SUM(cents) AS revenue_cents,
         COUNT(DISTINCT order_id) AS order_count,
         COUNT(DISTINCT customer_id) AS customer_count,
         0 AS is_total
  FROM sales
  GROUP BY category
), grand AS (
  SELECT 'ALL' AS category, SUM(cents) AS revenue_cents,
         COUNT(DISTINCT order_id) AS order_count,
         COUNT(DISTINCT customer_id) AS customer_count,
         1 AS is_total
  FROM sales
)
SELECT category, revenue_cents, order_count, customer_count
FROM (SELECT * FROM per_category UNION ALL SELECT * FROM grand)
ORDER BY is_total, revenue_cents DESC, category;
\`\`\`

## সাধারণ ভুল
মোট-সারির order_count/customer_count ক্যাটাগরির সংখ্যা যোগ করে বানানো (দ্বিগুণ গণনা); UNION-এর জায়গায় UNION লিখে একই মানের সারি মিশিয়ে ফেলা; 'ALL' সারিকে আলাদা করার sort key না দিয়ে জায়গা অনির্দিষ্ট রাখা; GROUP BY-তে order_id রেখে ভাঙন নষ্ট করা।`,
    difficulty: "MEDIUM",
    points: 300,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    premiumModuleSlug: "advanced-sql",
    category: "SQL Advanced",
    subcategory: "Pivot & grouping",
    referencePython: "",
    referenceSql: `WITH sales AS (
  SELECT c.name AS category, o.id AS order_id, cu.id AS customer_id,
         oi.quantity * oi.unit_price_cents AS cents
  FROM orders o
  JOIN order_items oi ON oi.order_id = o.id
  JOIN products p ON p.id = oi.product_id
  JOIN categories c ON c.id = p.category_id
  JOIN customers cu ON cu.id = o.customer_id
  WHERE o.status IN ('paid', 'shipped')
), per_category AS (
  SELECT category, SUM(cents) AS revenue_cents,
         COUNT(DISTINCT order_id) AS order_count,
         COUNT(DISTINCT customer_id) AS customer_count,
         0 AS is_total
  FROM sales
  GROUP BY category
), grand AS (
  SELECT 'ALL' AS category, SUM(cents) AS revenue_cents,
         COUNT(DISTINCT order_id) AS order_count,
         COUNT(DISTINCT customer_id) AS customer_count,
         1 AS is_total
  FROM sales
)
SELECT category, revenue_cents, order_count, customer_count
FROM (SELECT * FROM per_category UNION ALL SELECT * FROM grand)
ORDER BY is_total, revenue_cents DESC, category;`,
    tests: [
      {
        input: ``,
        expectedOutput: `Electronics	3340000	3	2
Men	860000	2	2
Home	540000	2	2
Books	465000	2	2
Fashion	240000	2	1
ALL	5445000	8	5`,
        isSample: true
      },
      {
        input: `update orders set status='cancelled' where id=3;`,
        expectedOutput: `Electronics	3340000	3	2
Home	540000	2	2
Books	465000	2	2
Men	380000	1	1
Fashion	120000	1	1
ALL	4845000	7	5`,
        isSample: true
      },
      {
        input: `insert into orders (id,customer_id,ordered_at,status) values (11,2,'2026-11-05','paid'); insert into order_items (id,order_id,product_id,quantity,unit_price_cents) values (16,11,13,1,210000);`,
        expectedOutput: `Electronics	3340000	3	2
Men	860000	2	2
Home	540000	2	2
Books	465000	2	2
Fashion	240000	2	1
Fiction	210000	1	1
ALL	5655000	9	5`,
        isSample: false
      },
      {
        input: `update orders set status='pending' where id=6;`,
        expectedOutput: `Electronics	3340000	3	2
Men	860000	2	2
Fashion	240000	2	1
Home	220000	1	1
Books	180000	1	1
ALL	4840000	7	5`,
        isSample: false
      },
      {
        input: `update orders set status='cancelled' where id=9;`,
        expectedOutput: `Electronics	3340000	3	2
Men	860000	2	2
Home	540000	2	2
Books	465000	2	2
Fashion	120000	1	1
ALL	5325000	7	5`,
        isSample: false
      },
    ],
  },
];
