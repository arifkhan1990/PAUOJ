import type { SeedProblem } from "./seed-problems";

export const SQL_PROBLEMS_BASIC_SUBQUERIES: SeedProblem[] = [
  {
    slug: "sql-above-category-average",
    title: "Above category average",
    statement: `প্রতিটি প্রোডাক্টের দাম তার ক্যাটাগরির গড় দামের চেয়ে বেশি হলে সেই প্রোডাক্টের নাম, ক্যাটাগরি আর দাম (সেন্টে) বের করো; ক্যাটাগরি, তারপর দাম descending, তারপর নাম অনুযায়ী সাজাও।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`name\`, \`category\`, \`price_cents\`।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## কেন দরকার
"এই প্রোডাক্ট কি দামি?" — এই প্রশ্নের উত্তর পুরো দোকানের গড় দিয়ে হয় না। Books-এর ২০০ টাকা Electronics-এর কাছে সস্তা। তুলনা হতে হবে একই ক্যাটাগরির ভিতরে।

## মূল ধারণা
Correlated subquery বাইরের query-র প্রতিটি সারির \`category_id\` ব্যবহার করে সেই ক্যাটাগরির \`AVG(price_cents)\` বের করে। চাইলে \`AVG(price_cents) OVER (PARTITION BY category_id)\` window function-ও ব্যবহার করা যায়; ফলাফল একই।

## ধাপে ধাপে
১. products আর categories জোড়া লাগাও।
২. subquery-তে একই \`category_id\`-র গড় দাম বের করো।
৩. বাইরে \`price_cents > (...)\` শর্ত দাও।
৪. ক্যাটাগরি/দাম/নাম দিয়ে সাজাও।

## কোডে দেখি
\`\`\`sql
SELECT p.name, c.name AS category, p.price_cents
FROM products p
JOIN categories c ON c.id = p.category_id
WHERE p.price_cents > (
  SELECT AVG(p2.price_cents)
  FROM products p2
  WHERE p2.category_id = p.category_id
)
ORDER BY c.name, p.price_cents DESC, p.name;
\`\`\`

## কমপ্লেক্সিটি
index ছাড়া প্রতিটি প্রোডাক্টের জন্য ক্যাটাগরি স্ক্যান — \`O(n * c)\`। \`category_id\`-তে index থাকলে অনেক দ্রুত।

## সাধারণ ভুল
পুরো টেবিলের গড় নেওয়া; \`>=\` আর \`>\` গুলিয়ে ফেলা; correlated subquery-তে alias ভুল করা।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    category: "SQL Basics",
    subcategory: "Subqueries",
    referencePython: "",
    referenceSql: `SELECT p.name, c.name AS category, p.price_cents
FROM products p JOIN categories c ON c.id=p.category_id
WHERE p.price_cents > (SELECT AVG(p2.price_cents) FROM products p2 WHERE p2.category_id=p.category_id)
ORDER BY c.name, p.price_cents DESC, p.name;`,
    tests: [
      {
        input: ``,
        expectedOutput: `Clean Code	Books	180000
27in Monitor	Electronics	1850000
Clay Dinner Set	Home	320000
Denim Jacket	Men	380000`,
        isSample: true
      },
      {
        input: `update products set price_cents=price_cents*2 where id in (5,8);`,
        expectedOutput: `SQL Handbook	Books	190000
27in Monitor	Electronics	1850000
Clay Dinner Set	Home	320000
Denim Jacket	Men	380000`,
        isSample: true
      },
      {
        input: `update products set price_cents=300000 where id in (4,13);`,
        expectedOutput: `Clean Code	Books	300000
27in Monitor	Electronics	1850000
Clay Dinner Set	Home	320000
Denim Jacket	Men	380000`,
        isSample: false
      },
      {
        input: `update products set price_cents=10000 where id=3;`,
        expectedOutput: `Clean Code	Books	180000
Mechanical Keyboard	Electronics	450000
Webcam	Electronics	350000
USB-C Hub	Electronics	220000
Clay Dinner Set	Home	320000
Denim Jacket	Men	380000`,
        isSample: false
      },
      {
        input: `update products set price_cents=400000 where id in (1,2,3,8,9,12);`,
        expectedOutput: `Clean Code	Books	180000
Clay Dinner Set	Home	320000
Denim Jacket	Men	380000`,
        isSample: false
      },
    ],
  },
  {
    slug: "sql-customers-without-orders",
    title: "Customers with no orders",
    statement: `যেসব কাস্টমারের কোনো paid/shipped অর্ডার নেই তাদের নাম ও শহর বের করো; নাম অনুযায়ী সাজাও।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`name\`, \`city\`।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## কেন দরকার
মার্কেটিং টিম জানতে চায় কারা অ্যাকাউন্ট খুলেছে কিন্তু কখনো কিনেনি। এই তালিকা ইমেইল ক্যাম্পেইন বা প্রথম অর্ডার ডিসকাউন্টের জন্য দরকার।

## মূল ধারণা
\`NOT EXISTS\` দিয়ে প্রতিটি কাস্টমারের জন্য দেখো, তার কোনো paid/shipped অর্ডার আছে কি না। \`cancelled\` বা \`pending\` অর্ডার "কেনা" হিসেবে গোনা যাবে না—ব্যবসার নিয়ম আগে ঠিক করো।

## ধাপে ধাপে
১. customers থেকে শুরু করো।
২. subquery-তে orders-এ \`customer_id\` মিলিয়ে paid/shipped ফিল্টার করো।
৩. \`WHERE NOT EXISTS (...)\`।
৪. নাম অনুযায়ী সাজাও।

## কোডে দেখি
\`\`\`sql
SELECT c.name, c.city
FROM customers c
WHERE NOT EXISTS (
  SELECT 1
  FROM orders o
  WHERE o.customer_id = c.id
    AND o.status IN ('paid', 'shipped')
)
ORDER BY c.name;
\`\`\`

## কমপ্লেক্সিটি
\`orders.customer_id\` index থাকলে প্রায় \`O(n log m)\`।

## সাধারণ ভুল
সব স্ট্যাটাস গোনা; \`LEFT JOIN\`-এ \`o.id IS NULL\` ভুল জায়গায় দেওয়া; একই কাস্টমার একাধিক অর্ডার থাকলে DISTINCT ভুলে যাওয়া (এখানে EXISTS হওয়ায় সমস্যা নেই)।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    category: "SQL Basics",
    subcategory: "Subqueries",
    referencePython: "",
    referenceSql: `SELECT c.name, c.city FROM customers c
WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.customer_id=c.id AND o.status IN ('paid','shipped'))
ORDER BY c.name;`,
    tests: [
      {
        input: ``,
        expectedOutput: `Sajid	Sylhet`,
        isSample: true
      },
      {
        input: `update orders set status='cancelled' where id=8;`,
        expectedOutput: `Karim	Chattogram
Sajid	Sylhet`,
        isSample: true
      },
      {
        input: `update orders set status='cancelled' where id in (3,9);`,
        expectedOutput: `Nusrat	Dhaka
Sajid	Sylhet`,
        isSample: false
      },
      {
        input: `delete from order_items where order_id=10; delete from orders where id=10;`,
        expectedOutput: `Sajid	Sylhet
Tanvir	Dhaka`,
        isSample: false
      },
      {
        input: `update customers set city='Barishal' where id=4;`,
        expectedOutput: `Sajid	Barishal`,
        isSample: false
      },
    ],
  },
];
