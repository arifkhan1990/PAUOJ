import type { SeedProblem } from "./seed-problems";

export const SQL_PROBLEMS_ADVANCED_METRICS: SeedProblem[] = [
  {
    slug: "sql-adv-category-share",
    title: "Category revenue share",
    statement: `paid/shipped অর্ডার থেকে প্রতিটি ক্যাটাগরির মোট রেভিনিউ (সেন্টে) আর পুরো রেভিনিউর কত শতাংশ সেই ক্যাটাগরি, তা এক দশমিক পর্যন্ত বের করো; বেশি রেভিনিউ আগে, টাইলে ক্যাটাগরি নাম।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`category\`, \`revenue_cents\`, \`share_pct\`।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## কেন দরকার
"কোন ক্যাটাগরি সবচেয়ে বড়?" — শুধু টাকার অঙ্ক দেখলে স্কেল বোঝা যায় না। শতাংশ দেখালে বোঝা যায় ব্যবসার কত অংশ একটিমাত্র ক্যাটাগরির উপর নির্ভরশীল।

## মূল ধারণা
প্রথমে CTE-তে ক্যাটাগরি ধরে রেভিনিউ যোগ করো। তারপর \`SUM(revenue_cents) OVER ()\` দিয়ে সব ক্যাটাগরির মোট রেভিনিউ বের করে শতাংশ 계산 করো। \`100.0\` দিয়ে গুণ করলে integer division-এর ফাঁদ এড়ানো যায়।

## ধাপে ধাপে
১. categories → products → order_items → orders জোড়া লাগাও।
২. paid/shipped ফিল্টার করে ক্যাটাগরি ধরে \`SUM\`।
৩. window \`SUM(...) OVER ()\` দিয়ে মোট।
৪. শতাংশ round করে সাজাও।

## কোডে দেখি
\`\`\`sql
WITH category_revenue AS (
  SELECT c.name AS category,
         SUM(oi.quantity * oi.unit_price_cents) AS revenue_cents
  FROM categories c
  JOIN products p ON p.category_id = c.id
  JOIN order_items oi ON oi.product_id = p.id
  JOIN orders o ON o.id = oi.order_id
  WHERE o.status IN ('paid', 'shipped')
  GROUP BY c.id
)
SELECT category, revenue_cents,
       ROUND(revenue_cents * 100.0 / SUM(revenue_cents) OVER (), 1) AS share_pct
FROM category_revenue
ORDER BY revenue_cents DESC, category;
\`\`\`

## কমপ্লেক্সিটি
JOIN + group + window — \`O(n log n)\`।

## সাধারণ ভুল
\`100\` দিয়ে integer division; প্রতিটি সারিতে মোট রেভিনিউর বদলে নিজের রেভিনিউ দিয়ে ভাগ; CTE-তে \`c.id\`-এর বদলে নাম দিয়ে গ্রুপ করা (একই নামের ক্যাটাগরি থাকলে ভুল)।`,
    difficulty: "HARD",
    points: 300,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    premiumModuleSlug: "advanced-sql",
    category: "SQL Advanced",
    subcategory: "Analytics",
    referencePython: "",
    referenceSql: `WITH category_revenue AS (
  SELECT c.name AS category, SUM(oi.quantity*oi.unit_price_cents) AS revenue_cents
  FROM categories c JOIN products p ON p.category_id=c.id
  JOIN order_items oi ON oi.product_id=p.id JOIN orders o ON o.id=oi.order_id
  WHERE o.status IN ('paid','shipped') GROUP BY c.id
)
SELECT category, revenue_cents,
       round(revenue_cents * 100.0 / SUM(revenue_cents) OVER (), 1) AS share_pct
FROM category_revenue ORDER BY revenue_cents DESC, category;`,
    tests: [
      {
        input: ``,
        expectedOutput: `Electronics	3340000	61.3
Men	860000	15.8
Home	540000	9.9
Books	465000	8.5
Fashion	240000	4.4`,
        isSample: true
      },
      {
        input: `update orders set status='cancelled' where id in (3,6);`,
        expectedOutput: `Electronics	3340000	78.8
Men	380000	9.0
Home	220000	5.2
Books	180000	4.2
Fashion	120000	2.8`,
        isSample: true
      },
      {
        input: `delete from order_items where order_id=10; delete from orders where id=10;`,
        expectedOutput: `Electronics	3340000	65.9
Home	540000	10.7
Men	480000	9.5
Books	465000	9.2
Fashion	240000	4.7`,
        isSample: false
      },
      {
        input: `insert into orders (id,customer_id,ordered_at,status) values (11,6,'2026-11-05','paid'); insert into order_items (id,order_id,product_id,quantity,unit_price_cents) values (16,11,13,1,210000);`,
        expectedOutput: `Electronics	3340000	59.1
Men	860000	15.2
Home	540000	9.5
Books	465000	8.2
Fashion	240000	4.2
Fiction	210000	3.7`,
        isSample: false
      },
      {
        input: `update orders set status='cancelled' where id in (3,9,10);`,
        expectedOutput: `Electronics	3340000	76.9
Home	540000	12.4
Books	465000	10.7`,
        isSample: false
      },
    ],
  },
  {
    slug: "sql-adv-monthly-growth",
    title: "Month-over-month growth",
    statement: `paid/shipped অর্ডারের মাসিক রেভিনিউ (সেন্টে) আর আগের মাসের তুলনায় শতকরা পরিবর্তন এক দশমিক পর্যন্ত বের করো; প্রথম মাসের growth \`NULL\` হবে; মাস অনুযায়ী সাজাও।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`month\` (YYYY-MM), \`revenue_cents\`, \`growth_pct\` (প্রথম মাসে \`\\N\`)।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## কেন দরকার
মাসিক রেভিনিউ বাড়ছে না কমছে, সেটাই ব্যবসার সবচেয়ে গুরুত্বপূর্ণ সংকেত। আগের মাসের সাথে তুলনা না করলে সংখ্যাটা শুধুই একটি সংখ্যা।

## মূল ধারণা
CTE-তে মাস ধরে রেভিনিউ বের করো। \`LAG(revenue_cents) OVER (ORDER BY month)\` আগের সারির রেভিনিউ আনে। প্রথম সারিতে LAG \`NULL\`, তাই growth-ও \`NULL\`—সেটাই সঠিক। শতাংশে \`(now - previous) * 100.0 / previous\`।

## ধাপে ধাপে
১. \`substr(ordered_at, 1, 7)\` দিয়ে মাস।
২. মাস ধরে \`SUM\`।
৩. \`LAG\` দিয়ে আগের মাস।
৪. শতাংশ round করে সাজাও।

## কোডে দেখি
\`\`\`sql
WITH monthly AS (
  SELECT substr(o.ordered_at, 1, 7) AS month,
         SUM(oi.quantity * oi.unit_price_cents) AS revenue_cents
  FROM orders o
  JOIN order_items oi ON oi.order_id = o.id
  WHERE o.status IN ('paid', 'shipped')
  GROUP BY month
)
SELECT month, revenue_cents,
       ROUND(
         (revenue_cents - LAG(revenue_cents) OVER (ORDER BY month)) * 100.0
         / LAG(revenue_cents) OVER (ORDER BY month),
         1
       ) AS growth_pct
FROM monthly
ORDER BY month;
\`\`\`

## কমপ্লেক্সিটি
\`O(n log n)\` — group + window sort।

## সাধারণ ভুল
প্রথম মাসে \`0\` দেখানো (অথচ তুলনা নেই); \`LAG\`-এর ORDER BY বাদ দেওয়া; আগের রেভিনিউ ০ হলে division-by-zero না সামলানো (\`NULLIF\` ব্যবহার করা যায়)।`,
    difficulty: "HARD",
    points: 300,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    premiumModuleSlug: "advanced-sql",
    category: "SQL Advanced",
    subcategory: "Analytics",
    referencePython: "",
    referenceSql: `WITH monthly AS (
  SELECT substr(o.ordered_at,1,7) AS month, SUM(oi.quantity*oi.unit_price_cents) AS revenue_cents
  FROM orders o JOIN order_items oi ON oi.order_id=o.id
  WHERE o.status IN ('paid','shipped') GROUP BY month
)
SELECT month, revenue_cents,
       round((revenue_cents - LAG(revenue_cents) OVER (ORDER BY month)) * 100.0 /
             LAG(revenue_cents) OVER (ORDER BY month), 1) AS growth_pct
FROM monthly ORDER BY month;`,
    tests: [
      {
        input: ``,
        expectedOutput: `2026-10	5065000	\\N
2026-11	380000	-92.5`,
        isSample: true
      },
      {
        input: `update orders set status='cancelled' where id in (3,6);`,
        expectedOutput: `2026-10	3860000	\\N
2026-11	380000	-90.2`,
        isSample: true
      },
      {
        input: `delete from order_items where order_id=10; delete from orders where id=10;`,
        expectedOutput: `2026-10	5065000	\\N`,
        isSample: false
      },
      {
        input: `insert into orders (id,customer_id,ordered_at,status) values (11,6,'2026-11-05','paid'); insert into order_items (id,order_id,product_id,quantity,unit_price_cents) values (16,11,13,1,210000);`,
        expectedOutput: `2026-10	5065000	\\N
2026-11	590000	-88.4`,
        isSample: false
      },
      {
        input: `update orders set status='cancelled' where id in (3,9,10);`,
        expectedOutput: `2026-10	4345000	\\N`,
        isSample: false
      },
    ],
  },
];
