import type { SeedProblem } from "./seed-problems";

/**
 * Script-mode SQL labs: DDL, DML and transactions against the in-memory
 * ShopSphere fixture. The judge runs every statement and compares only the
 * rows of the final SELECT. Writes never leave the sandbox.
 */

const CREATE_INDEX_SCRIPT = `CREATE INDEX idx_orders_customer_date ON orders (customer_id, ordered_at);

SELECT m.name AS index_name, o.id AS order_id, o.ordered_at
FROM sqlite_master AS m
CROSS JOIN orders AS o
WHERE m.type = 'index'
  AND m.name = 'idx_orders_customer_date'
  AND o.customer_id = 1
ORDER BY o.ordered_at;`;

const CREATE_VIEW_SCRIPT = `CREATE VIEW vendor_revenue_v AS
SELECT v.name AS vendor,
       SUM(oi.quantity * oi.unit_price_cents) AS revenue_cents
FROM vendors AS v
JOIN products AS p ON p.vendor_id = v.id
JOIN order_items AS oi ON oi.product_id = p.id
GROUP BY v.id, v.name;

SELECT m.name AS view_name, r.vendor, r.revenue_cents
FROM sqlite_master AS m
CROSS JOIN vendor_revenue_v AS r
WHERE m.type = 'view'
  AND m.name = 'vendor_revenue_v'
ORDER BY r.revenue_cents DESC, r.vendor;`;

const DML_SCRIPT = `INSERT INTO products (id, vendor_id, category_id, name, price_cents, stock, rating)
VALUES (15, 5, 8, 'Copper Tea Pot', 275000, 4, 4.6);

UPDATE products SET stock = stock + 6 WHERE name = 'Webcam';

DELETE FROM products WHERE name = 'Dune';

SELECT p.id, p.name, p.stock,
       (SELECT COUNT(*) FROM products WHERE name = 'Dune') AS dune_rows
FROM products AS p
WHERE p.id = 15 OR p.name = 'Webcam'
ORDER BY p.id;`;

const TRANSACTION_SCRIPT = `BEGIN;

UPDATE products SET stock = stock + 100 WHERE id = 8;
UPDATE vendors SET rating = 1.0 WHERE id = 4;

ROLLBACK;

SELECT p.name AS product, p.stock, v.name AS vendor, v.rating
FROM products AS p
JOIN vendors AS v ON v.id = p.vendor_id
WHERE p.id = 8;`;

