import type { SeedProblem } from "./seed-problems";

export const SQL_PROBLEMS_PRACTICE_BASIC_ORDER_LIFECYCLE: SeedProblem[] = [
  {
    slug: "sql-practice-order-lifecycle-easy",
    title: "Delivered parcel log",
    statement: `কাস্টমার সার্ভিস টিম ডেলিভারি-সম্পন্ন পার্সেলের আর্কাইভ তৈরি করছে — কোন অর্ডার কার, কোন কুরিয়ারে গেছে, কবে পৌঁছেছে। \`shipments\`-এ যেসব পার্সেলের স্ট্যাটাস \`delivered\`, তাদের \`order_id\`, কাস্টমারের নাম (\`customer\`), \`carrier\` ও \`delivered_at\` বের করো — ডেলিভারির তারিখ অনুযায়ী, একই তারিখে অর্ডার আইডি অনুযায়ী।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`order_id\`, \`customer\`, \`carrier\`, \`delivered_at\` — তারিখ ঊর্ধ্বক্রম, সমান হলে \`order_id\` অনুযায়ী।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## ধারণা
লাইফসাইকেল চেইনে \`shipments\` সরাসরি \`orders\`-এ ঝোঁকে, \`orders\` আবার \`customers\`-এ — দুই ধাপের JOIN-এ কাস্টমারের নাম পর্যন্ত পৌঁছানো যায়। ডেলিভার হওয়া মানে \`status = 'delivered'\`; শুধু শিপ হয়ে থাকলে \`delivered_at\` এখনো NULL — তাই ফিল্টারটা স্ট্যাটাসেই বসাতে হয়, তারিখে নয়।

## ধাপে ধাপে
১. \`shipments s JOIN orders o ... JOIN customers c ...\`।
২. \`WHERE s.status = 'delivered'\`।
৩. \`ORDER BY s.delivered_at, o.id\`।

## কোডে দেখি
\`\`\`sql
SELECT o.id AS order_id, c.name AS customer, s.carrier, s.delivered_at
FROM shipments s
JOIN orders o ON o.id = s.order_id
JOIN customers c ON c.id = o.customer_id
WHERE s.status = 'delivered'
ORDER BY s.delivered_at, o.id;
\`\`\`

## সাধারণ ভুল
স্ট্যাটাস ফিল্টার ছাড়া শিপ-হওয়া পার্সেলও আনা (তাদের \`delivered_at\` NULL); দ্বিতীয় JOIN ভুলে কাস্টমারের নাম না আনা; একই তারিখে অর্ডার আইডি টাই-ব্রেকার না দেওয়া।`,
    difficulty: "EASY",
    points: 150,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    category: "SQL Basics",
    subcategory: "Order lifecycle",
    referencePython: "",
    referenceSql: `SELECT o.id AS order_id, c.name AS customer, s.carrier, s.delivered_at FROM shipments s JOIN orders o ON o.id = s.order_id JOIN customers c ON c.id = o.customer_id WHERE s.status = 'delivered' ORDER BY s.delivered_at, o.id;`,
    tests: [
      {
        input: ``,
        expectedOutput: `1	Rahim	Sundarban	2026-10-04
3	Nusrat	Pathao	2026-10-07
6	Rahim	Pathao	2026-10-23
8	Karim	Pathao	2026-10-28
9	Nusrat	Sundarban	2026-10-31`,
        isSample: true
      },
      {
        input: `update shipments set status='delivered', delivered_at='2026-10-14' where id=3;`,
        expectedOutput: `1	Rahim	Sundarban	2026-10-04
3	Nusrat	Pathao	2026-10-07
4	Rahim	Sundarban	2026-10-14
6	Rahim	Pathao	2026-10-23
8	Karim	Pathao	2026-10-28
9	Nusrat	Sundarban	2026-10-31`,
        isSample: true
      },
      {
        input: `update shipments set status='shipped', delivered_at=NULL where id=6;`,
        expectedOutput: `1	Rahim	Sundarban	2026-10-04
3	Nusrat	Pathao	2026-10-07
6	Rahim	Pathao	2026-10-23
9	Nusrat	Sundarban	2026-10-31`,
        isSample: false
      },
      {
        input: `update shipments set delivered_at='2026-10-28' where id=7;`,
        expectedOutput: `1	Rahim	Sundarban	2026-10-04
3	Nusrat	Pathao	2026-10-07
6	Rahim	Pathao	2026-10-23
8	Karim	Pathao	2026-10-28
9	Nusrat	Sundarban	2026-10-28`,
        isSample: false
      },
      {
        input: `delete from shipments where id=1;`,
        expectedOutput: `3	Nusrat	Pathao	2026-10-07
6	Rahim	Pathao	2026-10-23
8	Karim	Pathao	2026-10-28
9	Nusrat	Sundarban	2026-10-31`,
        isSample: false
      },
    ],
  },
  {
    slug: "sql-practice-order-lifecycle-medium",
    title: "Payment method reliability",
    statement: `প্রোডাক্ট টিম ঠিক করবে কোন পেমেন্ট মেথড চেকআউটে রাখা জরুরি। \`payments\`-এ প্রতি চেষ্টাই এক সারি — সফল, failed, refunded, pending সব। প্রতি \`method\`-এর চেষ্টার সংখ্যা (\`attempts\`), তার মধ্যে সফল (\`paid\`) সংখ্যা (\`paid_count\`) আর সফলতার হার শতাংশে (\`success_pct\`, এক দশমিক) বের করো — হার বেশি থেকে কম, সমান হলে মেথডের নাম অনুযায়ী।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`method\`, \`attempts\`, \`paid_count\`, \`success_pct\` — হার নিচের ক্রমে, সমান হলে \`method\` অনুযায়ী।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## ধারণা
গ্রুপ-ভিত্তিক হার মানে লভ্যাংশ: হর \`COUNT(*)\` (সব চেষ্টা), লব \`SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END)\`। এই conditional aggregation-ই \`WHERE\` ছাড়াই গ্রুপের ভেতরে শুধু সফলগুলো গুনে দেয় — বাইরে \`WHERE status='paid'\` দিলে হরটাই ভুল হয়ে যেতো। ভাগে \`100.0\` দিয়ে দশমিক নিশ্চিত করো, \`ROUND(..., 1)\`-এ এক ঘর।

## ধাপে ধাপে
১. \`GROUP BY method\`।
২. \`COUNT(*)\` হর, \`SUM(CASE WHEN status='paid' THEN 1 ELSE 0 END)\` লব।
৩. \`ROUND(লব * 100.0 / হর, 1)\` হার।
৪. \`ORDER BY success_pct DESC, method\`।

## কোডে দেখি
\`\`\`sql
SELECT method,
       COUNT(*) AS attempts,
       SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) AS paid_count,
       ROUND(SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) * 100.0
             / COUNT(*), 1) AS success_pct
FROM payments
GROUP BY method
ORDER BY success_pct DESC, method;
\`\`\`

## সাধারণ ভুল
\`WHERE status='paid'\` দিয়ে আগেই ফিল্টার করে সব হার ১০০% বানানো; \`100\` দিয়ে গুণ করে ইন্টিজার ভাগে হার ০ আসা; refunded-ও সফল গোনা — সেই টাকা ফেরত গেছে; টাই-ব্রেকার \`method\` না রাখা।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    category: "SQL Basics",
    subcategory: "Order lifecycle",
    referencePython: "",
    referenceSql: `SELECT method, COUNT(*) AS attempts, SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) AS paid_count, ROUND(SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1) AS success_pct FROM payments GROUP BY method ORDER BY success_pct DESC, method;`,
    tests: [
      {
        input: ``,
        expectedOutput: `bkash	5	4	80.0
card	4	3	75.0
cod	2	1	50.0`,
        isSample: true
      },
      {
        input: `update payments set status='paid', paid_at='2026-10-03 11:00' where id=2;`,
        expectedOutput: `cod	2	2	100.0
bkash	5	4	80.0
card	4	3	75.0`,
        isSample: true
      },
      {
        input: `update payments set status='refunded' where id=3;`,
        expectedOutput: `bkash	5	4	80.0
card	4	2	50.0
cod	2	1	50.0`,
        isSample: false
      },
      {
        input: `insert into payments (id,order_id,method,amount_cents,status,paid_at,transaction_ref) values (12,5,'bkash',170000,'failed','2026-10-13 15:20','BK1702');`,
        expectedOutput: `card	4	3	75.0
bkash	6	4	66.7
cod	2	1	50.0`,
        isSample: false
      },
      {
        input: `update payments set status='failed' where id in (1,7);`,
        expectedOutput: `card	4	3	75.0
cod	2	1	50.0
bkash	5	2	40.0`,
        isSample: false
      },
    ],
  },
];
