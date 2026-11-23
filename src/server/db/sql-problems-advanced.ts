import type { SeedProblem } from "./seed-problems";

export const SQL_PROBLEMS_ADVANCED: SeedProblem[] = [
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
        input: ``,
        expectedOutput: `Books	SQL Handbook	285000
Electronics	27in Monitor	1850000
Fashion	Leather Wallet	240000
Home	Clay Dinner Set	320000
Men	Cotton Panjabi	480000`,
        isSample: true,
      },
      {
        input: `update products set price_cents=price_cents*2 where id in (5,8);`,
        expectedOutput: `Books	SQL Handbook	285000
Electronics	27in Monitor	1850000
Fashion	Leather Wallet	240000
Home	Clay Dinner Set	320000
Men	Cotton Panjabi	480000`,
        isSample: true,
      },
      {
        input: `update orders set status='cancelled' where id in (3,6);`,
        expectedOutput: `Books	Clean Code	180000
Electronics	27in Monitor	1850000
Fashion	Leather Wallet	120000
Home	Table Lamp	220000
Men	Denim Jacket	380000`,
        isSample: false,
      },
      {
        input: `insert into orders (id,customer_id,ordered_at,status) values (11,6,'2026-11-05','paid'); insert into order_items (id,order_id,product_id,quantity,unit_price_cents) values (16,11,13,1,210000);`,
        expectedOutput: `Books	SQL Handbook	285000
Electronics	27in Monitor	1850000
Fashion	Leather Wallet	240000
Fiction	Dune	210000
Home	Clay Dinner Set	320000
Men	Cotton Panjabi	480000`,
        isSample: false,
      },
      {
        input: `update order_items set unit_price_cents=100000 where product_id=3;`,
        expectedOutput: `Books	SQL Handbook	285000
Electronics	Mechanical Keyboard	900000
Fashion	Leather Wallet	240000
Home	Clay Dinner Set	320000
Men	Cotton Panjabi	480000`,
        isSample: false,
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
        input: ``,
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
      {
        input: `update orders set status='cancelled' where id in (3,6);`,
        expectedOutput: `2026-10-01	890000	890000
2026-10-10	2000000	2890000
2026-10-22	670000	3560000
2026-10-25	180000	3740000
2026-10-28	120000	3860000
2026-11-02	380000	4240000`,
        isSample: true,
      },
      {
        input: `delete from order_items where order_id=10; delete from orders where id=10;`,
        expectedOutput: `2026-10-01	890000	890000
2026-10-05	600000	1490000
2026-10-10	2000000	3490000
2026-10-20	605000	4095000
2026-10-22	670000	4765000
2026-10-25	180000	4945000
2026-10-28	120000	5065000`,
        isSample: false,
      },
      {
        input: `insert into orders (id,customer_id,ordered_at,status) values (11,6,'2026-11-05','paid'); insert into order_items (id,order_id,product_id,quantity,unit_price_cents) values (16,11,13,1,210000);`,
        expectedOutput: `2026-10-01	890000	890000
2026-10-05	600000	1490000
2026-10-10	2000000	3490000
2026-10-20	605000	4095000
2026-10-22	670000	4765000
2026-10-25	180000	4945000
2026-10-28	120000	5065000
2026-11-02	380000	5445000
2026-11-05	210000	5655000`,
        isSample: false,
      },
      {
        input: `update orders set ordered_at='2026-12-01' where id=10;`,
        expectedOutput: `2026-10-01	890000	890000
2026-10-05	600000	1490000
2026-10-10	2000000	3490000
2026-10-20	605000	4095000
2026-10-22	670000	4765000
2026-10-25	180000	4945000
2026-10-28	120000	5065000
2026-12-01	380000	5445000`,
        isSample: false,
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
        input: ``,
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
      {
        input: `update categories set parent_id=4 where id=8;`,
        expectedOutput: `1	Electronics
2	Electronics > Audio
3	Electronics > Audio > Headphones
4	Books
5	Books > Fiction
6	Fashion
7	Fashion > Men
8	Books > Home`,
        isSample: true,
      },
      {
        input: `update categories set name='Audio Gear' where id=2;`,
        expectedOutput: `1	Electronics
2	Electronics > Audio Gear
3	Electronics > Audio Gear > Headphones
4	Books
5	Books > Fiction
6	Fashion
7	Fashion > Men
8	Home`,
        isSample: false,
      },
      {
        input: `insert into categories (id,name,parent_id) values (9,'Gaming',1);`,
        expectedOutput: `1	Electronics
2	Electronics > Audio
3	Electronics > Audio > Headphones
4	Books
5	Books > Fiction
6	Fashion
7	Fashion > Men
8	Home
9	Electronics > Gaming`,
        isSample: false,
      },
      {
        input: `update categories set parent_id=6 where id=3;`,
        expectedOutput: `1	Electronics
2	Electronics > Audio
3	Fashion > Headphones
4	Books
5	Books > Fiction
6	Fashion
7	Fashion > Men
8	Home`,
        isSample: false,
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
        input: ``,
        expectedOutput: `Rahim	0
Karim	1
Nusrat	1
Mim	2
Sajid	2`,
        isSample: true,
      },
      {
        input: `update referrals set referred_by=3 where customer_id=6;`,
        expectedOutput: `Rahim	0
Karim	1
Nusrat	1
Mim	2
Sajid	2
Tanvir	2`,
        isSample: true,
      },
      {
        input: `insert into customers (id,name,city,signup_date) values (7,'Rafi','Dhaka','2026-05-01'); insert into referrals (customer_id,referred_by) values (7,5);`,
        expectedOutput: `Rahim	0
Karim	1
Nusrat	1
Mim	2
Sajid	2
Rafi	3`,
        isSample: false,
      },
      {
        input: `delete from referrals where customer_id=2;`,
        expectedOutput: `Rahim	0
Nusrat	1`,
        isSample: false,
      },
      {
        input: `update referrals set referred_by=6 where customer_id=4;`,
        expectedOutput: `Rahim	0
Karim	1
Nusrat	1
Mim	2`,
        isSample: false,
      },
    ],
  },
];
