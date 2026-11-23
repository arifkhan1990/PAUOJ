import type { SeedProblem } from "./seed-problems";

export const SQL_PROBLEMS_CHECKPOINTS_BASIC: SeedProblem[] = [
  {
    slug: "sql-check-basic-top-customers",
    title: "Top customers",
    statement: `চেকপয়েন্ট: paid/shipped অর্ডারে সবচেয়ে বেশি খরচ করা ৩ জন কাস্টমারের নাম ও মোট (সেন্টে) বের করো; বেশি খরচ আগে, টাইলে নাম।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`name\` ও \`total_cents\`, খরচ ডিসেন্ডিং।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## ধারণা
JOIN + GROUP BY + SUM, তারপর ORDER BY + LIMIT।

## ধাপে ধাপে
1. customers→orders→order_items জোড়া।
2. paid/shipped ফিল্টার।
3. কাস্টমার ধরে SUM, \`ORDER BY total DESC LIMIT 3\`।

\`\`\`sql
SELECT c.name, SUM(oi.quantity*oi.unit_price_cents) AS total_cents
FROM customers c
JOIN orders o ON o.customer_id=c.id
JOIN order_items oi ON oi.order_id=o.id
WHERE o.status IN ('paid','shipped')
GROUP BY c.id
ORDER BY total_cents DESC, c.name
LIMIT 3;
\`\`\`

## কমপ্লেক্সিটি
\`O(n log n)\`।

## সাধারণ ভুল
LIMIT বাদ দেওয়া বা টাই-ব্রেক না দেওয়া।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    category: "SQL Basics",
    subcategory: "Checkpoint",
    referencePython: "",
    referenceSql: `SELECT c.name, SUM(oi.quantity*oi.unit_price_cents) AS total_cents FROM customers c JOIN orders o ON o.customer_id=c.id JOIN order_items oi ON oi.order_id=o.id WHERE o.status IN ('paid','shipped') GROUP BY c.id ORDER BY total_cents DESC, c.name LIMIT 3;`,
    tests: [
      {
        input: ``,
        expectedOutput: `Rahim	3495000
Nusrat	720000
Mim	670000`,
        isSample: true,
      },
      {
        input: `update orders set status='cancelled' where id in (3,6);`,
        expectedOutput: `Rahim	2890000
Mim	670000
Tanvir	380000`,
        isSample: true,
      },
      {
        input: `insert into orders (id,customer_id,ordered_at,status) values (11,4,'2026-11-05','paid'); insert into order_items (id,order_id,product_id,quantity,unit_price_cents) values (16,11,8,1,85000);`,
        expectedOutput: `Rahim	3495000
Nusrat	720000
Mim	670000`,
        isSample: false,
      },
      {
        input: `insert into orders (id,customer_id,ordered_at,status) values (11,2,'2026-11-05','paid'); insert into order_items (id,order_id,product_id,quantity,unit_price_cents) values (16,11,4,1,180000);`,
        expectedOutput: `Rahim	3495000
Nusrat	720000
Mim	670000`,
        isSample: false,
      },
      {
        input: `update order_items set unit_price_cents=1 where order_id=1 and product_id=1;`,
        expectedOutput: `Rahim	3045001
Nusrat	720000
Mim	670000`,
        isSample: false,
      },
    ],
  },
  {
    slug: "sql-check-basic-monthly",
    title: "Monthly revenue",
    statement: `চেকপয়েন্ট: paid/shipped অর্ডারের মাস অনুযায়ী মোট রেভিনিউ (সেন্টে) বের করো; মাস অনুযায়ী সাজাও।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`month\` (YYYY-MM) ও \`revenue_cents\`।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## ধারণা
তারিখের প্রথম ৭ অক্ষর নিয়ে মাস বানিয়ে GROUP BY।

## ধাপে ধাপে
1. JOIN orders+items।
2. \`substr(ordered_at,1,7)\`।
3. GROUP BY month।

\`\`\`sql
SELECT substr(o.ordered_at,1,7) AS month,
       SUM(oi.quantity*oi.unit_price_cents) AS revenue_cents
FROM orders o
JOIN order_items oi ON oi.order_id=o.id
WHERE o.status IN ('paid','shipped')
GROUP BY month
ORDER BY month;
\`\`\`

## কমপ্লেক্সিটি
\`O(n log n)\`।

## সাধারণ ভুল
POstgreSQL-এ \`to_char\` ব্যবহার করা — portable রাখতে substr ব্যবহার করো।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    category: "SQL Basics",
    subcategory: "Checkpoint",
    referencePython: "",
    referenceSql: `SELECT substr(o.ordered_at,1,7) AS month, SUM(oi.quantity*oi.unit_price_cents) AS revenue_cents FROM orders o JOIN order_items oi ON oi.order_id=o.id WHERE o.status IN ('paid','shipped') GROUP BY month ORDER BY month;`,
    tests: [
      {
        input: ``,
        expectedOutput: `2026-10	5065000
2026-11	380000`,
        isSample: true,
      },
      {
        input: `update orders set status='cancelled' where id in (3,6);`,
        expectedOutput: `2026-10	3860000
2026-11	380000`,
        isSample: true,
      },
      {
        input: `delete from order_items where order_id=10; delete from orders where id=10;`,
        expectedOutput: `2026-10	5065000`,
        isSample: false,
      },
      {
        input: `insert into orders (id,customer_id,ordered_at,status) values (11,6,'2026-11-05','paid'); insert into order_items (id,order_id,product_id,quantity,unit_price_cents) values (16,11,13,1,210000);`,
        expectedOutput: `2026-10	5065000
2026-11	590000`,
        isSample: false,
      },
      {
        input: `update orders set ordered_at='2026-12-01' where id=10;`,
        expectedOutput: `2026-10	5065000
2026-12	380000`,
        isSample: false,
      },
    ],
  },
  {
    slug: "sql-check-basic-ratings",
    title: "Rating leaderboard",
    statement: `চেকপয়েন্ট: যেসব প্রোডাক্টের রিভিউ আছে তাদের গড় রেটিং (১ দশমিক) বের করো; সবচেয়ে ভালো ৫টি, টাইলে নাম।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`name\` ও \`avg_rating\`।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## ধারণা
AVG + GROUP BY + ROUND + ORDER BY + LIMIT।

## ধাপে ধাপে
1. products JOIN reviews।
2. প্রোডাক্ট ধরে AVG(r.rating)।
3. \`round(...,1)\`, DESC, LIMIT 5।

\`\`\`sql
SELECT p.name, round(AVG(r.rating),1) AS avg_rating
FROM products p
JOIN reviews r ON r.product_id=p.id
GROUP BY p.id
ORDER BY avg_rating DESC, p.name
LIMIT 5;
\`\`\`

## কমপ্লেক্সিটি
\`O(n log n)\`।

## সাধারণ ভুল
রিভিউ 없는 প্রোডাক্ট INNER JOIN-এ বাদ পড়া স্বাভাবিক — চেকপয়েন্টে শুধু রিভিউ থাকাগুলোই লাগবে।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    category: "SQL Basics",
    subcategory: "Checkpoint",
    referencePython: "",
    referenceSql: `SELECT p.name, round(AVG(r.rating),1) AS avg_rating FROM products p JOIN reviews r ON r.product_id=p.id GROUP BY p.id ORDER BY avg_rating DESC, p.name LIMIT 5;`,
    tests: [
      {
        input: ``,
        expectedOutput: `Clay Dinner Set	5.0
Mechanical Keyboard	5.0
Clean Code	4.5
Cotton Panjabi	4.0
Leather Wallet	3.0`,
        isSample: true,
      },
      {
        input: `delete from reviews where rating=5;`,
        expectedOutput: `Clean Code	4.0
Cotton Panjabi	4.0
Leather Wallet	3.0`,
        isSample: true,
      },
      {
        input: `insert into reviews (id,product_id,customer_id,rating,created_at) values (7,1,2,3,'2026-11-01');`,
        expectedOutput: `Clay Dinner Set	5.0
Clean Code	4.5
Cotton Panjabi	4.0
Mechanical Keyboard	4.0
Leather Wallet	3.0`,
        isSample: false,
      },
      {
        input: `update reviews set rating=5;`,
        expectedOutput: `Clay Dinner Set	5.0
Clean Code	5.0
Cotton Panjabi	5.0
Leather Wallet	5.0
Mechanical Keyboard	5.0`,
        isSample: false,
      },
      {
        input: `update reviews set rating=1 where product_id=7;`,
        expectedOutput: `Clay Dinner Set	5.0
Mechanical Keyboard	5.0
Clean Code	4.5
Cotton Panjabi	4.0
Leather Wallet	1.0`,
        isSample: false,
      },
    ],
  },
];
