import type { SeedProblem } from "./seed-problems";

export const SQL_PROBLEMS_PRACTICE_ADVANCED_A_BUSINESS_METRICS: SeedProblem[] = [
  {
    slug: "sql-practice-business-metrics-easy",
    title: "Customer city revenue share",
    statement: `মার্কেটিং টিম শহরভিত্তিক প্রচার চালাবে। প্রতিটি শহরের কাস্টমারদের paid/shipped অর্ডারে মোট খরচ (সেন্টে) বের করো—কেনাকাটা না থাকলে 0—আর সেটি পুরো মার্কেটপ্লেসের মোট খরচের কত শতাংশ (এক দশমিক) তাও। শহরের কাস্টমার-সংখ্যাও দেখাও; কোনো শহর বাদ যাবে না। আউটপুট কলাম: city, customers, spend_cents, share_pct। আগে খরচ (বেশি থেকে কম), টাইলে শহরের নাম অনুযায়ী সাজাও।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`city\`, \`customers\`, \`spend_cents\`, \`share_pct\`, খরচ ও নাম অনুযায়ী।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## ধারণা
শহর ধরে খরচ আগে, তারপর \`SUM(spend_cents) OVER ()\`—খালি OVER () মানে সব সারি মিলিয়ে মোট, যেটা ভাগের হর হয়। শহর বাদ যাবে না, তাই customers থেকে LEFT JOIN; paid/shipped শর্তটা CASE-এর ভেতরে দিলে বাতিল অর্ডারের শহরও 0 নিয়ে টিকে থাকে।

## ধাপে ধাপে
১. customers LEFT JOIN orders LEFT JOIN order_items।
২. CASE দিয়ে paid/shipped খরচ, শহর ধরে GROUP BY; COUNT(DISTINCT customer)।
৩. window SUM OVER () দিয়ে মোট, 100.0 গুণ করে শতাংশ।
৪. ROUND করে ORDER BY spend DESC, city।

## কোডে দেখি
\`\`\`sql
WITH city_spend AS (
  SELECT cu.city, COUNT(DISTINCT cu.id) AS customers,
         COALESCE(SUM(CASE WHEN o.status IN ('paid','shipped') THEN oi.quantity * oi.unit_price_cents ELSE 0 END), 0) AS spend_cents
  FROM customers cu
  LEFT JOIN orders o ON o.customer_id = cu.id
  LEFT JOIN order_items oi ON oi.order_id = o.id
  GROUP BY cu.city
)
SELECT city, customers, spend_cents,
       ROUND(spend_cents * 100.0 / SUM(spend_cents) OVER (), 1) AS share_pct
FROM city_spend
ORDER BY spend_cents DESC, city;
\`\`\`

## সাধারণ ভুল
WHERE-এ status ফিল্টার দিয়ে শূন্য-খরচ শহর হারানো; \`COUNT(*)\` লিখে order_items-এর সারি গুনে কাস্টমার বেশি দেখানো; \`100\` দিয়ে integer division-এ শতাংশ শূন্য করা।`,
    difficulty: "EASY",
    points: 200,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    premiumModuleSlug: "advanced-sql",
    category: "SQL Advanced",
    subcategory: "Analytics",
    referencePython: "",
    referenceSql: `WITH city_spend AS (SELECT cu.city, COUNT(DISTINCT cu.id) AS customers, COALESCE(SUM(CASE WHEN o.status IN ('paid','shipped') THEN oi.quantity*oi.unit_price_cents ELSE 0 END), 0) AS spend_cents FROM customers cu LEFT JOIN orders o ON o.customer_id=cu.id LEFT JOIN order_items oi ON oi.order_id=o.id GROUP BY cu.city) SELECT city, customers, spend_cents, ROUND(spend_cents * 100.0 / SUM(spend_cents) OVER (), 1) AS share_pct FROM city_spend ORDER BY spend_cents DESC, city;`,
    tests: [
      {
        input: ``,
        expectedOutput: `Dhaka	3	4595000	84.4
Khulna	1	670000	12.3
Chattogram	1	180000	3.3
Sylhet	1	0	0.0`,
        isSample: true
      },
      {
        input: `update orders set status='cancelled' where id=4;`,
        expectedOutput: `Dhaka	3	2595000	75.3
Khulna	1	670000	19.4
Chattogram	1	180000	5.2
Sylhet	1	0	0.0`,
        isSample: true
      },
      {
        input: `insert into orders (id,customer_id,ordered_at,status) values (11,4,'2026-11-08','paid'); insert into order_items (id,order_id,product_id,quantity,unit_price_cents) values (16,11,13,2,210000);`,
        expectedOutput: `Dhaka	3	4595000	78.3
Khulna	1	670000	11.4
Sylhet	1	420000	7.2
Chattogram	1	180000	3.1`,
        isSample: false
      },
      {
        input: `update orders set status='shipped' where id=5;`,
        expectedOutput: `Dhaka	3	4595000	81.8
Khulna	1	670000	11.9
Chattogram	1	180000	3.2
Sylhet	1	170000	3.0`,
        isSample: false
      },
      {
        input: `update order_items set unit_price_cents=200000 where id=6;`,
        expectedOutput: `Dhaka	3	2945000	77.6
Khulna	1	670000	17.7
Chattogram	1	180000	4.7
Sylhet	1	0	0.0`,
        isSample: false
      },
    ],
  },
  {
    slug: "sql-practice-business-metrics-medium",
    title: "Category monthly growth",
    statement: `ক্যাটাগরি ম্যানেজার জানতে চায় নিজের ক্যাটাগরি মাসে মাসে কেমন করছে। paid/shipped অর্ডার থেকে প্রতিটি ক্যাটাগরির মাসিক রেভিনিউ (সেন্টে) বের করো, আর সেই ক্যাটাগরির আগের মাসের তুলনায় শতকরা পরিবর্তন (এক দশমিক) দেখাও। ক্যাটাগরির প্রথম মাসের growth NULL হবে; একবারও বিক্রি না হওয়া ক্যাটাগরি আউটপুটে আসবে না। আউটপুট কলাম: category, month, revenue_cents, growth_pct। ক্যাটাগরি, তারপর মাস অনুযায়ী সাজাও।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`category\`, \`month\` (YYYY-MM), \`revenue_cents\`, \`growth_pct\` (ক্যাটাগরির প্রথম মাসে \`\\N\`)।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## ধারণা
আগের মাসের মান আনতে \`LAG(revenue_cents) OVER (PARTITION BY category ORDER BY month)\`। PARTITION BY category না দিলে LAG আগের সারি টেনে নেয়—মানে অন্য ক্যাটাগরির শেষ মাস! ক্যাটাগরির প্রথম মাসে LAG NULL দেয়, আর NULL দিয়ে হিসাব করলে পুরো গড় বা শতাংশ NULL হয়ে যায়—সেটাই প্রত্যাশিত।

## ধাপে ধাপে
১. orders JOIN order_items JOIN products JOIN categories, paid/shipped।
২. ক্যাটাগরি (id) + মাস ধরে SUM।
৩. LAG PARTITION BY category ORDER BY month।
৪. 100.0 গুণ করে ROUND, ORDER BY category, month।

## কোডে দেখি
\`\`\`sql
WITH monthly AS (
  SELECT c.name AS category, substr(o.ordered_at, 1, 7) AS month,
         SUM(oi.quantity * oi.unit_price_cents) AS revenue_cents
  FROM orders o
  JOIN order_items oi ON oi.order_id = o.id
  JOIN products p ON p.id = oi.product_id
  JOIN categories c ON c.id = p.category_id
  WHERE o.status IN ('paid', 'shipped')
  GROUP BY c.id, month
)
SELECT category, month, revenue_cents,
       ROUND(100.0 * (revenue_cents - LAG(revenue_cents) OVER (PARTITION BY category ORDER BY month))
             / LAG(revenue_cents) OVER (PARTITION BY category ORDER BY month), 1) AS growth_pct
FROM monthly
ORDER BY category, month;
\`\`\`

## সাধারণ ভুল
PARTITION BY বাদ দিয়ে অন্য ক্যাটাগরির মান ধার করা; প্রথম মাসের NULL-কে 0 ভেবে ভুল গ্রোথ বের করা; \`100\` লিখে integer division; GROUP BY-তে c.id-এর বদলে নাম ব্যবহার করা।`,
    difficulty: "MEDIUM",
    points: 300,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    premiumModuleSlug: "advanced-sql",
    category: "SQL Advanced",
    subcategory: "Analytics",
    referencePython: "",
    referenceSql: `WITH monthly AS (SELECT c.name AS category, substr(o.ordered_at,1,7) AS month, SUM(oi.quantity*oi.unit_price_cents) AS revenue_cents FROM orders o JOIN order_items oi ON oi.order_id=o.id JOIN products p ON p.id=oi.product_id JOIN categories c ON c.id=p.category_id WHERE o.status IN ('paid','shipped') GROUP BY c.id, month) SELECT category, month, revenue_cents, ROUND(100.0 * (revenue_cents - LAG(revenue_cents) OVER (PARTITION BY category ORDER BY month)) / LAG(revenue_cents) OVER (PARTITION BY category ORDER BY month), 1) AS growth_pct FROM monthly ORDER BY category, month;`,
    tests: [
      {
        input: ``,
        expectedOutput: `Books	2026-10	465000	\\N
Electronics	2026-10	3340000	\\N
Fashion	2026-10	240000	\\N
Home	2026-10	540000	\\N
Men	2026-10	480000	\\N
Men	2026-11	380000	-20.8`,
        isSample: true
      },
      {
        input: `insert into orders (id,customer_id,ordered_at,status) values (11,3,'2026-11-09','paid'); insert into order_items (id,order_id,product_id,quantity,unit_price_cents) values (16,11,13,1,210000);`,
        expectedOutput: `Books	2026-10	465000	\\N
Electronics	2026-10	3340000	\\N
Fashion	2026-10	240000	\\N
Fiction	2026-11	210000	\\N
Home	2026-10	540000	\\N
Men	2026-10	480000	\\N
Men	2026-11	380000	-20.8`,
        isSample: true
      },
      {
        input: `update orders set ordered_at='2026-10-30' where id=10;`,
        expectedOutput: `Books	2026-10	465000	\\N
Electronics	2026-10	3340000	\\N
Fashion	2026-10	240000	\\N
Home	2026-10	540000	\\N
Men	2026-10	860000	\\N`,
        isSample: false
      },
      {
        input: `update orders set status='pending' where id=9;`,
        expectedOutput: `Books	2026-10	465000	\\N
Electronics	2026-10	3340000	\\N
Fashion	2026-10	120000	\\N
Home	2026-10	540000	\\N
Men	2026-10	480000	\\N
Men	2026-11	380000	-20.8`,
        isSample: false
      },
      {
        input: `insert into orders (id,customer_id,ordered_at,status) values (12,5,'2026-11-20','paid'); insert into order_items (id,order_id,product_id,quantity,unit_price_cents) values (17,12,6,1,240000);`,
        expectedOutput: `Books	2026-10	465000	\\N
Electronics	2026-10	3340000	\\N
Fashion	2026-10	240000	\\N
Home	2026-10	540000	\\N
Men	2026-10	480000	\\N
Men	2026-11	620000	29.2`,
        isSample: false
      },
    ],
  },
];
