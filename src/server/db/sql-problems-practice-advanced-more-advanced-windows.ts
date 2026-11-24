import type { SeedProblem } from "./seed-problems";

export const SQL_PROBLEMS_PRACTICE_ADVANCED_MORE_ADVANCED_WINDOWS: SeedProblem[] = [
  {
    slug: "sql-practice-advanced-windows-hard",
    title: "First and last purchase",
    statement: `প্রতিটি কাস্টমারের paid/shipped অর্ডারগুলো তারিখের ক্রমে সাজিয়ে এক সারিতে দেখাও: তার প্রথম অর্ডারের id ও মান (সেন্টে), শেষ অর্ডারের id ও মান, আর সব অর্ডারের যোগফল (lifetime)। একই তারিখে একাধিক অর্ডার হলে ছোট order_id আগে। আউটপুট কলাম: customer, first_order_id, first_order_cents, last_order_id, last_order_cents, lifetime_cents। নাম অনুযায়ী সাজাও।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`customer\`, \`first_order_id\`, \`first_order_cents\`, \`last_order_id\`, \`last_order_cents\`, \`lifetime_cents\`, নাম অনুযায়ী।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## ধারণা
FIRST_VALUE আর LAST_VALUE দিয়ে পার্টিশনের প্রথম ও শেষ সারির মান প্রতি সারিতে টেনে আনা যায়। সাবধান: LAST_VALUE-এর ডিফল্ট frame হলো “CURRENT ROW পর্যন্ত” — তাতে সবসময় নিজের সারিটাই “শেষ” হয়ে যায়! frame-টা \`UNBOUNDED FOLLOWING\` পর্যন্ত বাড়াতে হবে।

## ধাপে ধাপে
১. order_totals: প্রতি অর্ডারের মান (GROUP BY order) + কাস্টমার + তারিখ।
২. WINDOW w: PARTITION BY customer, ORDER BY ordered_at, order_id, frame UNBOUNDED PRECEDING TO UNBOUNDED FOLLOWING।
৩. FIRST_VALUE/LAST_VALUE id ও cents, SUM(...) OVER w lifetime।
৪. প্রতি কাস্টমারে একই সারি বারবার আসে — DISTINCT দিয়ে একটা রাখো, ORDER BY customer।

## কোডে দেখি
\`\`\`sql
WITH order_totals AS (
  SELECT o.id AS order_id, cu.name AS customer, o.ordered_at,
         SUM(oi.quantity*oi.unit_price_cents) AS order_cents
  FROM orders o JOIN customers cu ON cu.id=o.customer_id
  JOIN order_items oi ON oi.order_id=o.id
  WHERE o.status IN ('paid','shipped') GROUP BY o.id, cu.name, o.ordered_at)
SELECT DISTINCT customer,
       FIRST_VALUE(order_id) OVER w AS first_order_id,
       FIRST_VALUE(order_cents) OVER w AS first_order_cents,
       LAST_VALUE(order_id) OVER w AS last_order_id,
       LAST_VALUE(order_cents) OVER w AS last_order_cents,
       SUM(order_cents) OVER w AS lifetime_cents
FROM order_totals
WINDOW w AS (PARTITION BY customer ORDER BY ordered_at, order_id
              ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING)
ORDER BY customer;
\`\`\`

## সাধারণ ভুল
LAST_VALUE থেকে frame বাদ দিলে প্রতিটি সারি নিজেকেই “শেষ” দেখে; DISTINCT না দিলে প্রতি অর্ডারে একই সারি জন্মায়; pending/cancelled অর্ডারও প্রথম/শেষ হিসেবে ধরে নেওয়া — প্রথম কেনাটা বদলে যায়।`,
    difficulty: "HARD",
    points: 320,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    premiumModuleSlug: "advanced-sql",
    category: "SQL Advanced",
    subcategory: "Window functions",
    referencePython: "",
    referenceSql: `WITH order_totals AS (
  SELECT o.id AS order_id, cu.name AS customer, o.ordered_at,
         SUM(oi.quantity*oi.unit_price_cents) AS order_cents
  FROM orders o JOIN customers cu ON cu.id=o.customer_id
  JOIN order_items oi ON oi.order_id=o.id
  WHERE o.status IN ('paid','shipped') GROUP BY o.id, cu.name, o.ordered_at)
SELECT DISTINCT customer,
       FIRST_VALUE(order_id) OVER w AS first_order_id,
       FIRST_VALUE(order_cents) OVER w AS first_order_cents,
       LAST_VALUE(order_id) OVER w AS last_order_id,
       LAST_VALUE(order_cents) OVER w AS last_order_cents,
       SUM(order_cents) OVER w AS lifetime_cents
FROM order_totals
WINDOW w AS (PARTITION BY customer ORDER BY ordered_at, order_id
              ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING)
ORDER BY customer;`,
    tests: [
      {
        input: ``,
        expectedOutput: `Karim	8	180000	8	180000	180000
Mim	7	670000	7	670000	670000
Nusrat	3	600000	9	120000	720000
Rahim	1	890000	6	605000	3495000
Tanvir	10	380000	10	380000	380000`,
        isSample: true
      },
      {
        input: `insert into orders (id,customer_id,ordered_at,status) values (11,2,'2026-11-04','paid'); insert into order_items (id,order_id,product_id,quantity,unit_price_cents) values (16,11,5,1,95000);`,
        expectedOutput: `Karim	8	180000	11	95000	275000
Mim	7	670000	7	670000	670000
Nusrat	3	600000	9	120000	720000
Rahim	1	890000	6	605000	3495000
Tanvir	10	380000	10	380000	380000`,
        isSample: true
      },
      {
        input: `update orders set status='cancelled' where id=3;`,
        expectedOutput: `Karim	8	180000	8	180000	180000
Mim	7	670000	7	670000	670000
Nusrat	9	120000	9	120000	120000
Rahim	1	890000	6	605000	3495000
Tanvir	10	380000	10	380000	380000`,
        isSample: false
      },
      {
        input: `update orders set ordered_at='2026-11-10' where id=1;`,
        expectedOutput: `Karim	8	180000	8	180000	180000
Mim	7	670000	7	670000	670000
Nusrat	3	600000	9	120000	720000
Rahim	4	2000000	1	890000	3495000
Tanvir	10	380000	10	380000	380000`,
        isSample: false
      },
      {
        input: `insert into orders (id,customer_id,ordered_at,status) values (12,4,'2026-11-05','paid'); insert into order_items (id,order_id,product_id,quantity,unit_price_cents) values (17,12,13,1,210000);`,
        expectedOutput: `Karim	8	180000	8	180000	180000
Mim	7	670000	7	670000	670000
Nusrat	3	600000	9	120000	720000
Rahim	1	890000	6	605000	3495000
Sajid	12	210000	12	210000	210000
Tanvir	10	380000	10	380000	380000`,
        isSample: false
      },
    ],
  },
  {
    slug: "sql-practice-advanced-windows-challenge",
    title: "Price step within category",
    statement: `প্রতিটি ক্যাটাগরির ভেতরে প্রোডাক্টগুলো দামের ক্রমে (কম থেকে বেশি; সমান দামে নাম অনুযায়ী) সাজিয়ে প্রতিটি প্রোডাক্টের পাশে দেখাও তার আগের প্রোডাক্টের দাম (prev_price_cents) এবং দাম কত শতাংশ বেড়েছে বা কমেছে (pct_change, ১ দশমিক; আগেরটার তুলনায়)। ক্যাটাগরির প্রথম প্রোডাক্টের prev NULL হবে এবং pct_change NULL — সেই সারি বাদ যাবে না। আউটপুট কলাম: category, product, price_cents, prev_price_cents, pct_change। ক্যাটাগরি, তারপর দাম, তারপর নাম অনুযায়ী সাজাও।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`category\`, \`product\`, \`price_cents\`, \`prev_price_cents\`, \`pct_change\`। প্রথম প্রোডাক্টে শেষ দুই কলাম \`\\N\`।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## ধারণা
\`LAG(price) OVER (PARTITION BY category ORDER BY price, name)\` আগের সারির দাম এনে দেয় — পার্টিশনের প্রথম সারিতে NULL। ফাঁদ দুটো: pct_change হিসাবের ভাগে prev থাকলেই ভাগ চলে (NULL/NULL হলে ফলও NULL, সারিটা বাঁচে); আর সমান দামের টাই-এ name টাই-ব্রেক না দিলে কে “আগে” অনির্দিষ্ট থেকে যায়।

## ধাপে ধাপে
১. products JOIN categories, window-এ PARTITION BY ক্যাটাগরি।
২. LAG দুই এক্সপ্রেশনেই (prev কলাম আর pct_change-এর ভাগে) ব্যবহার করো।
৩. 100.0*(price-prev)/prev, ROUND(...,1)।
৪. NULL সারি ফিল্টার কোরো না — ORDER BY category, price_cents, product।

## কোডে দেখি
\`\`\`sql
SELECT c.name AS category, p.name AS product, p.price_cents,
       LAG(p.price_cents) OVER w AS prev_price_cents,
       ROUND(100.0*(p.price_cents - LAG(p.price_cents) OVER w)
             / LAG(p.price_cents) OVER w, 1) AS pct_change
FROM products p JOIN categories c ON c.id = p.category_id
WINDOW w AS (PARTITION BY c.name ORDER BY p.price_cents, p.name)
ORDER BY category, price_cents, product;
\`\`\`

## সাধারণ ভুল
\`WHERE prev IS NOT NULL\` দিয়ে প্রথম প্রোডাক্টের সারি ফেলে দেওয়া; সমান দামে name টাই-ব্রেক না দেওয়া (pct_change 0.0 হওয়ার কথা ছিল, এলোমেলো আসে); COALESCE(prev,0) করে ভাগ-শূন্য ঘটানো বা প্রথম সারিতে ভুয়া শতকরা বসানো; price DESC দিয়ে “কম থেকে বেশি” উল্টে ফেলা।`,
    difficulty: "HARD",
    points: 340,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    premiumModuleSlug: "advanced-sql",
    category: "SQL Advanced",
    subcategory: "Window functions",
    referencePython: "",
    referenceSql: `SELECT c.name AS category, p.name AS product, p.price_cents,
       LAG(p.price_cents) OVER w AS prev_price_cents,
       ROUND(100.0*(p.price_cents - LAG(p.price_cents) OVER w) / LAG(p.price_cents) OVER w, 1) AS pct_change
FROM products p JOIN categories c ON c.id = p.category_id
WINDOW w AS (PARTITION BY c.name ORDER BY p.price_cents, p.name)
ORDER BY category, price_cents, product;`,
    tests: [
      {
        input: ``,
        expectedOutput: `Books	SQL Handbook	95000	\\N	\\N
Books	Clean Code	180000	95000	89.5
Electronics	Wireless Mouse	85000	\\N	\\N
Electronics	Laptop Stand	150000	85000	76.5
Electronics	USB-C Hub	220000	150000	46.7
Electronics	Webcam	350000	220000	59.1
Electronics	Mechanical Keyboard	450000	350000	28.6
Electronics	27in Monitor	1850000	450000	311.1
Fashion	Leather Wallet	120000	\\N	\\N
Fiction	Dune	210000	\\N	\\N
Home	Table Lamp	110000	\\N	\\N
Home	Clay Dinner Set	320000	110000	190.9
Men	Cotton Panjabi	240000	\\N	\\N
Men	Denim Jacket	380000	240000	58.3`,
        isSample: true
      },
      {
        input: `update products set price_cents=100000 where id=2;`,
        expectedOutput: `Books	SQL Handbook	95000	\\N	\\N
Books	Clean Code	180000	95000	89.5
Electronics	Wireless Mouse	85000	\\N	\\N
Electronics	USB-C Hub	100000	85000	17.6
Electronics	Laptop Stand	150000	100000	50.0
Electronics	Webcam	350000	150000	133.3
Electronics	Mechanical Keyboard	450000	350000	28.6
Electronics	27in Monitor	1850000	450000	311.1
Fashion	Leather Wallet	120000	\\N	\\N
Fiction	Dune	210000	\\N	\\N
Home	Table Lamp	110000	\\N	\\N
Home	Clay Dinner Set	320000	110000	190.9
Men	Cotton Panjabi	240000	\\N	\\N
Men	Denim Jacket	380000	240000	58.3`,
        isSample: true
      },
      {
        input: `insert into products (id,vendor_id,category_id,name,price_cents,stock,rating) values (15,4,1,'USB Fan',40000,10,4.1);`,
        expectedOutput: `Books	SQL Handbook	95000	\\N	\\N
Books	Clean Code	180000	95000	89.5
Electronics	USB Fan	40000	\\N	\\N
Electronics	Wireless Mouse	85000	40000	112.5
Electronics	Laptop Stand	150000	85000	76.5
Electronics	USB-C Hub	220000	150000	46.7
Electronics	Webcam	350000	220000	59.1
Electronics	Mechanical Keyboard	450000	350000	28.6
Electronics	27in Monitor	1850000	450000	311.1
Fashion	Leather Wallet	120000	\\N	\\N
Fiction	Dune	210000	\\N	\\N
Home	Table Lamp	110000	\\N	\\N
Home	Clay Dinner Set	320000	110000	190.9
Men	Cotton Panjabi	240000	\\N	\\N
Men	Denim Jacket	380000	240000	58.3`,
        isSample: false
      },
      {
        input: `update products set price_cents=1850000 where id=2;`,
        expectedOutput: `Books	SQL Handbook	95000	\\N	\\N
Books	Clean Code	180000	95000	89.5
Electronics	Wireless Mouse	85000	\\N	\\N
Electronics	Laptop Stand	150000	85000	76.5
Electronics	Webcam	350000	150000	133.3
Electronics	Mechanical Keyboard	450000	350000	28.6
Electronics	27in Monitor	1850000	450000	311.1
Electronics	USB-C Hub	1850000	1850000	0.0
Fashion	Leather Wallet	120000	\\N	\\N
Fiction	Dune	210000	\\N	\\N
Home	Table Lamp	110000	\\N	\\N
Home	Clay Dinner Set	320000	110000	190.9
Men	Cotton Panjabi	240000	\\N	\\N
Men	Denim Jacket	380000	240000	58.3`,
        isSample: false
      },
      {
        input: `delete from products where id=13;`,
        expectedOutput: `Books	SQL Handbook	95000	\\N	\\N
Books	Clean Code	180000	95000	89.5
Electronics	Wireless Mouse	85000	\\N	\\N
Electronics	Laptop Stand	150000	85000	76.5
Electronics	USB-C Hub	220000	150000	46.7
Electronics	Webcam	350000	220000	59.1
Electronics	Mechanical Keyboard	450000	350000	28.6
Electronics	27in Monitor	1850000	450000	311.1
Fashion	Leather Wallet	120000	\\N	\\N
Home	Table Lamp	110000	\\N	\\N
Home	Clay Dinner Set	320000	110000	190.9
Men	Cotton Panjabi	240000	\\N	\\N
Men	Denim Jacket	380000	240000	58.3`,
        isSample: false
      },
    ],
  },
];
