import type { SeedProblem } from "./seed-problems";

export const SQL_PROBLEMS_PRACTICE_ADVANCED_MORE_HIERARCHIES: SeedProblem[] = [
  {
    slug: "sql-practice-hierarchies-hard",
    title: "Root category revenue rollup",
    statement: `মার্কেটপ্লেসের রিপোর্ট টপ-লেভেল (root) ক্যাটাগরি ধরে চায়, কিন্তু বিক্রি লেখা হয় লিফ ক্যাটাগরিতে। প্রতিটি ক্যাটাগরিকে তার root অ্যাঙ্কেস্টরের অধীনে গুনে প্রতি root ক্যাটাগরির মোট প্রোডাক্ট সংখ্যা ও paid/shipped বিক্রির রেভিনিউ (সেন্টে) বের করো। root নিজেও নিজের অধীনে গণ্য। আউটপুট কলাম: root_category, products, revenue_cents। root ক্যাটাগরির নাম অনুযায়ী সাজাও।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`root_category\`, \`products\`, \`revenue_cents\`, নাম অনুযায়ী।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## ধারণা
recursive CTE দিয়ে প্রতিটি নোডকে তার root-এ ম্যাপ করা যায়: বেস কেস root নিজে (id, id), রিকার্সিভ কেস child-এর (id, parent-এর root_id)। এরপর সেই ম্যাপের সাথে products → order_items → orders জোড়া দিলে লিফ-লেভেলের বিক্রি root-এ গড়ে যায়।

## ধাপে ধাপে
১. WITH RECURSIVE cat_root(cat_id, root_id): root থেকে শুরু, প্রতিটি child তার parent-এর root_id পায়।
২. cat_root LEFT JOIN products (ক্যাটাগরিতে প্রোডাক্ট না থাকলেও root বাদ যাবে না)।
৩. order_items ও orders জোড়া দিয়ে CASE-এ paid/shipped শর্ত রাখো।
৪. root_id ধরে GROUP BY, ORDER BY root নাম।

## কোডে দেখি
\`\`\`sql
WITH RECURSIVE cat_root(cat_id, root_id) AS (
  SELECT id, id FROM categories WHERE parent_id IS NULL
  UNION ALL
  SELECT c.id, cr.root_id FROM categories c
    JOIN cat_root cr ON c.parent_id = cr.cat_id)
SELECT r.name AS root_category, COUNT(DISTINCT p.id) AS products,
       COALESCE(SUM(CASE WHEN o.status IN ('paid','shipped')
                         THEN oi.quantity*oi.unit_price_cents ELSE 0 END), 0) AS revenue_cents
FROM cat_root cr
JOIN categories r ON r.id = cr.root_id
LEFT JOIN products p ON p.category_id = cr.cat_id
LEFT JOIN order_items oi ON oi.product_id = p.id
LEFT JOIN orders o ON o.id = oi.order_id
GROUP BY cr.root_id, r.name ORDER BY r.name;
\`\`\`

## সাধারণ ভুল
products JOIN করার সময় root ছাড়া কেবল লিফ গুনা (root-এ সরাসরি প্রোডাক্ট থাকলে বাদ পড়ে); WHERE status='paid' ফিল্টার LEFT JOIN-কে ভেঙে ফেলে প্রোডাক্টবিহীন root-ও উধাও হয় — শর্তটা CASE-এর ভেতরে রাখো; UNION ALL-এর বদলে UNION দিলে একই সারি কেটে যেতে পারে।`,
    difficulty: "HARD",
    points: 320,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    premiumModuleSlug: "advanced-sql",
    category: "SQL Advanced",
    subcategory: "CTEs",
    referencePython: "",
    referenceSql: `WITH RECURSIVE cat_root(cat_id, root_id) AS (
  SELECT id, id FROM categories WHERE parent_id IS NULL
  UNION ALL
  SELECT c.id, cr.root_id FROM categories c
    JOIN cat_root cr ON c.parent_id = cr.cat_id)
SELECT r.name AS root_category, COUNT(DISTINCT p.id) AS products,
       COALESCE(SUM(CASE WHEN o.status IN ('paid','shipped') THEN oi.quantity*oi.unit_price_cents ELSE 0 END), 0) AS revenue_cents
FROM cat_root cr
JOIN categories r ON r.id = cr.root_id
LEFT JOIN products p ON p.category_id = cr.cat_id
LEFT JOIN order_items oi ON oi.product_id = p.id
LEFT JOIN orders o ON o.id = oi.order_id
GROUP BY cr.root_id, r.name ORDER BY r.name;`,
    tests: [
      {
        input: ``,
        expectedOutput: `Books	3	465000
Electronics	6	3340000
Fashion	3	1100000
Home	2	540000`,
        isSample: true
      },
      {
        input: `insert into products (id,vendor_id,category_id,name,price_cents,stock,rating) values (15,5,3,'Studio Headphones',290000,4,4.5);`,
        expectedOutput: `Books	3	465000
Electronics	7	3340000
Fashion	3	1100000
Home	2	540000`,
        isSample: true
      },
      {
        input: `update orders set status='cancelled' where id=4;`,
        expectedOutput: `Books	3	465000
Electronics	6	1340000
Fashion	3	1100000
Home	2	540000`,
        isSample: false
      },
      {
        input: `insert into categories (id,name,parent_id) values (9,'Kitchen',8); insert into products (id,vendor_id,category_id,name,price_cents,stock,rating) values (16,5,9,'Ceramic Mug',50000,10,4.0); insert into orders (id,customer_id,ordered_at,status) values (11,5,'2026-11-03','paid'); insert into order_items (id,order_id,product_id,quantity,unit_price_cents) values (16,11,16,2,50000);`,
        expectedOutput: `Books	3	465000
Electronics	6	3340000
Fashion	3	1100000
Home	3	640000`,
        isSample: false
      },
      {
        input: `update orders set status='paid' where id=5;`,
        expectedOutput: `Books	3	465000
Electronics	6	3510000
Fashion	3	1100000
Home	2	540000`,
        isSample: false
      },
    ],
  },
  {
    slug: "sql-practice-hierarchies-challenge",
    title: "Subtree price range",
    statement: `ক্যাটাগরি ট্রি-তে প্রতিটি নোডের subtree-র দামের চিত্র দরকার: প্রতিটি ক্যাটাগরির নিজের ও তার সব ডিসেনডেন্টের প্রোডাক্ট মিলিয়ে মোট প্রোডাক্ট সংখ্যা এবং সবচেয়ে কম ও বেশি দাম (সেন্টে) বের করো। subtree-তে একটিও প্রোডাক্ট না থাকলে সংখ্যা 0 আর দাম দুটোই NULL দেখাও — কোনো ক্যাটাগরি বাদ যাবে না। আউটপুট কলাম: category, subtree_products, min_price_cents, max_price_cents। ক্যাটাগরির নাম অনুযায়ী সাজাও।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`category\`, \`subtree_products\`, \`min_price_cents\`, \`max_price_cents\`, নাম অনুযায়ী। খালি subtree-তে দাম দুটি \`\\N\`।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## ধারণা
এবার recursion উল্টো দিক থেকে: বেস কেস প্রতিটি ক্যাটাগরি নিজে (id, id), রিকার্সিভ কেস child-এর (child_id, top_id) — তাহলে প্রতিটি নোড প্রতিটি পূর্বপুরুষের তালিকায় একবার আসে। LEFT JOIN products রাখলে প্রোডাক্টবিহীন ক্যাটাগরিও সারি হিসেবে থাকে, MIN/MAX স্বয়ংক্রিয়ভাবে NULL দেয়।

## ধাপে ধাপে
১. WITH RECURSIVE subtree(cat_id, top_id): সব নোড নিজে নিজের top, child-রা parent-এর top_id পায়।
২. top_id ধরে GROUP BY করলে প্রতিটি ক্যাটাগরির পুরো subtree এক জায়গায়।
৩. LEFT JOIN products + COUNT(p.id) — খালি গ্রুপে 0।
৪. MIN/MAX price NULL-safe, ORDER BY category।

## কোডে দেখি
\`\`\`sql
WITH RECURSIVE subtree(cat_id, top_id) AS (
  SELECT id, id FROM categories
  UNION ALL
  SELECT c.id, s.top_id FROM categories c
    JOIN subtree s ON c.parent_id = s.cat_id)
SELECT c.name AS category, COUNT(p.id) AS subtree_products,
       MIN(p.price_cents) AS min_price_cents, MAX(p.price_cents) AS max_price_cents
FROM subtree s JOIN categories c ON c.id = s.top_id
LEFT JOIN products p ON p.category_id = s.cat_id
GROUP BY s.top_id, c.name ORDER BY c.name;
\`\`\`

## সাধারণ ভুল
parent-side recursion (root→child) দিয়ে ভাবলে প্রতিটি পূর্বপুরুষের জন্য আলাদা সারি পাওয়ার কথা মাথা থেকে বেরিয়ে যায়; INNER JOIN products করলে Audio/Headphones-এর মতো খালি subtree পুরো উধাও; COUNT(*) লিখলে LEFT JOIN-এর NULL সারিও গুনে 1 দেখায় — COUNT(p.id) লাগবে।`,
    difficulty: "HARD",
    points: 340,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    premiumModuleSlug: "advanced-sql",
    category: "SQL Advanced",
    subcategory: "CTEs",
    referencePython: "",
    referenceSql: `WITH RECURSIVE subtree(cat_id, top_id) AS (
  SELECT id, id FROM categories
  UNION ALL
  SELECT c.id, s.top_id FROM categories c JOIN subtree s ON c.parent_id = s.cat_id)
SELECT c.name AS category, COUNT(p.id) AS subtree_products,
       MIN(p.price_cents) AS min_price_cents, MAX(p.price_cents) AS max_price_cents
FROM subtree s JOIN categories c ON c.id = s.top_id
LEFT JOIN products p ON p.category_id = s.cat_id
GROUP BY s.top_id, c.name ORDER BY c.name;`,
    tests: [
      {
        input: ``,
        expectedOutput: `Audio	0	\\N	\\N
Books	3	95000	210000
Electronics	6	85000	1850000
Fashion	3	120000	380000
Fiction	1	210000	210000
Headphones	0	\\N	\\N
Home	2	110000	320000
Men	2	240000	380000`,
        isSample: true
      },
      {
        input: `insert into products (id,vendor_id,category_id,name,price_cents,stock,rating) values (15,4,3,'Studio Headphones',290000,4,4.5);`,
        expectedOutput: `Audio	1	290000	290000
Books	3	95000	210000
Electronics	7	85000	1850000
Fashion	3	120000	380000
Fiction	1	210000	210000
Headphones	1	290000	290000
Home	2	110000	320000
Men	2	240000	380000`,
        isSample: true
      },
      {
        input: `update products set price_cents=2000000 where id=12;`,
        expectedOutput: `Audio	0	\\N	\\N
Books	3	95000	210000
Electronics	6	85000	2000000
Fashion	3	120000	380000
Fiction	1	210000	210000
Headphones	0	\\N	\\N
Home	2	110000	320000
Men	2	240000	380000`,
        isSample: false
      },
      {
        input: `insert into categories (id,name,parent_id) values (9,'Kitchen',8);`,
        expectedOutput: `Audio	0	\\N	\\N
Books	3	95000	210000
Electronics	6	85000	1850000
Fashion	3	120000	380000
Fiction	1	210000	210000
Headphones	0	\\N	\\N
Home	2	110000	320000
Kitchen	0	\\N	\\N
Men	2	240000	380000`,
        isSample: false
      },
      {
        input: `delete from products where id=13;`,
        expectedOutput: `Audio	0	\\N	\\N
Books	2	95000	180000
Electronics	6	85000	1850000
Fashion	3	120000	380000
Fiction	0	\\N	\\N
Headphones	0	\\N	\\N
Home	2	110000	320000
Men	2	240000	380000`,
        isSample: false
      },
    ],
  },
];
