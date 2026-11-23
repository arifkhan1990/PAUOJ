import type { SeedProblem } from "./seed-problems";

/** Project-based SQL problems for the ShopSphere track. */
export const SQL_PROBLEMS: SeedProblem[] = [
  {
    slug: "sql-vendor-directory",
    title: "Vendor directory",
    statement: `ShopSphere-এর হোমপেজে শুধু ভালো রেটিংয়ের ভেন্ডর দেখাতে হবে। \`vendors\` থেকে নাম ও শহর বের করো যাদের \`rating\` ৪.৫ বা বেশি; নাম অনুযায়ী সাজাও।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`name\` ও \`city\`, নাম অনুযায়ী।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## ধারণা
\`WHERE\` সারি ফিল্টার করে, \`ORDER BY\` ফল সাজায়। একটি টেবিল, JOIN দরকার নেই।

## ধাপে ধাপে
1. \`name\`, \`city\` সিলেক্ট করো।
2. \`rating >= 4.5\` শর্ত দাও।
3. \`ORDER BY name\`।

\`\`\`sql
SELECT name, city FROM vendors WHERE rating >= 4.5 ORDER BY name;
\`\`\`

## কমপ্লেক্সিটি
\`O(n)\` স্ক্যান।

## সাধারণ ভুল
\`>\` আর \`>=\` গুলানো, বা \`ORDER BY\` বাদ দেওয়া।`,
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    category: "SQL Basics",
    subcategory: "Orientation",
    referencePython: "",
    referenceSql: `SELECT name, city FROM vendors WHERE rating >= 4.5 ORDER BY name;`,
    tests: [
      {
        input: "",
        expectedOutput: `HomeCraft	Khulna
StyleHub	Dhaka
TechNest	Dhaka`,
        isSample: true,
      },
    ],
  },
  {
    slug: "sql-low-stock",
    title: "Low-stock shelf",
    statement: `ইনভেন্টরি টিম ১০টির কম স্টক থাকা প্রোডাক্ট দেখতে চায়। \`products\` থেকে নাম ও \`stock\` বের করো; কম স্টক আগে, একই স্টকে নাম অনুযায়ী সাজাও।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`name\` ও \`stock\`, স্টক ও নাম অনুযায়ী।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## ধারণা
দুই কলামে সাজাতে \`ORDER BY stock, name\` — প্রথমে স্টক, টাই হলে নাম।

## ধাপে ধাপে
1. \`name\`, \`stock\` নাও।
2. \`stock < 10\` ফিল্টার।
3. \`ORDER BY stock, name\`।

\`\`\`sql
SELECT name, stock FROM products WHERE stock < 10 ORDER BY stock, name;
\`\`\`

## কমপ্লেক্সিটি
\`O(n log n)\`।

## সাধারণ ভুল
শুধু \`ORDER BY stock\` দিলে সমান স্টকে ক্রম অনির্দিষ্ট।`,
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    category: "SQL Basics",
    subcategory: "Orientation",
    referencePython: "",
    referenceSql: `SELECT name, stock FROM products WHERE stock < 10 ORDER BY stock, name;`,
    tests: [
      {
        input: "",
        expectedOutput: `Webcam	2
Wireless Mouse	3
27in Monitor	5
Clay Dinner Set	6
Denim Jacket	7
USB-C Hub	8
SQL Handbook	9`,
        isSample: true,
      },
    ],
  },
  {
    slug: "sql-vendor-revenue",
    title: "Vendor revenue",
    statement: `কোন ভেন্ডর ৫,০০০ টাকার বেশি বিক্রি করেছে (শুধু \`paid\` ও \`shipped\`)? ভেন্ডরের নাম আর মোট রেভিনিউ (সেন্টে) বের করো; বেশি রেভিনিউ আগে।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`name\` ও \`revenue_cents\`, রেভিনিউ ডিসেন্ডিং।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## ধারণা
JOIN দিয়ে ভেন্ডর → প্রোডাক্ট → অর্ডার আইটেম; \`GROUP BY\` + \`SUM\`; গ্রুপ ফিল্টার \`HAVING\`।

## ধাপে ধাপে
1. \`status in ('paid','shipped')\`।
2. \`quantity * unit_price_cents\` যোগ করো।
3. \`GROUP BY v.id\` + \`HAVING SUM(...) > 500000\`।

\`\`\`sql
SELECT v.name, SUM(oi.quantity * oi.unit_price_cents) AS revenue_cents
FROM vendors v
JOIN products p ON p.vendor_id = v.id
JOIN order_items oi ON oi.product_id = p.id
JOIN orders o ON o.id = oi.order_id
WHERE o.status IN ('paid', 'shipped')
GROUP BY v.id
HAVING SUM(oi.quantity * oi.unit_price_cents) > 500000
ORDER BY revenue_cents DESC, v.name;
\`\`\`

## কমপ্লেক্সিটি
\`O(n log n)\`।

## সাধারণ ভুল
\`WHERE\`-এ \`SUM\` ব্যবহার, বা pending/cancelled অর্ডার ধরা।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    category: "SQL Basics",
    subcategory: "Aggregates",
    referencePython: "",
    referenceSql: `SELECT v.name, SUM(oi.quantity * oi.unit_price_cents) AS revenue_cents FROM vendors v JOIN products p ON p.vendor_id = v.id JOIN order_items oi ON oi.product_id = p.id JOIN orders o ON o.id = oi.order_id WHERE o.status IN ('paid','shipped') GROUP BY v.id HAVING SUM(oi.quantity * oi.unit_price_cents) > 500000 ORDER BY revenue_cents DESC, v.name;`,
    tests: [
      {
        input: "",
        expectedOutput: `TechNest	3190000
StyleHub	1100000
HomeCraft	540000`,
        isSample: true,
      },
    ],
  },
  {
    slug: "sql-order-receipts",
    title: "Order receipts",
    statement: `সাপোর্ট টিম প্রতিটি paid/shipped অর্ডারের রসিদ চায়: অর্ডার আইডি, কাস্টমারের নাম, মোট টাকা (সেন্টে)। অর্ডার আইডি অনুযায়ী সাজাও।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`order_id\`, \`customer\`, \`total_cents\`, অর্ডার আইডি অনুযায়ী।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## ধারণা
\`orders\` + \`customers\` + \`order_items\` জোড়া লাগিয়ে প্রতি অর্ডারে \`SUM\`।

## ধাপে ধাপে
1. তিন টেবিল JOIN।
2. \`status in ('paid','shipped')\`।
3. \`GROUP BY o.id\`, \`ORDER BY o.id\`।

\`\`\`sql
SELECT o.id AS order_id, c.name AS customer,
       SUM(oi.quantity * oi.unit_price_cents) AS total_cents
FROM orders o
JOIN customers c ON c.id = o.customer_id
JOIN order_items oi ON oi.order_id = o.id
WHERE o.status IN ('paid', 'shipped')
GROUP BY o.id
ORDER BY o.id;
\`\`\`

## কমপ্লেক্সিটি
\`O(n log n)\`।

## সাধারণ ভুল
order_items বাদ দেওয়া, বা কাস্টমার ধরে গ্রুপ করা।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    category: "SQL Basics",
    subcategory: "Joins",
    referencePython: "",
    referenceSql: `SELECT o.id AS order_id, c.name AS customer, SUM(oi.quantity * oi.unit_price_cents) AS total_cents FROM orders o JOIN customers c ON c.id = o.customer_id JOIN order_items oi ON oi.order_id = o.id WHERE o.status IN ('paid','shipped') GROUP BY o.id ORDER BY o.id;`,
    tests: [
      {
        input: "",
        expectedOutput: `1	Rahim	890000
3	Nusrat	600000
4	Rahim	2000000
6	Rahim	605000
7	Mim	670000
8	Karim	180000
9	Nusrat	120000
10	Tanvir	380000`,
        isSample: true,
      },
    ],
  },
  {
    slug: "sql-adv-top-product",
    title: "Top product per category",
    statement: `প্রতিটি ক্যাটাগরির সবচেয়ে বেশি বিক্রি হওয়া প্রোডাক্ট বের করো (paid/shipped)। ক্যাটাগরি, প্রোডাক্ট, রেভিনিউ (সেন্টে); ক্যাটাগরি অনুযায়ী সাজাও। \`RANK()\` ব্যবহার করো।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`category\`, \`product\`, \`revenue_cents\`, ক্যাটাগরি অনুযায়ী।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## ধারণা
\`RANK() OVER (PARTITION BY c.id ORDER BY SUM(...) DESC)\` প্রতি ক্যাটাগরিতে র‍্যাংক দেয়; \`rn = 1\` টপ।

## ধাপে ধাপে
1. ক্যাটাগরি+প্রোডাক্ট ধরে SUM।
2. RANK()।
3. বাইরে \`WHERE rn = 1\`।

\`\`\`sql
SELECT category, product, revenue_cents
FROM (
  SELECT c.name AS category, p.name AS product,
         SUM(oi.quantity * oi.unit_price_cents) AS revenue_cents,
         RANK() OVER (PARTITION BY c.id ORDER BY SUM(oi.quantity * oi.unit_price_cents) DESC) AS rn
  FROM categories c
  JOIN products p ON p.category_id = c.id
  JOIN order_items oi ON oi.product_id = p.id
  JOIN orders o ON o.id = oi.order_id
  WHERE o.status IN ('paid', 'shipped')
  GROUP BY c.id, p.id
) ranked
WHERE rn = 1
ORDER BY category;
\`\`\`

## কমপ্লেক্সিটি
\`O(n log n)\`।

## সাধারণ ভুল
PARTITION BY বাদ দেওয়া বা ROW_NUMBER/RANK গুলানো।`,
    difficulty: "HARD",
    points: 300,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    premiumModuleSlug: "advanced-sql",
    category: "SQL Advanced",
    subcategory: "Window functions",
    referencePython: "",
    referenceSql: `SELECT category, product, revenue_cents FROM (SELECT c.name AS category, p.name AS product, SUM(oi.quantity*oi.unit_price_cents) AS revenue_cents, RANK() OVER (PARTITION BY c.id ORDER BY SUM(oi.quantity*oi.unit_price_cents) DESC) AS rn FROM categories c JOIN products p ON p.category_id = c.id JOIN order_items oi ON oi.product_id = p.id JOIN orders o ON o.id = oi.order_id WHERE o.status IN ('paid','shipped') GROUP BY c.id, p.id) ranked WHERE rn = 1 ORDER BY category;`,
    tests: [
      {
        input: "",
        expectedOutput: `Books	SQL Handbook	285000
Electronics	27in Monitor	1850000
Fashion	Leather Wallet	240000
Home	Clay Dinner Set	320000
Men	Cotton Panjabi	480000`,
        isSample: true,
      },
    ],
  },
  {
    slug: "sql-adv-running-revenue",
    title: "Running revenue",
    statement: `ড্যাশবোর্ডে প্রতিদিনের রেভিনিউর পাশে সেই দিন পর্যন্ত মোট রেভিনিউ দরকার। তারিখ, দৈনিক, চলমান মোট (সেন্টে); তারিখ অনুযায়ী সাজাও।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`ordered_at\`, \`daily_cents\`, \`running_cents\`, তারিখ অনুযায়ী।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## ধারণা
প্রথমে তারিখ ধরে দৈনিক SUM, তারপর \`SUM(...) OVER (ORDER BY ordered_at)\`।

## ধাপে ধাপে
1. subquery-তে প্রতি তারিখে SUM।
2. বাইরে window SUM।

\`\`\`sql
SELECT ordered_at, daily_cents,
       SUM(daily_cents) OVER (ORDER BY ordered_at) AS running_cents
FROM (
  SELECT o.ordered_at, SUM(oi.quantity * oi.unit_price_cents) AS daily_cents
  FROM orders o
  JOIN order_items oi ON oi.order_id = o.id
  WHERE o.status IN ('paid', 'shipped')
  GROUP BY o.ordered_at
) daily
ORDER BY ordered_at;
\`\`\`

## কমপ্লেক্সিটি
\`O(n log n)\`।

## সাধারণ ভুল
window-এ ORDER BY বাদ দেওয়া, বা বাতিল অর্ডার ধরা।`,
    difficulty: "HARD",
    points: 300,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    premiumModuleSlug: "advanced-sql",
    category: "SQL Advanced",
    subcategory: "Window functions",
    referencePython: "",
    referenceSql: `SELECT ordered_at, daily_cents, SUM(daily_cents) OVER (ORDER BY ordered_at) AS running_cents FROM (SELECT o.ordered_at, SUM(oi.quantity*oi.unit_price_cents) AS daily_cents FROM orders o JOIN order_items oi ON oi.order_id = o.id WHERE o.status IN ('paid','shipped') GROUP BY o.ordered_at) daily ORDER BY ordered_at;`,
    tests: [
      {
        input: "",
        expectedOutput: `2026-10-01	890000	890000
2026-10-05	600000	1490000
2026-10-10	2000000	3490000
2026-10-20	605000	4095000
2026-10-22	670000	4765000
2026-10-25	180000	4945000
2026-10-28	120000	5065000
2026-11-02	380000	5445000`,
        isSample: true,
      },
    ],
  },
  {
    slug: "sql-adv-category-tree",
    title: "Category tree",
    statement: `ক্যাটাগরি হায়ারার্কির প্রতিটি নোডের path দরকার (যেমন \`Electronics > Audio > Headphones\`)। recursive CTE দিয়ে id ও path বের করো; id অনুযায়ী সাজাও।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`id\` ও \`path\`, id অনুযায়ী।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## ধারণা
Recursive CTE: anchor root (\`parent_id IS NULL\`), recursive অংশ সন্তান যোগ করে path বাড়ায়।

## ধাপে ধাপে
1. \`WITH RECURSIVE tree(id, path)\`।
2. Anchor root।
3. \`JOIN tree ON c.parent_id = tree.id\`, path = \`tree.path || ' > ' || c.name\`।

\`\`\`sql
WITH RECURSIVE tree(id, path) AS (
  SELECT id, name FROM categories WHERE parent_id IS NULL
  UNION ALL
  SELECT c.id, tree.path || ' > ' || c.name
  FROM categories c JOIN tree ON c.parent_id = tree.id
)
SELECT id, path FROM tree ORDER BY id;
\`\`\`

## কমপ্লেক্সিটি
\`O(n)\`।

## সাধারণ ভুল
\`UNION ALL\`-এর বদলে \`UNION\`, বা path আপডেট না করা।`,
    difficulty: "HARD",
    points: 300,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    premiumModuleSlug: "advanced-sql",
    category: "SQL Advanced",
    subcategory: "CTEs",
    referencePython: "",
    referenceSql: `WITH RECURSIVE tree(id, path) AS (SELECT id, name FROM categories WHERE parent_id IS NULL UNION ALL SELECT c.id, tree.path || ' > ' || c.name FROM categories c JOIN tree ON c.parent_id = tree.id) SELECT id, path FROM tree ORDER BY id;`,
    tests: [
      {
        input: "",
        expectedOutput: `1	Electronics
2	Electronics > Audio
3	Electronics > Audio > Headphones
4	Books
5	Books > Fiction
6	Fashion
7	Fashion > Men
8	Home`,
        isSample: true,
      },
    ],
  },
  {
    slug: "sql-adv-referral-depth",
    title: "Referral depth",
    statement: `রেফারেল চেইনে Rahim (customer 1) থেকে প্রত্যেক কাস্টমার কত ধাপ দূরে? recursive CTE দিয়ে নাম ও depth; depth ও নাম অনুযায়ী সাজাও।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`name\` ও \`depth\`, depth ও নাম অনুযায়ী।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## ধারণা
Anchor customer 1 (depth 0); recursive ধাপে \`referrals.referred_by\` মিলিয়ে পরের স্তর।

## ধাপে ধাপে
1. \`WITH RECURSIVE chain(id, depth)\`।
2. Anchor \`SELECT 1, 0\`।
3. \`JOIN chain ON r.referred_by = chain.id\`, depth + 1।

\`\`\`sql
WITH RECURSIVE chain(id, depth) AS (
  SELECT 1, 0
  UNION ALL
  SELECT r.customer_id, chain.depth + 1
  FROM referrals r
  JOIN chain ON r.referred_by = chain.id
)
SELECT c.name, chain.depth
FROM chain
JOIN customers c ON c.id = chain.id
ORDER BY chain.depth, c.name;
\`\`\`

## কমপ্লেক্সিটি
\`O(n)\`।

## সাধারণ ভুল
anchor-এ customer 1-এর referral সারি খোঁজা, বা referred_by/customer_id উল্টানো।`,
    difficulty: "HARD",
    points: 300,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    premiumModuleSlug: "advanced-sql",
    category: "SQL Advanced",
    subcategory: "CTEs",
    referencePython: "",
    referenceSql: `WITH RECURSIVE chain(id, depth) AS (SELECT 1, 0 UNION ALL SELECT r.customer_id, chain.depth + 1 FROM referrals r JOIN chain ON r.referred_by = chain.id) SELECT c.name, chain.depth FROM chain JOIN customers c ON c.id = chain.id ORDER BY chain.depth, c.name;`,
    tests: [
      {
        input: "",
        expectedOutput: `Rahim	0
Karim	1
Nusrat	1
Mim	2
Sajid	2`,
        isSample: true,
      },
    ],
  },
];
