import type { SeedProblem } from "./seed-problems";

export const SQL_PROBLEMS_PRACTICE_ADVANCED_B_CAPSTONE: SeedProblem[] = [
  {
    slug: "sql-practice-capstone-easy",
    title: "Product revenue leaderboard",
    statement: `ক্যাটাগরি ম্যানেজারদের প্রোডাক্ট লিডারবোর্ড দরকার: paid/shipped অর্ডারে প্রতিটি পণ্যের মোট বিক্রি (revenue_cents), মোট বিক্রি হওয়া ইউনিট (units_sold), আর বিক্রি অনুযায়ী \`DENSE_RANK()\` (বেশি থেকে কম)। বিক্রি হয়নি এমন পণ্য বাদ। আউটপুট: product, category, units_sold, revenue_cents, revenue_rank — revenue_rank, টাই হলে পণ্যের নাম অনুযায়ী সাজাও।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`product\`, \`category\`, \`units_sold\`, \`revenue_cents\`, \`revenue_rank\`।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## ধারণা
লিডারবোর্ড = aggregate + rank, দুই স্তরে। প্রথমে পণ্য ধরে units আর revenue (order_items ⋈ orders, paid/shipped ফিল্টার), তারপর \`DENSE_RANK() OVER (ORDER BY revenue_cents DESC)\`। RANK টাই-এর পরে ফাঁক রাখে (1, 2, 2, 4), DENSE_RANK রাখে না (1, 2, 2, 3) — লিডারবোর্ডে টাই-এর পরের স্থান সরাসরি দেখতে DENSE_RANK-ই সুবিধা, আর এই সমস্যার একটি ভ্যারিয়েন্টে সত্যিকারের টাই পড়বে। বিক্রি-নেই পণ্য INNER JOIN-এ স্বাভাবিকভাবেই বাদ যায়।

## ধাপে ধাপে
১. product_sales CTE: products ⋈ categories ⋈ order_items ⋈ orders, paid/shipped, পণ্য ধরে SUM(quantity) আর SUM(quantity × unit_price_cents)।
২. DENSE_RANK() revenue অনুযায়ী DESC।
৩. ORDER BY revenue_rank, product — টাই-ব্রেক পণ্যের নাম।

## কোডে দেখি
\`\`\`sql
WITH product_sales AS (
  SELECT p.id, p.name AS product, c.name AS category,
         SUM(oi.quantity) AS units_sold,
         SUM(oi.quantity * oi.unit_price_cents) AS revenue_cents
  FROM products p
  JOIN categories c ON c.id = p.category_id
  JOIN order_items oi ON oi.product_id = p.id
  JOIN orders o ON o.id = oi.order_id
  WHERE o.status IN ('paid', 'shipped')
  GROUP BY p.id, p.name, c.name
)
SELECT product, category, units_sold, revenue_cents,
       DENSE_RANK() OVER (ORDER BY revenue_cents DESC) AS revenue_rank
FROM product_sales
ORDER BY revenue_rank, product;
\`\`\`

## সাধারণ ভুল
units_sold-এ SUM(quantity) না দিয়ে সারি গোনা; pending/cancelled অর্ডার ঢুকিয়ে বিক্রি ফোলানো; RANK আর DENSE_RANK একই ভেবে টাই-এর পরের নম্বর না মেলানো; টাই-ব্রেক হিসেবে product না দিয়ে একই rank-এ অনির্দিষ্ট ক্রম।`,
    difficulty: "EASY",
    points: 200,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    premiumModuleSlug: "advanced-sql",
    category: "SQL Advanced",
    subcategory: "Capstone",
    referencePython: "",
    referenceSql: `WITH product_sales AS (
  SELECT p.id, p.name AS product, c.name AS category,
         SUM(oi.quantity) AS units_sold,
         SUM(oi.quantity * oi.unit_price_cents) AS revenue_cents
  FROM products p
  JOIN categories c ON c.id = p.category_id
  JOIN order_items oi ON oi.product_id = p.id
  JOIN orders o ON o.id = oi.order_id
  WHERE o.status IN ('paid', 'shipped')
  GROUP BY p.id, p.name, c.name
)
SELECT product, category, units_sold, revenue_cents,
       DENSE_RANK() OVER (ORDER BY revenue_cents DESC) AS revenue_rank
FROM product_sales
ORDER BY revenue_rank, product;`,
    tests: [
      {
        input: ``,
        expectedOutput: `27in Monitor	Electronics	1	1850000	1
Mechanical Keyboard	Electronics	2	900000	2
Cotton Panjabi	Men	2	480000	3
USB-C Hub	Electronics	2	440000	4
Denim Jacket	Men	1	380000	5
Clay Dinner Set	Home	1	320000	6
SQL Handbook	Books	3	285000	7
Leather Wallet	Fashion	2	240000	8
Table Lamp	Home	2	220000	9
Clean Code	Books	1	180000	10
Laptop Stand	Electronics	1	150000	11`,
        isSample: true
      },
      {
        input: `update order_items set unit_price_cents=165000 where id=14;`,
        expectedOutput: `27in Monitor	Electronics	1	1850000	1
Mechanical Keyboard	Electronics	2	900000	2
Cotton Panjabi	Men	2	480000	3
USB-C Hub	Electronics	2	440000	4
Denim Jacket	Men	1	380000	5
Clay Dinner Set	Home	1	320000	6
Leather Wallet	Fashion	2	285000	7
SQL Handbook	Books	3	285000	7
Table Lamp	Home	2	220000	8
Clean Code	Books	1	180000	9
Laptop Stand	Electronics	1	150000	10`,
        isSample: true
      },
      {
        input: `update orders set status='cancelled' where id=6;`,
        expectedOutput: `27in Monitor	Electronics	1	1850000	1
Mechanical Keyboard	Electronics	2	900000	2
Cotton Panjabi	Men	2	480000	3
USB-C Hub	Electronics	2	440000	4
Denim Jacket	Men	1	380000	5
Leather Wallet	Fashion	2	240000	6
Table Lamp	Home	2	220000	7
Clean Code	Books	1	180000	8
Laptop Stand	Electronics	1	150000	9`,
        isSample: false
      },
      {
        input: `insert into orders (id,customer_id,ordered_at,status) values (11,2,'2026-11-05','paid'); insert into order_items (id,order_id,product_id,quantity,unit_price_cents) values (16,11,4,1,180000);`,
        expectedOutput: `27in Monitor	Electronics	1	1850000	1
Mechanical Keyboard	Electronics	2	900000	2
Cotton Panjabi	Men	2	480000	3
USB-C Hub	Electronics	2	440000	4
Denim Jacket	Men	1	380000	5
Clean Code	Books	2	360000	6
Clay Dinner Set	Home	1	320000	7
SQL Handbook	Books	3	285000	8
Leather Wallet	Fashion	2	240000	9
Table Lamp	Home	2	220000	10
Laptop Stand	Electronics	1	150000	11`,
        isSample: false
      },
      {
        input: `update order_items set quantity=2 where id=7;`,
        expectedOutput: `27in Monitor	Electronics	1	1850000	1
Mechanical Keyboard	Electronics	2	900000	2
Cotton Panjabi	Men	2	480000	3
USB-C Hub	Electronics	2	440000	4
Denim Jacket	Men	1	380000	5
Clay Dinner Set	Home	1	320000	6
Laptop Stand	Electronics	2	300000	7
SQL Handbook	Books	3	285000	8
Leather Wallet	Fashion	2	240000	9
Table Lamp	Home	2	220000	10
Clean Code	Books	1	180000	11`,
        isSample: false
      },
    ],
  },
  {
    slug: "sql-practice-capstone-medium",
    title: "Coupon impact per customer",
    statement: `মার্কেটিং টিম কুপনের আসল প্রভাব মাপতে চায়: কে কুপন দিয়ে কিনছে, কে পুরো দামে। শুধু paid/shipped অর্ডার ধরে প্রতিটি কাস্টমারের জন্য বের করো: coupon_orders (অন্তত একটা coupon redemption-আছে এমন অর্ডারের সংখ্যা), full_price_orders (redemption-নেই এমন অর্ডার), spent_cents (সব order_items-এর যোগফল), discount_cents (সেইসব অর্ডারের redemption-এর discount_cents যোগফল), net_cents (= spent_cents − discount_cents)। একটাও paid/shipped অর্ডার না থাকা কাস্টমারও তালিকায় থাকবে — সব কলামে 0 নিয়ে। আউটপুট: customer, coupon_orders, full_price_orders, spent_cents, discount_cents, net_cents — net_cents (বেশি থেকে কম), টাই হলে customer অনুযায়ী সাজাও।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`customer\`, \`coupon_orders\`, \`full_price_orders\`, \`spent_cents\`, \`discount_cents\`, \`net_cents\`।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## ধারণা
কুপন-হিসাবে দুটো ফাঁদ। প্রথমটা fan-out: redemption এক অর্ডারে একবার গোনা হয়; redemption-কে সরাসরি order_items-এর সাথে জোড়া দিলে অর্ডারের প্রতিটি আইটেমে একবার করে বসে discount দ্বিগুণ হয়ে যায় — তাই আগে অর্ডার-দানায় আলাদা CTE (GROUP BY order_id)। দ্বিতীয়টা স্ট্যাটাসের সীমা: redemption-ও শুধু paid/shipped অর্ডারেরটা ধরা হবে — অর্ডার pending হলে তার খরচও নেই, ছাড়িও নেই। কাস্টমারকে বাইরে রেখে LEFT JOIN করলে অর্ডারহীন কাস্টমার শূন্য-সারি হিসেবে দেখা যায় — শুধু সাবধান, LEFT JOIN-এর NULL-বাড়ানো সারিটাকে full_price অর্ডার ভেবো না।

## ধাপে ধাপে
১. order_spend CTE: paid/shipped অর্ডার ধরে items-এর যোগফল।
২. order_coupons CTE: coupon_redemptions ⋈ orders (paid/shipped), অর্ডার ধরে discount-এর যোগফল।
৩. customers LEFT JOIN order_spend, তারপর order_coupons order_id ধরে — কোনো fan-out নেই।
৪. কাস্টমার ধরে conditional COUNT (os.order_id IS NOT NULL শর্তসহ), COALESCE শূন্য-ভরাট; ORDER BY net_cents DESC, customer।

## কোডে দেখি
\`\`\`sql
WITH order_spend AS (
  SELECT o.id AS order_id, cu.id AS customer_id,
         SUM(oi.quantity * oi.unit_price_cents) AS spent_cents
  FROM orders o
  JOIN customers cu ON cu.id = o.customer_id
  JOIN order_items oi ON oi.order_id = o.id
  WHERE o.status IN ('paid', 'shipped')
  GROUP BY o.id, cu.id
), order_coupons AS (
  SELECT cr.order_id, SUM(cr.discount_cents) AS discount_cents
  FROM coupon_redemptions cr
  JOIN orders o ON o.id = cr.order_id
  WHERE o.status IN ('paid', 'shipped')
  GROUP BY cr.order_id
)
SELECT cu.name AS customer,
       SUM(CASE WHEN oc.order_id IS NOT NULL THEN 1 ELSE 0 END) AS coupon_orders,
       SUM(CASE WHEN os.order_id IS NOT NULL AND oc.order_id IS NULL THEN 1 ELSE 0 END)
         AS full_price_orders,
       COALESCE(SUM(os.spent_cents), 0) AS spent_cents,
       COALESCE(SUM(oc.discount_cents), 0) AS discount_cents,
       COALESCE(SUM(os.spent_cents), 0) - COALESCE(SUM(oc.discount_cents), 0) AS net_cents
FROM customers cu
LEFT JOIN order_spend os ON os.customer_id = cu.id
LEFT JOIN order_coupons oc ON oc.order_id = os.order_id
GROUP BY cu.id, cu.name
ORDER BY net_cents DESC, customer;
\`\`\`

## সাধারণ ভুল
redemption-এর discount আইটেমের সাথে জুড়ে দ্বিগুণ গোনা; pending/cancelled অর্ডারের redemption-ও গোনা; INNER JOIN করে অর্ডারহীন কাস্টমার হারানো; LEFT JOIN-এর NULL-সারিকে full_price অর্ডার হিসেবে গোনা — os.order_id IS NOT NULL শর্তটা সেটাই আটকায়।`,
    difficulty: "MEDIUM",
    points: 300,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    premiumModuleSlug: "advanced-sql",
    category: "SQL Advanced",
    subcategory: "Capstone",
    referencePython: "",
    referenceSql: `WITH order_spend AS (
  SELECT o.id AS order_id, cu.id AS customer_id,
         SUM(oi.quantity * oi.unit_price_cents) AS spent_cents
  FROM orders o
  JOIN customers cu ON cu.id = o.customer_id
  JOIN order_items oi ON oi.order_id = o.id
  WHERE o.status IN ('paid', 'shipped')
  GROUP BY o.id, cu.id
), order_coupons AS (
  SELECT cr.order_id, SUM(cr.discount_cents) AS discount_cents
  FROM coupon_redemptions cr
  JOIN orders o ON o.id = cr.order_id
  WHERE o.status IN ('paid', 'shipped')
  GROUP BY cr.order_id
)
SELECT cu.name AS customer,
       SUM(CASE WHEN oc.order_id IS NOT NULL THEN 1 ELSE 0 END) AS coupon_orders,
       SUM(CASE WHEN os.order_id IS NOT NULL AND oc.order_id IS NULL THEN 1 ELSE 0 END)
         AS full_price_orders,
       COALESCE(SUM(os.spent_cents), 0) AS spent_cents,
       COALESCE(SUM(oc.discount_cents), 0) AS discount_cents,
       COALESCE(SUM(os.spent_cents), 0) - COALESCE(SUM(oc.discount_cents), 0) AS net_cents
FROM customers cu
LEFT JOIN order_spend os ON os.customer_id = cu.id
LEFT JOIN order_coupons oc ON oc.order_id = os.order_id
GROUP BY cu.id, cu.name
ORDER BY net_cents DESC, customer;`,
    tests: [
      {
        input: ``,
        expectedOutput: `Rahim	3	0	3495000	395000	3100000
Nusrat	1	1	720000	50000	670000
Mim	1	0	670000	50000	620000
Tanvir	1	0	380000	6000	374000
Karim	0	1	180000	0	180000
Sajid	0	0	0	0	0`,
        isSample: true
      },
      {
        input: `update orders set status='cancelled' where id=1;`,
        expectedOutput: `Rahim	2	0	2605000	306000	2299000
Nusrat	1	1	720000	50000	670000
Mim	1	0	670000	50000	620000
Tanvir	1	0	380000	6000	374000
Karim	0	1	180000	0	180000
Sajid	0	0	0	0	0`,
        isSample: true
      },
      {
        input: `insert into coupon_redemptions (id,coupon_id,order_id,customer_id,discount_cents,redeemed_at) values (7,1,8,2,10000,'2026-10-25');`,
        expectedOutput: `Rahim	3	0	3495000	395000	3100000
Nusrat	1	1	720000	50000	670000
Mim	1	0	670000	50000	620000
Tanvir	1	0	380000	6000	374000
Karim	1	0	180000	10000	170000
Sajid	0	0	0	0	0`,
        isSample: false
      },
      {
        input: `insert into orders (id,customer_id,ordered_at,status) values (11,4,'2026-11-05','paid'); insert into order_items (id,order_id,product_id,quantity,unit_price_cents) values (16,11,13,1,210000);`,
        expectedOutput: `Rahim	3	0	3495000	395000	3100000
Nusrat	1	1	720000	50000	670000
Mim	1	0	670000	50000	620000
Tanvir	1	0	380000	6000	374000
Sajid	0	1	210000	0	210000
Karim	0	1	180000	0	180000`,
        isSample: false
      },
      {
        input: `update orders set status='pending' where id=6;`,
        expectedOutput: `Rahim	2	0	2890000	389000	2501000
Nusrat	1	1	720000	50000	670000
Mim	1	0	670000	50000	620000
Tanvir	1	0	380000	6000	374000
Karim	0	1	180000	0	180000
Sajid	0	0	0	0	0`,
        isSample: false
      },
    ],
  },
];
