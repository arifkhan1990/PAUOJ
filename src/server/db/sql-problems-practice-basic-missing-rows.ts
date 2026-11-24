import type { SeedProblem } from "./seed-problems";

export const SQL_PROBLEMS_PRACTICE_BASIC_MISSING_ROWS: SeedProblem[] = [
  {
    slug: "sql-practice-missing-rows-easy",
    title: "Categories without products",
    statement: `ক্যাটাগরি টিম মেনু গুছাচ্ছে — কোন ক্যাটাগরিতে এখনো একটাও প্রোডাক্ট নেই, সেই খালি ক্যাটাগরির নাম দরকার। \`categories\` থেকে এমন \`name\` বের করো যার অধীনে \`products\`-এ একটি সারিও নেই; নাম অনুযায়ী সাজাও।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`name\` — খালি ক্যাটাগরির নাম, নাম অনুযায়ী সাজানো।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## ধারণা
'আছে এক টেবিলে, নেই অন্য টেবিলে' — এটাই anti-join। \`NOT EXISTS\` প্রতিটি ক্যাটাগরির জন্য ছোট একটা সাবকোয়েরি চালায়: এই ক্যাটাগরির অধীনে কোনো প্রোডাক্ট আছে কি? না থাকলে ক্যাটাগরিটি ফলে আসে। \`LEFT JOIN ... WHERE p.id IS NULL\` দিয়েও পাওয়া যায়; \`NOT IN\`-ও চলবে, তবে সাবকোয়েরির তালিকায় NULL থাকলে \`NOT IN\` নীরবে খালি ফল দেয় — তাই অভ্যাস হিসেবে \`NOT EXISTS\`-ই নিরাপদ।

## ধাপে ধাপে
১. \`categories\` থেকে \`name\` নাও।
২. \`WHERE NOT EXISTS (SELECT 1 FROM products p WHERE p.category_id = c.id)\`।
৩. \`ORDER BY name\`।

## কোডে দেখি
\`\`\`sql
SELECT c.name
FROM categories c
WHERE NOT EXISTS (
  SELECT 1 FROM products p WHERE p.category_id = c.id
)
ORDER BY c.name;
\`\`\`

## সাধারণ ভুল
সাবকোয়েরিতে \`p.category_id = c.id\` সংযোগ ভুলে গেলে সব ক্যাটাগরিই 'খালি' দেখায়; \`LEFT JOIN\`-এর \`IS NULL\` চেকে ভুল টেবিলের কলাম ধরা; খালি ফল দেখেই ভাবা query ভুল — ডেটাতে সত্যিই সব ক্যাটাগরি ভরা থাকতে পারে।`,
    difficulty: "EASY",
    points: 150,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    category: "SQL Basics",
    subcategory: "NULL & CASE",
    referencePython: "",
    referenceSql: `SELECT c.name FROM categories c WHERE NOT EXISTS (SELECT 1 FROM products p WHERE p.category_id = c.id) ORDER BY c.name;`,
    tests: [
      {
        input: ``,
        expectedOutput: `Audio
Headphones`,
        isSample: true
      },
      {
        input: `delete from products where id=13;`,
        expectedOutput: `Audio
Fiction
Headphones`,
        isSample: true
      },
      {
        input: `insert into products (id,vendor_id,category_id,name,price_cents,stock,rating) values (15,1,2,'Bluetooth Speaker',145000,10,4.1);`,
        expectedOutput: `Headphones`,
        isSample: false
      },
      {
        input: `insert into products (id,vendor_id,category_id,name,price_cents,stock,rating) values (16,1,3,'Studio Headphone',980000,4,4.5);`,
        expectedOutput: `Audio`,
        isSample: false
      },
      {
        input: `update products set category_id=1 where category_id=4;`,
        expectedOutput: `Audio
Books
Headphones`,
        isSample: false
      },
    ],
  },
  {
    slug: "sql-practice-missing-rows-medium",
    title: "Order log with gaps",
    statement: `গ্রোথ টিম প্রতিটি কাস্টমারের কার্যকর-অর্ডারের (\`paid\`/\`shipped\`) হিসাব চায় — কিন্তু যে কাস্টমার এখনো একটাও কার্যকর অর্ডার দেয়নি, সেও তালিকায় থাকবে, গুনতি শূন্য। প্রতি কাস্টমারের \`customer\`, \`city\`, কার্যকর অর্ডারের সংখ্যা \`order_count\` আর সর্বশেষ অর্ডারের তারিখ \`last_order\` (না থাকলে \`none\`) বের করো; বেশি অর্ডার আগে, সমান হলে নাম অনুযায়ী।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`customer\`, \`city\`, \`order_count\`, \`last_order\` — সংখ্যা নিচের ক্রমে, সমান হলে \`customer\` অনুযায়ী; \`last_order\` না থাকলে \`none\`।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## ধারণা
সব কাস্টমার তালিকায় রাখতে \`LEFT JOIN\` — ম্যাচ না পেলে ডান পাশ NULL হয়, কিন্তু বাম সারিটি বেঁচে থাকে। স্ট্যাটাস ফিল্টারটা জোড়ার \`ON\`-এ রাখতে হয়; \`WHERE\`-এ সরিয়ে দিলে NULL সারিগুলোই ছেঁড়ে পড়ে — LEFT JOIN-এর মান হারিয়ে যায়। খালি গ্রুপে \`COUNT(o.id)\` ০ দেয়, কিন্তু \`MAX(o.ordered_at)\` দেয় NULL — সেটাই \`COALESCE(..., 'none')\` দিয়ে দৃশ্যমান লেবেল হয়।

## ধাপে ধাপে
১. \`customers cu LEFT JOIN orders o ON o.customer_id = cu.id AND o.status IN ('paid','shipped')\`।
২. \`GROUP BY cu.id\`।
৩. \`COUNT(o.id)\` গুনতি, \`COALESCE(MAX(o.ordered_at), 'none')\` শেষ তারিখ।
৪. \`ORDER BY order_count DESC, customer\`।

## কোডে দেখি
\`\`\`sql
SELECT cu.name AS customer, cu.city,
       COUNT(o.id) AS order_count,
       COALESCE(MAX(o.ordered_at), 'none') AS last_order
FROM customers cu
LEFT JOIN orders o
  ON o.customer_id = cu.id AND o.status IN ('paid','shipped')
GROUP BY cu.id
ORDER BY order_count DESC, customer;
\`\`\`

## সাধারণ ভুল
স্ট্যাটাস ফিল্টার \`WHERE\`-এ লিখে অর্ডার-নেই কাস্টমারকে পুরো তালিকা থেকে হারানো; \`COUNT(*)\` লিখে খালি গ্রুপেও ১ গোনা (NULL সারিও একটি সারি); \`MAX\`-এর NULL সামলাতে \`COALESCE\` না দেওয়া; টাই-এ ক্রম অনির্দিষ্ট রাখা।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    category: "SQL Basics",
    subcategory: "NULL & CASE",
    referencePython: "",
    referenceSql: `SELECT cu.name AS customer, cu.city, COUNT(o.id) AS order_count, COALESCE(MAX(o.ordered_at), 'none') AS last_order FROM customers cu LEFT JOIN orders o ON o.customer_id = cu.id AND o.status IN ('paid','shipped') GROUP BY cu.id ORDER BY order_count DESC, customer;`,
    tests: [
      {
        input: ``,
        expectedOutput: `Rahim	Dhaka	3	2026-10-20
Nusrat	Dhaka	2	2026-10-28
Karim	Chattogram	1	2026-10-25
Mim	Khulna	1	2026-10-22
Tanvir	Dhaka	1	2026-11-02
Sajid	Sylhet	0	none`,
        isSample: true
      },
      {
        input: `insert into orders (id,customer_id,ordered_at,status) values (11,4,'2026-11-06','paid'); insert into order_items (id,order_id,product_id,quantity,unit_price_cents) values (16,11,13,1,210000);`,
        expectedOutput: `Rahim	Dhaka	3	2026-10-20
Nusrat	Dhaka	2	2026-10-28
Karim	Chattogram	1	2026-10-25
Mim	Khulna	1	2026-10-22
Sajid	Sylhet	1	2026-11-06
Tanvir	Dhaka	1	2026-11-02`,
        isSample: true
      },
      {
        input: `update orders set status='cancelled' where id in (3,9);`,
        expectedOutput: `Rahim	Dhaka	3	2026-10-20
Karim	Chattogram	1	2026-10-25
Mim	Khulna	1	2026-10-22
Tanvir	Dhaka	1	2026-11-02
Nusrat	Dhaka	0	none
Sajid	Sylhet	0	none`,
        isSample: false
      },
      {
        input: `update orders set status='paid' where id=5;`,
        expectedOutput: `Rahim	Dhaka	3	2026-10-20
Nusrat	Dhaka	2	2026-10-28
Karim	Chattogram	1	2026-10-25
Mim	Khulna	1	2026-10-22
Sajid	Sylhet	1	2026-10-12
Tanvir	Dhaka	1	2026-11-02`,
        isSample: false
      },
      {
        input: `update orders set status='pending' where id in (1,4,6);`,
        expectedOutput: `Nusrat	Dhaka	2	2026-10-28
Karim	Chattogram	1	2026-10-25
Mim	Khulna	1	2026-10-22
Tanvir	Dhaka	1	2026-11-02
Rahim	Dhaka	0	none
Sajid	Sylhet	0	none`,
        isSample: false
      },
    ],
  },
];
