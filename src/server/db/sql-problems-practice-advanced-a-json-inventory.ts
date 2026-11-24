import type { SeedProblem } from "./seed-problems";

export const SQL_PROBLEMS_PRACTICE_ADVANCED_A_JSON_INVENTORY: SeedProblem[] = [
  {
    slug: "sql-practice-json-inventory-easy",
    title: "Variant coverage",
    statement: `ক্যাটালগ টিম জানতে চায় কোন প্রোডাক্টে কত রকমফের (variant) আছে। product_variants থেকে যেসব প্রোডাক্টের অন্তত একটি variant আছে শুধু সেগুলোর জন্য বের করো: variant-সংখ্যা, সব variant মিলিয়ে মোট স্টক, আর সবচেয়ে দামি variant-এর দাম (সেন্টে)। আউটপুট কলাম: product, variants, variant_stock, top_variant_cents। আগে মোট স্টক (বেশি থেকে কম), টাইলে প্রোডাক্টের নাম অনুযায়ী সাজাও।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`product\`, \`variants\`, \`variant_stock\`, \`top_variant_cents\`, স্টক ও নাম অনুযায়ী।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## ধারণা
product_variants-এ প্রোডাক্টের id আছে, নাম নেই—products JOIN করে আনো। তারপর প্রোডাক্ট ধরে GROUP BY: \`COUNT(*)\` variant-সংখ্যা, \`SUM(stock)\` মোট স্টক, \`MAX(price_cents)\` সবচেয়ে দামি variant। প্রশ্ন শুধু variant-ওয়ালা প্রোডাক্টের, তাই সাধারণ (INNER) JOIN-ই যথেষ্ট।

## ধাপে ধাপে
১. products JOIN product_variants।
২. প্রোডাক্টের id ধরে GROUP BY।
৩. COUNT, SUM(stock), MAX(price_cents)।
৪. ORDER BY variant_stock DESC, product (টাই-ব্রেক)।

## কোডে দেখি
\`\`\`sql
SELECT p.name AS product,
       COUNT(*) AS variants,
       SUM(pv.stock) AS variant_stock,
       MAX(pv.price_cents) AS top_variant_cents
FROM products p
JOIN product_variants pv ON pv.product_id = p.id
GROUP BY p.id
ORDER BY variant_stock DESC, product;
\`\`\`

## সাধারণ ভুল
GROUP BY-তে id-এর বদলে নাম লিখে একই নামের প্রোডাক্ট এক গ্রুপে পড়া; ORDER BY-তে টাই-ব্রেক না দিয়ে সমান স্টকে অনির্দিষ্ট ক্রম; গড় বা মোট বের করতে গিয়ে products.price_cents ব্যবহার করা (variant-এর নিজের দামই লাগবে)।`,
    difficulty: "EASY",
    points: 200,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    premiumModuleSlug: "advanced-sql",
    category: "SQL Advanced",
    subcategory: "JSON & inventory",
    referencePython: "",
    referenceSql: `SELECT p.name AS product, COUNT(*) AS variants, SUM(pv.stock) AS variant_stock, MAX(pv.price_cents) AS top_variant_cents FROM products p JOIN product_variants pv ON pv.product_id = p.id GROUP BY p.id ORDER BY variant_stock DESC, product;`,
    tests: [
      {
        input: ``,
        expectedOutput: `Clean Code	1	15	220000
Cotton Panjabi	3	14	250000
Mechanical Keyboard	2	12	460000
Denim Jacket	2	7	390000
Clay Dinner Set	2	6	420000
27in Monitor	2	5	2350000`,
        isSample: true
      },
      {
        input: `insert into product_variants (id,product_id,sku,size,color,price_cents,stock) values (13,4,'BOOK-CC-PB','paperback','white',200000,10);`,
        expectedOutput: `Clean Code	2	25	220000
Cotton Panjabi	3	14	250000
Mechanical Keyboard	2	12	460000
Denim Jacket	2	7	390000
Clay Dinner Set	2	6	420000
27in Monitor	2	5	2350000`,
        isSample: true
      },
      {
        input: `update product_variants set stock=0 where sku='PANJABI-M';`,
        expectedOutput: `Clean Code	1	15	220000
Mechanical Keyboard	2	12	460000
Cotton Panjabi	3	8	250000
Denim Jacket	2	7	390000
Clay Dinner Set	2	6	420000
27in Monitor	2	5	2350000`,
        isSample: false
      },
      {
        input: `insert into product_variants (id,product_id,sku,size,color,price_cents,stock) values (14,13,'DUNE-MM','mass market','orange',230000,6);`,
        expectedOutput: `Clean Code	1	15	220000
Cotton Panjabi	3	14	250000
Mechanical Keyboard	2	12	460000
Denim Jacket	2	7	390000
Clay Dinner Set	2	6	420000
Dune	1	6	230000
27in Monitor	2	5	2350000`,
        isSample: false
      },
      {
        input: `delete from product_variants where product_id=10;`,
        expectedOutput: `Clean Code	1	15	220000
Cotton Panjabi	3	14	250000
Mechanical Keyboard	2	12	460000
Denim Jacket	2	7	390000
27in Monitor	2	5	2350000`,
        isSample: false
      },
    ],
  },
  {
    slug: "sql-practice-json-inventory-medium",
    title: "Sales ledger audit",
    statement: `গুদামের 'sale' এন্ট্রি আর আসল বিক্রির হিসাব মেলাও। paid/shipped অর্ডারের order_items থেকে প্রতিটি প্রোডাক্টের বিক্রি হওয়া unit-সংখ্যা বের করো; inventory_movements-এর kind='sale' এন্ট্রিগুলো থেকে মোট কত unit বের হয়েছে সেটাও। দুটো না মিললেই শুধু সেই প্রোডাক্ট রিপোর্টে আসবে। আউটপুট কলাম: product, sold_units, moved_units, difference (= sold_units − moved_units)। movement না থাকলে moved_units 0 ধরো; বিক্রি ০ হলেও অমিল ধরা পড়বে। আগে অমিলের বিশালতা (ABS) বেশি থেকে কম, টাইলে প্রোডাক্টের নাম অনুযায়ী সাজাও।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`product\`, \`sold_units\`, \`moved_units\`, \`difference\`, অমিল ও নাম অনুযায়ী।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## ধারণা
দুই খাতার হিসাব দুই CTE-তে: sold—order_items, কিন্তু শুধু paid/shipped অর্ডারের (বাতিল অর্ডারের বিক্রি আসল বিক্রি নয়); moved—inventory_movements-এর 'sale' সারি, আর quantity ঋণাত্মক তাই −SUM করে ধনাত্মক বানাও। যে প্রোডাক্টের movement নেই সে কিন্তু বিক্রি হতে পারে—তাই products LEFT JOIN + COALESCE(0)।

## ধাপে ধাপে
১. paid/shipped অর্ডারের order_items নিয়ে sold_items CTE।
২. products LEFT JOIN sold_items, প্রোডাক্ট ধরে sold_units (COALESCE 0)।
৩. 'sale' movement থেকে moved_units = −SUM(quantity)।
৪. LEFT JOIN + COALESCE, \`WHERE sold <> moved\`, ORDER BY ABS DESC, product।

## কোডে দেখি
\`\`\`sql
WITH sold_items AS (
  SELECT oi.product_id, oi.quantity
  FROM order_items oi
  JOIN orders o ON o.id = oi.order_id
  WHERE o.status IN ('paid', 'shipped')
),
sold AS (
  SELECT p.id, p.name, COALESCE(SUM(si.quantity), 0) AS sold_units
  FROM products p
  LEFT JOIN sold_items si ON si.product_id = p.id
  GROUP BY p.id
),
moved AS (
  SELECT product_id, -SUM(quantity) AS moved_units
  FROM inventory_movements
  WHERE kind = 'sale'
  GROUP BY product_id
)
SELECT s.name AS product, s.sold_units, COALESCE(m.moved_units, 0) AS moved_units,
       s.sold_units - COALESCE(m.moved_units, 0) AS difference
FROM sold s
LEFT JOIN moved m ON m.product_id = s.id
WHERE s.sold_units <> COALESCE(m.moved_units, 0)
ORDER BY ABS(s.sold_units - COALESCE(m.moved_units, 0)) DESC, product;
\`\`\`

## সাধারণ ভুল
status ফিল্টার বাদ দিয়ে cancelled অর্ডারের বিক্রি-ও গুনে ফেলা; LEFT JOIN না করে movement-হীন প্রোডাক্ট রিপোর্ট থেকে হারিয়ে যাওয়া; ঋণাত্মক quantity সরাসরি তুলনা করে চিহ্ন উল্টে যাওয়া।`,
    difficulty: "MEDIUM",
    points: 300,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    premiumModuleSlug: "advanced-sql",
    category: "SQL Advanced",
    subcategory: "JSON & inventory",
    referencePython: "",
    referenceSql: `WITH sold_items AS (SELECT oi.product_id, oi.quantity FROM order_items oi JOIN orders o ON o.id = oi.order_id WHERE o.status IN ('paid','shipped')), sold AS (SELECT p.id, p.name, COALESCE(SUM(si.quantity), 0) AS sold_units FROM products p LEFT JOIN sold_items si ON si.product_id = p.id GROUP BY p.id), moved AS (SELECT product_id, -SUM(quantity) AS moved_units FROM inventory_movements WHERE kind = 'sale' GROUP BY product_id) SELECT s.name AS product, s.sold_units, COALESCE(m.moved_units, 0) AS moved_units, s.sold_units - COALESCE(m.moved_units, 0) AS difference FROM sold s LEFT JOIN moved m ON m.product_id = s.id WHERE s.sold_units <> COALESCE(m.moved_units, 0) ORDER BY ABS(s.sold_units - COALESCE(m.moved_units, 0)) DESC, product;`,
    tests: [
      {
        input: ``,
        expectedOutput: `SQL Handbook	3	0	3
Leather Wallet	2	0	2
Wireless Mouse	0	2	-2`,
        isSample: true
      },
      {
        input: `insert into inventory_movements (id,product_id,kind,quantity,reference,created_at) values (34,5,'sale',-3,'ORD-6','2026-10-20');`,
        expectedOutput: `Leather Wallet	2	0	2
Wireless Mouse	0	2	-2`,
        isSample: true
      },
      {
        input: `update orders set status='cancelled' where id=3;`,
        expectedOutput: `SQL Handbook	3	0	3
Cotton Panjabi	0	2	-2
Wireless Mouse	0	2	-2
Leather Wallet	1	0	1`,
        isSample: false
      },
      {
        input: `insert into orders (id,customer_id,ordered_at,status) values (11,6,'2026-11-21','paid'); insert into order_items (id,order_id,product_id,quantity,unit_price_cents) values (16,11,12,1,350000);`,
        expectedOutput: `SQL Handbook	3	0	3
Leather Wallet	2	0	2
Wireless Mouse	0	2	-2
Webcam	1	0	1`,
        isSample: false
      },
      {
        input: `insert into inventory_movements (id,product_id,kind,quantity,reference,created_at) values (34,7,'sale',-1,'ORD-3','2026-10-05');`,
        expectedOutput: `SQL Handbook	3	0	3
Wireless Mouse	0	2	-2
Leather Wallet	2	1	1`,
        isSample: false
      },
    ],
  },
];
