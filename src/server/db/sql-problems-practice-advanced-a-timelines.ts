import type { SeedProblem } from "./seed-problems";

export const SQL_PROBLEMS_PRACTICE_ADVANCED_A_TIMELINES: SeedProblem[] = [
  {
    slug: "sql-practice-timelines-easy",
    title: "Cart adds moving average",
    statement: `মার্কেটিং টিম দেখতে চায় মানুষ কত আগ্রহে কার্টে পণ্য যোগ করছে। cart_items থেকে প্রতিদিন মোট কত unit কার্টে যোগ হয়েছে গুনো, আর প্রতিটি দিনের জন্য সেই দিনসহ আগের ২টি সারির (মোট ৩ সারির) চলমান গড় (moving average) দুই দশমিক পর্যন্ত round করো। শুরুর দিকে ৩টির কম সারি থাকলে যত সারি আছে তাদেরই গড় হবে। আউটপুট কলাম: day, units_added, moving_avg। দিন অনুযায়ী সাজাও।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`day\` (YYYY-MM-DD), \`units_added\`, \`moving_avg\` (দুই দশমিক), দিন অনুযায়ী।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## ধারণা
দানা হলো দিন। প্রথমে cart_items থেকে দিন ধরে SUM(quantity) করে দৈনিক সারি বানাও, তারপর উপরে \`AVG(...) OVER (ORDER BY day ROWS BETWEEN 2 PRECEDING AND CURRENT ROW)\`—বর্তমান সারিসহ ঠিক ৩টি সারির গড়। শুরুতে ৩-এর কম সারি পেলে window যতটুকু পায় ততটুকুর গড় দেয়, সেটাই প্রত্যাশিত।

## ধাপে ধাপে
১. cart_items থেকে \`substr(added_at, 1, 10)\` দিয়ে day বানাও।
২. দিন ধরে GROUP BY, SUM(quantity)।
৩. বাইরের SELECT-এ AVG window, frame \`ROWS BETWEEN 2 PRECEDING AND CURRENT ROW\`।
৪. ROUND(..., 2) আর ORDER BY day।

## কোডে দেখি
\`\`\`sql
WITH daily AS (
  SELECT substr(added_at, 1, 10) AS day, SUM(quantity) AS units_added
  FROM cart_items
  GROUP BY day
)
SELECT day, units_added,
       ROUND(AVG(units_added) OVER (ORDER BY day ROWS BETWEEN 2 PRECEDING AND CURRENT ROW), 2) AS moving_avg
FROM daily
ORDER BY day;
\`\`\`

## সাধারণ ভুল
দৈনিক সারি না বানিয়ে সরাসরি cart_items-এর উপর window চালানো; \`ROWS\`-এর বদলে \`RANGE\` লেখা (একই দিনের সারি জুড়ে যেতে পারে); window-এর ORDER BY day বাদ দিয়ে গড় অনির্দিষ্ট করা।`,
    difficulty: "EASY",
    points: 200,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    premiumModuleSlug: "advanced-sql",
    category: "SQL Advanced",
    subcategory: "Window functions",
    referencePython: "",
    referenceSql: `WITH daily AS (SELECT substr(added_at, 1, 10) AS day, SUM(quantity) AS units_added FROM cart_items GROUP BY day) SELECT day, units_added, ROUND(AVG(units_added) OVER (ORDER BY day ROWS BETWEEN 2 PRECEDING AND CURRENT ROW), 2) AS moving_avg FROM daily ORDER BY day;`,
    tests: [
      {
        input: ``,
        expectedOutput: `2026-09-30	3	3.0
2026-10-02	4	3.5
2026-10-04	3	3.33
2026-10-08	3	3.33
2026-10-20	3	3.0
2026-10-24	1	2.33
2026-11-01	2	2.0
2026-11-10	1	1.33`,
        isSample: true
      },
      {
        input: `insert into carts (id,customer_id,status,created_at,updated_at) values (9,6,'active','2026-11-11 10:00','2026-11-11 10:10'); insert into cart_items (id,cart_id,product_id,quantity,unit_price_cents,added_at) values (16,9,1,1,450000,'2026-11-11 10:05');`,
        expectedOutput: `2026-09-30	3	3.0
2026-10-02	4	3.5
2026-10-04	3	3.33
2026-10-08	3	3.33
2026-10-20	3	3.0
2026-10-24	1	2.33
2026-11-01	2	2.0
2026-11-10	1	1.33
2026-11-11	1	1.33`,
        isSample: true
      },
      {
        input: `update cart_items set quantity=3 where id=13;`,
        expectedOutput: `2026-09-30	3	3.0
2026-10-02	4	3.5
2026-10-04	3	3.33
2026-10-08	3	3.33
2026-10-20	3	3.0
2026-10-24	3	3.0
2026-11-01	2	2.67
2026-11-10	1	2.0`,
        isSample: false
      },
      {
        input: `delete from cart_items where cart_id=6;`,
        expectedOutput: `2026-09-30	3	3.0
2026-10-02	4	3.5
2026-10-04	3	3.33
2026-10-08	3	3.33
2026-10-20	3	3.0
2026-10-24	1	2.33
2026-11-10	1	1.67`,
        isSample: false
      },
      {
        input: `insert into cart_items (id,cart_id,product_id,quantity,unit_price_cents,added_at) values (17,7,1,2,450000,'2026-11-10 19:00');`,
        expectedOutput: `2026-09-30	3	3.0
2026-10-02	4	3.5
2026-10-04	3	3.33
2026-10-08	3	3.33
2026-10-20	3	3.0
2026-10-24	1	2.33
2026-11-01	2	2.0
2026-11-10	3	2.0`,
        isSample: false
      },
    ],
  },
  {
    slug: "sql-practice-timelines-medium",
    title: "Monthly running revenue",
    statement: `ফাইন্যান্স ড্যাশবোর্ডে দিনের পর দিন জমা রেভিনিউ দেখানো হয়, কিন্তু মাস পাল্টালে হিসাব নতুন করে শুরু হয়। paid/shipped অর্ডার থেকে দৈনিক রেভিনিউ (সেন্টে) বের করো আর প্রতিটি দিনের পাশে সেই মাসের ভেতরে ওই দিন পর্যন্ত জমা মোট (running total) দেখাও—নভেম্বরের প্রথম দিনে আবার ০ থেকে শুরু। আউটপুট কলাম: day, daily_cents, month_running_cents। দিন অনুযায়ী সাজাও।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`day\` (YYYY-MM-DD), \`daily_cents\`, \`month_running_cents\`, দিন অনুযায়ী।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## ধারণা
running total কোন পাত্রে জমবে সেটা PARTITION BY ঠিক করে। \`SUM(daily_cents) OVER (PARTITION BY substr(day, 1, 7) ORDER BY day)\` মানে প্রতিটি মাস নিজের আলাদা পাত্র—মাস পাল্টালে জমা আবার ০ থেকে শুরু। PARTITION বাদ দিলে সব মাস এক পাত্রে জমে যেত।

## ধাপে ধাপে
১. paid/shipped ফিল্টার করে দিন ধরে দৈনিক রেভিনিউর CTE বানাও।
২. \`substr(day, 1, 7)\` দিয়ে মাস বের করো।
৩. window-এ PARTITION BY মাস, ORDER BY day।
৪. ORDER BY day দিয়ে সাজাও।

## কোডে দেখি
\`\`\`sql
WITH daily AS (
  SELECT substr(o.ordered_at, 1, 10) AS day,
         SUM(oi.quantity * oi.unit_price_cents) AS daily_cents
  FROM orders o
  JOIN order_items oi ON oi.order_id = o.id
  WHERE o.status IN ('paid', 'shipped')
  GROUP BY day
)
SELECT day, daily_cents,
       SUM(daily_cents) OVER (PARTITION BY substr(day, 1, 7) ORDER BY day) AS month_running_cents
FROM daily
ORDER BY day;
\`\`\`

## সাধারণ ভুল
PARTITION BY বাদ দিয়ে নভেম্বরেও অক্টোবরের জমা টেনে আনা; \`ordered_at\`-এর পুরো টেক্সট ধরে গ্রুপ করে দানা ভুল হওয়া; বাতিল অর্ডার ধরে জমা বাড়িয়ে ফেলা।`,
    difficulty: "MEDIUM",
    points: 300,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    premiumModuleSlug: "advanced-sql",
    category: "SQL Advanced",
    subcategory: "Window functions",
    referencePython: "",
    referenceSql: `WITH daily AS (SELECT substr(o.ordered_at, 1, 10) AS day, SUM(oi.quantity*oi.unit_price_cents) AS daily_cents FROM orders o JOIN order_items oi ON oi.order_id=o.id WHERE o.status IN ('paid','shipped') GROUP BY day) SELECT day, daily_cents, SUM(daily_cents) OVER (PARTITION BY substr(day, 1, 7) ORDER BY day) AS month_running_cents FROM daily ORDER BY day;`,
    tests: [
      {
        input: ``,
        expectedOutput: `2026-10-01	890000	890000
2026-10-05	600000	1490000
2026-10-10	2000000	3490000
2026-10-20	605000	4095000
2026-10-22	670000	4765000
2026-10-25	180000	4945000
2026-10-28	120000	5065000
2026-11-02	380000	380000`,
        isSample: true
      },
      {
        input: `update orders set ordered_at='2026-11-15' where id=6;`,
        expectedOutput: `2026-10-01	890000	890000
2026-10-05	600000	1490000
2026-10-10	2000000	3490000
2026-10-22	670000	4160000
2026-10-25	180000	4340000
2026-10-28	120000	4460000
2026-11-02	380000	380000
2026-11-15	605000	985000`,
        isSample: true
      },
      {
        input: `insert into orders (id,customer_id,ordered_at,status) values (11,6,'2026-11-20','paid'); insert into order_items (id,order_id,product_id,quantity,unit_price_cents) values (16,11,12,1,350000);`,
        expectedOutput: `2026-10-01	890000	890000
2026-10-05	600000	1490000
2026-10-10	2000000	3490000
2026-10-20	605000	4095000
2026-10-22	670000	4765000
2026-10-25	180000	4945000
2026-10-28	120000	5065000
2026-11-02	380000	380000
2026-11-20	350000	730000`,
        isSample: false
      },
      {
        input: `update orders set status='cancelled' where id in (4,7);`,
        expectedOutput: `2026-10-01	890000	890000
2026-10-05	600000	1490000
2026-10-20	605000	2095000
2026-10-25	180000	2275000
2026-10-28	120000	2395000
2026-11-02	380000	380000`,
        isSample: false
      },
      {
        input: `update orders set ordered_at='2026-10-31' where id=10;`,
        expectedOutput: `2026-10-01	890000	890000
2026-10-05	600000	1490000
2026-10-10	2000000	3490000
2026-10-20	605000	4095000
2026-10-22	670000	4765000
2026-10-25	180000	4945000
2026-10-28	120000	5065000
2026-10-31	380000	5445000`,
        isSample: false
      },
    ],
  },
];
