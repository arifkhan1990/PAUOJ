import type { SeedProblem } from "./seed-problems";

export const SQL_PROBLEMS_PRACTICE_ADVANCED_MORE_QUERY_PERFORMANCE: SeedProblem[] = [
  {
    slug: "sql-practice-query-performance-hard",
    title: "Two-column keyset page",
    statement: `অর্ডার ফিড (customer_id, order_id) জোড়া ক্রমে পেজ করা হয় — OFFSET ব্যবহার নিষেধ, কারণ গভীর পেজে সেটা ধীর। কার্সর (customer_id=3, order_id=9)-এর পরের সব অর্ডার আনো: অর্থাৎ customer_id > 3, অথবা customer_id = 3 এবং order_id > 9। আউটপুট কলাম: customer, order_id, ordered_at, status। ফিডের ক্রম (customer_id, তারপর order_id) অনুযায়ী সাজাও।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`customer\`, \`order_id\`, \`ordered_at\`, \`status\`, customer_id ও order_id ক্রমে।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## ধারণা
এক কলামের কার্সর যথেষ্ট না হলে জোড়া কার্সর লাগে। শর্তটা OR-দুটো ভাঙে: \`customer_id > 3 OR (customer_id = 3 AND order_id > 9)\`। ORDER BY (customer_id, id)-এর সাথে এই তুলনা হুবহু মেলে, তাই ইনডেক্স-বান্ধু এবং পেজ যত গভীরই হোক ধীর হয় না — OFFSET-এর মতো সব আগের সারি স্ক্যান করতে হয় না।

## ধাপে ধাপে
১. কার্সরের দুই অংশ আলাদা করো: বেশি customer_id, সমান customer_id-তে বেশি order_id।
২. OR + AND দিয়ে জোড়ো দাও — বদলে দুইবার UNION ALL করলে ডুপ্লিকেট ঝুঁকি।
৩. customers JOIN করে নাম আনো।
৪. ORDER BY customer_id, id — ফিডের ক্রম।

## কোডে দেখি
\`\`\`sql
SELECT cu.name AS customer, o.id AS order_id, o.ordered_at, o.status
FROM orders o JOIN customers cu ON cu.id = o.customer_id
WHERE o.customer_id > 3
   OR (o.customer_id = 3 AND o.id > 9)
ORDER BY o.customer_id, o.id;
\`\`\`

## সাধারণ ভুল
শুধু \`o.id > 9\` লিখে customer_id < 3-এর অর্ডারও টেনে আনা; \`customer_id >= 3\` লিখে id=9-এর আগের সারিগুলো ফাঁস করা; ORDER BY name দিলে কার্সরের ক্রম ভেঙে পরের পেজ আলাদা সারি দেখায়; উপর-নিচ পেজ মিলিয়ে সাজাতে গিয়ে ORDER BY-তে status ঢোকানো।`,
    difficulty: "HARD",
    points: 320,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    premiumModuleSlug: "advanced-sql",
    category: "SQL Advanced",
    subcategory: "Query performance",
    referencePython: "",
    referenceSql: `SELECT cu.name AS customer, o.id AS order_id, o.ordered_at, o.status
FROM orders o JOIN customers cu ON cu.id = o.customer_id
WHERE o.customer_id > 3
   OR (o.customer_id = 3 AND o.id > 9)
ORDER BY o.customer_id, o.id;`,
    tests: [
      {
        input: ``,
        expectedOutput: `Sajid	5	2026-10-12	cancelled
Mim	7	2026-10-22	paid
Tanvir	10	2026-11-02	paid`,
        isSample: true
      },
      {
        input: `insert into orders (id,customer_id,ordered_at,status) values (11,4,'2026-10-20','paid');`,
        expectedOutput: `Sajid	5	2026-10-12	cancelled
Sajid	11	2026-10-20	paid
Mim	7	2026-10-22	paid
Tanvir	10	2026-11-02	paid`,
        isSample: true
      },
      {
        input: `update orders set customer_id=2 where id=5;`,
        expectedOutput: `Mim	7	2026-10-22	paid
Tanvir	10	2026-11-02	paid`,
        isSample: false
      },
      {
        input: `update orders set status='cancelled' where id=10;`,
        expectedOutput: `Sajid	5	2026-10-12	cancelled
Mim	7	2026-10-22	paid
Tanvir	10	2026-11-02	cancelled`,
        isSample: false
      },
      {
        input: `insert into orders (id,customer_id,ordered_at,status) values (12,5,'2026-11-04','paid');`,
        expectedOutput: `Sajid	5	2026-10-12	cancelled
Mim	7	2026-10-22	paid
Mim	12	2026-11-04	paid
Tanvir	10	2026-11-02	paid`,
        isSample: false
      },
    ],
  },
  {
    slug: "sql-practice-query-performance-challenge",
    title: "October payment cutoff",
    statement: `অক্টোবর মাসে সফল পেমেন্টের হিসাব দরকার। payments.paid_at ফরম্যাট \`YYYY-MM-DD HH:MM\` — সীমানা একদম নিখুঁত হতে হবে: 2026-10-01 00:00 থেকে 2026-10-31 23:59 পর্যন্ত, অথচ \`BETWEEN\`-এর মতো স্ট্রিং-ফাঁদে পা দিয়ে 31 তারিখের রাতের পেমেন্ট হারানো যাবে না। প্রতিটি মেথডের জন্য বের করো paid পেমেন্ট সংখ্যা ও যোগফল (সেন্টে)। আউটপুট কলাম: method, paid_count, paid_cents। মেথডের নাম অনুযায়ী সাজাও।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`method\`, \`paid_count\`, \`paid_cents\`, নাম অনুযায়ী।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## ধারণা
\`paid_at BETWEEN '2026-10-01' AND '2026-10-31'\` লিখলে '2026-10-31 23:50'-এর মতো মান বাদ পড়ে — স্ট্রিং তুলনায় তা '2026-10-31'-এর চেয়ে বড়। নিরাপদ কায়দা: \`>= '2026-10-01' AND < '2026-11-01'\` — প্রথম দিনের সবসময় ঢুকে, শেষ দিনের রাতও ঢুকে, নভেম্বরের কিছুই ঢুকে না। এটা half-open interval, টাইমস্ট্যাম্প কলামে সবচেয়ে নির্ভরযোগ্য।

## ধাপে ধাপে
১. WHERE status='paid' AND paid_at >= '2026-10-01' AND paid_at < '2026-11-01'।
২. কলামে ফাংশন লাগাবে না (যেমন substr(paid_at,1,7)='2026-10') — সেটা ইনডেক্স নষ্ট করে আর সীমানাও একই ঝামেলা।
৩. GROUP BY method, COUNT ও SUM।
৪. ORDER BY method।

## কোডে দেখি
\`\`\`sql
SELECT method, COUNT(*) AS paid_count, SUM(amount_cents) AS paid_cents
FROM payments
WHERE status = 'paid'
  AND paid_at >= '2026-10-01'
  AND paid_at < '2026-11-01'
GROUP BY method ORDER BY method;
\`\`\`

## সাধারণ ভুল
\`BETWEEN '2026-10-01' AND '2026-10-31'\` — 31 তারিখের সময়-সহ টাইমস্ট্যাম্প বাদ; \`substr(paid_at,1,7) = '2026-10'\` — কাজ তো দেয়, কিন্তু ইনডেক্স-বান্ধু নয় আর কলামে ফাংশন এড়িয়ে যাওয়ার উদ্দেশ্যই নষ্ট; status-এর শর্ত ভুলে 2 নম্বর pending বা refunded পেমেন্টও গুনে ফেলা।`,
    difficulty: "HARD",
    points: 340,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    premiumModuleSlug: "advanced-sql",
    category: "SQL Advanced",
    subcategory: "Query performance",
    referencePython: "",
    referenceSql: `SELECT method, COUNT(*) AS paid_count, SUM(amount_cents) AS paid_cents
FROM payments
WHERE status = 'paid'
  AND paid_at >= '2026-10-01'
  AND paid_at < '2026-11-01'
GROUP BY method ORDER BY method;`,
    tests: [
      {
        input: ``,
        expectedOutput: `bkash	4	3680000
card	2	780000
cod	1	605000`,
        isSample: true
      },
      {
        input: `insert into payments (id,order_id,method,amount_cents,status,paid_at,transaction_ref) values (12,4,'bkash',99999,'paid','2026-10-31 23:50','BKTRAP');`,
        expectedOutput: `bkash	5	3779999
card	2	780000
cod	1	605000`,
        isSample: true
      },
      {
        input: `update payments set paid_at='2026-11-01 08:00' where id=9;`,
        expectedOutput: `bkash	3	3560000
card	2	780000
cod	1	605000`,
        isSample: false
      },
      {
        input: `update payments set status='refunded' where id=7;`,
        expectedOutput: `bkash	3	3010000
card	2	780000
cod	1	605000`,
        isSample: false
      },
      {
        input: `insert into payments (id,order_id,method,amount_cents,status,paid_at,transaction_ref) values (13,10,'card',25000,'paid','2026-10-15 10:00','CRDX');`,
        expectedOutput: `bkash	4	3680000
card	3	805000
cod	1	605000`,
        isSample: false
      },
    ],
  },
];
