import type { SeedProblem } from "./seed-problems";

export const SQL_PROBLEMS_ADVANCED_PIVOT: SeedProblem[] = [
  {
    slug: "sql-adv-vendor-month-pivot",
    title: "Vendor monthly revenue pivot",
    statement: `ফাইন্যান্স টিমের মাসিক ভেন্ডর রিপোর্ট এক সারিতে সব মাস চায়। paid/shipped অর্ডার থেকে প্রতিটি ভেন্ডরের অক্টোবর 2026 (মাস 2026-10) আর নভেম্বর 2026 (মাস 2026-11) এর রেভিনিউ (সেন্টে) বের করো, আর সেই দুই মাসের মোটও—প্রতিটি ভেন্ডরের জন্য একটি সারিতে: oct_cents, nov_cents, total_cents। বিক্রি না থাকা ভেন্ডরের মান 0 হবে, কেউ তালিকা থেকে বাদ যাবে না। শর্তসাপেক্ষ যোগফল (conditional aggregation: SUM + CASE) ব্যবহার করো। মোট (বেশি থেকে কম), টাই হলে ভেন্ডরের নাম অনুযায়ী সাজাও।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`vendor\`, \`oct_cents\`, \`nov_cents\`, \`total_cents\`।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## কেন দরকার
তালিকাভিত্তিক (long) ডেটা জমাতে সহজ, পড়তে কঠিন: 'ভেন্ডর X-এর অক্টোবরে বিক্রি কত?' উত্তর খুঁজতে হয় সারির ভিড়ে। এজন্যই রিপোর্ট সবসময় crosstab আকারে চায়—ভেন্ডর এক কলামে, মাসগুলো পাশাপাশি কলামে। SQL-এ এই pivot করার মানক কৌশল conditional aggregation: একই GROUP BY-র ভেতরে প্রতিটি আউটপুট কলামের জন্য একটা SUM(CASE WHEN ...) বসাও। PostgreSQL-এ এজন্য আলাদা crosstab ফাংশন আছে, Excel-এর pivot টেবিলও একই কাজ করে—পার্থক্য শুধু হাতিয়ারে।

## মূল ধারণা
প্রতিটি আউটপুট কলাম একটা শর্ত: \`SUM(CASE WHEN month='2026-10' THEN cents ELSE 0 END)\` শুধু অক্টোবরের সারি যোগ করে, বাকিগুলো 0 হিসেবে পড়ে—একবার GROUP BY vendor চালালেই সব মাসের কলাম একসাথে বেরিয়ে আসে। মাস বানাও \`substr(ordered_at,1,7)\` দিয়ে (YYYY-MM)। দুটো নজর: (১) বিক্রি নেই এমন ভেন্ডর রাখতে vendors-কে বাইরে রেখে LEFT JOIN করো, নাহলে INNER JOIN তাদের বাদ ফেলে দেবে; (২) LEFT JOIN হলে ফাঁকা মান NULL আসে, COALESCE(...,0) দিয়ে শূন্য বানাও—নাহলে সেই ভেন্ডরের মোটও NULL হয়ে যায়।

## ধাপে ধাপে
১. CTE vendor_sales: orders ⋈ order_items ⋈ products, paid/shipped ফিল্টার, প্রতি সারিতে vendor_id, month, cents।
২. vendors LEFT JOIN vendor_sales—সব ভেন্ডর তালিকায় থাকবে।
৩. প্রতিটি মাসের কলামে SUM(CASE WHEN month=... THEN cents ELSE 0 END), COALESCE দিয়ে শূন্য-ভরাট।
৪. \`ORDER BY total_cents DESC, vendor\` দিয়ে সাজাও।

## কোডে দেখি
\`\`\`sql
WITH vendor_sales AS (
  SELECT p.vendor_id AS vendor_id, substr(o.ordered_at, 1, 7) AS month,
         oi.quantity * oi.unit_price_cents AS cents
  FROM orders o
  JOIN order_items oi ON oi.order_id = o.id
  JOIN products p ON p.id = oi.product_id
  WHERE o.status IN ('paid', 'shipped')
)
SELECT v.name AS vendor,
       COALESCE(SUM(CASE WHEN vs.month = '2026-10' THEN vs.cents ELSE 0 END), 0) AS oct_cents,
       COALESCE(SUM(CASE WHEN vs.month = '2026-11' THEN vs.cents ELSE 0 END), 0) AS nov_cents,
       COALESCE(SUM(vs.cents), 0) AS total_cents
FROM vendors v
LEFT JOIN vendor_sales vs ON vs.vendor_id = v.id
GROUP BY v.id
ORDER BY total_cents DESC, vendor;
\`\`\`

## কমপ্লেক্সিটি
JOIN ও group-এ O(n), প্রতিটি সারিতে CASE ধ্রুব। মাস যত বাড়ুক স্ক্যান বাড়ে না—শুধু কলাম বাড়ে। UNION ALL দিয়ে প্রতি মাসে আলাদা query চালানোর তুলনায় এখানে একটাই স্ক্যান।

## সাধারণ ভুল
INNER JOIN করে বিক্রি-নেই ভেন্ডর হারানো; COALESCE ছাড়া NULL রিপোর্টে পাঠানো; GROUP BY-তে month-ও রেখে pivot নষ্ট করা—মাস তখন সারিতে নেমে আসে; status ফিল্টার ভুলে cancelled অর্ডারের টাকাও গোনা; ORDER BY-তে vendor টাই-ব্রেক না দেওয়া।`,
    difficulty: "HARD",
    points: 350,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    premiumModuleSlug: "advanced-sql",
    category: "SQL Advanced",
    subcategory: "Pivot & grouping",
    referencePython: "",
    referenceSql: `WITH vendor_sales AS (
  SELECT p.vendor_id AS vendor_id, substr(o.ordered_at,1,7) AS month,
         oi.quantity*oi.unit_price_cents AS cents
  FROM orders o JOIN order_items oi ON oi.order_id=o.id
  JOIN products p ON p.id=oi.product_id
  WHERE o.status IN ('paid','shipped')
)
SELECT v.name AS vendor,
       COALESCE(SUM(CASE WHEN vs.month='2026-10' THEN vs.cents ELSE 0 END),0) AS oct_cents,
       COALESCE(SUM(CASE WHEN vs.month='2026-11' THEN vs.cents ELSE 0 END),0) AS nov_cents,
       COALESCE(SUM(vs.cents),0) AS total_cents
FROM vendors v LEFT JOIN vendor_sales vs ON vs.vendor_id=v.id
GROUP BY v.id ORDER BY total_cents DESC, vendor;`,
    tests: [
      {
        input: ``,
        expectedOutput: `TechNest	3190000	0	3190000
StyleHub	720000	380000	1100000
HomeCraft	540000	0	540000
BookBazar	465000	0	465000
GadgetPoint	150000	0	150000
PaperTrail	0	0	0`,
        isSample: true
      },
      {
        input: `update orders set status='shipped' where id=2;`,
        expectedOutput: `TechNest	3190000	0	3190000
StyleHub	720000	380000	1100000
BookBazar	645000	0	645000
HomeCraft	540000	0	540000
GadgetPoint	150000	0	150000
PaperTrail	0	0	0`,
        isSample: true
      },
      {
        input: `update orders set ordered_at='2026-11-03' where id=6;`,
        expectedOutput: `TechNest	3190000	0	3190000
StyleHub	720000	380000	1100000
HomeCraft	220000	320000	540000
BookBazar	180000	285000	465000
GadgetPoint	150000	0	150000
PaperTrail	0	0	0`,
        isSample: false
      },
      {
        input: `update order_items set unit_price_cents=250000 where id=1;`,
        expectedOutput: `TechNest	2990000	0	2990000
StyleHub	720000	380000	1100000
HomeCraft	540000	0	540000
BookBazar	465000	0	465000
GadgetPoint	150000	0	150000
PaperTrail	0	0	0`,
        isSample: false
      },
      {
        input: `update orders set status='cancelled' where id in (3,9);`,
        expectedOutput: `TechNest	3190000	0	3190000
HomeCraft	540000	0	540000
BookBazar	465000	0	465000
StyleHub	0	380000	380000
GadgetPoint	150000	0	150000
PaperTrail	0	0	0`,
        isSample: false
      },
    ],
  },
  {
    slug: "sql-adv-status-matrix",
    title: "Monthly order status matrix",
    statement: `অপারেশন টিম মাসে মাসে অর্ডারের অবস্থা (status) একনজরে দেখতে চায়—কতগুলো paid, কতগুলো pending, কতগুলো cancelled, আর কতগুলো shipped। প্রতিটি মাসের জন্য একটি সারিতে চারটি স্ট্যাটাসের অর্ডার-সংখ্যা বের করো (শর্তসাপেক্ষ যোগফল: SUM + CASE)। আউটপুট: month, paid, pending, cancelled, shipped। যে মাসে কোনো অর্ডার নেই সেই মাস আউটপুটে আসবে না। মাস অনুযায়ী সাজাও।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`month\` (YYYY-MM), \`paid\`, \`pending\`, \`cancelled\`, \`shipped\` (অর্ডারের সংখ্যা)।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## কেন দরকার
অপারেশন রিপোর্টে 'মাস ধরে কয়টা অর্ডার কোন অবস্থায় আছে' প্রশ্নটা প্রতি সপ্তাহে আসে। স্ট্যাটাস আলাদা সারিতে (long আকারে) দিলে তুলনা কঠিন—টেবিল লম্বা হয়, চোখ ঘোরে। ম্যাট্রিক্স (মাস সারিতে, স্ট্যাটাস কলামে) বসালে একনজরেই দেখা যায় কোন মাসে cancellation লাফিয়েছে বা pending জমেছে। ড্যাশবোর্ডের সব status-board এই pivot-এর উপরই দাঁড়িয়ে।

## মূল ধারণা
কৌশল আগের রিপোর্টের মতোই: GROUP BY মাস, আর প্রতিটি স্ট্যাটাসের জন্য \`SUM(CASE WHEN status=... THEN 1 ELSE 0 END)\`। এখানে যোগ হয় ঘটনার সংখ্যা (১), টাকা নয়। চাইলে COUNT(*) দিয়ে মোট অর্ডারও বের করা যায়—চার কলামের যোগফলের সাথে মিলিয়ে যাচাই করার জন্য। একটা সত্য মনে রাখো: GROUP BY শুধু যেসব মাস ডেটায় আছে সেগুলোই দেখায়—অর্ডার-বিহীন মাসের শূন্য-সারি আসে না। শূন্য-মাসও দেখাতে হলে সব মাসের একটা ক্যালেন্ডার টেবিল বানিয়ে LEFT JOIN করতে হয়—এই সমস্যায় সেটা দরকার নেই।

## ধাপে ধাপে
১. \`substr(ordered_at,1,7)\` দিয়ে মাস বানাও।
২. GROUP BY মাস।
৩. চারটি কলামে চারটি CASE-যোগফল।
৪. \`ORDER BY month\` দিয়ে সাজাও।

## কোডে দেখি
\`\`\`sql
SELECT substr(ordered_at, 1, 7) AS month,
       SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) AS paid,
       SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending,
       SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled,
       SUM(CASE WHEN status = 'shipped' THEN 1 ELSE 0 END) AS shipped
FROM orders
GROUP BY substr(ordered_at, 1, 7)
ORDER BY month;
\`\`\`

## কমপ্লেক্সিটি
একটাই টেবিল-স্ক্যান O(n), মাসের সংখ্যা g হলে গ্রুপ-হিসাব O(g)। JOIN-বিহীন pivot—সবচেয়ে সস্তা ম্যাট্রিক্স।

## সাধারণ ভুল
CASE-এ ELSE 0 না দিলে অনুপস্থিত স্ট্যাটাসের যোগফল NULL হয়ে যাওয়া; GROUP BY মাস ছাড়া পুরো টেবিলের এক সারিতে খুঁজে ফেলা; স্ট্যাটাসের বানান ভুল হলে ঐ কলাম নীরবে শূন্য থাকে—আউটপুট ভাঙে না, তাই ধরা কঠিন; ORDER BY ছাড়া মাস-ক্রম অনির্দিষ্ট হওয়া।`,
    difficulty: "HARD",
    points: 350,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    premiumModuleSlug: "advanced-sql",
    category: "SQL Advanced",
    subcategory: "Pivot & grouping",
    referencePython: "",
    referenceSql: `SELECT substr(ordered_at,1,7) AS month,
       SUM(CASE WHEN status='paid' THEN 1 ELSE 0 END) AS paid,
       SUM(CASE WHEN status='pending' THEN 1 ELSE 0 END) AS pending,
       SUM(CASE WHEN status='cancelled' THEN 1 ELSE 0 END) AS cancelled,
       SUM(CASE WHEN status='shipped' THEN 1 ELSE 0 END) AS shipped
FROM orders GROUP BY substr(ordered_at,1,7) ORDER BY month;`,
    tests: [
      {
        input: ``,
        expectedOutput: `2026-10	6	1	1	1
2026-11	1	0	0	0`,
        isSample: true
      },
      {
        input: `update orders set status='shipped' where id in (2,5);`,
        expectedOutput: `2026-10	6	0	0	3
2026-11	1	0	0	0`,
        isSample: true
      },
      {
        input: `update orders set ordered_at='2026-11-04' where id=9;`,
        expectedOutput: `2026-10	5	1	1	1
2026-11	2	0	0	0`,
        isSample: false
      },
      {
        input: `insert into orders (id,customer_id,ordered_at,status) values (11,5,'2026-11-06','pending');`,
        expectedOutput: `2026-10	6	1	1	1
2026-11	1	1	0	0`,
        isSample: false
      },
      {
        input: `update orders set ordered_at='2026-10-02', status='cancelled' where id=10;`,
        expectedOutput: `2026-10	6	1	2	1`,
        isSample: false
      },
    ],
  },
];
