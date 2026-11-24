import type { SeedProblem } from "./seed-problems";

export const SQL_PROBLEMS_PRACTICE_ADVANCED_MORE_PIVOT_GROUPING: SeedProblem[] = [
  {
    slug: "sql-practice-pivot-grouping-hard",
    title: "Movement kind matrix",
    statement: `ইনভেন্টরি টিম প্রতি প্রোডাক্টের চলাচলের পূর্ণ ছক চায়। প্রতিটি প্রোডাক্টের জন্য চার ধরনের movement — purchase, sale, return, adjustment — আলাদা কলামে যোগ করো (sale ধনাত্মক সংখ্যা হিসেবে দেখাও, টেবিলে ঋণাত্মক থাকে; বাকিগুলো যেমন আছে তেমন) এবং শেষে net_units = purchase - sale + return + adjustment বসাও। কোনো movement-ই না থাকা প্রোডাক্টের সব কলাম 0 হবে — কোনো প্রোডাক্ট বাদ যাবে না। আউটপুট কলাম: product, purchase_units, sale_units, return_units, adjustment_units, net_units। আগে net_units (বড় থেকে ছোট), টাইলে প্রোডাক্টের নাম অনুযায়ী সাজাও।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`product\`, \`purchase_units\`, \`sale_units\`, \`return_units\`, \`adjustment_units\`, \`net_units\`।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## ধারণা
লাইন-থেকে-কলাম pivot-এর স্ট্যান্ডার্ড কায়দা: GROUP BY product + প্রতি ধরনের জন্য একটি \`SUM(CASE WHEN kind=... )\`। সারি-থেকে-কলাম উল্টানোর দরকার নেই, CASE-ই যথেষ্ট। movement নেই এমন প্রোডাক্ট রাখতে aggregation-কে LEFT JOIN-এর ডান পাশে রাখো।

## ধাপে ধাপে
১. kind_totals: product_id ধরে চার CASE-যোগফল, sale-এর ঋণাত্মক quantity উল্টে (−quantity) নাও।
২. products LEFT JOIN kind_totals — খালি প্রোডাক্ট 0।
৩. net_units = purchase - sale + return + adjustment (COALESCE সহ)।
৪. ORDER BY net_units DESC, product।

## কোডে দেখি
\`\`\`sql
WITH kind_totals AS (
  SELECT product_id,
         SUM(CASE WHEN kind='purchase' THEN quantity ELSE 0 END) AS purchase_units,
         SUM(CASE WHEN kind='sale' THEN -quantity ELSE 0 END) AS sale_units,
         SUM(CASE WHEN kind='return' THEN quantity ELSE 0 END) AS return_units,
         SUM(CASE WHEN kind='adjustment' THEN quantity ELSE 0 END) AS adjustment_units
  FROM inventory_movements GROUP BY product_id)
SELECT p.name AS product,
       COALESCE(kt.purchase_units,0) AS purchase_units,
       COALESCE(kt.sale_units,0) AS sale_units,
       COALESCE(kt.return_units,0) AS return_units,
       COALESCE(kt.adjustment_units,0) AS adjustment_units,
       COALESCE(kt.purchase_units,0) - COALESCE(kt.sale_units,0)
         + COALESCE(kt.return_units,0) + COALESCE(kt.adjustment_units,0) AS net_units
FROM products p LEFT JOIN kind_totals kt ON kt.product_id = p.id
ORDER BY net_units DESC, product;
\`\`\`

## সাধারণ ভুল
sale-এর ঋণাত্মক quantity সরাসরি যোগ করে net-এ দুইবার বিয়োগ করা; INNER JOIN করে movement-বিহীন প্রোডাক্ট হারানো (Leather Wallet-এ একটাও movement নেই); COALESCE ছাড়া NULL+সংখ্যা = NULL হয়ে পুরো net_units উধাও।`,
    difficulty: "HARD",
    points: 320,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    premiumModuleSlug: "advanced-sql",
    category: "SQL Advanced",
    subcategory: "Pivot & grouping",
    referencePython: "",
    referenceSql: `WITH kind_totals AS (
  SELECT product_id,
         SUM(CASE WHEN kind='purchase' THEN quantity ELSE 0 END) AS purchase_units,
         SUM(CASE WHEN kind='sale' THEN -quantity ELSE 0 END) AS sale_units,
         SUM(CASE WHEN kind='return' THEN quantity ELSE 0 END) AS return_units,
         SUM(CASE WHEN kind='adjustment' THEN quantity ELSE 0 END) AS adjustment_units
  FROM inventory_movements GROUP BY product_id)
SELECT p.name AS product,
       COALESCE(kt.purchase_units,0) AS purchase_units,
       COALESCE(kt.sale_units,0) AS sale_units,
       COALESCE(kt.return_units,0) AS return_units,
       COALESCE(kt.adjustment_units,0) AS adjustment_units,
       COALESCE(kt.purchase_units,0) - COALESCE(kt.sale_units,0)
         + COALESCE(kt.return_units,0) + COALESCE(kt.adjustment_units,0) AS net_units
FROM products p LEFT JOIN kind_totals kt ON kt.product_id = p.id
ORDER BY net_units DESC, product;`,
    tests: [
      {
        input: ``,
        expectedOutput: `Clean Code	35	1	1	-5	30
Table Lamp	20	2	0	0	18
Cotton Panjabi	15	2	0	1	14
Dune	14	0	0	-2	12
Mechanical Keyboard	20	2	1	-7	12
Laptop Stand	12	1	0	0	11
SQL Handbook	9	0	0	0	9
USB-C Hub	10	2	0	0	8
Denim Jacket	8	1	0	0	7
Webcam	8	0	0	-1	7
Clay Dinner Set	8	1	1	-2	6
27in Monitor	6	1	0	0	5
Wireless Mouse	5	2	0	0	3
Leather Wallet	0	0	0	0	0`,
        isSample: true
      },
      {
        input: `insert into inventory_movements (id,product_id,kind,quantity,reference,created_at) values (34,7,'purchase',10,'PO-1015','2026-11-01');`,
        expectedOutput: `Clean Code	35	1	1	-5	30
Table Lamp	20	2	0	0	18
Cotton Panjabi	15	2	0	1	14
Dune	14	0	0	-2	12
Mechanical Keyboard	20	2	1	-7	12
Laptop Stand	12	1	0	0	11
Leather Wallet	10	0	0	0	10
SQL Handbook	9	0	0	0	9
USB-C Hub	10	2	0	0	8
Denim Jacket	8	1	0	0	7
Webcam	8	0	0	-1	7
Clay Dinner Set	8	1	1	-2	6
27in Monitor	6	1	0	0	5
Wireless Mouse	5	2	0	0	3`,
        isSample: true
      },
      {
        input: `update inventory_movements set quantity=-3 where id=5;`,
        expectedOutput: `Clean Code	35	1	1	-5	30
Table Lamp	20	2	0	0	18
Mechanical Keyboard	20	2	1	-3	16
Cotton Panjabi	15	2	0	1	14
Dune	14	0	0	-2	12
Laptop Stand	12	1	0	0	11
SQL Handbook	9	0	0	0	9
USB-C Hub	10	2	0	0	8
Denim Jacket	8	1	0	0	7
Webcam	8	0	0	-1	7
Clay Dinner Set	8	1	1	-2	6
27in Monitor	6	1	0	0	5
Wireless Mouse	5	2	0	0	3
Leather Wallet	0	0	0	0	0`,
        isSample: false
      },
      {
        input: `insert into inventory_movements (id,product_id,kind,quantity,reference,created_at) values (34,7,'adjustment',-4,'CYCLE-7','2026-11-01');`,
        expectedOutput: `Clean Code	35	1	1	-5	30
Table Lamp	20	2	0	0	18
Cotton Panjabi	15	2	0	1	14
Dune	14	0	0	-2	12
Mechanical Keyboard	20	2	1	-7	12
Laptop Stand	12	1	0	0	11
SQL Handbook	9	0	0	0	9
USB-C Hub	10	2	0	0	8
Denim Jacket	8	1	0	0	7
Webcam	8	0	0	-1	7
Clay Dinner Set	8	1	1	-2	6
27in Monitor	6	1	0	0	5
Wireless Mouse	5	2	0	0	3
Leather Wallet	0	0	0	-4	-4`,
        isSample: false
      },
      {
        input: `delete from inventory_movements where product_id=6;`,
        expectedOutput: `Clean Code	35	1	1	-5	30
Table Lamp	20	2	0	0	18
Dune	14	0	0	-2	12
Mechanical Keyboard	20	2	1	-7	12
Laptop Stand	12	1	0	0	11
SQL Handbook	9	0	0	0	9
USB-C Hub	10	2	0	0	8
Denim Jacket	8	1	0	0	7
Webcam	8	0	0	-1	7
Clay Dinner Set	8	1	1	-2	6
27in Monitor	6	1	0	0	5
Wireless Mouse	5	2	0	0	3
Cotton Panjabi	0	0	0	0	0
Leather Wallet	0	0	0	0	0`,
        isSample: false
      },
    ],
  },
  {
    slug: "sql-practice-pivot-grouping-challenge",
    title: "Cart time-of-day funnel",
    statement: `কার্ট কখন তৈরি হচ্ছে সেটাই রূপান্তরের আরেকটা লেন্স। carts.created_at-এর ঘণ্টা ধরে তিনটি বালতিতে ভাগ করো: \`morning\` (05–11), \`afternoon\` (12–17), \`evening\` (18–23)। প্রতিটি বালতির জন্য বের করো: মোট কার্ট, converted, abandoned, active সংখ্যা এবং conversion হার (converted/মোট, শতকরা, ১ দশমিক)। একটিও কার্ট না থাকা বালতিও তালিকায় থাকবে — সেখানে সব সংখ্যা 0 আর conversion হার NULL। আউটপুট কলাম: bucket, carts, converted, abandoned, active, conversion_pct। বালতির নাম অনুযায়ী সাজাও।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`bucket\`, \`carts\`, \`converted\`, \`abandoned\`, \`active\`, \`conversion_pct\`। খালি বালতিতে \`conversion_pct\` \`\\N\`।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## ধারণা
বালতির তালিকা ডেটা থেকে নয়, সংজ্ঞা থেকে আসে — তাই একটা ছোট defs সেট (UNION ALL) বানিয়ে ডেটাকে তার সাথে LEFT JOIN করতে হবে। উল্টো দিকে করলে (ডেটা JOIN defs) খালি বালতির সারিই জন্মায় না। হার = ভাগশেষ না দিয়ে SUM/COUNT — শূন্যে ভাগ করলে SQLite শান্তভাবে NULL দেয়, সেটাই দেখানোর কথা।

## ধাপে ধাপে
১. buckets: substr(created_at,12,2) থেকে ঘণ্টা, CASE-এ তিন বালতি + status।
২. defs: 'morning'/'afternoon'/'evening' তিন সারি।
৩. defs LEFT JOIN buckets — COUNT(c.status) মোট, status ধরে CASE-count।
৪. ROUND(100.0*converted/COUNT(c.status),1), ORDER BY bucket।

## কোডে দেখি
\`\`\`sql
WITH buckets AS (
  SELECT CASE WHEN CAST(substr(created_at,12,2) AS INTEGER) BETWEEN 5 AND 11 THEN 'morning'
              WHEN CAST(substr(created_at,12,2) AS INTEGER) BETWEEN 12 AND 17 THEN 'afternoon'
              ELSE 'evening' END AS bucket,
         status
  FROM carts),
defs AS (SELECT 'morning' AS bucket UNION ALL SELECT 'afternoon' UNION ALL SELECT 'evening')
SELECT d.bucket, COUNT(c.status) AS carts,
       SUM(CASE WHEN c.status='converted' THEN 1 ELSE 0 END) AS converted,
       SUM(CASE WHEN c.status='abandoned' THEN 1 ELSE 0 END) AS abandoned,
       SUM(CASE WHEN c.status='active' THEN 1 ELSE 0 END) AS active,
       ROUND(100.0*SUM(CASE WHEN c.status='converted' THEN 1 ELSE 0 END)/COUNT(c.status), 1) AS conversion_pct
FROM defs d LEFT JOIN buckets c ON c.bucket = d.bucket
GROUP BY d.bucket ORDER BY d.bucket;
\`\`\`

## সাধারণ ভুল
ডেটা-নিচে গুনে খালি বালতি পুরো বাদ দেওয়া — সবচেয়ে কমন ভুল; COUNT(*) লিখে LEFT JOIN-এর NULL সারিও গুনে carts=1 দেখানো; ঘণ্টা স্ট্রিং '09' সংখ্যার সাথে তুলনা করা — CAST ছাড়া BETWEEN ভুল ধরে; শূন্যে ভাগ এড়াতে COALESCE(x,0) বসিয়ে ভুয়া 0.0% দেখানো — আসলে হার অজানা, NULL-ই সঠিক।`,
    difficulty: "HARD",
    points: 340,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    premiumModuleSlug: "advanced-sql",
    category: "SQL Advanced",
    subcategory: "Pivot & grouping",
    referencePython: "",
    referenceSql: `WITH buckets AS (
  SELECT CASE WHEN CAST(substr(created_at,12,2) AS INTEGER) BETWEEN 5 AND 11 THEN 'morning'
              WHEN CAST(substr(created_at,12,2) AS INTEGER) BETWEEN 12 AND 17 THEN 'afternoon'
              ELSE 'evening' END AS bucket,
         status
  FROM carts),
defs AS (SELECT 'morning' AS bucket UNION ALL SELECT 'afternoon' UNION ALL SELECT 'evening')
SELECT d.bucket, COUNT(c.status) AS carts,
       SUM(CASE WHEN c.status='converted' THEN 1 ELSE 0 END) AS converted,
       SUM(CASE WHEN c.status='abandoned' THEN 1 ELSE 0 END) AS abandoned,
       SUM(CASE WHEN c.status='active' THEN 1 ELSE 0 END) AS active,
       ROUND(100.0*SUM(CASE WHEN c.status='converted' THEN 1 ELSE 0 END)/COUNT(c.status), 1) AS conversion_pct
FROM defs d LEFT JOIN buckets c ON c.bucket = d.bucket
GROUP BY d.bucket ORDER BY d.bucket;`,
    tests: [
      {
        input: ``,
        expectedOutput: `afternoon	2	0	2	0	0.0
evening	1	0	0	1	0.0
morning	5	4	0	1	80.0`,
        isSample: true
      },
      {
        input: `delete from carts where id=7;`,
        expectedOutput: `afternoon	2	0	2	0	0.0
evening	0	0	0	0	\\N
morning	5	4	0	1	80.0`,
        isSample: true
      },
      {
        input: `insert into carts (id,customer_id,status,created_at,updated_at) values (9,6,'converted','2026-11-05 19:30','2026-11-05 20:00');`,
        expectedOutput: `afternoon	2	0	2	0	0.0
evening	2	1	0	1	50.0
morning	5	4	0	1	80.0`,
        isSample: false
      },
      {
        input: `update carts set status='active' where id=1;`,
        expectedOutput: `afternoon	2	0	2	0	0.0
evening	1	0	0	1	0.0
morning	5	3	0	2	60.0`,
        isSample: false
      },
      {
        input: `insert into carts (id,customer_id,status,created_at,updated_at) values (10,3,'abandoned','2026-11-06 20:10','2026-11-06 21:00');`,
        expectedOutput: `afternoon	2	0	2	0	0.0
evening	2	0	1	1	0.0
morning	5	4	0	1	80.0`,
        isSample: false
      },
    ],
  },
];
