import type { SeedProblem } from "./seed-problems";

export const SQL_PROBLEMS_PRACTICE_BASIC_ORIENTATION: SeedProblem[] = [
  {
    slug: "sql-practice-orientation-easy",
    title: "Dhaka customer list",
    statement: `ShopSphere-এর ডেলিভারি টিম ঢাকা অঞ্চলে ডেমো ক্যাম্পেইন চালাবে — আগে দরকার ঢাকার কাস্টমারদের তালিকা। \`customers\` টেবিল থেকে যেসব কাস্টমারের \`city\` ঠিক \`Dhaka\`, তাদের \`name\`, \`city\` ও \`signup_date\` বের করো; নাম অনুযায়ী সাজাও।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`name\`, \`city\`, \`signup_date\` — নাম অনুযায়ী সাজানো।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## ধারণা
\`SELECT\` কোন কলাম দেখাবে, \`WHERE\` কোন সারি থাকবে, \`ORDER BY\` কোন ক্রমে — তিনটাই এক টেবিলে, কোনো JOIN ছাড়াই। টেক্সট মান মেলাতে একক সমান চিহ্ন (\`=\`) যথেষ্ট। স্ট্রিং তুলনা কেস-সেনসিটিভ, তাই \`'dhaka'\` ছোট হাতের লিখলে একটাও সারি মেলে না।

## ধাপে ধাপে
১. \`name\`, \`city\`, \`signup_date\` সিলেক্ট করো।
২. \`WHERE city = 'Dhaka'\` শর্ত দাও।
৩. \`ORDER BY name\` — দুই কাস্টমারের নাম এক হলেও যেন ক্রম নির্দিষ্ট থাকে, নাম-ই এখানে টাই-ব্রেকার।

## কোডে দেখি
\`\`\`sql
SELECT name, city, signup_date
FROM customers
WHERE city = 'Dhaka'
ORDER BY name;
\`\`\`

## সাধারণ ভুল
\`'dhaka'\` ছোট হাতের লিখে খালি ফল পাওয়া; \`ORDER BY\` বাদ দিলে একই query দুইবার চালালে দুই রকম ক্রম; \`city\`-র বদলে \`customers\` লিখে টেবিল-কলাম গুলিয়ে ফেলা।`,
    difficulty: "EASY",
    points: 150,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    category: "SQL Basics",
    subcategory: "Orientation",
    referencePython: "",
    referenceSql: `SELECT name, city, signup_date FROM customers WHERE city = 'Dhaka' ORDER BY name;`,
    tests: [
      {
        input: ``,
        expectedOutput: `Nusrat	Dhaka	2026-02-21
Rahim	Dhaka	2026-01-12
Tanvir	Dhaka	2026-04-02`,
        isSample: true
      },
      {
        input: `insert into customers (id,name,city,signup_date) values (7,'Salma','Dhaka','2026-05-01');`,
        expectedOutput: `Nusrat	Dhaka	2026-02-21
Rahim	Dhaka	2026-01-12
Salma	Dhaka	2026-05-01
Tanvir	Dhaka	2026-04-02`,
        isSample: true
      },
      {
        input: `update customers set city='Sylhet' where id=6;`,
        expectedOutput: `Nusrat	Dhaka	2026-02-21
Rahim	Dhaka	2026-01-12`,
        isSample: false
      },
      {
        input: `update customers set city='Dhaka' where id=5;`,
        expectedOutput: `Mim	Dhaka	2026-03-18
Nusrat	Dhaka	2026-02-21
Rahim	Dhaka	2026-01-12
Tanvir	Dhaka	2026-04-02`,
        isSample: false
      },
      {
        input: `update customers set city='Dhaka' where id in (2,4);`,
        expectedOutput: `Karim	Dhaka	2026-02-03
Nusrat	Dhaka	2026-02-21
Rahim	Dhaka	2026-01-12
Sajid	Dhaka	2026-03-05
Tanvir	Dhaka	2026-04-02`,
        isSample: false
      },
    ],
  },
  {
    slug: "sql-practice-orientation-medium",
    title: "Mid-price catalog",
    statement: `মার্কেটিং টিম 'মিড-রেঞ্জ কালেকশন' ফ্ল্যাশ-সেল বানাচ্ছে — দামের সীমা ১,০০,০০০ থেকে ৪,০০,০০০ সেন্ট, দুই দিকই অন্তর্ভুক্ত। \`products\` থেকে সেই ব্যান্ডের প্রোডাক্টের \`name\`, \`price_cents\` ও \`stock\` বের করো; দাম ঊর্ধ্বক্রমে, একই দামে নাম অনুযায়ী।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`name\`, \`price_cents\`, \`stock\` — দাম ঊর্ধ্বক্রম, একই দামে \`name\` অনুযায়ী।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## ধারণা
\`BETWEEN a AND b\` মানে \`>= a\` এবং \`<= b\` — দুই প্রান্তই বন্ধ। ঠিক সীমায় বসা দাম (যেমন হুবহু ৪,০০,০০০) ফলে থাকবে। \`a\` আর \`b\` উল্টে লিখলে (\`BETWEEN 400000 AND 100000\`) কোনো সারিই শর্ত মেলায় না। সাজানোতে দুই কলাম দিলে (\`price_cents\`, তারপর \`name\`) সমান দামের প্রোডাক্টগুলোর ক্রমও প্রতিবার একই থাকে।

## ধাপে ধাপে
১. \`WHERE price_cents BETWEEN 100000 AND 400000\`।
২. \`ORDER BY price_cents, name\` — দাম, তারপর নাম।
৩. তিনটি কলাম সিলেক্টে বসাও।

## কোডে দেখি
\`\`\`sql
SELECT name, price_cents, stock
FROM products
WHERE price_cents BETWEEN 100000 AND 400000
ORDER BY price_cents, name;
\`\`\`

## সাধারণ ভুল
\`<\` বা \`<=\` গুলিয়ে inclusive প্রান্ত হারানো বা বাড়তি সারি আনা; \`BETWEEN\`-এ বড় সংখ্যা আগে লিখে খালি ফল; টাই-ব্রেকার \`name\` না দিয়ে সমান দামে অনির্দিষ্ট ক্রম; সেন্টকে টাকা ভেবে ১০০০-এর মতো সংখ্যা লিখে প্রায় সব প্রোডাক্ট ব্যান্ডে আনা।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    category: "SQL Basics",
    subcategory: "Orientation",
    referencePython: "",
    referenceSql: `SELECT name, price_cents, stock FROM products WHERE price_cents BETWEEN 100000 AND 400000 ORDER BY price_cents, name;`,
    tests: [
      {
        input: ``,
        expectedOutput: `Table Lamp	110000	18
Leather Wallet	120000	25
Laptop Stand	150000	11
Clean Code	180000	30
Dune	210000	12
USB-C Hub	220000	8
Cotton Panjabi	240000	14
Clay Dinner Set	320000	6
Webcam	350000	2
Denim Jacket	380000	7`,
        isSample: true
      },
      {
        input: `update products set price_cents=400000 where id=3;`,
        expectedOutput: `Table Lamp	110000	18
Leather Wallet	120000	25
Laptop Stand	150000	11
Clean Code	180000	30
Dune	210000	12
USB-C Hub	220000	8
Cotton Panjabi	240000	14
Clay Dinner Set	320000	6
Webcam	350000	2
Denim Jacket	380000	7
27in Monitor	400000	5`,
        isSample: true
      },
      {
        input: `update products set price_cents=99999 where id=4;`,
        expectedOutput: `Table Lamp	110000	18
Leather Wallet	120000	25
Laptop Stand	150000	11
Dune	210000	12
USB-C Hub	220000	8
Cotton Panjabi	240000	14
Clay Dinner Set	320000	6
Webcam	350000	2
Denim Jacket	380000	7`,
        isSample: false
      },
      {
        input: `update products set price_cents=400000 where id in (3,9);`,
        expectedOutput: `Table Lamp	110000	18
Leather Wallet	120000	25
Clean Code	180000	30
Dune	210000	12
USB-C Hub	220000	8
Cotton Panjabi	240000	14
Clay Dinner Set	320000	6
Webcam	350000	2
Denim Jacket	380000	7
27in Monitor	400000	5
Laptop Stand	400000	11`,
        isSample: false
      },
      {
        input: `update products set price_cents=150000 where id in (5,8);`,
        expectedOutput: `Table Lamp	110000	18
Leather Wallet	120000	25
Laptop Stand	150000	11
SQL Handbook	150000	9
Wireless Mouse	150000	3
Clean Code	180000	30
Dune	210000	12
USB-C Hub	220000	8
Cotton Panjabi	240000	14
Clay Dinner Set	320000	6
Webcam	350000	2
Denim Jacket	380000	7`,
        isSample: false
      },
    ],
  },
];
