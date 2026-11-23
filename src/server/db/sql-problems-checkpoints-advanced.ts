import type { SeedProblem } from "./seed-problems";

export const SQL_PROBLEMS_CHECKPOINTS_ADVANCED: SeedProblem[] = [
  {
    slug: "sql-check-adv-vendor-month",
    title: "Vendor monthly revenue",
    statement: `অ্যাডভান্সড চেকপয়েন্ট: প্রতি ভেন্ডরের প্রতি মাসের রেভিনিউ (paid/shipped, সেন্টে) বের করো; ভেন্ডর ও মাস অনুযায়ী সাজাও।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`vendor\`, \`month\`, \`revenue_cents\`।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## ধারণা
দুই লেভেলে গ্রুপ: ভেন্ডর + মাস।

## ধাপে ধাপে
1. vendors→products→items→orders।
2. \`substr(ordered_at,1,7)\` মাস।
3. GROUP BY v.id, month।

\`\`\`sql
SELECT v.name, substr(o.ordered_at,1,7) AS month,
       SUM(oi.quantity*oi.unit_price_cents) AS revenue_cents
FROM vendors v
JOIN products p ON p.vendor_id=v.id
JOIN order_items oi ON oi.product_id=p.id
JOIN orders o ON o.id=oi.order_id
WHERE o.status IN ('paid','shipped')
GROUP BY v.id, month
ORDER BY v.name, month;
\`\`\`

## কমপ্লেক্সিটি
\`O(n log n)\`।

## সাধারণ ভুল
শুধু মাস ধরে গ্রুপ করা (ভেন্ডর আলাদা থাকে না)।`,
    difficulty: "HARD",
    points: 300,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    premiumModuleSlug: "advanced-sql",
    category: "SQL Advanced",
    subcategory: "Checkpoint",
    referencePython: "",
    referenceSql: `SELECT v.name, substr(o.ordered_at,1,7) AS month, SUM(oi.quantity*oi.unit_price_cents) AS revenue_cents FROM vendors v JOIN products p ON p.vendor_id=v.id JOIN order_items oi ON oi.product_id=p.id JOIN orders o ON o.id=oi.order_id WHERE o.status IN ('paid','shipped') GROUP BY v.id, month ORDER BY v.name, month;`,
    tests: [
      {
        input: ``,
        expectedOutput: `BookBazar	2026-10	465000
GadgetPoint	2026-10	150000
HomeCraft	2026-10	540000
StyleHub	2026-10	720000
StyleHub	2026-11	380000
TechNest	2026-10	3190000`,
        isSample: true,
      },
      {
        input: `update orders set status='cancelled' where id in (3,6);`,
        expectedOutput: `BookBazar	2026-10	180000
GadgetPoint	2026-10	150000
HomeCraft	2026-10	220000
StyleHub	2026-10	120000
StyleHub	2026-11	380000
TechNest	2026-10	3190000`,
        isSample: true,
      },
      {
        input: `delete from reviews;`,
        expectedOutput: `BookBazar	2026-10	465000
GadgetPoint	2026-10	150000
HomeCraft	2026-10	540000
StyleHub	2026-10	720000
StyleHub	2026-11	380000
TechNest	2026-10	3190000`,
        isSample: false,
      },
      {
        input: `update products set stock=9 where stock>=10;`,
        expectedOutput: `BookBazar	2026-10	465000
GadgetPoint	2026-10	150000
HomeCraft	2026-10	540000
StyleHub	2026-10	720000
StyleHub	2026-11	380000
TechNest	2026-10	3190000`,
        isSample: false,
      },
      {
        input: `insert into orders (id,customer_id,ordered_at,status) values (11,6,'2026-11-05','paid'); insert into order_items (id,order_id,product_id,quantity,unit_price_cents) values (16,11,13,1,210000);`,
        expectedOutput: `BookBazar	2026-10	465000
BookBazar	2026-11	210000
GadgetPoint	2026-10	150000
HomeCraft	2026-10	540000
StyleHub	2026-10	720000
StyleHub	2026-11	380000
TechNest	2026-10	3190000`,
        isSample: false,
      },
    ],
  },
  {
    slug: "sql-check-adv-repeat",
    title: "Repeat buyers",
    statement: `অ্যাডভান্সড চেকপয়েন্ট: paid/shipped অর্ডারে একাধিকবার কিনেছে এমন কাস্টমারের নাম ও অর্ডার সংখ্যা; নাম অনুযায়ী সাজাও।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`name\` ও \`order_count\`।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## ধারণা
GROUP BY + HAVING + COUNT(DISTINCT)।

## ধাপে ধাপে
1. customers JOIN orders।
2. paid/shipped।
3. GROUP BY c.id HAVING >1।

\`\`\`sql
SELECT c.name, COUNT(DISTINCT o.id) AS order_count
FROM customers c
JOIN orders o ON o.customer_id=c.id
WHERE o.status IN ('paid','shipped')
GROUP BY c.id
HAVING COUNT(DISTINCT o.id)>1
ORDER BY c.name;
\`\`\`

## কমপ্লেক্সিটি
\`O(n log n)\`।

## সাধারণ ভুল
WHERE-এ COUNT ব্যবহার করা।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    premiumModuleSlug: "advanced-sql",
    category: "SQL Advanced",
    subcategory: "Checkpoint",
    referencePython: "",
    referenceSql: `SELECT c.name, COUNT(DISTINCT o.id) AS order_count FROM customers c JOIN orders o ON o.customer_id=c.id WHERE o.status IN ('paid','shipped') GROUP BY c.id HAVING COUNT(DISTINCT o.id)>1 ORDER BY c.name;`,
    tests: [
      {
        input: ``,
        expectedOutput: `Nusrat	2
Rahim	3`,
        isSample: true,
      },
      {
        input: `update orders set status='cancelled' where id in (3,6);`,
        expectedOutput: `Rahim	2`,
        isSample: true,
      },
      {
        input: `delete from reviews;`,
        expectedOutput: `Nusrat	2
Rahim	3`,
        isSample: false,
      },
      {
        input: `update products set stock=9 where stock>=10;`,
        expectedOutput: `Nusrat	2
Rahim	3`,
        isSample: false,
      },
      {
        input: `insert into orders (id,customer_id,ordered_at,status) values (11,6,'2026-11-05','paid'); insert into order_items (id,order_id,product_id,quantity,unit_price_cents) values (16,11,13,1,210000);`,
        expectedOutput: `Nusrat	2
Rahim	3
Tanvir	2`,
        isSample: false,
      },
    ],
  },
  {
    slug: "sql-check-adv-value",
    title: "Stock value by vendor",
    statement: `অ্যাডভান্সড চেকপয়েন্ট: প্রতি ভেন্ডরের মোট স্টক ভ্যালু (\`price_cents * stock\`, সেন্টে) বের করো; বেশি ভ্যালু আগে, টাইলে নাম।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`name\` ও \`stock_value_cents\`।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## ধারণা
JOIN + SUM(price*stock) + GROUP BY।

## ধাপে ধাপে
1. vendors JOIN products।
2. প্রতি ভেন্ডরে \`SUM(price_cents*stock)\`।
3. DESC, name।

\`\`\`sql
SELECT v.name, SUM(p.price_cents*p.stock) AS stock_value_cents
FROM vendors v
JOIN products p ON p.vendor_id=v.id
GROUP BY v.id
ORDER BY stock_value_cents DESC, v.name;
\`\`\`

## কমপ্লেক্সিটি
\`O(n log n)\`।

## সাধারণ ভুল
SUM-এর ভেতরে শুধু price বা শুধু stock নেওয়া।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    premiumModuleSlug: "advanced-sql",
    category: "SQL Advanced",
    subcategory: "Checkpoint",
    referencePython: "",
    referenceSql: `SELECT v.name, SUM(p.price_cents*p.stock) AS stock_value_cents FROM vendors v JOIN products p ON p.vendor_id=v.id GROUP BY v.id ORDER BY stock_value_cents DESC, v.name;`,
    tests: [
      {
        input: ``,
        expectedOutput: `TechNest	17110000
StyleHub	9020000
BookBazar	8775000
HomeCraft	3900000
GadgetPoint	1905000`,
        isSample: true,
      },
      {
        input: `update orders set status='cancelled' where id in (3,6);`,
        expectedOutput: `TechNest	17110000
StyleHub	9020000
BookBazar	8775000
HomeCraft	3900000
GadgetPoint	1905000`,
        isSample: true,
      },
      {
        input: `delete from reviews;`,
        expectedOutput: `TechNest	17110000
StyleHub	9020000
BookBazar	8775000
HomeCraft	3900000
GadgetPoint	1905000`,
        isSample: false,
      },
      {
        input: `update products set stock=9 where stock>=10;`,
        expectedOutput: `TechNest	15760000
StyleHub	5900000
BookBazar	4365000
HomeCraft	2910000
GadgetPoint	1605000`,
        isSample: false,
      },
      {
        input: `insert into orders (id,customer_id,ordered_at,status) values (11,6,'2026-11-05','paid'); insert into order_items (id,order_id,product_id,quantity,unit_price_cents) values (16,11,13,1,210000);`,
        expectedOutput: `TechNest	17110000
StyleHub	9020000
BookBazar	8775000
HomeCraft	3900000
GadgetPoint	1905000`,
        isSample: false,
      },
    ],
  },
];
