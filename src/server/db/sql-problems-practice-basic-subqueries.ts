import type { SeedProblem } from "./seed-problems";

export const SQL_PROBLEMS_PRACTICE_BASIC_SUBQUERIES: SeedProblem[] = [
  {
    slug: "sql-practice-subqueries-easy",
    title: "Dhaka vendor catalog",
    statement: `ঢাকার ওয়্যারহাউস ম্যানেজার জানতে চায় ঢাকার ভেন্ডরদের ক্যাটালগে কী কী প্রোডাক্ট আছে। \`products\` থেকে এমন প্রোডাক্টের \`name\` ও \`price_cents\` বের করো যাদের ভেন্ডর ঢাকায় — ভেন্ডরের তালিকা একটি \`IN\` subquery দিয়ে আনবে; দাম নিচের ক্রমে, একই দামে নাম অনুযায়ী।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`name\`, \`price_cents\` — দাম নিচের ক্রমে, সমান হলে \`name\` অনুযায়ী।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## ধারণা
\`IN (SELECT ...)\` ভেতরের query-র ফলাফলকে একটা তালিকা বানিয়ে বাইরের শর্তে বসায় — আগে ভেন্ডর টেবিল থেকে ঢাকার আইডি, তারপর সেই আইডিগুলোর প্রোডাক্ট। ভেতরের query বাইরের কোনো সারির উপর নির্ভর করে না — তাই এটা uncorrelated subquery, একবারই চলে। ঢাকার ভেন্ডর একাধিক হতে পারে, তাই \`IN\`; একটি মানের জন্য \`=\` দিলে ভুল হবে।

## ধাপে ধাপে
১. ভেতরে: \`SELECT id FROM vendors WHERE city = 'Dhaka'\`।
২. বাইরে: \`WHERE p.vendor_id IN (...)\`।
৩. \`ORDER BY p.price_cents DESC, p.name\`।

## কোডে দেখি
\`\`\`sql
SELECT p.name, p.price_cents
FROM products p
WHERE p.vendor_id IN (SELECT v.id FROM vendors v WHERE v.city = 'Dhaka')
ORDER BY p.price_cents DESC, p.name;
\`\`\`

## সাধারণ ভুল
ভেতরের query থেকে \`name\` এনে বাইরে \`vendor_id\`-এর সাথে নাম মেলানো; \`IN\`-এর ভেতরে semicolon দেওয়া; \`=\` লিখে একাধিক ম্যাচের সম্ভাবনা উড়িয়ে দেওয়া; টাই-ব্রেকার \`name\` না দেওয়া।`,
    difficulty: "EASY",
    points: 150,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    category: "SQL Basics",
    subcategory: "Subqueries",
    referencePython: "",
    referenceSql: `SELECT p.name, p.price_cents FROM products p WHERE p.vendor_id IN (SELECT v.id FROM vendors v WHERE v.city = 'Dhaka') ORDER BY p.price_cents DESC, p.name;`,
    tests: [
      {
        input: ``,
        expectedOutput: `27in Monitor	1850000
Mechanical Keyboard	450000
Denim Jacket	380000
Webcam	350000
Cotton Panjabi	240000
USB-C Hub	220000
Leather Wallet	120000`,
        isSample: true
      },
      {
        input: `update vendors set city='Dhaka' where id=2;`,
        expectedOutput: `27in Monitor	1850000
Mechanical Keyboard	450000
Denim Jacket	380000
Webcam	350000
Cotton Panjabi	240000
USB-C Hub	220000
Dune	210000
Clean Code	180000
Leather Wallet	120000
SQL Handbook	95000`,
        isSample: true
      },
      {
        input: `update vendors set city='Sylhet' where id=1;`,
        expectedOutput: `Denim Jacket	380000
Cotton Panjabi	240000
Leather Wallet	120000`,
        isSample: false
      },
      {
        input: `update vendors set city='Dhaka' where id in (2,5);`,
        expectedOutput: `27in Monitor	1850000
Mechanical Keyboard	450000
Denim Jacket	380000
Webcam	350000
Clay Dinner Set	320000
Cotton Panjabi	240000
USB-C Hub	220000
Dune	210000
Clean Code	180000
Leather Wallet	120000
Table Lamp	110000
SQL Handbook	95000`,
        isSample: false
      },
      {
        input: `update products set price_cents=120000 where id in (6,7);`,
        expectedOutput: `27in Monitor	1850000
Mechanical Keyboard	450000
Denim Jacket	380000
Webcam	350000
USB-C Hub	220000
Cotton Panjabi	120000
Leather Wallet	120000`,
        isSample: false
      },
    ],
  },
  {
    slug: "sql-practice-subqueries-medium",
    title: "Percent of the priciest",
    statement: `প্রাইসিং টিম প্রতিটি প্রোডাক্টের দামকে মার্কেটপ্লেসের সবচেয়ে দামি প্রোডাক্টের শতকরা হিসেবে দেখতে চায়। প্রতিটি প্রোডাক্টের \`name\`, \`price_cents\` আর \`pct_of_max\` (সর্বোচ্চ দামের তুলনায় শতাংশ, এক দশমিক ঘর) বের করো; শতাংশ বেশি থেকে কম, সমান হলে নাম অনুযায়ী।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`name\`, \`price_cents\`, \`pct_of_max\` — শতকরা নিচের ক্রমে, সমান হলে \`name\` অনুযায়ী।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## ধারণা
স্কেলার subquery (\`SELECT MAX(price_cents) FROM products\`) ঠিক একটি মান ফেরায় — সেটাকে সিলেক্ট-লিস্টের যেকোনো এক্সপ্রেশনের ভেতরে বসানো যায়, যেমন ভাগের হরে। শতকরা বের করতে \`100.0\` দিয়ে গুণ করো — \`100\` (পূর্ণসংখ্যা) দিলে ইন্টিজার ভাগ প্রায় সব শতকরা ০ বানিয়ে দেয়। \`ROUND(..., 1)\` দশমিক এক ঘরে আটকে রাখে।

## ধাপে ধাপে
১. হর হিসেবে \`(SELECT MAX(price_cents) FROM products)\` — এক মানের সাবকোয়েরি।
২. \`ROUND(p.price_cents * 100.0 / (হর), 1) AS pct_of_max\` সিলেক্টে বসাও।
৩. \`ORDER BY pct_of_max DESC, name\`।

## কোডে দেখি
\`\`\`sql
SELECT p.name, p.price_cents,
       ROUND(p.price_cents * 100.0 /
             (SELECT MAX(price_cents) FROM products), 1) AS pct_of_max
FROM products p
ORDER BY pct_of_max DESC, p.name;
\`\`\`

## সাধারণ ভুল
\`100\` দিয়ে গুণ করে ইন্টিজার ভাগে সব ০ আনা; \`MAX\`-এর জায়গায় \`AVG\` বসিয়ে প্রশ্নটাই বদলে ফেলা; ROUND-এ ঘর না বলে লম্বা দশমিক ছাপা; সমান শতকরায় ক্রম অনির্দিষ্ট রাখা।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    category: "SQL Basics",
    subcategory: "Subqueries",
    referencePython: "",
    referenceSql: `SELECT p.name, p.price_cents, ROUND(p.price_cents * 100.0 / (SELECT MAX(price_cents) FROM products), 1) AS pct_of_max FROM products p ORDER BY pct_of_max DESC, p.name;`,
    tests: [
      {
        input: ``,
        expectedOutput: `27in Monitor	1850000	100.0
Mechanical Keyboard	450000	24.3
Denim Jacket	380000	20.5
Webcam	350000	18.9
Clay Dinner Set	320000	17.3
Cotton Panjabi	240000	13.0
USB-C Hub	220000	11.9
Dune	210000	11.4
Clean Code	180000	9.7
Laptop Stand	150000	8.1
Leather Wallet	120000	6.5
Table Lamp	110000	5.9
SQL Handbook	95000	5.1
Wireless Mouse	85000	4.6`,
        isSample: true
      },
      {
        input: `update products set price_cents=900000 where id=3;`,
        expectedOutput: `27in Monitor	900000	100.0
Mechanical Keyboard	450000	50.0
Denim Jacket	380000	42.2
Webcam	350000	38.9
Clay Dinner Set	320000	35.6
Cotton Panjabi	240000	26.7
USB-C Hub	220000	24.4
Dune	210000	23.3
Clean Code	180000	20.0
Laptop Stand	150000	16.7
Leather Wallet	120000	13.3
Table Lamp	110000	12.2
SQL Handbook	95000	10.6
Wireless Mouse	85000	9.4`,
        isSample: true
      },
      {
        input: `update products set price_cents=2000000 where id=1;`,
        expectedOutput: `Mechanical Keyboard	2000000	100.0
27in Monitor	1850000	92.5
Denim Jacket	380000	19.0
Webcam	350000	17.5
Clay Dinner Set	320000	16.0
Cotton Panjabi	240000	12.0
USB-C Hub	220000	11.0
Dune	210000	10.5
Clean Code	180000	9.0
Laptop Stand	150000	7.5
Leather Wallet	120000	6.0
Table Lamp	110000	5.5
SQL Handbook	95000	4.8
Wireless Mouse	85000	4.3`,
        isSample: false
      },
      {
        input: `update products set price_cents=95000 where id=2;`,
        expectedOutput: `27in Monitor	1850000	100.0
Mechanical Keyboard	450000	24.3
Denim Jacket	380000	20.5
Webcam	350000	18.9
Clay Dinner Set	320000	17.3
Cotton Panjabi	240000	13.0
Dune	210000	11.4
Clean Code	180000	9.7
Laptop Stand	150000	8.1
Leather Wallet	120000	6.5
Table Lamp	110000	5.9
SQL Handbook	95000	5.1
USB-C Hub	95000	5.1
Wireless Mouse	85000	4.6`,
        isSample: false
      },
      {
        input: `insert into products (id,vendor_id,category_id,name,price_cents,stock,rating) values (15,1,2,'Bluetooth Speaker',145000,10,4.1);`,
        expectedOutput: `27in Monitor	1850000	100.0
Mechanical Keyboard	450000	24.3
Denim Jacket	380000	20.5
Webcam	350000	18.9
Clay Dinner Set	320000	17.3
Cotton Panjabi	240000	13.0
USB-C Hub	220000	11.9
Dune	210000	11.4
Clean Code	180000	9.7
Laptop Stand	150000	8.1
Bluetooth Speaker	145000	7.8
Leather Wallet	120000	6.5
Table Lamp	110000	5.9
SQL Handbook	95000	5.1
Wireless Mouse	85000	4.6`,
        isSample: false
      },
    ],
  },
];
