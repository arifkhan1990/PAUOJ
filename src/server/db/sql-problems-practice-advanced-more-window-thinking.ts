import type { SeedProblem } from "./seed-problems";

export const SQL_PROBLEMS_PRACTICE_ADVANCED_MORE_WINDOW_THINKING: SeedProblem[] = [
  {
    slug: "sql-practice-window-thinking-hard",
    title: "Paid order day streaks",
    statement: `গ্রোথ টিম দেখতে চায় কোন কাস্টমার টানা কত দিন কেনাকাটা করেছে। paid/shipped অর্ডারের দিনগুলো ধরো (একই দিনে একাধিক অর্ডার হলে দিনটি একবারই গুনবে), কাস্টমার ধরে টানা ক্রমিক দিনের প্রতিটি স্ট্রিক আলাদা করে শুরুর দিন, শেষ দিন ও দৈর্ঘ্য বের করো। আউটপুট কলাম: customer, streak_start, streak_end, streak_days। কাস্টমারের নাম, তারপর স্ট্রিকের শুরুর দিন অনুযায়ী সাজাও।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`customer\`, \`streak_start\`, \`streak_end\`, \`streak_days\`, নাম ও শুরুর দিন অনুযায়ী।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## ধারণা
এটা classic gaps-and-islands: প্রতি কাস্টমারের দিনগুলোকে সাজিয়ে \`day_number - ROW_NUMBER()\` বাদ দিলে টানা ক্রমিক দিনের গ্রুপে একই মান আসে, আর ফাঁক পড়লেই মান বদলে যায়। এই গ্রুপ আইডি ধরে GROUP BY করলেই প্রতিটি স্ট্রিক এক সারি।

## ধাপে ধাপে
১. paid/shipped অর্ডার থেকে কাস্টমার ও দিন (date অংশ) নাও, DISTINCT দিয়ে একই দিন একবার রাখো।
২. \`julianday(day)\` থেকে \`ROW_NUMBER() OVER (PARTITION BY customer ORDER BY day)\` বাদ দিয়ে grp বানাও — টানা দিনে grp অপরিবর্তিত।
৩. customer+grp ধরে GROUP BY করে MIN(day)=শুরু, MAX(day)=শেষ, COUNT(*)=দৈর্ঘ্য।
৪. ORDER BY customer, streak_start।

## কোডে দেখি
\`\`\`sql
WITH paid_days AS (
  SELECT DISTINCT o.customer_id, substr(o.ordered_at,1,10) AS day
  FROM orders o WHERE o.status IN ('paid','shipped')),
marked AS (
  SELECT customer_id, day,
         CAST(julianday(day) AS INTEGER)
           - ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY day) AS grp
  FROM paid_days)
SELECT cu.name AS customer, MIN(m.day) AS streak_start, MAX(m.day) AS streak_end,
       COUNT(*) AS streak_days
FROM marked m JOIN customers cu ON cu.id = m.customer_id
GROUP BY m.customer_id, m.grp
ORDER BY customer, streak_start;
\`\`\`

## সাধারণ ভুল
DISTINCT না দিলে একই দিনের দুটি অর্ডার দুই “স্ট্রিক” হয়ে যায়; দিনের পার্থক্য স্ট্রিং বিয়োগ করা যায় না বলে julianday লাগবেই; grp-এ কাস্টমার বাদ দিলে ভিন্ন কাস্টমারের দিন এক সিরিজে মিশে যায়।`,
    difficulty: "HARD",
    points: 320,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    premiumModuleSlug: "advanced-sql",
    category: "SQL Advanced",
    subcategory: "Window functions",
    referencePython: "",
    referenceSql: `WITH paid_days AS (
  SELECT DISTINCT o.customer_id, substr(o.ordered_at,1,10) AS day
  FROM orders o WHERE o.status IN ('paid','shipped')),
marked AS (
  SELECT customer_id, day,
         CAST(julianday(day) AS INTEGER)
           - ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY day) AS grp
  FROM paid_days)
SELECT cu.name AS customer, MIN(m.day) AS streak_start, MAX(m.day) AS streak_end,
       COUNT(*) AS streak_days
FROM marked m JOIN customers cu ON cu.id = m.customer_id
GROUP BY m.customer_id, m.grp
ORDER BY customer, streak_start;`,
    tests: [
      {
        input: ``,
        expectedOutput: `Karim	2026-10-25	2026-10-25	1
Mim	2026-10-22	2026-10-22	1
Nusrat	2026-10-05	2026-10-05	1
Nusrat	2026-10-28	2026-10-28	1
Rahim	2026-10-01	2026-10-01	1
Rahim	2026-10-10	2026-10-10	1
Rahim	2026-10-20	2026-10-20	1
Tanvir	2026-11-02	2026-11-02	1`,
        isSample: true
      },
      {
        input: `insert into orders (id,customer_id,ordered_at,status) values (11,1,'2026-10-02','paid'); insert into orders (id,customer_id,ordered_at,status) values (12,1,'2026-10-03','paid');`,
        expectedOutput: `Karim	2026-10-25	2026-10-25	1
Mim	2026-10-22	2026-10-22	1
Nusrat	2026-10-05	2026-10-05	1
Nusrat	2026-10-28	2026-10-28	1
Rahim	2026-10-01	2026-10-03	3
Rahim	2026-10-10	2026-10-10	1
Rahim	2026-10-20	2026-10-20	1
Tanvir	2026-11-02	2026-11-02	1`,
        isSample: true
      },
      {
        input: `insert into orders (id,customer_id,ordered_at,status) values (11,3,'2026-10-29','paid');`,
        expectedOutput: `Karim	2026-10-25	2026-10-25	1
Mim	2026-10-22	2026-10-22	1
Nusrat	2026-10-05	2026-10-05	1
Nusrat	2026-10-28	2026-10-29	2
Rahim	2026-10-01	2026-10-01	1
Rahim	2026-10-10	2026-10-10	1
Rahim	2026-10-20	2026-10-20	1
Tanvir	2026-11-02	2026-11-02	1`,
        isSample: false
      },
      {
        input: `update orders set status='cancelled' where id=4;`,
        expectedOutput: `Karim	2026-10-25	2026-10-25	1
Mim	2026-10-22	2026-10-22	1
Nusrat	2026-10-05	2026-10-05	1
Nusrat	2026-10-28	2026-10-28	1
Rahim	2026-10-01	2026-10-01	1
Rahim	2026-10-20	2026-10-20	1
Tanvir	2026-11-02	2026-11-02	1`,
        isSample: false
      },
      {
        input: `insert into orders (id,customer_id,ordered_at,status) values (12,6,'2026-11-03','paid');`,
        expectedOutput: `Karim	2026-10-25	2026-10-25	1
Mim	2026-10-22	2026-10-22	1
Nusrat	2026-10-05	2026-10-05	1
Nusrat	2026-10-28	2026-10-28	1
Rahim	2026-10-01	2026-10-01	1
Rahim	2026-10-10	2026-10-10	1
Rahim	2026-10-20	2026-10-20	1
Tanvir	2026-11-02	2026-11-03	2`,
        isSample: false
      },
    ],
  },
  {
    slug: "sql-practice-window-thinking-challenge",
    title: "City median order value",
    statement: `প্রতিটি শহরের paid/shipped অর্ডারগুলোর মধ্যম মান (median) বের করো। অর্ডারের মান = তার সব আইটেমের quantity × unit_price_cents যোগফল। শহরে জোড় সংখ্যক অর্ডার থাকলে মাঝের দুটি মানের গড় হবে, বিজোড় হলে ঠিক মাঝের মানটি। একটিও paid/shipped অর্ডার না থাকা শহর তালিকায় আসবে না। আউটপুট কলাম: city, median_order_cents, paid_orders। শহরের নাম অনুযায়ী সাজাও।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`city\`, \`median_order_cents\`, \`paid_orders\`, শহরের নাম অনুযায়ী। median পূর্ণসংখ্যা।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## ধারণা
মধ্যম মান পেতে প্রতি শহরের ভেতরে অর্ডারের মান ক্রমে সাজিয়ে মাঝের সারি(গুলো) বের করতে হয়। \`ROW_NUMBER() OVER (PARTITION BY city ORDER BY cents)\` আর \`COUNT(*) OVER (PARTITION BY city)\` একসাথে ব্যবহার করলে প্রতি সারি নিজের অবস্থান আর মোট সংখ্যা দুটোই জানে; rn IN (FLOOR((n+1)/2.0), FLOOR((n+2)/2.0)) দুই কেসই সামলায়।

## ধাপে ধাপে
১. প্রতি অর্ডারের মোট মান বের করো (GROUP BY order)।
২. শহর ধরে rn ও n উইন্ডো বসাও — ORDER BY cents, order_id টাই-ব্রেক।
৩. rn IN (FLOOR((n+1)/2.0), FLOOR((n+2)/2.0)) ফিল্টার করে শহর ধরে AVG নাও — বিজোড়ে একটি সারি নিজেই মধ্যম।
৪. CAST দিয়ে পূর্ণসংখ্যা করো, ORDER BY city।

## কোডে দেখি
\`\`\`sql
WITH order_totals AS (
  SELECT o.id, cu.city, SUM(oi.quantity*oi.unit_price_cents) AS cents
  FROM orders o JOIN customers cu ON cu.id=o.customer_id
  JOIN order_items oi ON oi.order_id=o.id
  WHERE o.status IN ('paid','shipped') GROUP BY o.id, cu.city),
ranked AS (
  SELECT city, cents,
         ROW_NUMBER() OVER (PARTITION BY city ORDER BY cents, id) AS rn,
         COUNT(*) OVER (PARTITION BY city) AS n
  FROM order_totals)
SELECT city, CAST(ROUND(AVG(cents),0) AS INTEGER) AS median_order_cents,
       MAX(n) AS paid_orders
FROM ranked WHERE rn IN (FLOOR((n+1)/2.0), FLOOR((n+2)/2.0))
GROUP BY city ORDER BY city;
\`\`\`

## সাধারণ ভুল
জোড় সংখ্যকে শুধু একটি “মাঝের” সারি নেওয়া; (n+1)/2 আর (n+2)/2 ভুলে যাওয়া; pending/cancelled অর্ডার গুনে ফেলা; Sylhet-এর মতো শূন্য গ্রুপের জন্য AVG-এ ভাঙা লজিক — এখানে শহরটি আদৌ আসবে না, জোর করে আনতে গেলে ভুল হবে।`,
    difficulty: "HARD",
    points: 340,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    premiumModuleSlug: "advanced-sql",
    category: "SQL Advanced",
    subcategory: "Window functions",
    referencePython: "",
    referenceSql: `WITH order_totals AS (
  SELECT o.id, cu.city, SUM(oi.quantity*oi.unit_price_cents) AS cents
  FROM orders o JOIN customers cu ON cu.id=o.customer_id
  JOIN order_items oi ON oi.order_id=o.id
  WHERE o.status IN ('paid','shipped') GROUP BY o.id, cu.city),
ranked AS (
  SELECT city, cents,
         ROW_NUMBER() OVER (PARTITION BY city ORDER BY cents, id) AS rn,
         COUNT(*) OVER (PARTITION BY city) AS n
  FROM order_totals)
SELECT city, CAST(ROUND(AVG(cents),0) AS INTEGER) AS median_order_cents,
       MAX(n) AS paid_orders
FROM ranked WHERE rn IN (FLOOR((n+1)/2.0), FLOOR((n+2)/2.0))
GROUP BY city ORDER BY city;`,
    tests: [
      {
        input: ``,
        expectedOutput: `Chattogram	180000	1
Dhaka	602500	6
Khulna	670000	1`,
        isSample: true
      },
      {
        input: `update orders set status='paid' where id=5;`,
        expectedOutput: `Chattogram	180000	1
Dhaka	602500	6
Khulna	670000	1
Sylhet	170000	1`,
        isSample: true
      },
      {
        input: `insert into orders (id,customer_id,ordered_at,status) values (11,2,'2026-11-04','paid'); insert into order_items (id,order_id,product_id,quantity,unit_price_cents) values (16,11,5,1,250000);`,
        expectedOutput: `Chattogram	215000	2
Dhaka	602500	6
Khulna	670000	1`,
        isSample: false
      },
      {
        input: `update orders set status='pending' where id=3;`,
        expectedOutput: `Chattogram	180000	1
Dhaka	605000	5
Khulna	670000	1`,
        isSample: false
      },
      {
        input: `update orders set status='cancelled' where id=6;`,
        expectedOutput: `Chattogram	180000	1
Dhaka	600000	5
Khulna	670000	1`,
        isSample: false
      },
    ],
  },
];
