import type { SeedProblem } from "./seed-problems";

export const SQL_PROBLEMS_PRACTICE_ADVANCED_A_FUNNELS_COUPONS: SeedProblem[] = [
  {
    slug: "sql-practice-funnels-coupons-easy",
    title: "City cart funnel",
    statement: `মার্কেটিং টিম শহরভিত্তিক কার্ট-ফানেল রিপোর্ট চায়। কাস্টমারের শহর ধরে গুনো: মোট কার্ট, কতটি converted, কতটি abandoned, কতটি active, আর conversion শতাংশ (এক দশমিক)। যে শহরের কাস্টমারের কার্ট আছে সেই শহর আউটপুটে আসবে। আউটপুট কলাম: city, carts, converted, abandoned, active, conversion_pct। শহরের নাম অনুযায়ী সাজাও।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`city\`, \`carts\`, \`converted\`, \`abandoned\`, \`active\`, \`conversion_pct\`, শহরের নাম অনুযায়ী।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## ধারণা
একটাই GROUP BY, ভেতরে চারটা গণনা: \`COUNT(*)\` মোট কার্ট আর প্রতিটি স্ট্যাটাসের জন্য \`SUM(CASE WHEN status = '...' THEN 1 ELSE 0 END)\`—এটাই conditional aggregation। শহর carts টেবিলে নেই, কাস্টমারের কাছে; JOIN করে আনতে হবে। শতাংশে 100.0 গুণ না করলে integer division সব শূন্য করে দেয়।

## ধাপে ধাপে
১. carts JOIN customers, শহর বের করো।
২. শহর ধরে GROUP BY।
৩. CASE দিয়ে converted/abandoned/active গোনো, COUNT(*) মোট।
৪. \`ROUND(100.0 * converted / carts, 1)\` আর ORDER BY city।

## কোডে দেখি
\`\`\`sql
SELECT cu.city,
       COUNT(*) AS carts,
       SUM(CASE WHEN c.status = 'converted' THEN 1 ELSE 0 END) AS converted,
       SUM(CASE WHEN c.status = 'abandoned' THEN 1 ELSE 0 END) AS abandoned,
       SUM(CASE WHEN c.status = 'active' THEN 1 ELSE 0 END) AS active,
       ROUND(100.0 * SUM(CASE WHEN c.status = 'converted' THEN 1 ELSE 0 END) / COUNT(*), 1) AS conversion_pct
FROM carts c
JOIN customers cu ON cu.id = c.customer_id
GROUP BY cu.city
ORDER BY cu.city;
\`\`\`

## সাধারণ ভুল
প্রতিটি স্ট্যাটাসের জন্য আলাদা query লিখে পরে জোড়া লাগানো; \`100\` দিয়ে integer division; \`WHERE status = 'converted'\` দিয়ে আগেই ফিল্টার করে ফানেলের আসল চিত্র লুকিয়ে ফেলা।`,
    difficulty: "EASY",
    points: 200,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    premiumModuleSlug: "advanced-sql",
    category: "SQL Advanced",
    subcategory: "Analytics",
    referencePython: "",
    referenceSql: `SELECT cu.city, COUNT(*) AS carts, SUM(CASE WHEN c.status='converted' THEN 1 ELSE 0 END) AS converted, SUM(CASE WHEN c.status='abandoned' THEN 1 ELSE 0 END) AS abandoned, SUM(CASE WHEN c.status='active' THEN 1 ELSE 0 END) AS active, ROUND(100.0 * SUM(CASE WHEN c.status='converted' THEN 1 ELSE 0 END) / COUNT(*), 1) AS conversion_pct FROM carts c JOIN customers cu ON cu.id = c.customer_id GROUP BY cu.city ORDER BY cu.city;`,
    tests: [
      {
        input: ``,
        expectedOutput: `Chattogram	2	1	1	0	50.0
Dhaka	4	2	0	2	50.0
Khulna	1	1	0	0	100.0
Sylhet	1	0	1	0	0.0`,
        isSample: true
      },
      {
        input: `insert into carts (id,customer_id,status,created_at,updated_at) values (9,4,'converted','2026-11-12 09:00','2026-11-12 10:00');`,
        expectedOutput: `Chattogram	2	1	1	0	50.0
Dhaka	4	2	0	2	50.0
Khulna	1	1	0	0	100.0
Sylhet	2	1	1	0	50.0`,
        isSample: true
      },
      {
        input: `update carts set status='converted' where id=2;`,
        expectedOutput: `Chattogram	2	2	0	0	100.0
Dhaka	4	2	0	2	50.0
Khulna	1	1	0	0	100.0
Sylhet	1	0	1	0	0.0`,
        isSample: false
      },
      {
        input: `insert into carts (id,customer_id,status,created_at,updated_at) values (10,1,'abandoned','2026-11-13 12:00','2026-11-13 12:30');`,
        expectedOutput: `Chattogram	2	1	1	0	50.0
Dhaka	5	2	1	2	40.0
Khulna	1	1	0	0	100.0
Sylhet	1	0	1	0	0.0`,
        isSample: false
      },
      {
        input: `update carts set status='abandoned' where id=5;`,
        expectedOutput: `Chattogram	2	1	1	0	50.0
Dhaka	4	2	0	2	50.0
Khulna	1	0	1	0	0.0
Sylhet	1	0	1	0	0.0`,
        isSample: false
      },
    ],
  },
  {
    slug: "sql-practice-funnels-coupons-medium",
    title: "Abandoned cart value",
    statement: `ফানেলে ঠিক কোথায় কত টাকা আটকে পড়ছে? কার্ট তৈরির মাস ধরে বের করো: কতটি কার্ট abandoned হয়েছে, সেই সব abandoned কার্টের আইটেমের মোট মূল্য (সেন্টে, quantity × unit_price_cents), আর abandoned প্রতি কার্টে গড়ে কত টাকা আটকে ছিল (দুই দশমিক)। কোনো মাসে abandoned কার্ট না থাকলে গড় NULL হবে; আইটেম না থাকা abandoned কার্টের মূল্য 0 ধরা হবে; কোনো মাস বাদ যাবে না। আউটপুট কলাম: month, abandoned_carts, stuck_cents, avg_stuck_cents। মাস অনুযায়ী সাজাও।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`month\` (YYYY-MM), \`abandoned_carts\`, \`stuck_cents\`, \`avg_stuck_cents\` (abandoned না থাকলে \`\\N\`), মাস অনুযায়ী।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## ধারণা
cart_items-এ এক কার্টের অনেক সারি; সরাসরি মাস ধরে গুনলে ৩-আইটেমের কার্ট ৩বার গোনা হয়—ফানেলের হিসাব ফুলে যায়। তাই প্রথমে CTE-তে এক কার্ট = এক সারি বানাও (carts LEFT JOIN cart_items, কার্ট ধরে GROUP BY, আইটেম না থাকলে COALESCE 0), তারপর মাস ধরে গোনো আর টাকা জোড়ো। গড়ের ভাগে \`NULLIF(abandoned_carts, 0)\` দিলে abandoned শূন্য এমন মাসে NULL আসে—০ দিয়ে ভাগের বিপদ এড়ানো যায়।

## ধাপে ধাপে
১. carts LEFT JOIN cart_items, কার্ট ধরে GROUP BY—প্রতিটি কার্টের মূল্য এক সারিতে।
২. মাস = \`substr(created_at, 1, 7)\`।
৩. মাস ধরে GROUP BY; CASE দিয়ে abandoned গোনো আর শুধু abandoned-এর মূল্য জোড়ো।
৪. \`ROUND(stuck * 1.0 / NULLIF(abandoned, 0), 2)\` গড়, ORDER BY month।

## কোডে দেখি
\`\`\`sql
WITH cart_value AS (
  SELECT substr(c.created_at, 1, 7) AS month, c.status,
         COALESCE(SUM(ci.quantity * ci.unit_price_cents), 0) AS value_cents
  FROM carts c
  LEFT JOIN cart_items ci ON ci.cart_id = c.id
  GROUP BY c.id
)
SELECT month,
       SUM(CASE WHEN status = 'abandoned' THEN 1 ELSE 0 END) AS abandoned_carts,
       SUM(CASE WHEN status = 'abandoned' THEN value_cents ELSE 0 END) AS stuck_cents,
       ROUND(SUM(CASE WHEN status = 'abandoned' THEN value_cents ELSE 0 END) * 1.0
             / NULLIF(SUM(CASE WHEN status = 'abandoned' THEN 1 ELSE 0 END), 0), 2) AS avg_stuck_cents
FROM cart_value
GROUP BY month
ORDER BY month;
\`\`\`

## সাধারণ ভুল
সরাসরি cart_items JOIN করে মাস ধরে কার্ট গুনলে বহু-আইটেম কার্ট বারবার গোনা; INNER JOIN করে আইটেম-নেই কার্ট হারানো; ০ দিয়ে ভাগ; কার্টের \`updated_at\` ধরে মাস বানানো—কার্ট কোন মাসে তৈরি হয়েছে সেটা \`created_at\`-ই বলে।`,
    difficulty: "MEDIUM",
    points: 300,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    premiumModuleSlug: "advanced-sql",
    category: "SQL Advanced",
    subcategory: "Analytics",
    referencePython: "",
    referenceSql: `WITH cart_value AS (SELECT substr(c.created_at, 1, 7) AS month, c.status, COALESCE(SUM(ci.quantity*ci.unit_price_cents), 0) AS value_cents FROM carts c LEFT JOIN cart_items ci ON ci.cart_id = c.id GROUP BY c.id) SELECT month, SUM(CASE WHEN status='abandoned' THEN 1 ELSE 0 END) AS abandoned_carts, SUM(CASE WHEN status='abandoned' THEN value_cents ELSE 0 END) AS stuck_cents, ROUND(SUM(CASE WHEN status='abandoned' THEN value_cents ELSE 0 END) * 1.0 / NULLIF(SUM(CASE WHEN status='abandoned' THEN 1 ELSE 0 END), 0), 2) AS avg_stuck_cents FROM cart_value GROUP BY month ORDER BY month;`,
    tests: [
      {
        input: ``,
        expectedOutput: `2026-09	0	0	\\N
2026-10	2	1130000	565000.0
2026-11	0	0	\\N`,
        isSample: true
      },
      {
        input: `insert into carts (id,customer_id,status,created_at,updated_at) values (9,6,'abandoned','2026-11-14 09:00','2026-11-14 09:30'); insert into cart_items (id,cart_id,product_id,quantity,unit_price_cents,added_at) values (16,9,3,1,1850000,'2026-11-14 09:05');`,
        expectedOutput: `2026-09	0	0	\\N
2026-10	2	1130000	565000.0
2026-11	1	1850000	1850000.0`,
        isSample: true
      },
      {
        input: `update carts set status='converted' where id=2;`,
        expectedOutput: `2026-09	0	0	\\N
2026-10	1	380000	380000.0
2026-11	0	0	\\N`,
        isSample: false
      },
      {
        input: `delete from cart_items where cart_id=2;`,
        expectedOutput: `2026-09	0	0	\\N
2026-10	2	380000	190000.0
2026-11	0	0	\\N`,
        isSample: false
      },
      {
        input: `insert into carts (id,customer_id,status,created_at,updated_at) values (10,3,'abandoned','2026-12-01 10:00','2026-12-01 10:20'); insert into cart_items (id,cart_id,product_id,quantity,unit_price_cents,added_at) values (17,10,7,2,120000,'2026-12-01 10:05');`,
        expectedOutput: `2026-09	0	0	\\N
2026-10	2	1130000	565000.0
2026-11	0	0	\\N
2026-12	1	240000	240000.0`,
        isSample: false
      },
    ],
  },
];
