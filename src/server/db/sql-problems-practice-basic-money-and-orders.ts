import type { SeedProblem } from "./seed-problems";

export const SQL_PROBLEMS_PRACTICE_BASIC_MONEY_AND_ORDERS: SeedProblem[] = [
  {
    slug: "sql-practice-money-and-orders-easy",
    title: "Revenue by category",
    statement: `ক্যাটাগরি ম্যানেজাররা জানতে চায় তাদের তাদের ক্যাটাগরি কত টাকার বিক্রি করেছে। শুধু কার্যকর অর্ডার (\`paid\` বা \`shipped\`) ধরে প্রতি ক্যাটাগরির মোট বিক্রির টাকা (সেন্টে) বের করো — \`category\` ও \`revenue_cents\`; বেশি রেভিনিউ আগে, সমান হলে ক্যাটাগরির নাম অনুযায়ী।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`category\`, \`revenue_cents\` — রেভিনিউ নিচের ক্রমে, সমান হলে \`category\` অনুযায়ী।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## ধারণা
চেইনটা চার ধাপের: \`order_items\` → \`orders\` (স্ট্যাটাস ফিল্টার) → \`products\` → \`categories\`। প্রতি সারির টাকা \`quantity * unit_price_cents\`, আর গ্রুপ করতে হয় ক্যাটাগরির আইডিতে — শুধু নামে গ্রুপ করলে একই নামের দুই ক্যাটাগরি এক গ্রুপে মিশে যেতো। \`SUM\` গ্রুপের ভেতরের সব সারির যোগফল দেয়।

## ধাপে ধাপে
১. চার টেবিল JOIN করো।
২. \`WHERE o.status IN ('paid','shipped')\` — বাতিল/অপেক্ষমাণ অর্ডার বাদ।
৩. \`GROUP BY c.id\` করে \`SUM(oi.quantity * oi.unit_price_cents)\`।
৪. \`ORDER BY revenue_cents DESC, category\`।

## কোডে দেখি
\`\`\`sql
SELECT c.name AS category,
       SUM(oi.quantity * oi.unit_price_cents) AS revenue_cents
FROM order_items oi
JOIN orders o ON o.id = oi.order_id
JOIN products p ON p.id = oi.product_id
JOIN categories c ON c.id = p.category_id
WHERE o.status IN ('paid','shipped')
GROUP BY c.id
ORDER BY revenue_cents DESC, category;
\`\`\`

## সাধারণ ভুল
স্ট্যাটাস ফিল্টার ছাড়া cancelled অর্ডারের টাকাও গোনা; \`GROUP BY\`-তে শুধু নাম ধরে আইডি না ধরা; \`price_cents\`-এর বদলে স্টক বা রেটিং গুণে ফেলা; টাই-এ ক্রম অনির্দিষ্ট রেখে দেওয়া।`,
    difficulty: "EASY",
    points: 150,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    category: "SQL Basics",
    subcategory: "Aggregates",
    referencePython: "",
    referenceSql: `SELECT c.name AS category, SUM(oi.quantity * oi.unit_price_cents) AS revenue_cents FROM order_items oi JOIN orders o ON o.id = oi.order_id JOIN products p ON p.id = oi.product_id JOIN categories c ON c.id = p.category_id WHERE o.status IN ('paid','shipped') GROUP BY c.id ORDER BY revenue_cents DESC, category;`,
    tests: [
      {
        input: ``,
        expectedOutput: `Electronics	3340000
Men	860000
Home	540000
Books	465000
Fashion	240000`,
        isSample: true
      },
      {
        input: `update orders set status='cancelled' where id=3;`,
        expectedOutput: `Electronics	3340000
Home	540000
Books	465000
Men	380000
Fashion	120000`,
        isSample: true
      },
      {
        input: `update orders set status='cancelled' where id in (3,9);`,
        expectedOutput: `Electronics	3340000
Home	540000
Books	465000
Men	380000`,
        isSample: false
      },
      {
        input: `update order_items set unit_price_cents=unit_price_cents*2 where product_id=5;`,
        expectedOutput: `Electronics	3340000
Men	860000
Books	750000
Home	540000
Fashion	240000`,
        isSample: false
      },
      {
        input: `insert into orders (id,customer_id,ordered_at,status) values (11,4,'2026-11-06','paid'); insert into order_items (id,order_id,product_id,quantity,unit_price_cents) values (16,11,13,1,210000);`,
        expectedOutput: `Electronics	3340000
Men	860000
Home	540000
Books	465000
Fashion	240000
Fiction	210000`,
        isSample: false
      },
    ],
  },
  {
    slug: "sql-practice-money-and-orders-medium",
    title: "Average order value",
    statement: `সাপোর্ট টিম 'প্রিমিয়াম লাইন' চালু করবে — যে কাস্টমারের গড় অর্ডারের দাম বেশি, সে আগে সামলানো হবে। শুধু কার্যকর অর্ডার (\`paid\`/\`shipped\`) ধরে প্রতি কাস্টমারের অর্ডার সংখ্যা (\`orders\`), মোট খরচ (\`total_cents\`) আর গড় অর্ডারের দাম (\`avg_order_cents\`, পূর্ণসংখ্যায় round) বের করো; গড় বেশি থেকে কম, সমান হলে নাম অনুযায়ী।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`customer\`, \`orders\`, \`total_cents\`, \`avg_order_cents\` — গড় নিচের ক্রমে, সমান হলে \`customer\` অনুযায়ী।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## ধারণা
এক অর্ডারে একাধিক আইটেম থাকে, তাই \`order_items\` পর্যন্ত JOIN করলে একই অর্ডার একাধিক সারিতে ছড়ায় — এটাই join fan-out। অর্ডার গুনতে হয় \`COUNT(DISTINCT o.id)\`; \`COUNT(*)\` লিখলে আইটেমের সংখ্যা গোনা হয়। গড়ের ভাগে \`*1.0\` দিয়ে দশমিক নিশ্চিত করো, তারপর \`ROUND(...,0)\`-তে পূর্ণসংখ্যা।

## ধাপে ধাপে
১. \`customers\` + \`orders\` + \`order_items\` JOIN, \`paid/shipped\` ফিল্টার।
২. \`GROUP BY cu.id\`।
৩. \`COUNT(DISTINCT o.id)\` অর্ডার সংখ্যা, \`SUM(oi.quantity * oi.unit_price_cents)\` মোট।
৪. গড় = \`CAST(ROUND(মোট * 1.0 / অর্ডার, 0) AS INTEGER)\`; \`ORDER BY avg_order_cents DESC, customer\`।

## কোডে দেখি
\`\`\`sql
SELECT cu.name AS customer,
       COUNT(DISTINCT o.id) AS orders,
       SUM(oi.quantity * oi.unit_price_cents) AS total_cents,
       CAST(ROUND(SUM(oi.quantity * oi.unit_price_cents) * 1.0
            / COUNT(DISTINCT o.id), 0) AS INTEGER) AS avg_order_cents
FROM customers cu
JOIN orders o ON o.customer_id = cu.id
JOIN order_items oi ON oi.order_id = o.id
WHERE o.status IN ('paid','shipped')
GROUP BY cu.id
ORDER BY avg_order_cents DESC, customer;
\`\`\`

## সাধারণ ভুল
\`COUNT(*)\` লিখে আইটেম গুনে গড় ছোট করে ফেলা; ভাগে \`1.0\` না দিয়ে ইন্টিজার ভাগে দশমিক হারানো; কার্যকর-অর্ডার ফিল্টার ভুলে cancelled-ও গোনা; টাই-ব্রেকার ছাড়া সমান গড়ে অনির্দিষ্ট ক্রম।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    category: "SQL Basics",
    subcategory: "Aggregates",
    referencePython: "",
    referenceSql: `SELECT cu.name AS customer, COUNT(DISTINCT o.id) AS orders, SUM(oi.quantity * oi.unit_price_cents) AS total_cents, CAST(ROUND(SUM(oi.quantity * oi.unit_price_cents) * 1.0 / COUNT(DISTINCT o.id), 0) AS INTEGER) AS avg_order_cents FROM customers cu JOIN orders o ON o.customer_id = cu.id JOIN order_items oi ON oi.order_id = o.id WHERE o.status IN ('paid','shipped') GROUP BY cu.id ORDER BY avg_order_cents DESC, customer;`,
    tests: [
      {
        input: ``,
        expectedOutput: `Rahim	3	3495000	1165000
Mim	1	670000	670000
Tanvir	1	380000	380000
Nusrat	2	720000	360000
Karim	1	180000	180000`,
        isSample: true
      },
      {
        input: `insert into orders (id,customer_id,ordered_at,status) values (11,3,'2026-11-06','paid'); insert into order_items (id,order_id,product_id,quantity,unit_price_cents) values (16,11,5,1,95000);`,
        expectedOutput: `Rahim	3	3495000	1165000
Mim	1	670000	670000
Tanvir	1	380000	380000
Nusrat	3	815000	271667
Karim	1	180000	180000`,
        isSample: true
      },
      {
        input: `update orders set status='cancelled' where id=8;`,
        expectedOutput: `Rahim	3	3495000	1165000
Mim	1	670000	670000
Tanvir	1	380000	380000
Nusrat	2	720000	360000`,
        isSample: false
      },
      {
        input: `update order_items set quantity=2 where id=11;`,
        expectedOutput: `Rahim	3	3495000	1165000
Mim	1	1120000	1120000
Tanvir	1	380000	380000
Nusrat	2	720000	360000
Karim	1	180000	180000`,
        isSample: false
      },
      {
        input: `update orders set status='pending' where id in (1,4);`,
        expectedOutput: `Mim	1	670000	670000
Rahim	1	605000	605000
Tanvir	1	380000	380000
Nusrat	2	720000	360000
Karim	1	180000	180000`,
        isSample: false
      },
    ],
  },
];
