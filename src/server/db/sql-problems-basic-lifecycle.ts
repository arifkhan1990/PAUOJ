import type { SeedProblem } from "./seed-problems";

export const SQL_PROBLEMS_BASIC_LIFECYCLE: SeedProblem[] = [
  {
    slug: "sql-orders-without-payment",
    title: "Orders without a paid payment",
    statement: `ফাইন্যান্স টিম প্রতি সন্ধ্যায় reconciliation চালায় — প্রতিটি অর্ডারের টাকা কি সফলভাবে এসেছে? বাস্তবে একটি অর্ডারে \`payments\` টেবিলে একাধিক রেকর্ড থাকতে পারে: bKash চেষ্টা ব্যর্থ হলে \`failed\`, COD বকেয়া থাকলে \`pending\`, রিফান্ড হলে \`refunded\`, আর সফল হলে \`paid\`। এমন অর্ডার বের করো যার **কোনো** \`paid\` পেমেন্ট নেই; \`order_id\`, কাস্টমারের নাম (\`customer\`) ও অর্ডারের \`status\` দাও, অর্ডার আইডি অনুযায়ী সাজাও।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`order_id\`, \`customer\`, \`status\` — অর্ডার আইডি অনুযায়ী সাজানো।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## কেন দরকার
অর্ডার হলেই টাকা আসে না — পেমেন্ট ব্যর্থ হয়, COD বকেয়া থাকে, কার্ডের টাকা রিফান্ড হয়ে যায়। ফাইন্যান্সের reconciliation রিপোর্ট খোঁজে সেই অর্ডারগুলো যার একটিও সফল (\`paid\`) পেমেন্ট নেই — এগুলোই আসল বকেয়া। এটা missing-match প্রশ্ন: অর্ডার আছে, কিন্তু নির্দিষ্ট শর্তের জোড়া নেই।

## মূল ধারণা
এক অর্ডারে একাধিক পেমেন্ট রেকর্ড থাকতে পারে, তাই \`NOT EXISTS\` দিয়ে ভেতরের সাবকোয়েরিতে জিজ্ঞেস করি: এই অর্ডারের কোনো \`paid\` রেকর্ড আছে কি? শর্তটা (\`p.status = 'paid'\`) ভেতরেই বসাতে হবে। \`LEFT JOIN payments ... WHERE p.id IS NULL\` দিয়েও একই ফল পাওয়া যায় — তবে সেখানেও জয়েনের ON-এ স্ট্যাটাস শর্ত থাকতে হবে।

## ধাপে ধাপে
১. \`orders\` + \`customers\` JOIN করে নাম আনো।
২. \`WHERE NOT EXISTS (...)\` দাও।
৩. ভেতরে \`p.order_id = o.id AND p.status = 'paid'\` — সংযোগ আর স্ট্যাটাস দুটোই।
৪. \`ORDER BY o.id\`।

## কোডে দেখি
\`\`\`sql
SELECT o.id AS order_id, c.name AS customer, o.status
FROM orders o
JOIN customers c ON c.id = o.customer_id
WHERE NOT EXISTS (
  SELECT 1 FROM payments p
  WHERE p.order_id = o.id AND p.status = 'paid'
)
ORDER BY o.id;
\`\`\`

## কমপ্লেক্সিটি
প্রতি অর্ডারে একবার পেমেন্ট টেবিলে খোঁজা — নমিনাল \`O(n·m)\`, \`order_id\` ইনডেক্স থাকলে কার্যত লিনিয়ার।

## সাধারণ ভুল
\`p.status != 'paid'\` লেখা — অর্ডার ১-এ \`paid\` ও \`refunded\` দুটোই আছে, \`!=\` তাকে ভুল তালিকায় তুলে নিতো; ভেতরের সাবকোয়েরিতে \`p.order_id = o.id\` মিলিয়ে না দিলে সব পেমেন্ট একসাথে গোনা; \`LEFT JOIN\` করে \`WHERE p.status = 'paid'\` বাইরে লিখলে LEFT JOIN-এর মানেই হারিয়ে যায় — শর্ত ভেতরে না গেলে IS NULL প্যাটার্ন ব্যবহার করো।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    category: "SQL Basics",
    subcategory: "Order lifecycle",
    referencePython: "",
    referenceSql: `SELECT o.id AS order_id, c.name AS customer, o.status FROM orders o JOIN customers c ON c.id = o.customer_id WHERE NOT EXISTS (SELECT 1 FROM payments p WHERE p.order_id = o.id AND p.status = 'paid') ORDER BY o.id;`,
    tests: [
      {
        input: ``,
        expectedOutput: `2	Karim	pending
5	Sajid	cancelled`,
        isSample: true
      },
      {
        input: `update payments set status='paid', paid_at='2026-10-03 11:00' where id=2;`,
        expectedOutput: `5	Sajid	cancelled`,
        isSample: true
      },
      {
        input: `update payments set status='failed' where id in (1,4);`,
        expectedOutput: `1	Rahim	paid
2	Karim	pending
4	Rahim	paid
5	Sajid	cancelled`,
        isSample: false
      },
      {
        input: `insert into payments (id,order_id,method,amount_cents,status,paid_at,transaction_ref) values (12,5,'bkash',170000,'paid','2026-11-03 10:00','BK1701');`,
        expectedOutput: `2	Karim	pending`,
        isSample: false
      },
      {
        input: `update payments set status='refunded' where id=6;`,
        expectedOutput: `2	Karim	pending
5	Sajid	cancelled
6	Rahim	paid`,
        isSample: false
      },
    ],
  },
  {
    slug: "sql-return-rate-by-vendor",
    title: "Return rate by vendor",
    statement: `মার্কেটপ্লেস অপস টিম মাস শেষে র‍্যাংক করে কোন ভেন্ডরের প্রোডাক্ট সবচেয়ে বেশি ফেরত আসছে — বেশি রিটার্ন মানে হয় মান খারাপ, নয় বর্ণনায় ভুল। শুধু কার্যকর অর্ডার (\`paid\` বা \`shipped\`) ধরে প্রতি ভেন্ডরের জন্য বের করো: approved রিটার্নের সংখ্যা (\`returns\`), বিক্রি হওয়া অর্ডার-আইটেমের সংখ্যা (\`items\`) আর রিটার্নের হার শতাংশে (\`return_rate_pct\`, এক দশমিক ঘর)। আগে বেশি হার, সমান হলে ভেন্ডরের নাম অনুযায়ী। (যে ভেন্ডরের কার্যকর অর্ডারে অন্তত একটি আইটেম আছে, শুধু সে-ই তালিকায় আসবে।)`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`vendor\`, \`returns\`, \`items\`, \`return_rate_pct\` — হার কমানো ক্রমে, সমান হারে \`vendor\` (নাম) অনুযায়ী।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## কেন দরকার
মার্কেটপ্লেসে রিটার্ন খরচ গুনে দেয় — রিফান্ড, রিভার্স লজিস্টিক, আর ক্রেতার আস্থা। অপস টিম দেখতে চায় কোন ভেন্ডরের approved রিটার্নের হার বেশি। হার বের করতে দুই সংখ্যা লাগে — কতটি রিটার্ন approved হলো, আর মোট কতটি আইটেম কার্যকর অর্ডারে বিক্রি হলো। দুই সংখ্যাই আলাদা টেবিল-চেইনে বসে আছে: returns → order_items → orders → products → vendors।

## মূল ধারণা
দুই রকম গণনার ভিত্তি আলাদা, তাই দুইটি CTE। \`sold\`: order_items → orders → products চেইনে \`paid/shipped\` অর্ডারের আইটেম গুনো — cancelled অর্ডারের আইটেম এখানে ঢুকবে না। \`approved\`: returns → order_items → orders চেইনে approved রিটার্ন গুনো — অর্ডার cancelled হয়ে থাকলে তার রিটার্নও গোনা যাবে না। তারপর দুই CTE vendors-এর সাথে জোড়া দাও; \`approved\` দিকে LEFT JOIN, কারণ রিটার্ন-নেই ভেন্ডরও রিপোর্টে থাকবে — \`COALESCE(a.returns, 0)\` দিয়ে NULL সামলাও। ভাগ \`100.0\` দিয়ে করো (ইন্টিজার ভাগে 0 আসে), \`ROUND(..., 1)\`-এ এক দশমিক।

## ধাপে ধাপে
১. \`sold\` CTE: কার্যকর অর্ডারের প্রতি ভেন্ডরে আইটেম গুনো।
২. \`approved\` CTE: একই অর্ডার-ফিল্টার ধরে approved রিটার্ন গুনো।
৩. দুই CTE vendors-এর সাথে জোড়া দাও (\`approved\` দিকে LEFT JOIN + COALESCE)।
৪. \`ROUND(returns * 100.0 / items, 1)\` হার বানাও।
৫. \`ORDER BY return_rate_pct DESC, vendor\` — টাই-ব্রেকার সহ।

## কোডে দেখি
\`\`\`sql
WITH sold AS (
  SELECT p.vendor_id, COUNT(*) AS items
  FROM order_items oi
  JOIN orders o ON o.id = oi.order_id
  JOIN products p ON p.id = oi.product_id
  WHERE o.status IN ('paid','shipped')
  GROUP BY p.vendor_id
),
approved AS (
  SELECT p.vendor_id, COUNT(*) AS returns
  FROM returns r
  JOIN order_items oi ON oi.id = r.order_item_id
  JOIN orders o ON o.id = oi.order_id
  JOIN products p ON p.id = oi.product_id
  WHERE r.status = 'approved' AND o.status IN ('paid','shipped')
  GROUP BY p.vendor_id
)
SELECT v.name AS vendor,
       COALESCE(a.returns, 0) AS returns,
       s.items AS items,
       ROUND(COALESCE(a.returns, 0) * 100.0 / s.items, 1) AS return_rate_pct
FROM vendors v
JOIN sold s ON s.vendor_id = v.id
LEFT JOIN approved a ON a.vendor_id = v.id
ORDER BY return_rate_pct DESC, v.name;
\`\`\`

## কমপ্লেক্সিটি
প্রতিটি CTE নিজের চেইন একবার পড়ে — মোট \`O(n)\` স্ক্যান, গ্রুপিং ও সাজানো \`O(v log v)\` (v = ভেন্ডর সংখ্যা)।

## সাধারণ ভুল
pending বা cancelled অর্ডারের আইটেমও গুনে হার ছোট করে ফেলা; \`rejected\`/\`pending\` রিটার্নও গুনে হার বাড়িয়ে ফেলা; \`100\` দিয়ে গুণ করে ইন্টিজার ভাগে সব হার 0 আসা; COALESCE ছাড়া রিটার্ন-নেই ভেন্ডরের হার NULL হয়ে তালিকা থেকে ঝরে পড়া।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    category: "SQL Basics",
    subcategory: "Order lifecycle",
    referencePython: "",
    referenceSql: `WITH sold AS (SELECT p.vendor_id, COUNT(*) AS items FROM order_items oi JOIN orders o ON o.id = oi.order_id JOIN products p ON p.id = oi.product_id WHERE o.status IN ('paid','shipped') GROUP BY p.vendor_id), approved AS (SELECT p.vendor_id, COUNT(*) AS returns FROM returns r JOIN order_items oi ON oi.id = r.order_item_id JOIN orders o ON o.id = oi.order_id JOIN products p ON p.id = oi.product_id WHERE r.status = 'approved' AND o.status IN ('paid','shipped') GROUP BY p.vendor_id) SELECT v.name AS vendor, COALESCE(a.returns, 0) AS returns, s.items AS items, ROUND(COALESCE(a.returns, 0) * 100.0 / s.items, 1) AS return_rate_pct FROM vendors v JOIN sold s ON s.vendor_id = v.id LEFT JOIN approved a ON a.vendor_id = v.id ORDER BY return_rate_pct DESC, v.name;`,
    tests: [
      {
        input: ``,
        expectedOutput: `HomeCraft	1	2	50.0
TechNest	1	4	25.0
BookBazar	0	2	0.0
GadgetPoint	0	1	0.0
StyleHub	0	4	0.0`,
        isSample: true
      },
      {
        input: `update returns set status='approved' where id=4;`,
        expectedOutput: `GadgetPoint	1	1	100.0
HomeCraft	1	2	50.0
TechNest	1	4	25.0
BookBazar	0	2	0.0
StyleHub	0	4	0.0`,
        isSample: true
      },
      {
        input: `update returns set status='rejected' where id=1;`,
        expectedOutput: `HomeCraft	1	2	50.0
BookBazar	0	2	0.0
GadgetPoint	0	1	0.0
StyleHub	0	4	0.0
TechNest	0	4	0.0`,
        isSample: false
      },
      {
        input: `update orders set status='cancelled' where id=6;`,
        expectedOutput: `TechNest	1	4	25.0
BookBazar	0	1	0.0
GadgetPoint	0	1	0.0
HomeCraft	0	1	0.0
StyleHub	0	4	0.0`,
        isSample: false
      },
      {
        input: `insert into returns (id,order_item_id,quantity,reason,refund_cents,status,requested_at) values (5,6,1,'damaged',1850000,'approved','2026-11-05');`,
        expectedOutput: `HomeCraft	1	2	50.0
TechNest	2	4	50.0
BookBazar	0	2	0.0
GadgetPoint	0	1	0.0
StyleHub	0	4	0.0`,
        isSample: false
      },
    ],
  },
];
