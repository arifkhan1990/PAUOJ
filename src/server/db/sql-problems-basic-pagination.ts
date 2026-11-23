import type { SeedProblem } from "./seed-problems";

export const SQL_PROBLEMS_BASIC_PAGINATION: SeedProblem[] = [
  {
    slug: "sql-top-products-page",
    title: "Top products, page two",
    statement: `মার্কেটিং ড্যাশবোর্ডে 'টপ প্রোডাক্ট' তালিকা প্রতি পেজে ঠিক ৫টি করে দেখায় — প্রথম পেজে শীর্ষ ৫, দ্বিতীয় পেজে তার পরের ৫। কার্যকর (\`paid\` বা \`shipped\`) অর্ডারের আইটেম থেকে প্রতি প্রোডাক্টের মোট আয় হিসাব করো (\`quantity × unit_price_cents\`), আয়ের কমানো ক্রমে পূর্ণ তালিকা সাজাও — তারপর **দ্বিতীয় পেজের** ৫টি প্রোডাক্ট দেখাও: \`product\`, \`revenue_cents\`। সমান আয়ের প্রোডাক্ট নাম অনুযায়ী সাজাবে — নইলে ৫ম-৬ষ্ঠ স্থানের সীমানায় কে থাকবে তা অনির্দিষ্ট হয়ে যায়।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`product\`, \`revenue_cents\` — আয়ের কমানো ক্রমে, সমান আয়ে \`product\` (নাম) অনুযায়ী।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## কেন দরকার
ড্যাশবোর্ডে হাজার সারি এক নিগেড়ে দেখালে কেউ পড়ে না — তাই তালিকা ভাগ হয় পেজে। 'টপ প্রোডাক্ট' রিপোর্টে প্রথম পেজে সেরা ৫টি, দ্বিতীয় পেজে পরের ৫টি। পেজিনেশন মানে দুই কাজ একসাথে: পূর্ণ তালিকা **সাজানো**, তারপর তার একটা **স্লাইস** দেখানো।

## মূল ধারণা
\`LIMIT 5 OFFSET 5\` মানে: সাজানো তালিকার শুরু থেকে ৫টি সারি লাফিয়ে পার হও, পরের ৫টি দেখাও। পেজ k-এর সূত্র \`LIMIT size OFFSET (k-1)×size\` — এখানে পেজ ২, সাইজ ৫। দুইটা জিনিস খেয়াল রাখতে হয়। প্রথমত, LIMIT কাটবেই সাজানো তালিকার উপরে — ORDER BY deterministic না হলে সীমানার সারি এলোমেলো: সমান আয়ের দুই প্রোডাক্ট ৫ম-৬ষ্ঠ স্থানে হেরফের খায়, তাই \`ORDER BY revenue_cents DESC, product\` — নামই ঠিক করে দেয় কে ৫ম। দ্বিতীয়ত, OFFSET আসলে আগের সারিগুলো হিসাব করেই ফেলে দেয় — গভীর পেজে বৃথা কাজ বাড়ে; বড় সিস্টেমে তাই keyset (seek) pagination: আগের পেজের শেষ সারির মান ধরে \`WHERE (revenue_cents, product) < (শেষ আয়, শেষ নাম) ORDER BY revenue_cents DESC, product LIMIT 5\` — লাফ নেই, নতুন অর্ডার ঢুকলেও পেজের জায়গা সরে না। আর হিসাবে শুধু কার্যকর অর্ডার — pending/cancelled অর্ডারের আয় রিপোর্টে গোনা যায় না।

## ধাপে ধাপে
১. \`order_items\` + \`orders\` + \`products\` জোড়া দাও, \`WHERE o.status IN ('paid','shipped')\`।
২. \`GROUP BY p.id, p.name\` করে \`SUM(quantity * unit_price_cents)\` আয় বানাও।
৩. \`ORDER BY revenue_cents DESC, product\` — টাই-ব্রেকারসহ।
৪. শেষে \`LIMIT 5 OFFSET 5\` — পেজ ২।

## কোডে দেখি
\`\`\`sql
SELECT p.name AS product,
       SUM(oi.quantity * oi.unit_price_cents) AS revenue_cents
FROM order_items oi
JOIN orders o ON o.id = oi.order_id
JOIN products p ON p.id = oi.product_id
WHERE o.status IN ('paid','shipped')
GROUP BY p.id, p.name
ORDER BY revenue_cents DESC, product
LIMIT 5 OFFSET 5;
\`\`\`

## কমপ্লেক্সিটি
গ্রুপিং \`O(n)\` (n = কার্যকর আইটেম), সাজানো \`O(p log p)\` (p = প্রোডাক্ট); OFFSET প্রথম সারিগুলো আগেই হিসাব করে ফেলে — গভীর পেজে keyset সস্তা।

## সাধারণ ভুল
\`OFFSET\` ভুলে প্রথম পেজ (\`LIMIT 5\`) দেখানো; পেজ ২ মানে \`LIMIT 10\` লিখে ১০টি সারি দেখানো — লাফ দিতে হয়, নেওয়া নয়; টাই-ব্রেকার ছাড়া ORDER BY দিয়ে সীমানার সারি অনির্দিষ্ট করা; pending/cancelled অর্ডারের আয়ও গুনে ফেলা; \`quantity\` না গুণিয়ে শুধু \`unit_price_cents\` যোগ করা।`,
    difficulty: "MEDIUM",
    points: 175,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    category: "SQL Basics",
    subcategory: "Pagination",
    referencePython: "",
    referenceSql: `SELECT p.name AS product, SUM(oi.quantity * oi.unit_price_cents) AS revenue_cents FROM order_items oi JOIN orders o ON o.id = oi.order_id JOIN products p ON p.id = oi.product_id WHERE o.status IN ('paid','shipped') GROUP BY p.id, p.name ORDER BY revenue_cents DESC, product LIMIT 5 OFFSET 5;`,
    tests: [
      {
        input: ``,
        expectedOutput: `Clay Dinner Set	320000
SQL Handbook	285000
Leather Wallet	240000
Table Lamp	220000
Clean Code	180000`,
        isSample: true
      },
      {
        input: `update orders set status='paid' where id=2;`,
        expectedOutput: `Clean Code	360000
Clay Dinner Set	320000
SQL Handbook	285000
Leather Wallet	240000
Table Lamp	220000`,
        isSample: true
      },
      {
        input: `update order_items set quantity=2 where id=14;`,
        expectedOutput: `Leather Wallet	360000
Clay Dinner Set	320000
SQL Handbook	285000
Table Lamp	220000
Clean Code	180000`,
        isSample: false
      },
      {
        input: `update order_items set unit_price_cents=200000 where id=9;`,
        expectedOutput: `Denim Jacket	380000
Clay Dinner Set	320000
Leather Wallet	240000
Table Lamp	220000
Clean Code	180000`,
        isSample: false
      },
      {
        input: `insert into orders (id,customer_id,ordered_at,status) values (11,6,'2026-11-10','paid'); insert into order_items (id,order_id,product_id,quantity,unit_price_cents) values (16,11,13,2,210000),(17,11,8,1,85000);`,
        expectedOutput: `Denim Jacket	380000
Clay Dinner Set	320000
SQL Handbook	285000
Leather Wallet	240000
Table Lamp	220000`,
        isSample: false
      },
    ],
  },
  {
    slug: "sql-latest-order-per-customer",
    title: "Latest order per customer",
    statement: `কাস্টমার সাপোর্টের ফলোআপ ড্যাশবোর্ড প্রতি কাস্টমারের **সর্বশেষ কার্যকর অর্ডার** দেখায় — কল শুরু হয় সেখান থেকেই, কারণ পুরনো অর্ডার নিয়ে কথা বলা আর সাম্প্রতিকটা নিয়ে বলা এক ব্যাপার নয়। প্রতি কাস্টমারের সবচেয়ে নতুন \`paid\`/\`shipped\` অর্ডার বের করো: কাস্টমারের নাম (\`customer\`), \`order_id\`, \`ordered_at\`। window function এখনো আমাদের টুলবক্সে নেই — correlated subquery-তে \`MAX\` দিয়ে করো; একই কাস্টমারের সর্বোচ্চ তারিখে একাধিক অর্ডার থাকলে **বড় \`id\`**-এর অর্ডারটা নাও। কার্যকর অর্ডার একটাও নেই এমন কাস্টমার তালিকায় আসবে না। নাম অনুযায়ী, সমান হলে \`order_id\` অনুযায়ী সাজাও।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`customer\`, \`order_id\`, \`ordered_at\` — নাম অনুযায়ী, সমান হলে \`order_id\` অনুযায়ী।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## কেন দরকার
'প্রতি গ্রুপের সেরা একটি সারি' — top-N-per-group — ডেটা অ্যানালিসিসের সবচেয়ে বহুল প্যাটার্নগুলোর একটি: প্রতি কাস্টমারের শেষ অর্ডার, প্রতি ভেন্ডরের সেরা প্রোডাক্ট, প্রতি শহরের সর্বোচ্চ রেটিং। এখানে গ্রুপ হলো কাস্টমার, আর 'সেরা' মানে সবচেয়ে নতুন তারিখ।

## মূল ধারণা
প্যাটার্নটা দুই স্তরের: বাইরের query-তে প্রতিটি ক্যান্ডিডেট সারি, ভেতরের correlated subquery বলে দেয় 'তোমার গ্রুপের সর্বোচ্চটা কত'। প্রথম স্তর: \`o2.ordered_at = (SELECT MAX(o3.ordered_at) ...)\` — কিন্তু শুধু তারিখ মিলালে টাই থাকলে একই কাস্টমারের একাধিক সারি উঠে আসতে পারে। তাই দ্বিতীয় স্তর: সর্বোচ্চ তারিখের ভেতর থেকে \`MAX(o2.id)\` — বড় আইডিরটাই বেঁচে থাকলে প্রতি কাস্টমার ঠিক একটি সারি। খেয়াল রাখো — স্ট্যাটাস শর্ত (\`paid\`/\`shipped\`) বাইরের query আর ভেতরের subquery **দুই জায়গাতেই** লাগবে: ভেতরে না দিলে একটি pending অর্ডারের নতুন তারিখ সর্বোচ্চ গোনা হবে, বাইরে না দিলে সেই pending অর্ডারটাই দেখাবে।

## ধাপে ধাপে
১. \`customers\` + \`orders\` জোড়া দাও, বাইরেই \`status IN ('paid','shipped')\`।
২. ভেতরের subquery-তে একই কাস্টমারের কার্যকর অর্ডারের \`MAX(ordered_at)\` মেলাও।
৩. টাই ভাঙতে সর্বোচ্চ তারিখের ভেতরে \`MAX(o2.id)\`।
৪. কার্যকর অর্ডার-নেই কাস্টমার JOIN-এই বাদ পড়বে।
৫. \`ORDER BY customer, order_id\`।

## কোডে দেখি
\`\`\`sql
SELECT c.name AS customer, o.id AS order_id, o.ordered_at
FROM customers c
JOIN orders o ON o.customer_id = c.id
WHERE o.status IN ('paid','shipped')
  AND o.id = (
    SELECT MAX(o2.id)
    FROM orders o2
    WHERE o2.customer_id = o.customer_id
      AND o2.status IN ('paid','shipped')
      AND o2.ordered_at = (
        SELECT MAX(o3.ordered_at)
        FROM orders o3
        WHERE o3.customer_id = o2.customer_id
          AND o3.status IN ('paid','shipped')
      )
  )
ORDER BY c.name, o.id;
\`\`\`

## কমপ্লেক্সিটি
প্রতি কার্যকর অর্ডারে ভেতরে দুইবার খোঁজা — নমিনাল \`O(n²)\`, \`customer_id\` ইনডেক্সে কার্যত লিনিয়ার; window function (\`ROW_NUMBER\`) বড় টেবিলে সস্তা — সেটা advanced মডিউলের ব্যাপার।

## সাধারণ ভুল
ভেতরের subquery-তে স্ট্যাটাস ফিল্টার ভুলে যাওয়া — pending অর্ডারের তারিখ সর্বোচ্চ হলে কাস্টমার তালিকা থেকেই ঝরে যায়; শুধু \`MAX(ordered_at)\` মিলিয়ে টাই-এ একই কাস্টমারের একাধিক সারি; \`MAX(o.id)\`-কেই 'সর্বশেষ' ভেবে তারিখ একেবারে উপেক্ষা — আইডি বড় মানে সবসময় নতুন তারিখ নয়; \`GROUP BY\` করে \`MAX(ordered_at)\` নেওয়া — গ্রুপে না-থাকা কলামের (\`order_id\`) মান SQLite-তে অনির্দিষ্ট থেকে যায়।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    category: "SQL Basics",
    subcategory: "Pagination",
    referencePython: "",
    referenceSql: `SELECT c.name AS customer, o.id AS order_id, o.ordered_at FROM customers c JOIN orders o ON o.customer_id = c.id WHERE o.status IN ('paid','shipped') AND o.id = (SELECT MAX(o2.id) FROM orders o2 WHERE o2.customer_id = o.customer_id AND o2.status IN ('paid','shipped') AND o2.ordered_at = (SELECT MAX(o3.ordered_at) FROM orders o3 WHERE o3.customer_id = o2.customer_id AND o3.status IN ('paid','shipped'))) ORDER BY c.name, o.id;`,
    tests: [
      {
        input: ``,
        expectedOutput: `Karim	8	2026-10-25
Mim	7	2026-10-22
Nusrat	9	2026-10-28
Rahim	6	2026-10-20
Tanvir	10	2026-11-02`,
        isSample: true
      },
      {
        input: `update orders set status='paid', ordered_at='2026-11-15' where id=2;`,
        expectedOutput: `Karim	2	2026-11-15
Mim	7	2026-10-22
Nusrat	9	2026-10-28
Rahim	6	2026-10-20
Tanvir	10	2026-11-02`,
        isSample: true
      },
      {
        input: `update orders set status='paid' where id=5;`,
        expectedOutput: `Karim	8	2026-10-25
Mim	7	2026-10-22
Nusrat	9	2026-10-28
Rahim	6	2026-10-20
Sajid	5	2026-10-12
Tanvir	10	2026-11-02`,
        isSample: false
      },
      {
        input: `insert into orders (id,customer_id,ordered_at,status) values (11,1,'2026-10-20','paid');`,
        expectedOutput: `Karim	8	2026-10-25
Mim	7	2026-10-22
Nusrat	9	2026-10-28
Rahim	11	2026-10-20
Tanvir	10	2026-11-02`,
        isSample: false
      },
      {
        input: `update orders set status='cancelled' where id=10;`,
        expectedOutput: `Karim	8	2026-10-25
Mim	7	2026-10-22
Nusrat	9	2026-10-28
Rahim	6	2026-10-20`,
        isSample: false
      },
    ],
  },
];
