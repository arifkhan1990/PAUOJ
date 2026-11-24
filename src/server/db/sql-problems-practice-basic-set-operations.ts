import type { SeedProblem } from "./seed-problems";

export const SQL_PROBLEMS_PRACTICE_BASIC_SET_OPERATIONS: SeedProblem[] = [
  {
    slug: "sql-practice-set-operations-easy",
    title: "Sold but unreviewed",
    statement: `ইনগেজমেন্ট টিম 'রিভিউ লিখো' রিমাইন্ডার পাঠাবে — টার্গেট সেই প্রোডাক্ট, যারা কার্যকর অর্ডারে (\`paid\`/\`shipped\`) বিক্রি হয়েছে অথচ এখনো একটি রিভিউও পায়নি। বিক্রি-হওয়া প্রোডাক্টের নাম থেকে রিভিউ-পাওয়া প্রোডাক্টের নাম \`EXCEPT\` করে বাকিগুলো বের করো — প্রতি লাইনে \`name\`, নাম অনুযায়ী সাজানো।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`name\` — বিক্রি হয়েছে কিন্তু রিভিউ পায়নি এমন প্রোডাক্ট, নাম অনুযায়ী।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## ধারণা
\`EXCEPT\` প্রথম SELECT-এর সারি থেকে দ্বিতীয় SELECT-এ যা আছে তা বাদ দেয় — 'প্রথম সেটে আছে, দ্বিতীয় সেটে নেই' প্রশ্নের সেট-অপারেশন রূপ। খেয়াল রাখো — \`EXCEPT\` পুরো সারি মেলায়; এখানে দুই শাখাতেই একটাই কলাম (\`name\`), তাই নামের তালিকা বিয়োগ হচ্ছে। একই নামের দুটি ভিন্ন প্রোডাক্ট থাকলে নাম-ভিত্তিক বিয়োগ বিভ্রান্তি করতো — আইডি-ভিত্তিক তুলনা নিরাপদ হলেও এখানে নামগুলো ইউনিক।

## ধাপে ধাপে
১. প্রথম শাখা: কার্যকর অর্ডারে বিক্রি-হওয়া প্রোডাক্টের নাম।
২. দ্বিতীয় শাখা: রিভিউ-পাওয়া প্রোডাক্টের নাম।
৩. মাঝে \`EXCEPT\`, শেষে \`ORDER BY name\`।

## কোডে দেখি
\`\`\`sql
SELECT p.name
FROM products p
JOIN order_items oi ON oi.product_id = p.id
JOIN orders o ON o.id = oi.order_id
WHERE o.status IN ('paid','shipped')
EXCEPT
SELECT p2.name FROM products p2 JOIN reviews r ON r.product_id = p2.id
ORDER BY name;
\`\`\`

## সাধারণ ভুল
\`UNION\` লিখে বাদ দেওয়ার বদলে তালিকা জোড়া দেওয়া; প্রথম শাখায় স্ট্যাটাস ফিল্টার ভুলে cancelled অর্ডারের প্রোডাক্টও আনা; দুই শাখায় আলাদা \`ORDER BY\` দেওয়া — সাজানো হয় এক হওয়ার পরে, শেষে একবার।`,
    difficulty: "EASY",
    points: 150,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    category: "SQL Basics",
    subcategory: "Set operations",
    referencePython: "",
    referenceSql: `SELECT p.name FROM products p JOIN order_items oi ON oi.product_id = p.id JOIN orders o ON o.id = oi.order_id WHERE o.status IN ('paid','shipped') EXCEPT SELECT p2.name FROM products p2 JOIN reviews r ON r.product_id = p2.id ORDER BY name;`,
    tests: [
      {
        input: ``,
        expectedOutput: `27in Monitor
Denim Jacket
Laptop Stand
SQL Handbook
Table Lamp
USB-C Hub`,
        isSample: true
      },
      {
        input: `insert into reviews (id,product_id,customer_id,rating,created_at) values (7,3,1,5,'2026-11-05');`,
        expectedOutput: `Denim Jacket
Laptop Stand
SQL Handbook
Table Lamp
USB-C Hub`,
        isSample: true
      },
      {
        input: `delete from reviews where product_id=4;`,
        expectedOutput: `27in Monitor
Clean Code
Denim Jacket
Laptop Stand
SQL Handbook
Table Lamp
USB-C Hub`,
        isSample: false
      },
      {
        input: `insert into order_items (id,order_id,product_id,quantity,unit_price_cents) values (16,10,12,1,350000);`,
        expectedOutput: `27in Monitor
Denim Jacket
Laptop Stand
SQL Handbook
Table Lamp
USB-C Hub
Webcam`,
        isSample: false
      },
      {
        input: `update orders set status='cancelled' where id in (4,7);`,
        expectedOutput: `Denim Jacket
SQL Handbook
USB-C Hub`,
        isSample: false
      },
    ],
  },
  {
    slug: "sql-practice-set-operations-medium",
    title: "Cart-only vs order-only",
    statement: `ইনভেন্টরি টিম কার্ট আর অর্ডারের অসঙ্গতি খুঁজছে — কোন প্রোডাক্ট কাস্টমারের কার্টে ঢুকেছে কিন্তু কখনো অর্ডার হয়নি (\`cart_only\`), আর কোনটা অর্ডার হয়েছে কিন্তু কখনো কার্টে ছিল না (\`ordered_only\`)। দুই দিকের তালিকা একসাথে জোড়ো — প্রতি লাইনে \`product\` ও দিকের লেবেল \`listed\`; নাম অনুযায়ী সাজাও, একই নামে লেবেল অনুযায়ী।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`product\`, \`listed\` (\`cart_only\` বা \`ordered_only\`) — \`product\` অনুযায়ী, একই নামে \`listed\` অনুযায়ী।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## ধারণা
দুই দিকের ব্যবধান মানে দুটো 'আছে-নেই' শর্ত — কার্টে আছে অথচ অর্ডারে নেই, আর উল্টোটা। দুই শাখার সারি আলাদা অর্থ বহন করে (একটা \`cart_only\`, একটা \`ordered_only\`), তাই জোড়া দিতে \`UNION ALL\` — ডুপ্লিকেট-বাদ দেওয়ার দরকার নেই, \`UNION\` দিলে হলেও এখানে সারিরা লেবেলে আলাদা। প্রতি শাখায় \`IN\` আর \`NOT IN\` সাবকোয়েরি জোড়া দিয়ে দুই টেবিলে উপস্থিতি চেক করা হয়।

## ধাপে ধাপে
১. শাখা ১: \`p.id IN (কার্টের product_id)\` এবং \`NOT IN (অর্ডারের product_id)\` — লেবেল \`cart_only\`।
২. শাখা ২: উল্টো জোড়া — লেবেল \`ordered_only\`।
৩. \`UNION ALL\` দিয়ে জোড়ো, শেষে \`ORDER BY product, listed\`।

## কোডে দেখি
\`\`\`sql
SELECT p.name AS product, 'cart_only' AS listed
FROM products p
WHERE p.id IN (SELECT product_id FROM cart_items)
  AND p.id NOT IN (SELECT product_id FROM order_items)
UNION ALL
SELECT p.name, 'ordered_only'
FROM products p
WHERE p.id IN (SELECT product_id FROM order_items)
  AND p.id NOT IN (SELECT product_id FROM cart_items)
ORDER BY product, listed;
\`\`\`

## সাধারণ ভুল
\`NOT IN\`-এর তালিকায় NULL থাকলে খালি ফল — এখানে \`product_id\` NULL হয় না, তবে সতর্ক থাকো; দুই শাখার কলাম সংখ্যা/ক্রম না মেলানো; দুই শাখায় আলাদা \`ORDER BY\` দেওয়া — যুক্ত ফল সাজায় শুধু শেষের এক \`ORDER BY\`।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    category: "SQL Basics",
    subcategory: "Set operations",
    referencePython: "",
    referenceSql: `SELECT p.name AS product, 'cart_only' AS listed FROM products p WHERE p.id IN (SELECT product_id FROM cart_items) AND p.id NOT IN (SELECT product_id FROM order_items) UNION ALL SELECT p.name, 'ordered_only' FROM products p WHERE p.id IN (SELECT product_id FROM order_items) AND p.id NOT IN (SELECT product_id FROM cart_items) ORDER BY product, listed;`,
    tests: [
      {
        input: ``,
        expectedOutput: `27in Monitor	ordered_only
Dune	cart_only
Webcam	cart_only`,
        isSample: true
      },
      {
        input: `insert into order_items (id,order_id,product_id,quantity,unit_price_cents) values (16,10,12,1,350000);`,
        expectedOutput: `27in Monitor	ordered_only
Dune	cart_only`,
        isSample: true
      },
      {
        input: `insert into cart_items (id,cart_id,product_id,quantity,unit_price_cents,added_at) values (16,6,3,1,1850000,'2026-11-02 09:00');`,
        expectedOutput: `Dune	cart_only
Webcam	cart_only`,
        isSample: false
      },
      {
        input: `delete from cart_items where product_id=13;`,
        expectedOutput: `27in Monitor	ordered_only
Webcam	cart_only`,
        isSample: false
      },
      {
        input: `delete from cart_items where product_id in (12,13);`,
        expectedOutput: `27in Monitor	ordered_only`,
        isSample: false
      },
    ],
  },
];
