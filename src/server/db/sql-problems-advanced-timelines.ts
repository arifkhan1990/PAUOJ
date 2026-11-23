import type { SeedProblem } from "./seed-problems";

export const SQL_PROBLEMS_ADVANCED_TIMELINES: SeedProblem[] = [
  {
    slug: "sql-adv-moving-average",
    title: "Daily revenue moving average",
    statement: `ShopSphere-এর অ্যানালিটিক্স টিম প্রতিদিনের বিক্রির ওঠানামা মসৃণ করে দেখতে চায়। paid/shipped অর্ডার থেকে প্রতিদিনের মোট রেভিনিউ (সেন্টে) বের করো, আর প্রতিটি দিনের জন্য সেই দিনসহ আগের ৬টি সারির (মোট ৭ সারির) চলমান গড় (moving average) দুই দশমিক পর্যন্ত round করো। শুরুর দিকে ৭টির কম সারি থাকলে যত সারি আছে তাদেরই গড় হবে। দিন অনুযায়ী সাজাও।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`day\` (YYYY-MM-DD), \`daily_cents\`, \`moving_avg\`।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## কেন দরকার
এক একদিনের রেভিনিউ আকস্মিক লাফায়—কেউ একটা দামি মনিটর কিনলেই সেই দিনের গ্রাফ ছাদে ওঠে, পরদিন মেঝেতে নামে। এই noise দেখে সিদ্ধান্ত নিলে ভুল হয়: ভালো দিনকে trend আর খারাপ দিনকে বিপর্যয় ভাবা হয়। ৭-দিনের moving average হঠাৎ ওঠানামা মসৃণ করে আসল ধারা দেখায়—কেনাকাটার ডেটা দিনে-দিনে নয়, সপ্তাহের স্কেলে বোঝা যায়।

## মূল ধারণা
প্রথমে CTE-তে দিন ধরে রেভিনিউ যোগ করো—এক দিনে একাধিক অর্ডার থাকতে পারে, তাই আগেই এক দিন = এক সারি বানাও। তারপর চালাও \`AVG(daily_cents) OVER (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)\`। এখানে \`ROWS\` frame বলে দেয়: বর্তমান সারিসহ ঠিক ৬টি আগের সারি গড়ে ধরা হবে—দিনের ব্যবধান নয়, সারির সংখ্যা গোনা হয়। শুরুর সারিগুলোতে ৬টি আগের সারি নেই, তাই frame ছোট থাকে—যত আছে ততই গড়, আর সেটাই প্রত্যাশিত।

## ধাপে ধাপে
১. orders-এর সাথে order_items জোড়া লাগাও, \`status IN ('paid','shipped')\` ফিল্টার করো।
২. \`substr(ordered_at,1,10)\` দিয়ে দিন বানিয়ে GROUP BY day, SUM দিয়ে daily_cents।
৩. বাইরের SELECT-এ AVG window চালাও, frame \`ROWS BETWEEN 6 PRECEDING AND CURRENT ROW\`।
৪. \`ROUND(...,2)\` করে \`ORDER BY day\` দিয়ে সাজাও।

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
       ROUND(AVG(daily_cents) OVER (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW), 2) AS moving_avg
FROM daily
ORDER BY day;
\`\`\`

## কমপ্লেক্সিটি
GROUP BY-তে O(n) স্ক্যান, window-এর sort-এ O(d log d) (d = দিনের সংখ্যা), আর প্রতিটি সারিতে frame-এর গড় ধ্রুব সময়—frame সর্বোচ্চ ৭টি সারি। মোট প্রায় O(n + d log d)।

## সাধারণ ভুল
frame-এ \`ROWS\`-এর বদলে \`RANGE\` লেখা; \`AVG(...) OVER ()\` দিয়ে পুরো সময়ের গড় বের করা, যা চলমান গড় নয়; order_items না জুড়ে শুধু orders থেকে হিসাব করা; window-এর \`ORDER BY day\` বাদ দিলে frame অর্থহীন হয়; শেষে \`ORDER BY\` না দিলে আউটপুটের ক্রম অনির্দিষ্ট হয়ে যায়।`,
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
  WHERE o.status IN ('paid','shipped') GROUP BY day
)
SELECT day, daily_cents,
       round(AVG(daily_cents) OVER (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW), 2) AS moving_avg
FROM daily ORDER BY day;`,
    tests: [
      {
        input: ``,
        expectedOutput: `2026-10-01	890000	890000.0
2026-10-05	600000	745000.0
2026-10-10	2000000	1163333.33
2026-10-20	605000	1023750.0
2026-10-22	670000	953000.0
2026-10-25	180000	824166.67
2026-10-28	120000	723571.43
2026-11-02	380000	650714.29`,
        isSample: true
      },
      {
        input: `update orders set status='cancelled' where id in (3,6);`,
        expectedOutput: `2026-10-01	890000	890000.0
2026-10-10	2000000	1445000.0
2026-10-22	670000	1186666.67
2026-10-25	180000	935000.0
2026-10-28	120000	772000.0
2026-11-02	380000	706666.67`,
        isSample: true
      },
      {
        input: `insert into orders (id,customer_id,ordered_at,status) values (11,3,'2026-11-05','paid'); insert into order_items (id,order_id,product_id,quantity,unit_price_cents) values (16,11,13,1,210000);`,
        expectedOutput: `2026-10-01	890000	890000.0
2026-10-05	600000	745000.0
2026-10-10	2000000	1163333.33
2026-10-20	605000	1023750.0
2026-10-22	670000	953000.0
2026-10-25	180000	824166.67
2026-10-28	120000	723571.43
2026-11-02	380000	650714.29
2026-11-05	210000	595000.0`,
        isSample: false
      },
      {
        input: `update orders set ordered_at='2026-10-05' where id=4;`,
        expectedOutput: `2026-10-01	890000	890000.0
2026-10-05	2600000	1745000.0
2026-10-20	605000	1365000.0
2026-10-22	670000	1191250.0
2026-10-25	180000	989000.0
2026-10-28	120000	844166.67
2026-11-02	380000	777857.14`,
        isSample: false
      },
      {
        input: `update orders set status='cancelled' where id in (9,10);`,
        expectedOutput: `2026-10-01	890000	890000.0
2026-10-05	600000	745000.0
2026-10-10	2000000	1163333.33
2026-10-20	605000	1023750.0
2026-10-22	670000	953000.0
2026-10-25	180000	824166.67`,
        isSample: false
      },
    ],
  },
  {
    slug: "sql-adv-customer-running",
    title: "Customer running total",
    statement: `গ্রোথ টিম জানতে চায় প্রতিটি কাস্টমার ধীরে ধীরে কত টাকা খরচ করছে। paid/shipped অর্ডার থেকে প্রতিটি অর্ডারের মোট (সেন্টে) বের করো, আর অর্ডারের তারিখ অনুযায়ী সাজিয়ে সেই কাস্টমারের চলমান মোট (running total) দেখাও—অর্থাৎ ওই অর্ডার পর্যন্ত কাস্টমারটি মোট কত খরচ করেছে। একই তারিখে একাধিক অর্ডার থাকলে ছোট order_id আগে গণনা হবে। কাস্টমারের নাম, তারপর অর্ডার অনুযায়ী সাজাও।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`customer\`, \`order_id\`, \`order_cents\`, \`running_cents\`।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## কেন দরকার
"এই কাস্টমার এ পর্যন্ত মোট কত কিনেছে?"—এই প্রশ্নের উত্তর প্রতিটি অর্ডারের পর বদলায়। VIP লিস্ট বানাতে, loyalty tier ঠিক করতে বা credit limit দিতে প্রতিটি অর্ডার পর্যন্ত জমা মোট লাগে। আলাদা subquery দিয়ে প্রতিটি সারির জমা বের করা যায়, কিন্তু সেটা ধীর আর ঝামেলাপূর্ণ। Window function একবারেই প্রতিটি সারির পাশে তার জমা মোট বসিয়ে দেয়।

## মূল ধারণা
প্রথমে CTE-তে প্রতিটি অর্ডারের মোট বের করো (order_id ধরে GROUP BY)। তারপর চালাও \`SUM(order_cents) OVER (PARTITION BY customer ORDER BY ordered_at, order_id)\`: \`PARTITION BY customer\` প্রতিটি কাস্টমারের জন্য জমা শূন্য থেকে শুরু করে, আর \`ORDER BY ordered_at, order_id\` বলে কোন ক্রমে জমা হবে। order_id টাই-ব্রেকার—একই তারিখে দুটি অর্ডার থাকলে order_id ছাড়া জমার ক্রম অনির্দিষ্ট হয়ে যেত।

## ধাপে ধাপে
১. orders ⋈ customers ⋈ order_items জোড়া লাগাও, \`status IN ('paid','shipped')\` ফিল্টার।
২. GROUP BY o.id দিয়ে প্রতি অর্ডারের order_cents বের করো (ordered_at-ও CTE-তে রাখো)।
৩. বাইরের SELECT-এ SUM window চালাও, PARTITION BY customer।
৪. \`ORDER BY customer, order_id\` দিয়ে সাজাও।

## কোডে দেখি
\`\`\`sql
WITH order_totals AS (
  SELECT cu.name AS customer, o.id AS order_id, o.ordered_at,
         SUM(oi.quantity * oi.unit_price_cents) AS order_cents
  FROM orders o
  JOIN customers cu ON cu.id = o.customer_id
  JOIN order_items oi ON oi.order_id = o.id
  WHERE o.status IN ('paid', 'shipped')
  GROUP BY o.id
)
SELECT customer, order_id, order_cents,
       SUM(order_cents) OVER (PARTITION BY customer ORDER BY ordered_at, order_id) AS running_cents
FROM order_totals
ORDER BY customer, order_id;
\`\`\`

## কমপ্লেক্সিটি
জোড়া ও group-এ O(n), প্রতিটি partition ধরে sort-এ O(m log m)। Correlated subquery-র O(n²) পদ্ধতির তুলনায় বড় ডেটায় অনেক দ্রুত।

## সাধারণ ভুল
\`PARTITION BY customer\` বাদ দিলে সব কাস্টমারের টাকা এক পাত্রে জমে; ORDER BY-তে শুধু ordered_at রেখে order_id টাই-ব্রেক না দিলে একই তারিখে দুটি অর্ডারের জমা অদল-বদল হয়ে আসতে পারে; GROUP BY ছাড়া সরাসরি window চালালে order_items-এর প্রতিটি সারিতে জমা হয়ে যায়; বাইরের \`ORDER BY\` না দিলে চূড়ান্ত সারির ক্রম অনির্দিষ্ট।`,
    difficulty: "HARD",
    points: 320,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    premiumModuleSlug: "advanced-sql",
    category: "SQL Advanced",
    subcategory: "Window functions",
    referencePython: "",
    referenceSql: `WITH order_totals AS (
  SELECT cu.name AS customer, o.id AS order_id, o.ordered_at,
         SUM(oi.quantity*oi.unit_price_cents) AS order_cents
  FROM orders o JOIN customers cu ON cu.id=o.customer_id
  JOIN order_items oi ON oi.order_id=o.id
  WHERE o.status IN ('paid','shipped') GROUP BY o.id
)
SELECT customer, order_id, order_cents,
       SUM(order_cents) OVER (PARTITION BY customer ORDER BY ordered_at, order_id) AS running_cents
FROM order_totals ORDER BY customer, order_id;`,
    tests: [
      {
        input: ``,
        expectedOutput: `Karim	8	180000	180000
Mim	7	670000	670000
Nusrat	3	600000	600000
Nusrat	9	120000	720000
Rahim	1	890000	890000
Rahim	4	2000000	2890000
Rahim	6	605000	3495000
Tanvir	10	380000	380000`,
        isSample: true
      },
      {
        input: `update orders set status='shipped' where id=2;`,
        expectedOutput: `Karim	2	180000	180000
Karim	8	180000	360000
Mim	7	670000	670000
Nusrat	3	600000	600000
Nusrat	9	120000	720000
Rahim	1	890000	890000
Rahim	4	2000000	2890000
Rahim	6	605000	3495000
Tanvir	10	380000	380000`,
        isSample: true
      },
      {
        input: `update order_items set quantity=2 where id=14;`,
        expectedOutput: `Karim	8	180000	180000
Mim	7	670000	670000
Nusrat	3	600000	600000
Nusrat	9	240000	840000
Rahim	1	890000	890000
Rahim	4	2000000	2890000
Rahim	6	605000	3495000
Tanvir	10	380000	380000`,
        isSample: false
      },
      {
        input: `update orders set status='cancelled' where id in (4,6);`,
        expectedOutput: `Karim	8	180000	180000
Mim	7	670000	670000
Nusrat	3	600000	600000
Nusrat	9	120000	720000
Rahim	1	890000	890000
Tanvir	10	380000	380000`,
        isSample: false
      },
      {
        input: `update orders set status='shipped' where id=5;`,
        expectedOutput: `Karim	8	180000	180000
Mim	7	670000	670000
Nusrat	3	600000	600000
Nusrat	9	120000	720000
Rahim	1	890000	890000
Rahim	4	2000000	2890000
Rahim	6	605000	3495000
Sajid	5	170000	170000
Tanvir	10	380000	380000`,
        isSample: false
      },
    ],
  },
];
