import type { SeedProblem } from "./seed-problems";

export const SQL_PROBLEMS_PRACTICE_BASIC_PAGINATION: SeedProblem[] = [
  {
    slug: "sql-practice-pagination-easy",
    title: "Three cheapest products",
    statement: `হোমপেজের 'বাজেট কর্নার'-এ তিনটি সস্তা প্রোডাক্ট দেখানো হবে। \`products\` থেকে সবচেয়ে কম দামের তিনটি প্রোডাক্টের \`name\` ও \`price_cents\` বের করো — দাম ঊর্ধ্বক্রমে, একই দামে নাম অনুযায়ী; ঠিক ৩টি সারি।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`name\`, \`price_cents\` — দাম ঊর্ধ্বক্রম, সমান দামে \`name\` অনুযায়ী; ঠিক ৩টি সারি।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## ধারণা
\`LIMIT n\` সাজানো ফলের প্রথম n সারি কেটে নেয় — তাই \`ORDER BY\` আগে, \`LIMIT\` পরে। সীমানায় সমান দাম বসলে কে ঢুকবে তা ঠিক করে দ্বিতীয় কী (\`name\`) — এই টাই-ব্রেকার ছাড়া LIMIT প্রতিবার ভিন্ন সারি তুলতে পারতো।

## ধাপে ধাপে
১. \`ORDER BY price_cents, name\` — দাম, তারপর নাম।
২. শেষে \`LIMIT 3\`।

## কোডে দেখি
\`\`\`sql
SELECT name, price_cents
FROM products
ORDER BY price_cents, name
LIMIT 3;
\`\`\`

## সাধারণ ভুল
\`ORDER BY\` ছাড়া \`LIMIT\` দিলে কোন সারি আসবে তা অজানা; শুধু \`price_cents\` দিয়ে সাজিয়ে সমান দামে অনির্দিষ্ট ক্রম রাখা; \`DESC\` লিখে সবচেয়ে দামি তিনটি আনা; \`WHERE\` দিয়ে দামের শর্ত বসিয়ে LIMIT-এর কাজ দ্বিগুণ করা।`,
    difficulty: "EASY",
    points: 150,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    category: "SQL Basics",
    subcategory: "Pagination",
    referencePython: "",
    referenceSql: `SELECT name, price_cents FROM products ORDER BY price_cents, name LIMIT 3;`,
    tests: [
      {
        input: ``,
        expectedOutput: `Wireless Mouse	85000
SQL Handbook	95000
Table Lamp	110000`,
        isSample: true
      },
      {
        input: `update products set price_cents=85000 where id=5;`,
        expectedOutput: `SQL Handbook	85000
Wireless Mouse	85000
Table Lamp	110000`,
        isSample: true
      },
      {
        input: `update products set price_cents=50000 where id=4;`,
        expectedOutput: `Clean Code	50000
Wireless Mouse	85000
SQL Handbook	95000`,
        isSample: false
      },
      {
        input: `update products set price_cents=100000 where id in (5,8);`,
        expectedOutput: `SQL Handbook	100000
Wireless Mouse	100000
Table Lamp	110000`,
        isSample: false
      },
      {
        input: `update products set price_cents=110000 where id=5;`,
        expectedOutput: `Wireless Mouse	85000
SQL Handbook	110000
Table Lamp	110000`,
        isSample: false
      },
    ],
  },
  {
    slug: "sql-practice-pagination-medium",
    title: "Customer leaderboard page two",
    statement: `ড্যাশবোর্ডে কার্যকর-অর্ডারের (\`paid\`/\`shipped\`) সংখ্যায় কাস্টমারদের লিডারবোর্ড পেজে ভাগ করে দেখানো হয় — প্রতি পেজে ২ জন। দ্বিতীয় পেজ বের করো: কাস্টমারের নাম (\`customer\`) ও অর্ডার সংখ্যা (\`order_count\`) — বেশি সংখ্যা আগে, সমান হলে নাম অনুযায়ী।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`customer\`, \`order_count\` — সংখ্যা নিচের ক্রমে, সমান হলে \`customer\` অনুযায়ী; দ্বিতীয় পেজ — ২টি সারি।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## ধারণা
পেজ k, সাইজ s মানে \`LIMIT s OFFSET (k-1)*s\` — দ্বিতীয় পেজ হলো \`LIMIT 2 OFFSET 2\`। আসল সতর্কতা সীমানায়: একই সংখ্যার কাস্টমাররা পাশাপাশি বসে, আর পেজের কাটা লাইন ঠিক সেই ব্লকের ভেতরে পড়তে পারে — টাই-ব্রেকার \`customer\` না থাকলে কে ৩য়-৪র্থ হবে তা এলোমেলো হয়ে যেতো, পেজে ভিন্ন মানুষ ঢুকে পড়তো।

## ধাপে ধাপে
১. \`customers cu JOIN orders o\`, \`paid/shipped\` ফিল্টার, \`GROUP BY cu.id\`।
২. \`ORDER BY order_count DESC, customer\`।
৩. \`LIMIT 2 OFFSET 2\` — দ্বিতীয় পেজ।

## কোডে দেখি
\`\`\`sql
SELECT cu.name AS customer, COUNT(o.id) AS order_count
FROM customers cu
JOIN orders o ON o.customer_id = cu.id
WHERE o.status IN ('paid','shipped')
GROUP BY cu.id
ORDER BY order_count DESC, customer
LIMIT 2 OFFSET 2;
\`\`\`

## সাধারণ ভুল
\`LIMIT 2\` একাই দিয়ে প্রথম পেজ দেখানো; \`OFFSET 4\` বা \`OFFSET 1\` দিয়ে ভুল পেজ আনা; টাই-ব্রেকার ছাড়া সীমানার সারি অদল-বদল; ফিল্টার ছাড়া pending/cancelled-ও গুনে সংখ্যা ফুলিয়ে ফেলা।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    category: "SQL Basics",
    subcategory: "Pagination",
    referencePython: "",
    referenceSql: `SELECT cu.name AS customer, COUNT(o.id) AS order_count FROM customers cu JOIN orders o ON o.customer_id = cu.id WHERE o.status IN ('paid','shipped') GROUP BY cu.id ORDER BY order_count DESC, customer LIMIT 2 OFFSET 2;`,
    tests: [
      {
        input: ``,
        expectedOutput: `Karim	1
Mim	1`,
        isSample: true
      },
      {
        input: `insert into orders (id,customer_id,ordered_at,status) values (11,2,'2026-11-06','paid'); insert into order_items (id,order_id,product_id,quantity,unit_price_cents) values (16,11,4,1,180000);`,
        expectedOutput: `Nusrat	2
Mim	1`,
        isSample: true
      },
      {
        input: `update orders set status='pending' where id=8;`,
        expectedOutput: `Mim	1
Tanvir	1`,
        isSample: false
      },
      {
        input: `update orders set status='cancelled' where id in (1,4);`,
        expectedOutput: `Mim	1
Rahim	1`,
        isSample: false
      },
      {
        input: `update orders set customer_id=2 where id in (3,9);`,
        expectedOutput: `Mim	1
Tanvir	1`,
        isSample: false
      },
    ],
  },
];
