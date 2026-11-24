import type { SeedProblem } from "./seed-problems";

export const SQL_PROBLEMS_PRACTICE_BASIC_MORE_PAGINATION: SeedProblem[] = [
  {
    slug: "sql-practice-pagination-hard",
    title: "Top vendors by units sold",
    statement: `হোমপেজে 'টপ ভেন্ডর' কার্ড বসানো হবে। কার্যকর অর্ডারের (\`paid\`/\`shipped\`) সব \`order_items\` মিলিয়ে প্রতি ভেন্ডরের প্রোডাক্ট মোট কত ইউনিট বিক্রি হয়েছে গুনো (\`units_sold\`, quantity-র যোগফল) — তারপর প্রথম পৃষ্ঠার ৩ জন দেখাও: বেশি বিক্রি আগে, সমান হলে ভেন্ডরের নাম অনুযায়ী। কলাম: \`vendor\`, \`units_sold\`।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`vendor\`, \`units_sold\` — বিক্রি নিচের ক্রমে, টাই-এ \`vendor\`; সর্বোচ্চ ৩ সারি।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## ধারণা
এখানে পেজিনেশন aggregate-এর পরে — প্রথমে চার টেবিল জুড়ে (vendors → products → order_items → orders) ভেন্ডর-প্রতি ইউনিট যোগ, তারপর সাজানো তালিকার উপরে \`LIMIT 3\`। ক্রম উল্টে দিলে ভুল পেজ: LIMIT আগে চালালে ভিন্ন তিনজন উঠে আসবে। আর টপে টাই আছে — সমান units-এ নাম-ই আগে-পিছে ঠিক করবে, নাহলে ৩ নং সিটে কে ঢুকবে তা অনির্দিষ্ট।

## ধাপে ধাপে
১. চার টেবিল জোড়া, \`WHERE o.status IN ('paid','shipped')\`।
২. \`GROUP BY v.id\` — \`SUM(oi.quantity) AS units_sold\`।
৩. \`ORDER BY units_sold DESC, v.name\`।
৪. সবার শেষে \`LIMIT 3\`।

## কোডে দেখি
\`\`\`sql
SELECT v.name AS vendor, SUM(oi.quantity) AS units_sold
FROM vendors v
JOIN products p ON p.vendor_id = v.id
JOIN order_items oi ON oi.product_id = p.id
JOIN orders o ON o.id = oi.order_id
WHERE o.status IN ('paid','shipped')
GROUP BY v.id
ORDER BY units_sold DESC, v.name
LIMIT 3;
\`\`\`

## সাধারণ ভুল
\`COUNT(oi.id)\` দিয়ে সারি গোনা — এক সারিতে কয়েক ইউনিট থাকতে পারে; টাই-ব্রেকার ছাড়া ৩ নং সিট অনির্দিষ্ট; বিক্রি-শূন্য ভেন্ডর তালিকায় নেই বলে অবাক হওয়া — INNER JOIN-এ তা স্বাভাবিক, 'টপ থ্রি'-তে খালি ভেন্ডর লাগবেই না; ORDER BY-র আগে LIMIT বসানোর মতো সিনট্যাক্স-বিভ্রম (শেষেই লিখতে হয়)।`,
    difficulty: "HARD",
    points: 250,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    category: "SQL Basics",
    subcategory: "Pagination",
    referencePython: "",
    referenceSql: `SELECT v.name AS vendor, SUM(oi.quantity) AS units_sold FROM vendors v JOIN products p ON p.vendor_id = v.id JOIN order_items oi ON oi.product_id = p.id JOIN orders o ON o.id = oi.order_id WHERE o.status IN ('paid','shipped') GROUP BY v.id ORDER BY units_sold DESC, v.name LIMIT 3;`,
    tests: [
      {
        input: ``,
        expectedOutput: `StyleHub	5
TechNest	5
BookBazar	4`,
        isSample: true
      },
      {
        input: `update orders set status='cancelled' where id=6;`,
        expectedOutput: `StyleHub	5
TechNest	5
HomeCraft	2`,
        isSample: true
      },
      {
        input: `insert into products (id,vendor_id,category_id,name,price_cents,stock,rating) values (15,6,4,'Paper Notebook',60000,50,4.2); insert into orders (id,customer_id,ordered_at,status) values (11,6,'2026-11-12','paid'); insert into order_items (id,order_id,product_id,quantity,unit_price_cents) values (16,11,15,6,60000);`,
        expectedOutput: `PaperTrail	6
StyleHub	5
TechNest	5`,
        isSample: false
      },
      {
        input: `update orders set status='pending' where id=7;`,
        expectedOutput: `StyleHub	5
BookBazar	4
TechNest	4`,
        isSample: false
      },
      {
        input: `insert into order_items (id,order_id,product_id,quantity,unit_price_cents) values (18,10,7,2,120000);`,
        expectedOutput: `StyleHub	7
TechNest	5
BookBazar	4`,
        isSample: false
      },
    ],
  },
  {
    slug: "sql-practice-pagination-challenge",
    title: "Flash-sale page two",
    statement: `ফ্ল্যাশ-সেল ক্যাটালগ সস্তা-থেকে-দামি ক্রমে পৃষ্ঠায় সাজানো হয়, প্রতি পৃষ্ঠায় ৩টা প্রোডাক্ট। তোমার দরকার দ্বিতীয় পৃষ্ঠা — পুরো তালিকার ৪র্থ থেকে ৬ষ্ঠ প্রোডাক্ট। প্রতি সারিতে \`name\`, \`price_cents\`, \`stock\` দেখাও। সাজানোর নিয়ম: \`price_cents\` ঊর্ধ্বক্রমে (সস্তা আগে), একই দামে \`name\` অনুযায়ী — পৃষ্ঠার সীমানায় একই দামের জোড়া বসলেও ক্রম যেন অটুট থাকে।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`name\`, \`price_cents\`, \`stock\` — দাম ঊর্ধ্বক্রম, টাই-এ \`name\`; ঠিক ৩ সারি (পুরো তালিকার ৪–৬ নং)।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## ধারণা
\`LIMIT 3 OFFSET 3\` — প্রথম ৩টা স্কিপ করে পরের ৩টা। OFFSET শূন্য-থেকে গোনা: পৃষ্ঠা p শুরু (p−1)×size তে — পৃষ্ঠা ২ মানে offset ৩। আসল ফাঁদ সীমানায়: লুকানো টেস্টে একই দামের কয়েক প্রোডাক্ট ঠিক ৩–৪ নং সিটের দুই পাশে বসানো — \`ORDER BY price\` একা দিলে কে ৩ নং আর কে ৪ নং হবে তা ইঞ্জিনের হাত, তোমার পৃষ্ঠা ভুল হয়ে যাবে। \`name\` টাই-ব্রেকার দিলে ক্রম প্রতিবার একই।

## ধাপে ধাপে
১. \`ORDER BY price_cents, name\` — দাম, তারপর নাম।
২. \`LIMIT 3 OFFSET 3\` — পৃষ্ঠা ২, সাইজ ৩।

## কোডে দেখি
\`\`\`sql
SELECT name, price_cents, stock
FROM products
ORDER BY price_cents, name
LIMIT 3 OFFSET 3;
\`\`\`

## সাধারণ ভুল
\`OFFSET 2\` বা \`4\` — পৃষ্ঠা-গণনার অফ-বাই-ওয়ান; টাই-ব্রেকার বাদ দিয়ে লুকানো টেস্টে ভাঙা; \`LIMIT 3, 3\` লিখে MySQL-স্টাইল কমা-সিনট্যাক্স (SQLite-তে এটা offset, limit — এখানে কাকতালীয়ভাবে একই, পোর্টেবল নয়); দাম নয় নাম দিয়ে সাজিয়ে ভিন্ন পৃষ্ঠা কাটা।`,
    difficulty: "MEDIUM",
    points: 225,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    category: "SQL Basics",
    subcategory: "Pagination",
    referencePython: "",
    referenceSql: `SELECT name, price_cents, stock FROM products ORDER BY price_cents, name LIMIT 3 OFFSET 3;`,
    tests: [
      {
        input: ``,
        expectedOutput: `Leather Wallet	120000	25
Laptop Stand	150000	11
Clean Code	180000	30`,
        isSample: true
      },
      {
        input: `update products set price_cents=120000 where id=4;`,
        expectedOutput: `Clean Code	120000	30
Leather Wallet	120000	25
Laptop Stand	150000	11`,
        isSample: true
      },
      {
        input: `update products set price_cents=110000 where id=4;`,
        expectedOutput: `Table Lamp	110000	18
Leather Wallet	120000	25
Laptop Stand	150000	11`,
        isSample: false
      },
      {
        input: `update products set price_cents=180000 where id in (5,8);`,
        expectedOutput: `Clean Code	180000	30
SQL Handbook	180000	9
Wireless Mouse	180000	3`,
        isSample: false
      },
      {
        input: `insert into products (id,vendor_id,category_id,name,price_cents,stock,rating) values (15,4,1,'AAA Charger',30000,20,4.0);`,
        expectedOutput: `Table Lamp	110000	18
Leather Wallet	120000	25
Laptop Stand	150000	11`,
        isSample: false
      },
    ],
  },
];
