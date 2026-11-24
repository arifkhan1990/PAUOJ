import type { SeedProblem } from "./seed-problems";

export const SQL_PROBLEMS_PRACTICE_ADVANCED_MORE_TIMELINES: SeedProblem[] = [
  {
    slug: "sql-practice-timelines-hard",
    title: "Revenue drawdown",
    statement: `রিস্ক টিম বিক্রির পতন মাপতে চায়। প্রতিটি দিনের paid/shipped রেভিনিউ (সেন্টে) বের করো, তারপর প্রতিটি দিনে দেখাও সেই দিন পর্যন্ত সর্বোচ্চ দৈনিক রেভিনিউ (peak) কত ছিল এবং বর্তমান দিন peak থেকে কতটা পিছিয়ে (drawdown)। প্রথম দিনে drawdown 0। আউটপুট কলাম: day, daily_cents, peak_cents, drawdown_cents। দিন অনুযায়ী সাজাও।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`day\`, \`daily_cents\`, \`peak_cents\`, \`drawdown_cents\`, দিন অনুযায়ী।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## ধারণা
চলমান সর্বোচ্চ মানের জন্য \`MAX() OVER (ORDER BY day ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)\` — এটা শুধু আজ পর্যন্ত দেখা সর্বোচ্চটা ধরে রাখে, ভবিষ্যতের দিন ঢুকায় না। drawdown = peak - আজকের মান, অর্থাৎ শীর্ষ থেকে কতটা নামলাম।

## ধাপে ধাপে
১. daily CTE-তে দিন ধরে paid/shipped রেভিনিউ যোগ করো।
২. একই window-এর MAX-কে দুইবার লাগানো যায় না — peak_cents আর drawdown দুটোই একই এক্সপ্রেশন থেকে আসবে।
৩. প্রথম দিনে peak=নিজের মান তাই drawdown 0।
৪. ORDER BY day দিয়ে টাইমলাইন ঠিক রাখো।

## কোডে দেখি
\`\`\`sql
WITH daily AS (
  SELECT substr(o.ordered_at,1,10) AS day,
         SUM(oi.quantity*oi.unit_price_cents) AS daily_cents
  FROM orders o JOIN order_items oi ON oi.order_id=o.id
  WHERE o.status IN ('paid','shipped') GROUP BY day)
SELECT day, daily_cents,
       MAX(daily_cents) OVER (ORDER BY day ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS peak_cents,
       MAX(daily_cents) OVER (ORDER BY day ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) - daily_cents AS drawdown_cents
FROM daily ORDER BY day;
\`\`\`

## সাধারণ ভুল
frame ছাড়া MAX() OVER (ORDER BY day) লিখলে SQLite ডিফল্টে UNBOUNDED PRECEDING নেয় ঠিকই, কিন্তু নতুন পিক এলে আগের সারিগুলোর peak বদলে যায় না — সেটা কাম্য; ভুলটা হয় PARTITION এড়িয়ে ORDER BY-ই না দিলে পুরো সেটের MAX সব সারিতে বসে; “ভবিষ্যৎ পিক” ঢুকিয়ে ফেলা (ORDER BY day-এর দিক উল্টানো) প্রথম দিনেই সর্বোচ্চ দেখিয়ে দেয়।`,
    difficulty: "HARD",
    points: 320,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    premiumModuleSlug: "advanced-sql",
    category: "SQL Advanced",
    subcategory: "Window functions",
    referencePython: "",
    referenceSql: `WITH daily AS (
  SELECT substr(o.ordered_at,1,10) AS day, SUM(oi.quantity*oi.unit_price_cents) AS daily_cents
  FROM orders o JOIN order_items oi ON oi.order_id=o.id
  WHERE o.status IN ('paid','shipped') GROUP BY day)
SELECT day, daily_cents,
       MAX(daily_cents) OVER (ORDER BY day ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS peak_cents,
       MAX(daily_cents) OVER (ORDER BY day ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) - daily_cents AS drawdown_cents
FROM daily ORDER BY day;`,
    tests: [
      {
        input: ``,
        expectedOutput: `2026-10-01	890000	890000	0
2026-10-05	600000	890000	290000
2026-10-10	2000000	2000000	0
2026-10-20	605000	2000000	1395000
2026-10-22	670000	2000000	1330000
2026-10-25	180000	2000000	1820000
2026-10-28	120000	2000000	1880000
2026-11-02	380000	2000000	1620000`,
        isSample: true
      },
      {
        input: `update orders set ordered_at='2026-11-03' where id=6;`,
        expectedOutput: `2026-10-01	890000	890000	0
2026-10-05	600000	890000	290000
2026-10-10	2000000	2000000	0
2026-10-22	670000	2000000	1330000
2026-10-25	180000	2000000	1820000
2026-10-28	120000	2000000	1880000
2026-11-02	380000	2000000	1620000
2026-11-03	605000	2000000	1395000`,
        isSample: true
      },
      {
        input: `insert into orders (id,customer_id,ordered_at,status) values (11,5,'2026-10-26','paid'); insert into order_items (id,order_id,product_id,quantity,unit_price_cents) values (16,11,8,1,85000);`,
        expectedOutput: `2026-10-01	890000	890000	0
2026-10-05	600000	890000	290000
2026-10-10	2000000	2000000	0
2026-10-20	605000	2000000	1395000
2026-10-22	670000	2000000	1330000
2026-10-25	180000	2000000	1820000
2026-10-26	85000	2000000	1915000
2026-10-28	120000	2000000	1880000
2026-11-02	380000	2000000	1620000`,
        isSample: false
      },
      {
        input: `update orders set status='cancelled' where id=4;`,
        expectedOutput: `2026-10-01	890000	890000	0
2026-10-05	600000	890000	290000
2026-10-20	605000	890000	285000
2026-10-22	670000	890000	220000
2026-10-25	180000	890000	710000
2026-10-28	120000	890000	770000
2026-11-02	380000	890000	510000`,
        isSample: false
      },
      {
        input: `update order_items set unit_price_cents=1900000 where id=6;`,
        expectedOutput: `2026-10-01	890000	890000	0
2026-10-05	600000	890000	290000
2026-10-10	2050000	2050000	0
2026-10-20	605000	2050000	1445000
2026-10-22	670000	2050000	1380000
2026-10-25	180000	2050000	1870000
2026-10-28	120000	2050000	1930000
2026-11-02	380000	2050000	1670000`,
        isSample: false
      },
    ],
  },
  {
    slug: "sql-practice-timelines-challenge",
    title: "Calendar 7-day trailing revenue",
    statement: `প্রতিটি দিনের paid/shipped রেভিনিউ-র সাথে সেই দিনসহ ঠিক আগের ৭ ক্যালেন্ডার দিনের (দিনটি - ৬ থেকে দিনটি) মোট রেভিনিউ দেখাও। মনে রাখো: অর্ডার নেই এমন দিনও ক্যালেন্ডারের ৭ দিনের ভেতরে পড়ে — ROWS গুনে ৭টা সারি নিলে চলবে না, ক্যালেন্ডার অনুযায়ী ৭ দিন লাগবে। আউটপুট কলাম: day, daily_cents, trailing_7d_cents। দিন অনুযায়ী সাজাও।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`day\`, \`daily_cents\`, \`trailing_7d_cents\`, দিন অনুযায়ী।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## ধারণা
\`ROWS BETWEEN 6 PRECEDING\` গুনে আগের ৬টা সারি — কিন্তু ফাঁকা দিনগুলোর সারি তো নেই, তাই ৬ সারি মানে ক্যালেন্ডারের ৬ দিন নয়। \`RANGE BETWEEN 6 PRECEDING AND CURRENT ROW\` সারি নয়, ORDER BY-এর মান ধরে হিসাব করে — julianday-কে সংখ্যা বানিয়ে RANGE দিলেই আসল ৭ দিনের জানালা পাওয়া যায়।

## ধাপে ধাপে
১. daily CTE-তে দিন ধরে রেভিনিউ (ফাঁকা দিনের সারি তৈরি করতে হয় না)।
২. ORDER BY CAST(julianday(day) AS INTEGER) — সংখ্যায় দিন।
৩. SUM(...) OVER (... RANGE BETWEEN 6 PRECEDING AND CURRENT ROW)।
৪. শুরুর দিনগুলোতে জানালা ছোট — যা আছে তার যোগফলই আসবে।

## কোডে দেখি
\`\`\`sql
WITH daily AS (
  SELECT substr(o.ordered_at,1,10) AS day,
         SUM(oi.quantity*oi.unit_price_cents) AS daily_cents
  FROM orders o JOIN order_items oi ON oi.order_id=o.id
  WHERE o.status IN ('paid','shipped') GROUP BY day)
SELECT day, daily_cents,
       SUM(daily_cents) OVER (
         ORDER BY CAST(julianday(day) AS INTEGER)
         RANGE BETWEEN 6 PRECEDING AND CURRENT ROW) AS trailing_7d_cents
FROM daily ORDER BY day;
\`\`\`

## সাধারণ ভুল
ROWS দিয়ে 6 PRECEDING — ফাঁকা দিন উপেক্ষা করে ৭ সারি গুনে বড় মান দেখায়; দিনের স্ট্রিং সরাসরি ORDER BY-তে দিয়ে RANGE ব্যবহার করা (SQLite-এ স্ট্রিং offset চলে না, সংখ্যা লাগবে); julianday REAL রেখে দিলে ভাগশেষ-জাত পিয়ার সমস্যা — CAST AS INTEGER নিরাপদ।`,
    difficulty: "HARD",
    points: 340,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    premiumModuleSlug: "advanced-sql",
    category: "SQL Advanced",
    subcategory: "Window functions",
    referencePython: "",
    referenceSql: `WITH daily AS (
  SELECT substr(o.ordered_at,1,10) AS day, SUM(oi.quantity*oi.unit_price_cents) AS daily_cents
  FROM orders o JOIN order_items oi ON oi.order_id=o.id
  WHERE o.status IN ('paid','shipped') GROUP BY day)
SELECT day, daily_cents,
       SUM(daily_cents) OVER (
         ORDER BY CAST(julianday(day) AS INTEGER)
         RANGE BETWEEN 6 PRECEDING AND CURRENT ROW) AS trailing_7d_cents
FROM daily ORDER BY day;`,
    tests: [
      {
        input: ``,
        expectedOutput: `2026-10-01	890000	890000
2026-10-05	600000	1490000
2026-10-10	2000000	2600000
2026-10-20	605000	605000
2026-10-22	670000	1275000
2026-10-25	180000	1455000
2026-10-28	120000	970000
2026-11-02	380000	500000`,
        isSample: true
      },
      {
        input: `insert into orders (id,customer_id,ordered_at,status) values (11,5,'2026-10-26','paid'); insert into order_items (id,order_id,product_id,quantity,unit_price_cents) values (16,11,8,1,85000);`,
        expectedOutput: `2026-10-01	890000	890000
2026-10-05	600000	1490000
2026-10-10	2000000	2600000
2026-10-20	605000	605000
2026-10-22	670000	1275000
2026-10-25	180000	1455000
2026-10-26	85000	1540000
2026-10-28	120000	1055000
2026-11-02	380000	500000`,
        isSample: true
      },
      {
        input: `update orders set ordered_at='2026-10-04' where id=3;`,
        expectedOutput: `2026-10-01	890000	890000
2026-10-04	600000	1490000
2026-10-10	2000000	2600000
2026-10-20	605000	605000
2026-10-22	670000	1275000
2026-10-25	180000	1455000
2026-10-28	120000	970000
2026-11-02	380000	500000`,
        isSample: false
      },
      {
        input: `update orders set status='pending' where id=9;`,
        expectedOutput: `2026-10-01	890000	890000
2026-10-05	600000	1490000
2026-10-10	2000000	2600000
2026-10-20	605000	605000
2026-10-22	670000	1275000
2026-10-25	180000	1455000
2026-11-02	380000	380000`,
        isSample: false
      },
      {
        input: `insert into orders (id,customer_id,ordered_at,status) values (12,1,'2026-10-02','paid'); insert into order_items (id,order_id,product_id,quantity,unit_price_cents) values (17,12,2,1,220000);`,
        expectedOutput: `2026-10-01	890000	890000
2026-10-02	220000	1110000
2026-10-05	600000	1710000
2026-10-10	2000000	2600000
2026-10-20	605000	605000
2026-10-22	670000	1275000
2026-10-25	180000	1455000
2026-10-28	120000	970000
2026-11-02	380000	500000`,
        isSample: false
      },
    ],
  },
];
