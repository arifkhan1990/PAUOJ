import type { SeedProblem } from "./seed-problems";

export const SQL_PROBLEMS_PRACTICE_ADVANCED_MORE_FINANCE_RECONCILIATION: SeedProblem[] = [
  {
    slug: "sql-practice-finance-reconciliation-hard",
    title: "Payment method ledger",
    statement: `ফাইন্যান্স টিম প্রতি পেমেন্ট মেথডের নিষ্পত্তি চায়। প্রতিটি মেথডের জন্য বের করো: paid পেমেন্ট সংখ্যা ও যোগফল (সেন্টে), refunded পেমেন্টের যোগফল, net = paid - refunded, pending পেমেন্ট সংখ্যা, failed পেমেন্ট সংখ্যা, এবং মোট net-এর ভেতরে ওই মেথডের অংশ (শতকরা, ১ দশমিক)। আউটপুট কলাম: method, paid_count, paid_cents, refunded_cents, net_cents, pending_count, failed_count, net_share_pct। আগে net_cents (বড় থেকে ছোট), টাইলে method অনুযায়ী সাজাও।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`method\`, \`paid_count\`, \`paid_cents\`, \`refunded_cents\`, \`net_cents\`, \`pending_count\`, \`failed_count\`, \`net_share_pct\`।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## ধারণা
এক পাসে conditional aggregation: status ধরে CASE খুলে প্রতি মেথডের পাঁচ রকম সংখ্যা বের করো। এরপর বাইরের স্তরে সব মেথডের net যোগ করে share বের করা হয় — ভেতরের সারিতে window চালালে প্রতি মেথডের নিজের net আর সবার যোগফল একসাথে পাওয়া যায়।

## ধাপে ধাপে
১. method_ledger: GROUP BY method, প্রতিটি status-এর COUNT/SUM CASE দিয়ে।
২. net_cents = paid_cents - refunded_cents বাইরে হিসাব করো।
৩. SUM(net) OVER () দিয়ে মোট net — share = 100*net/মোট।
৪. ORDER BY net_cents DESC, method।

## কোডে দেখি
\`\`\`sql
WITH method_ledger AS (
  SELECT method,
         SUM(CASE WHEN status='paid' THEN 1 ELSE 0 END) AS paid_count,
         SUM(CASE WHEN status='paid' THEN amount_cents ELSE 0 END) AS paid_cents,
         SUM(CASE WHEN status='refunded' THEN amount_cents ELSE 0 END) AS refunded_cents,
         SUM(CASE WHEN status='pending' THEN 1 ELSE 0 END) AS pending_count,
         SUM(CASE WHEN status='failed' THEN 1 ELSE 0 END) AS failed_count
  FROM payments GROUP BY method)
SELECT method, paid_count, paid_cents, refunded_cents,
       paid_cents - refunded_cents AS net_cents, pending_count, failed_count,
       ROUND(100.0*(paid_cents - refunded_cents)
             / SUM(paid_cents - refunded_cents) OVER (), 1) AS net_share_pct
FROM method_ledger ORDER BY net_cents DESC, method;
\`\`\`

## সাধারণ ভুল
refunded বাদ না দিয়ে net-কে paid_cents বানানো — অর্ডার ১-এর 450000 refunded আলাদা পেমেন্ট সারি, কাটতেই হবে; status ধরে WHERE দিয়ে ফিল্টার করলে pending/failed গুনতেই পারবে না; share-এর ভাগ মোট paid দিয়ে করা — সঠিক ভিত্তি মোট net।`,
    difficulty: "HARD",
    points: 320,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    premiumModuleSlug: "advanced-sql",
    category: "SQL Advanced",
    subcategory: "Finance",
    referencePython: "",
    referenceSql: `WITH method_ledger AS (
  SELECT method,
         SUM(CASE WHEN status='paid' THEN 1 ELSE 0 END) AS paid_count,
         SUM(CASE WHEN status='paid' THEN amount_cents ELSE 0 END) AS paid_cents,
         SUM(CASE WHEN status='refunded' THEN amount_cents ELSE 0 END) AS refunded_cents,
         SUM(CASE WHEN status='pending' THEN 1 ELSE 0 END) AS pending_count,
         SUM(CASE WHEN status='failed' THEN 1 ELSE 0 END) AS failed_count
  FROM payments GROUP BY method)
SELECT method, paid_count, paid_cents, refunded_cents,
       paid_cents - refunded_cents AS net_cents, pending_count, failed_count,
       ROUND(100.0*(paid_cents - refunded_cents) / SUM(paid_cents - refunded_cents) OVER (), 1) AS net_share_pct
FROM method_ledger ORDER BY net_cents DESC, method;`,
    tests: [
      {
        input: ``,
        expectedOutput: `bkash	4	3680000	450000	3230000	0	0	64.7
card	3	1160000	0	1160000	0	1	23.2
cod	1	605000	0	605000	1	0	12.1`,
        isSample: true
      },
      {
        input: `update payments set status='refunded' where id=7;`,
        expectedOutput: `bkash	3	3010000	1120000	1890000	0	0	51.7
card	3	1160000	0	1160000	0	1	31.7
cod	1	605000	0	605000	1	0	16.6`,
        isSample: true
      },
      {
        input: `insert into payments (id,order_id,method,amount_cents,status,paid_at,transaction_ref) values (12,4,'bkash',99999,'paid','2026-10-31 23:50','BK99');`,
        expectedOutput: `bkash	5	3779999	450000	3329999	0	0	65.4
card	3	1160000	0	1160000	0	1	22.8
cod	1	605000	0	605000	1	0	11.9`,
        isSample: false
      },
      {
        input: `update payments set status='paid' where id=5;`,
        expectedOutput: `bkash	4	3680000	450000	3230000	0	0	62.5
card	4	1330000	0	1330000	0	0	25.8
cod	1	605000	0	605000	1	0	11.7`,
        isSample: false
      },
      {
        input: `update payments set status='failed' where id=6;`,
        expectedOutput: `bkash	4	3680000	450000	3230000	0	0	73.6
card	3	1160000	0	1160000	0	1	26.4
cod	0	0	0	0	1	1	0.0`,
        isSample: false
      },
    ],
  },
  {
    slug: "sql-practice-finance-reconciliation-challenge",
    title: "Vendor refund exposure",
    statement: `রিফান্ডের টাকা তিন রকম স্ট্যাটাসে ঘুরে: approved মানে টাকা শেষ পর্যন্ত ফেরত গেছে, pending মানে ঝুঁকিতে, rejected মানে আর ফেরত যাবে না। প্রতিটি ভেন্ডরের জন্য বের করো: approved রিফান্ডের যোগফল (সেন্টে), pending রিফান্ডের যোগফল, rejected রিফান্ডের যোগফল, আর approved রিফান্ডে ফেরত যাওয়া ইউনিট সংখ্যা। কোনো রিটার্নই না থাকা ভেন্ডরে সব 0 দেখাও — কেউ বাদ যাবে না। আউটপুট কলাম: vendor, approved_refund_cents, pending_refund_cents, rejected_refund_cents, approved_units। আগে approved (বড় থেকে), তারপর pending (বড় থেকে), শেষে নাম অনুযায়ী সাজাও।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`vendor\`, \`approved_refund_cents\`, \`pending_refund_cents\`, \`rejected_refund_cents\`, \`approved_units\`।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## ধারণা
returns টেবিল অর্ডার-আইটেম ধরে প্রোডাক্টে গিয়ে ভেন্ডরে পৌঁছায় — এই জোড়া দুই ধাপের। ভেন্ডর-প্রতি হিসাবে শুধু রিটার্ন-আছে ভেন্ডর আসে, তাই সব ভেন্ডর রাখতে vendors LEFT JOIN করে COALESCE 0 বসাতে হবে। আর তিন স্ট্যাটাসের টাকা আলাদা করাই এই সমস্যার মূল — মোট রিফান্ড গুনলে হিসাব ভেঙে পড়ে।

## ধাপে ধাপে
১. return_units CTE: returns JOIN order_items JOIN products, vendor ধরে তিন স্ট্যাটাসে CASE-যোগফল + approved ইউনিট।
২. vendors LEFT JOIN সেটার সাথে।
৩. COALESCE(...,0) দিয়ে খালি ভেন্ডর পূরণ।
৪. ORDER BY approved DESC, pending DESC, vendor।

## কোডে দেখি
\`\`\`sql
WITH return_units AS (
  SELECT p.vendor_id,
         SUM(CASE WHEN r.status='approved' THEN r.refund_cents ELSE 0 END) AS approved_cents,
         SUM(CASE WHEN r.status='pending' THEN r.refund_cents ELSE 0 END) AS pending_cents,
         SUM(CASE WHEN r.status='rejected' THEN r.refund_cents ELSE 0 END) AS rejected_cents,
         SUM(CASE WHEN r.status='approved' THEN r.quantity ELSE 0 END) AS approved_units
  FROM returns r
  JOIN order_items oi ON oi.id = r.order_item_id
  JOIN products p ON p.id = oi.product_id
  GROUP BY p.vendor_id)
SELECT v.name AS vendor,
       COALESCE(ru.approved_cents,0) AS approved_refund_cents,
       COALESCE(ru.pending_cents,0) AS pending_refund_cents,
       COALESCE(ru.rejected_cents,0) AS rejected_refund_cents,
       COALESCE(ru.approved_units,0) AS approved_units
FROM vendors v LEFT JOIN return_units ru ON ru.vendor_id = v.id
ORDER BY approved_refund_cents DESC, pending_refund_cents DESC, v.name;
\`\`\`

## সাধারণ ভুল
সব রিটার্নের refund_cents এক গুঁফে গুনে ফেলা — rejected টাকা তো ফেরত যায়নি, pending এখনো ঝুঁকি; INNER JOIN করে রিটার্ন-শূন্য ভেন্ডর (PaperTrail, StyleHub) হারানো; order_items না পেরিয়ে সরাসরি returns-এ vendor খোঁজা — ওই টেবিলে vendor নেইই।`,
    difficulty: "HARD",
    points: 340,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    premiumModuleSlug: "advanced-sql",
    category: "SQL Advanced",
    subcategory: "Finance",
    referencePython: "",
    referenceSql: `WITH return_units AS (
  SELECT p.vendor_id,
         SUM(CASE WHEN r.status='approved' THEN r.refund_cents ELSE 0 END) AS approved_cents,
         SUM(CASE WHEN r.status='pending' THEN r.refund_cents ELSE 0 END) AS pending_cents,
         SUM(CASE WHEN r.status='rejected' THEN r.refund_cents ELSE 0 END) AS rejected_cents,
         SUM(CASE WHEN r.status='approved' THEN r.quantity ELSE 0 END) AS approved_units
  FROM returns r
  JOIN order_items oi ON oi.id = r.order_item_id
  JOIN products p ON p.id = oi.product_id
  GROUP BY p.vendor_id)
SELECT v.name AS vendor,
       COALESCE(ru.approved_cents,0) AS approved_refund_cents,
       COALESCE(ru.pending_cents,0) AS pending_refund_cents,
       COALESCE(ru.rejected_cents,0) AS rejected_refund_cents,
       COALESCE(ru.approved_units,0) AS approved_units
FROM vendors v LEFT JOIN return_units ru ON ru.vendor_id = v.id
ORDER BY approved_refund_cents DESC, pending_refund_cents DESC, v.name;`,
    tests: [
      {
        input: ``,
        expectedOutput: `TechNest	450000	0	0	1
HomeCraft	320000	0	110000	1
GadgetPoint	0	150000	0	0
BookBazar	0	0	0	0
PaperTrail	0	0	0	0
StyleHub	0	0	0	0`,
        isSample: true
      },
      {
        input: `update returns set status='approved' where id=4;`,
        expectedOutput: `TechNest	450000	0	0	1
HomeCraft	320000	0	110000	1
GadgetPoint	150000	0	0	1
BookBazar	0	0	0	0
PaperTrail	0	0	0	0
StyleHub	0	0	0	0`,
        isSample: true
      },
      {
        input: `update returns set status='rejected' where id=1;`,
        expectedOutput: `HomeCraft	320000	0	110000	1
GadgetPoint	0	150000	0	0
BookBazar	0	0	0	0
PaperTrail	0	0	0	0
StyleHub	0	0	0	0
TechNest	0	0	450000	0`,
        isSample: false
      },
      {
        input: `update returns set status='approved' where id=3;`,
        expectedOutput: `TechNest	450000	0	0	1
HomeCraft	430000	0	0	2
GadgetPoint	0	150000	0	0
BookBazar	0	0	0	0
PaperTrail	0	0	0	0
StyleHub	0	0	0	0`,
        isSample: false
      },
      {
        input: `update returns set refund_cents=999999 where id=4;`,
        expectedOutput: `TechNest	450000	0	0	1
HomeCraft	320000	0	110000	1
GadgetPoint	0	999999	0	0
BookBazar	0	0	0	0
PaperTrail	0	0	0	0
StyleHub	0	0	0	0`,
        isSample: false
      },
    ],
  },
];
