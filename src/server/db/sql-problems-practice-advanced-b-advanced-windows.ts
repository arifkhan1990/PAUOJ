import type { SeedProblem } from "./seed-problems";

export const SQL_PROBLEMS_PRACTICE_ADVANCED_B_ADVANCED_WINDOWS: SeedProblem[] = [
  {
    slug: "sql-practice-advanced-windows-easy",
    title: "Price percentile in category",
    statement: `প্রাইসিং টিম জানতে চায় প্রতিটি পণ্যের দাম তার নিজের ক্যাটাগরির ভেতরে কোন শতকরা অবস্থানে পড়ে। প্রতিটি ক্যাটাগরির ভেতরে দাম অনুযায়ী \`PERCENT_RANK()\` বের করো — 0 মানে সেই ক্যাটাগরির সবচেয়ে সস্তা পণ্য, 1 মানে সবচেয়ে দামি; দাম সমান হলে পণ্যের নাম টাই-ব্রেক। আউটপুট: category, product, price_cents, price_pct (দুই দশমিকে ছাঁটা)। ক্যাটাগরি, তারপর price_pct, তারপর পণ্যের নাম অনুযায়ী সাজাও।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`category\`, \`product\`, \`price_cents\`, \`price_pct\` (0.0–1.0, দুই দশমিক)।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## ধারণা
\`PERCENT_RANK()\` বলে দেয় সারিটা নিজের partition-এর কত অংশের উপরে/সমানে: (rank − 1)/(rows − 1), মান 0 থেকে 1। সবচেয়ে সস্তা পণ্য 0, সবচেয়ে দামি 1। NTILE বালতির নম্বর দেয়, PERCENT_RANK দেয় অবস্থানের ভগ্নাংশ — ড্যাশবোর্ডে "দামের percentile" দেখাতে এটাই লাগে। দুটা সীমাও জেনে রাখো: ক্যাটাগরিতে একটাই পণ্য থাকলে rows − 1 = 0 হয়ে SQLite মান 0.0 দেয়; আর সমান দামের সারি একই rank পায়, তাই তাদের percentile-ও এক।

## ধাপে ধাপে
১. products ⋈ categories জোড়া লাগাও।
২. \`PERCENT_RANK() OVER (PARTITION BY category ORDER BY price_cents, name)\` — টাই-ব্রেক নাম।
৩. ROUND(..., 2) দিয়ে দুই দশমিকে ছাঁটো।
৪. ORDER BY category, price_pct, product।

## কোডে দেখি
\`\`\`sql
SELECT c.name AS category, p.name AS product, p.price_cents,
       ROUND(PERCENT_RANK() OVER (PARTITION BY c.name ORDER BY p.price_cents, p.name), 2) AS price_pct
FROM products p
JOIN categories c ON c.id = p.category_id
ORDER BY category, price_pct, product;
\`\`\`

## সাধারণ ভুল
PARTITION BY বাদ দিয়ে পুরো মার্কেটপ্লেসের percentile বের করা; DESC লিখে অর্থ উল্টো করা; ROUND ছাড়া লম্বা ভগ্নাংশ রেখে দেওয়া; সমান দামে নাম-টাই-ব্রেক না দিয়ে অনির্দিষ্ট ক্রম।`,
    difficulty: "EASY",
    points: 200,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    premiumModuleSlug: "advanced-sql",
    category: "SQL Advanced",
    subcategory: "Window functions",
    referencePython: "",
    referenceSql: `SELECT c.name AS category, p.name AS product, p.price_cents,
       ROUND(PERCENT_RANK() OVER (PARTITION BY c.name ORDER BY p.price_cents, p.name), 2) AS price_pct
FROM products p
JOIN categories c ON c.id = p.category_id
ORDER BY category, price_pct, product;`,
    tests: [
      {
        input: ``,
        expectedOutput: `Books	SQL Handbook	95000	0.0
Books	Clean Code	180000	1.0
Electronics	Wireless Mouse	85000	0.0
Electronics	Laptop Stand	150000	0.2
Electronics	USB-C Hub	220000	0.4
Electronics	Webcam	350000	0.6
Electronics	Mechanical Keyboard	450000	0.8
Electronics	27in Monitor	1850000	1.0
Fashion	Leather Wallet	120000	0.0
Fiction	Dune	210000	0.0
Home	Table Lamp	110000	0.0
Home	Clay Dinner Set	320000	1.0
Men	Cotton Panjabi	240000	0.0
Men	Denim Jacket	380000	1.0`,
        isSample: true
      },
      {
        input: `update products set price_cents=220000 where id=9;`,
        expectedOutput: `Books	SQL Handbook	95000	0.0
Books	Clean Code	180000	1.0
Electronics	Wireless Mouse	85000	0.0
Electronics	Laptop Stand	220000	0.2
Electronics	USB-C Hub	220000	0.4
Electronics	Webcam	350000	0.6
Electronics	Mechanical Keyboard	450000	0.8
Electronics	27in Monitor	1850000	1.0
Fashion	Leather Wallet	120000	0.0
Fiction	Dune	210000	0.0
Home	Table Lamp	110000	0.0
Home	Clay Dinner Set	320000	1.0
Men	Cotton Panjabi	240000	0.0
Men	Denim Jacket	380000	1.0`,
        isSample: true
      },
      {
        input: `insert into products values (15,3,6,'Silk Scarf',90000,10,4.6);`,
        expectedOutput: `Books	SQL Handbook	95000	0.0
Books	Clean Code	180000	1.0
Electronics	Wireless Mouse	85000	0.0
Electronics	Laptop Stand	150000	0.2
Electronics	USB-C Hub	220000	0.4
Electronics	Webcam	350000	0.6
Electronics	Mechanical Keyboard	450000	0.8
Electronics	27in Monitor	1850000	1.0
Fashion	Silk Scarf	90000	0.0
Fashion	Leather Wallet	120000	1.0
Fiction	Dune	210000	0.0
Home	Table Lamp	110000	0.0
Home	Clay Dinner Set	320000	1.0
Men	Cotton Panjabi	240000	0.0
Men	Denim Jacket	380000	1.0`,
        isSample: false
      },
      {
        input: `update products set price_cents=320000 where id=11;`,
        expectedOutput: `Books	SQL Handbook	95000	0.0
Books	Clean Code	180000	1.0
Electronics	Wireless Mouse	85000	0.0
Electronics	Laptop Stand	150000	0.2
Electronics	USB-C Hub	220000	0.4
Electronics	Webcam	350000	0.6
Electronics	Mechanical Keyboard	450000	0.8
Electronics	27in Monitor	1850000	1.0
Fashion	Leather Wallet	120000	0.0
Fiction	Dune	210000	0.0
Home	Clay Dinner Set	320000	0.0
Home	Table Lamp	320000	1.0
Men	Cotton Panjabi	240000	0.0
Men	Denim Jacket	380000	1.0`,
        isSample: false
      },
      {
        input: `update products set price_cents=240000 where id=14;`,
        expectedOutput: `Books	SQL Handbook	95000	0.0
Books	Clean Code	180000	1.0
Electronics	Wireless Mouse	85000	0.0
Electronics	Laptop Stand	150000	0.2
Electronics	USB-C Hub	220000	0.4
Electronics	Webcam	350000	0.6
Electronics	Mechanical Keyboard	450000	0.8
Electronics	27in Monitor	1850000	1.0
Fashion	Leather Wallet	120000	0.0
Fiction	Dune	210000	0.0
Home	Table Lamp	110000	0.0
Home	Clay Dinner Set	320000	1.0
Men	Cotton Panjabi	240000	0.0
Men	Denim Jacket	240000	1.0`,
        isSample: false
      },
    ],
  },
  {
    slug: "sql-practice-advanced-windows-medium",
    title: "Cumulative stock by rating",
    statement: `গুদাম টিম ভেন্ডর ধরে পণ্যের রেটিং-তালিকা (বেশি থেকে কম) বানাচ্ছে; প্রতিটি পণ্যের পাশে লাগবে ওই তালিকায় এ পর্যন্ত জমা মোট স্টক (cumulative_stock)। নিয়ম: একই রেটিং হলে ছোট product id আগে ধরা হবে, আর **প্রতিটি পণ্য আলাদা ধাপে** গোনা হবে — অর্থাৎ window frame টি স্পষ্ট লিখতে হবে: \`ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW\`। (সতর্কতা: ORDER BY থাকলে ডিফল্ট frame RANGE হয় — একই রেটিংয়ের সারিগুলো তখন এক গুচ্ছে ধরা হয়, cumulative ভুল আসবে।) পণ্যবিহীন ভেন্ডর তালিকায় আসবে না। আউটপুট: vendor, product, rating, stock, cumulative_stock — ভেন্ডরের নাম, তারপর rating (বেশি থেকে কম), তারপর product id অনুযায়ী সাজাও।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`vendor\`, \`product\`, \`rating\`, \`stock\`, \`cumulative_stock\`।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## ধারণা
window-এ ORDER BY থাকলে ডিফল্ট frame \`RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW\` — আর RANGE-এ "বর্তমান সারি" মানে বর্তমান সারি **এবং ORDER BY-মান সমান সব সারি**। একই রেটিংয়ের দুই পণ্যে তখন দুজনেই দুজনের স্টক মিলিয়ে যোগফল দেখায় — cumulative ভেঙে পড়ে। প্রতিটি পণ্য আলাদা ধাপে গুনতে চাইলে frame লিখতে হয় \`ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW\`: ROWS সারি গোনে, RANGE মান গোছায় — এই পার্থক্যই এই সমস্যার মূল। ফিক্সচারে BookBazar-এর দুটি পণ্যের রেটিং সমান (4.9) — সেটাই ফাঁদ ধরার জায়গা।

## ধাপে ধাপে
১. products ⋈ vendors।
২. SUM(stock) OVER (PARTITION BY vendor ORDER BY rating DESC, id ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)।
৩. window-এর ORDER BY-তে id টাই-ব্রেক — সমান রেটিংয়ে ছোট id আগে।
৪. বাইরের ORDER BY vendor, rating DESC, id — ভেতরের ক্রমের সাথে মিলবে।

## কোডে দেখি
\`\`\`sql
SELECT v.name AS vendor, p.name AS product, p.rating, p.stock,
       SUM(p.stock) OVER (
         PARTITION BY v.name
         ORDER BY p.rating DESC, p.id
         ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
       ) AS cumulative_stock
FROM products p
JOIN vendors v ON v.id = p.vendor_id
ORDER BY vendor, p.rating DESC, p.id;
\`\`\`

## সাধারণ ভুল
frame না লিখে ডিফল্ট RANGE-এ চুপচাপ পড়ে যাওয়া — সমান রেটিংয়ে ফল ভুল আসবে; PARTITION BY vendor বাদ দিয়ে সব ভেন্ডরের স্টক এক তালিকায় মেশানো; টাই-ব্রেক id না দিয়ে সমান রেটিংয়ে অনির্দিষ্ট ক্রম; বাইরের ORDER BY-তে id ভুলে আউটপুটের ক্রমই অনির্দিষ্ট হওয়া।`,
    difficulty: "MEDIUM",
    points: 300,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    premiumModuleSlug: "advanced-sql",
    category: "SQL Advanced",
    subcategory: "Window functions",
    referencePython: "",
    referenceSql: `SELECT v.name AS vendor, p.name AS product, p.rating, p.stock,
       SUM(p.stock) OVER (
         PARTITION BY v.name
         ORDER BY p.rating DESC, p.id
         ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
       ) AS cumulative_stock
FROM products p
JOIN vendors v ON v.id = p.vendor_id
ORDER BY vendor, p.rating DESC, p.id;`,
    tests: [
      {
        input: ``,
        expectedOutput: `BookBazar	Clean Code	4.9	30	30
BookBazar	Dune	4.9	12	42
BookBazar	SQL Handbook	4.5	9	51
GadgetPoint	Laptop Stand	4.3	11	11
GadgetPoint	Wireless Mouse	4.0	3	14
HomeCraft	Clay Dinner Set	4.8	6	6
HomeCraft	Table Lamp	4.2	18	24
StyleHub	Denim Jacket	4.5	7	7
StyleHub	Cotton Panjabi	4.4	14	21
StyleHub	Leather Wallet	4.1	25	46
TechNest	Mechanical Keyboard	4.7	12	12
TechNest	27in Monitor	4.6	5	17
TechNest	USB-C Hub	4.2	8	25
TechNest	Webcam	4.0	2	27`,
        isSample: true
      },
      {
        input: `update products set rating=4.6 where id=2;`,
        expectedOutput: `BookBazar	Clean Code	4.9	30	30
BookBazar	Dune	4.9	12	42
BookBazar	SQL Handbook	4.5	9	51
GadgetPoint	Laptop Stand	4.3	11	11
GadgetPoint	Wireless Mouse	4.0	3	14
HomeCraft	Clay Dinner Set	4.8	6	6
HomeCraft	Table Lamp	4.2	18	24
StyleHub	Denim Jacket	4.5	7	7
StyleHub	Cotton Panjabi	4.4	14	21
StyleHub	Leather Wallet	4.1	25	46
TechNest	Mechanical Keyboard	4.7	12	12
TechNest	USB-C Hub	4.6	8	20
TechNest	27in Monitor	4.6	5	25
TechNest	Webcam	4.0	2	27`,
        isSample: true
      },
      {
        input: `update products set rating=4.8 where id=11;`,
        expectedOutput: `BookBazar	Clean Code	4.9	30	30
BookBazar	Dune	4.9	12	42
BookBazar	SQL Handbook	4.5	9	51
GadgetPoint	Laptop Stand	4.3	11	11
GadgetPoint	Wireless Mouse	4.0	3	14
HomeCraft	Clay Dinner Set	4.8	6	6
HomeCraft	Table Lamp	4.8	18	24
StyleHub	Denim Jacket	4.5	7	7
StyleHub	Cotton Panjabi	4.4	14	21
StyleHub	Leather Wallet	4.1	25	46
TechNest	Mechanical Keyboard	4.7	12	12
TechNest	27in Monitor	4.6	5	17
TechNest	USB-C Hub	4.2	8	25
TechNest	Webcam	4.0	2	27`,
        isSample: false
      },
      {
        input: `insert into products values (15,2,4,'Cookbook',300000,15,4.9);`,
        expectedOutput: `BookBazar	Clean Code	4.9	30	30
BookBazar	Dune	4.9	12	42
BookBazar	Cookbook	4.9	15	57
BookBazar	SQL Handbook	4.5	9	66
GadgetPoint	Laptop Stand	4.3	11	11
GadgetPoint	Wireless Mouse	4.0	3	14
HomeCraft	Clay Dinner Set	4.8	6	6
HomeCraft	Table Lamp	4.2	18	24
StyleHub	Denim Jacket	4.5	7	7
StyleHub	Cotton Panjabi	4.4	14	21
StyleHub	Leather Wallet	4.1	25	46
TechNest	Mechanical Keyboard	4.7	12	12
TechNest	27in Monitor	4.6	5	17
TechNest	USB-C Hub	4.2	8	25
TechNest	Webcam	4.0	2	27`,
        isSample: false
      },
      {
        input: `update products set stock=20 where id=13;`,
        expectedOutput: `BookBazar	Clean Code	4.9	30	30
BookBazar	Dune	4.9	20	50
BookBazar	SQL Handbook	4.5	9	59
GadgetPoint	Laptop Stand	4.3	11	11
GadgetPoint	Wireless Mouse	4.0	3	14
HomeCraft	Clay Dinner Set	4.8	6	6
HomeCraft	Table Lamp	4.2	18	24
StyleHub	Denim Jacket	4.5	7	7
StyleHub	Cotton Panjabi	4.4	14	21
StyleHub	Leather Wallet	4.1	25	46
TechNest	Mechanical Keyboard	4.7	12	12
TechNest	27in Monitor	4.6	5	17
TechNest	USB-C Hub	4.2	8	25
TechNest	Webcam	4.0	2	27`,
        isSample: false
      },
    ],
  },
];