export const SQL_PROBLEMS_ADVANCED_LABS: SeedProblem[] = [
  {
    slug: "sql-lab-create-index",
    title: "Index lab: orders lookup",
    statement: `\`orders\` টেবিলে কাস্টমার আর তারিখ একসাথে ধরে খোঁজা হয়—প্রতিটি কাস্টমার-টাইমলাইন রিপোর্ট এই lookup-ই চালায়। তাই \`customer_id\` আর \`ordered_at\` নিয়ে composite index \`idx_orders_customer_date\` বানাও, তারপর \`sqlite_master\` থেকে index-এর নাম আর customer 1-এর অর্ডারগুলো (id ও ordered_at) বের করো।

স্ক্রিপ্টে একাধিক statement চলবে, কিন্তু শেষ statement-টা অবশ্যই SELECT বা EXPLAIN হতে হবে—judge শুধু শেষ SELECT-এর সারিগুলো মেলায়।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL script লেখো: আগে CREATE INDEX, শেষে SELECT।",
    outputFormat:
      "প্রতি লাইনে `index_name`, `order_id`, `ordered_at`; `ordered_at` অনুযায়ী সাজানো। Index তৈরি না হলে বা নাম ভুল হলে কোনো সারি আসবে না।",
    constraints:
      "ShopSphere fixture. Script mode: CREATE INDEX/VIEW, DML আর transaction চলবে; ATTACH, DETACH আর PRAGMA বন্ধ।",
    editorial: `## ধারণা
DDL মানে ডেটার গঠন বদলানো—\`CREATE\`, \`ALTER\`, \`DROP\`। Index হলো টেবিলের পাশে রাখা ক্রম-সাজানো ঠিকানা-খাতা, যাতে ইঞ্জিন পুরো টেবিল না পড়ে সরাসরি দরকারি সারিতে পৌঁছায়। \`(customer_id, ordered_at)\` ক্রমে composite index বানালে আগে customer ধরে, তার ভিতরে তারিখ ধরে খোঁজা দ্রুত হয়—বাঁয়ের কলাম একাও কাজে লাগে, তাই ক্রমটা equality কলাম আগে, range কলাম পরে।

ল্যাবে index আসলে কোথায় বসল, সেটা দেখা যায় \`sqlite_master\` থেকে—এটা SQLite-এর নিজের ক্যাটালগ টেবিল, যেখানে প্রতিটি টেবিল, index আর view-এর নাম আর ধরন লেখা থাকে। \`PRAGMA\` দিয়ে দেখা সহজ হতো, কিন্তু sandbox-এ PRAGMA বন্ধ; তাই ক্যাটালগ টেবিলই ভরসা।\n\n## ধাপে ধাপে
১. \`CREATE INDEX idx_orders_customer_date ON orders (customer_id, ordered_at);\` লেখো—নাম হুবহু এইটাই হতে হবে।
২. \`sqlite_master\`-এ \`type = 'index'\` আর নাম দিয়ে ফিল্টার করো।
৩. সেই এক সারির সাথে customer 1-এর অর্ডার জুড়ে id আর ordered_at নাও।
৪. \`ORDER BY ordered_at\` দিয়ে ক্রম ঠিক রাখো।

\`\`\`sql
${CREATE_INDEX_SCRIPT}
\`\`\`

## কমপ্লেক্সিটি
Index তৈরি একবারের কাজ, \`O(n log n)\`-এর কাছাকাছি; প্রতিটি lookup তারপর \`O(log n)\`। রিপোর্টের SELECT নিজে fixture-এর আকারে \`O(n)\`।

## সাধারণ ভুল
Index-এর নাম ভুল লেখা বা কলামের ক্রম উল্টে দেওয়া; \`sqlite_master\`-এ \`type = 'index'\` ফিল্টার না দেওয়া; শেষে SELECT না দিয়ে UPDATE-এ থামা; আর ধরে নেওয়া যে PRAGMA চলবে—এখানে সেটা denied।`,
    difficulty: "HARD",
    points: 350,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project", "DDL", "Indexes"],
    judgeLanguage: "sql-script",
    premiumModuleSlug: "advanced-sql",
    category: "SQL Advanced",
    subcategory: "DDL & indexes",
    referencePython: "",
    referenceSql: CREATE_INDEX_SCRIPT,
    tests: [
      {
        input: "",
        expectedOutput: `idx_orders_customer_date	1	2026-10-01
idx_orders_customer_date	4	2026-10-10
idx_orders_customer_date	6	2026-10-20`,
        isSample: true,
      },
      {
        input: "insert into orders (id,customer_id,ordered_at,status) values (11,1,'2026-11-05','paid');",
        expectedOutput: `idx_orders_customer_date	1	2026-10-01
idx_orders_customer_date	4	2026-10-10
idx_orders_customer_date	6	2026-10-20
idx_orders_customer_date	11	2026-11-05`,
        isSample: true,
      },
      {
        input: "update orders set customer_id = 2 where id = 6;",
        expectedOutput: `idx_orders_customer_date	1	2026-10-01
idx_orders_customer_date	4	2026-10-10`,
        isSample: false,
      },
      {
        input: "update orders set ordered_at = '2026-09-15' where id = 1;",
        expectedOutput: `idx_orders_customer_date	1	2026-09-15
idx_orders_customer_date	4	2026-10-10
idx_orders_customer_date	6	2026-10-20`,
        isSample: false,
      },
      {
        input:
          "delete from order_items where order_id in (1,4,6); delete from orders where customer_id = 1; insert into orders (id,customer_id,ordered_at,status) values (12,1,'2026-12-01','paid');",
        expectedOutput: `idx_orders_customer_date	12	2026-12-01`,
        isSample: false,
      },
    ],
  },
  {
    slug: "sql-lab-create-view",
    title: "View lab: vendor revenue",
    statement: `ভেন্ডর-রেভিনিউ রিপোর্ট বারবার দরকার, কিন্তু প্রতিবার একই JOIN-যোগ লিখতে গিয়ে ভুল হয়। তাই ভেন্ডরপ্রতি মোট বিক্রির হিসাব \`vendor_revenue_v\` নামের view হিসেবে সংরক্ষণ করো (কলাম: \`vendor\`, \`revenue_cents\`), তারপর সেই view থেকেই রেভিনিউ-ক্রমে সব ভেন্ডর দেখাও।

লক্ষ করো: index-এর মতো view-ও \`sqlite_master\`-এ লেখা থাকে, তাই শেষ SELECT-এ view-এর নামও ফেরত দিতে হবে। শেষ statement-টা SELECT হতে হবে।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL script লেখো: আগে CREATE VIEW, শেষে SELECT।",
    outputFormat:
      "প্রতি লাইনে `view_name`, `vendor`, `revenue_cents`; রেভিনিউ বেশি থেকে কম, সমান হলে vendor নাম অনুযায়ী।",
    constraints:
      "ShopSphere fixture. Script mode: CREATE VIEW/INDEX, DML আর transaction চলবে; ATTACH, DETACH আর PRAGMA বন্ধ।",
    editorial: `## ধারণা
View মানে সংরক্ষিত query-র নাম। একবার \`CREATE VIEW\` করলে পরে \`SELECT ... FROM view_name\` লিখলেই হয়—ভিতরের JOIN আর GROUP BY লুকিয়ে থাকে, আর সব রিপোর্ট একই হিসাব ব্যবহার করে। View নিজে ডেটা জমায় না; প্রতিবার চলার সময় ভিতরের query চালায়, তাই base টেবিল বদলালে view-এর ফলও বদলায়।

ShopSphere-এ ভেন্ডরের রেভিনিউ আসে \`order_items\` থেকে: \`quantity * unit_price_cents\`. কিন্তু order_items-এ vendor নেই, তাই \`products\` হয়ে \`vendors\`-এ যেতে হয়—দুই JOIN। GROUP BY \`v.id, v.name\` দিলে নাম এক হলেও দুই ভেন্ডর মিশে যাবে না।\n\n## ধাপে ধাপে
১. তিন টেবিল যোগ করো: vendors → products → order_items।
২. ভেন্ডর ধরে \`SUM(quantity * unit_price_cents)\` নাও, alias দাও \`revenue_cents\`।
৩. পুরো query-টা \`vendor_revenue_v\` নামে view বানাও।
৪. \`sqlite_master\`-এ view-এর এক সারির সাথে view-টি CROSS JOIN করে নাম আর রেভিনিউ একসাথে দেখাও।
৫. \`ORDER BY revenue_cents DESC, vendor\` দিয়ে ক্রম স্থির করো।

\`\`\`sql
${CREATE_VIEW_SCRIPT}
\`\`\`

## কমপ্লেক্সিটি
প্রতিবার view চললে JOIN + GROUP BY, তাই \`O(n log n)\`-এর কাছাকাছি; রিপোর্ট নিজে view-এর ওপর শুধু sort করে।

## সাধারণ ভুল
\`unit_price_cents\`-এর বদলে products.price ব্যবহার করা; GROUP BY-তে শুধু \`v.name\` রেখে একই নামের ভেন্ডর মিশিয়ে ফেলা; view-এর নাম ভুলে \`sqlite_master\` ফিল্টার না মেলা; আর ORDER BY-তে tie-breaker না দেওয়া।`,
    difficulty: "HARD",
    points: 350,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project", "DDL", "Views"],
    judgeLanguage: "sql-script",
    premiumModuleSlug: "advanced-sql",
    category: "SQL Advanced",
    subcategory: "DDL & indexes",
    referencePython: "",
    referenceSql: CREATE_VIEW_SCRIPT,
    tests: [
      {
        input: "",
        expectedOutput: `vendor_revenue_v	TechNest	3190000
vendor_revenue_v	StyleHub	1100000
vendor_revenue_v	BookBazar	645000
vendor_revenue_v	HomeCraft	540000
vendor_revenue_v	GadgetPoint	320000`,
        isSample: true,
      },
      {
        input:
          "insert into order_items (id,order_id,product_id,quantity,unit_price_cents) values (16,1,4,5,180000);",
        expectedOutput: `vendor_revenue_v	TechNest	3190000
vendor_revenue_v	BookBazar	1545000
vendor_revenue_v	StyleHub	1100000
vendor_revenue_v	HomeCraft	540000
vendor_revenue_v	GadgetPoint	320000`,
        isSample: true,
      },
      {
        input: "delete from order_items where product_id in (10,11);",
        expectedOutput: `vendor_revenue_v	TechNest	3190000
vendor_revenue_v	StyleHub	1100000
vendor_revenue_v	BookBazar	645000
vendor_revenue_v	GadgetPoint	320000`,
        isSample: false,
      },
      {
        input: "update order_items set quantity = 3 where product_id = 3;",
        expectedOutput: `vendor_revenue_v	TechNest	6890000
vendor_revenue_v	StyleHub	1100000
vendor_revenue_v	BookBazar	645000
vendor_revenue_v	HomeCraft	540000
vendor_revenue_v	GadgetPoint	320000`,
        isSample: false,
      },
      {
        input:
          "insert into order_items (id,order_id,product_id,quantity,unit_price_cents) values (17,2,13,2,210000);",
        expectedOutput: `vendor_revenue_v	TechNest	3190000
vendor_revenue_v	StyleHub	1100000
vendor_revenue_v	BookBazar	1065000
vendor_revenue_v	HomeCraft	540000
vendor_revenue_v	GadgetPoint	320000`,
        isSample: false,
      },
    ],
  },
  {
    slug: "sql-lab-dml",
    title: "DML lab: product lifecycle",
    statement: `গুদাম টিম নতুন একটি পণ্য তোলে, একটি পণ্যের স্টক বাড়ায়, আর বন্ধ হওয়া একটি পণ্য তালিকা থেকে সরায়। এই তিন ধাপ—INSERT, UPDATE, DELETE—একই script-এ করো:

নতুন পণ্য \`id = 15\`, vendor 5, category 8, নাম \`Copper Tea Pot\`, দাম 275000 সেন্ট, স্টক 4, রেটিং 4.6 হিসেবে যোগ করো; \`Webcam\`-এর স্টক 6 বাড়াও; \`Dune\` নামের পণ্যটি মুছে ফেলো। শেষে id 15 আর Webcam-এর সারি (id, name, stock) দেখাও, সাথে \`Dune\` বাকি আছে কি না তার সংখ্যা।

শেষ statement-টা SELECT হতে হবে; DELETE-এ থামলে judge কিছু পাবে না।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL script লেখো: INSERT, UPDATE, DELETE, শেষে SELECT।",
    outputFormat:
      "প্রতি লাইনে `id`, `name`, `stock`, `dune_rows` (Dune মুছে গেলে 0); id অনুযায়ী সাজানো।",
    constraints:
      "ShopSphere fixture. Script mode: INSERT/UPDATE/DELETE চলবে; FK মেনে চলো—যে পণ্য order_items-এ আছে তা সরাসরি মুছলে constraint error হবে।",
    editorial: `## ধারণা
DML মানে ডেটার সারি বদলানো: \`INSERT\` নতুন সারি যোগ করে, \`UPDATE\` বিদ্যমান সারি বদলায়, \`DELETE\` সারি সরায়। প্রতিটি statement-এর পর প্রভাবিত সারির সংখ্যা জানা যায়; নিরাপদ অভ্যাস হলো আগে \`WHERE\` দিয়ে দেখে নেওয়া, তারপর বদলানো—না হলে এক UPDATE-এ গোটা টেবিল বদলে যেতে পারে।

ল্যাবের ডেটাবেস মেমোরিতে থাকা fixture-এর কপি, তাই INSERT/UPDATE/DELETE কখনো আসল ডেটা বা হোস্ট ফাইল ছোঁয় না; প্রতিটি submission নতুন কপি পায়। তবু FK নিয়ম মেনে চলতে হয়—\`products\`-এর সারি \`order_items\`-এ ব্যবহৃত থাকলে DELETE ব্যর্থ হবে।\n\n## ধাপে ধাপে
১. \`INSERT INTO products (...) VALUES (...)\`—কলামের নাম আর মানের ক্রম মিলিয়ে লেখো।
২. \`UPDATE products SET stock = stock + 6 WHERE name = 'Webcam';\`—নাম দিয়ে ফিল্টার যেন এক সারিই বদলায়।
৩. \`DELETE FROM products WHERE name = 'Dune';\`—Dune-এর কোনো order_item নেই, তাই নিরাপদ।
৪. শেষ SELECT-এ বদলানো সারিগুলো আর \`Dune\`-এর অবশিষ্ট সংখ্যা scalar subquery দিয়ে দেখাও।

\`\`\`sql
${DML_SCRIPT}
\`\`\`

## কমপ্লেক্সিটি
প্রতিটি DML statement সূচক-খোঁজায় \`O(log n)\`, WHERE-এ index না থাকলে \`O(n)\`; সব মিলিয়ে fixture-এর আকারে রৈখিক।

## সাধারণ ভুল
INSERT-এ কলাম-তালিকা আর VALUE-এর ক্রম না মেলানো; \`stock = stock + 6\`-এর বদলে ভুলে fixed মান বসানো; WHERE ছাড়া DELETE চালানো; FK-তে আটকে থাকা পণ্য (যেমন order_items-এ থাকা) মুছতে যাওয়া; আর শেষে SELECT বাদ দেওয়া।`,
    difficulty: "HARD",
    points: 350,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project", "DML"],
    judgeLanguage: "sql-script",
    premiumModuleSlug: "advanced-sql",
    category: "SQL Advanced",
    subcategory: "DML & transactions",
    referencePython: "",
    referenceSql: DML_SCRIPT,
    tests: [
      {
        input: "",
        expectedOutput: `12	Webcam	8	0
15	Copper Tea Pot	4	0`,
        isSample: true,
      },
      {
        input: "update products set stock = 0 where id = 12;",
        expectedOutput: `12	Webcam	6	0
15	Copper Tea Pot	4	0`,
        isSample: true,
      },
      {
        input: "update products set stock = 10 where id = 12;",
        expectedOutput: `12	Webcam	16	0
15	Copper Tea Pot	4	0`,
        isSample: false,
      },
      {
        input: "update products set name = 'HD Webcam' where id = 12;",
        expectedOutput: `15	Copper Tea Pot	4	0`,
        isSample: false,
      },
      {
        input: "update products set stock = 20 where id = 12;",
        expectedOutput: `12	Webcam	26	0
15	Copper Tea Pot	4	0`,
        isSample: false,
      },
    ],
  },
  {
    slug: "sql-lab-transaction",
    title: "Transaction lab: safe rollback",
    statement: `স্টকের বড় সমন্বয় শুরুর আগে গুদাম ম্যানেজার চায় নিশ্চয়তা—হিসাব ভুল হলে সব যেন আগের অবস্থায় ফিরে যায়। এটা প্রমাণ করার ল্যাব:

\`BEGIN\` দিয়ে transaction শুরু করো, product 8-এর স্টক 100 বাড়াও, vendor 4-এর রেটিং 1.0 করো, তারপর \`ROLLBACK\` দিয়ে সব ফিরিয়ে দাও। শেষে product 8-এর নাম, স্টক, ভেন্ডরের নাম আর রেটিং দেখাও—মূল মানই ফিরে আসা উচিত।

চাইলে একই script-এ \`COMMIT\` করে দেখতে পারো; তবে গ্রেড হয় শেষ SELECT-এর সারি দিয়েই।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL script লেখো: BEGIN, UPDATE, ROLLBACK, শেষে SELECT।",
    outputFormat:
      "এক লাইনে `product`, `stock`, `vendor`, `rating`—ROLLBACK-এর পর তাই fixture-এর মূল মান।",
    constraints:
      "ShopSphere fixture. Script mode: BEGIN/COMMIT/ROLLBACK/SAVEPOINT চলবে; ATTACH, DETACH আর PRAGMA বন্ধ।",
    editorial: `## ধারণা
Transaction মানে একগুচ্ছ statement-এর সব-বা-কিছুই নীতি। \`BEGIN\`-এর পর প্রতিটি বদল অস্থায়ী; \`COMMIT\` দিলে স্থায়ী হয়, \`ROLLBACK\` দিলে সব বাতিল। একসাথে কয়েক টেবিল বদলাতে হয়—যেমন স্টক আর ভেন্ডর রেটিং—সেখানে মাঝপথে error হলে অর্ধেক বদল থাকলে হিসাবই ভুল হয়ে যায়; transaction সেই ঝুঁকি মুছে দেয়। বড় কাজে \`SAVEPOINT\` দিয়ে মাঝপথের চেকপয়েন্ট রাখা যায়, আর \`ROLLBACK TO savepoint\` দিয়ে শুধু শেষ অংশ ফেরানো যায়।

ল্যাবের রানার autocommit মোডে চলে, তাই BEGIN লিখলে সত্যিই transaction শুরু হয়; PROMISE রাখতে শেষ SELECT-টা ROLLBACK-এর পরে দাও—তবেই মূল মান ফেরত আসা প্রমাণ হয়।\n\n## ধাপে ধাপে
১. \`BEGIN;\` দিয়ে transaction খোলো।
২. যেসব বদল পরীক্ষা করতে চাও, সেগুলো UPDATE দিয়ে করো—এখানে product 8-এর স্টক আর vendor 4-এর রেটিং।
৩. \`ROLLBACK;\` দিয়ে সব বাতিল করো।
৪. শেষ SELECT-এ ওই সারিগুলো আবার পড়ো—মান আগের মতোই থাকবে।
৫. ভবিষ্যতে বদল রাখতে চাইলে ROLLBACK-এর জায়গায় \`COMMIT;\` বসাও।

\`\`\`sql
${TRANSACTION_SCRIPT}
\`\`\`

## কমপ্লেক্সিটি
BEGIN/COMMIT/ROLLBACK নিজে প্রায় শূন্য খরচ; ভিতরের প্রতিটি UPDATE indexed lookup-এ \`O(log n)\`।

## সাধারণ ভুল
ROLLBACK ভুলে যাওয়া, ফলে বদল থেকে গিয়ে ভিন্ন মান আসা; BEGIN ছাড়া ROLLBACK লেখা (error); transaction-এর মাঝে SELECT করে শেষ statement হিসেবে রেখে দেওয়া; আর COMMIT-এর পর আবার একই UPDATE চালিয়ে ডেটা দ্বিগুণ করা।`,
    difficulty: "HARD",
    points: 350,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project", "Transactions"],
    judgeLanguage: "sql-script",
    premiumModuleSlug: "advanced-sql",
    category: "SQL Advanced",
    subcategory: "DML & transactions",
    referencePython: "",
    referenceSql: TRANSACTION_SCRIPT,
    tests: [
      {
        input: "",
        expectedOutput: `Wireless Mouse	3	GadgetPoint	4.1`,
        isSample: true,
      },
      {
        input: "update products set stock = 10 where id = 8;",
        expectedOutput: `Wireless Mouse	10	GadgetPoint	4.1`,
        isSample: true,
      },
      {
        input: "update vendors set rating = 4.5 where id = 4;",
        expectedOutput: `Wireless Mouse	3	GadgetPoint	4.5`,
        isSample: false,
      },
      {
        input:
          "update products set stock = 0 where id = 8; update vendors set rating = 3.9 where id = 4;",
        expectedOutput: `Wireless Mouse	0	GadgetPoint	3.9`,
        isSample: false,
      },
      {
        input: "update products set name = 'Wireless Mouse Pro' where id = 8;",
        expectedOutput: `Wireless Mouse Pro	3	GadgetPoint	4.1`,
        isSample: false,
      },
    ],
  },
];
