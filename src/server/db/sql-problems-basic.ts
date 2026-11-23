import type { SeedProblem } from "./seed-problems";

export const SQL_PROBLEMS_BASIC: SeedProblem[] = [
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
        input: ``,
        expectedOutput: `HomeCraft	Khulna
StyleHub	Dhaka
TechNest	Dhaka`,
        isSample: true,
      },
      {
        input: `update vendors set rating=4.0 where id=1;`,
        expectedOutput: `HomeCraft	Khulna
StyleHub	Dhaka`,
        isSample: true,
      },
      {
        input: `update vendors set rating=4.5 where id=2;`,
        expectedOutput: `BookBazar	Chattogram
HomeCraft	Khulna
StyleHub	Dhaka
TechNest	Dhaka`,
        isSample: false,
      },
      {
        input: `update vendors set rating=4.4 where id=5;`,
        expectedOutput: `StyleHub	Dhaka
TechNest	Dhaka`,
        isSample: false,
      },
      {
        input: `update vendors set rating=4.7 where id=6;`,
        expectedOutput: `HomeCraft	Khulna
PaperTrail	Rajshahi
StyleHub	Dhaka
TechNest	Dhaka`,
        isSample: false,
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
        input: ``,
        expectedOutput: `Webcam	2
Wireless Mouse	3
27in Monitor	5
Clay Dinner Set	6
Denim Jacket	7
USB-C Hub	8
SQL Handbook	9`,
        isSample: true,
      },
      {
        input: `update products set stock=9 where id in (4,6);`,
        expectedOutput: `Webcam	2
Wireless Mouse	3
27in Monitor	5
Clay Dinner Set	6
Denim Jacket	7
USB-C Hub	8
Clean Code	9
Cotton Panjabi	9
SQL Handbook	9`,
        isSample: true,
      },
      {
        input: `update products set stock=10 where id in (2,5);`,
        expectedOutput: `Webcam	2
Wireless Mouse	3
27in Monitor	5
Clay Dinner Set	6
Denim Jacket	7`,
        isSample: false,
      },
      {
        input: `update products set stock=0 where id=3;`,
        expectedOutput: `27in Monitor	0
Webcam	2
Wireless Mouse	3
Clay Dinner Set	6
Denim Jacket	7
USB-C Hub	8
SQL Handbook	9`,
        isSample: false,
      },
      {
        input: `update products set stock=1 where id=12;`,
        expectedOutput: `Webcam	1
Wireless Mouse	3
27in Monitor	5
Clay Dinner Set	6
Denim Jacket	7
USB-C Hub	8
SQL Handbook	9`,
        isSample: false,
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
        input: ``,
        expectedOutput: `TechNest	3190000
StyleHub	1100000
HomeCraft	540000`,
        isSample: true,
      },
      {
        input: `update orders set status='cancelled' where id in (3,6);`,
        expectedOutput: `TechNest	3190000`,
        isSample: true,
      },
      {
        input: `update order_items set unit_price_cents=unit_price_cents*10 where product_id=9;`,
        expectedOutput: `TechNest	3190000
GadgetPoint	1500000
StyleHub	1100000
HomeCraft	540000`,
        isSample: false,
      },
      {
        input: `delete from order_items where product_id in (6,7);`,
        expectedOutput: `TechNest	3190000
HomeCraft	540000`,
        isSample: false,
      },
      {
        input: `insert into orders (id,customer_id,ordered_at,status) values (11,5,'2026-11-05','paid'); insert into order_items (id,order_id,product_id,quantity,unit_price_cents) values (16,11,9,1,150000);`,
        expectedOutput: `TechNest	3190000
StyleHub	1100000
HomeCraft	540000`,
        isSample: false,
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
        input: ``,
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
      {
        input: `update orders set status='cancelled' where id in (3,6);`,
        expectedOutput: `1	Rahim	890000
4	Rahim	2000000
7	Mim	670000
8	Karim	180000
9	Nusrat	120000
10	Tanvir	380000`,
        isSample: true,
      },
      {
        input: `insert into orders (id,customer_id,ordered_at,status) values (11,5,'2026-11-05','paid'); insert into order_items (id,order_id,product_id,quantity,unit_price_cents) values (16,11,9,1,150000);`,
        expectedOutput: `1	Rahim	890000
3	Nusrat	600000
4	Rahim	2000000
6	Rahim	605000
7	Mim	670000
8	Karim	180000
9	Nusrat	120000
10	Tanvir	380000
11	Mim	150000`,
        isSample: false,
      },
      {
        input: `update order_items set unit_price_cents=unit_price_cents*10 where product_id=9;`,
        expectedOutput: `1	Rahim	890000
3	Nusrat	600000
4	Rahim	3350000
6	Rahim	605000
7	Mim	670000
8	Karim	180000
9	Nusrat	120000
10	Tanvir	380000`,
        isSample: false,
      },
      {
        input: `update order_items set unit_price_cents=1 where order_id=1 and product_id=1;`,
        expectedOutput: `1	Rahim	440001
3	Nusrat	600000
4	Rahim	2000000
6	Rahim	605000
7	Mim	670000
8	Karim	180000
9	Nusrat	120000
10	Tanvir	380000`,
        isSample: false,
      },
    ],
  },
];
