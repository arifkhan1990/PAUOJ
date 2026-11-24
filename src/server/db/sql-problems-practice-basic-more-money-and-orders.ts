import type { SeedProblem } from "./seed-problems";

export const SQL_PROBLEMS_PRACTICE_BASIC_MORE_MONEY_AND_ORDERS: SeedProblem[] = [
  {
    slug: "sql-practice-money-and-orders-hard",
    title: "Customer spending tiers",
    statement: `গ্রোথ টিম খরচের ভিত্তিতে কাস্টমারদের টিয়ারে ভাগ করছে। প্রতি কাস্টমারের কার্যকর অর্ডারের (\`paid\`/\`shipped\`) মোট খরচ বের করো \`spent_cents\` নামে (quantity × unit price, সেন্টে) — কার্যকর অর্ডার না-থাকা কাস্টমারও তালিকায় থাকবে, খরচ ০। সাথে \`tier\`: কার্যকর অর্ডারই নেই হলে \`none\`, খরচ ১০ লাখ সেন্ট (1000000) বা বেশি হলে \`vip\`, ৩ লাখ সেন্ট (300000) বা বেশি হলে \`regular\`, নাহলে \`small\`। কলাম: \`customer\`, \`city\`, \`spent_cents\`, \`tier\`; খরচ নিচের ক্রমে, সমান হলে নাম অনুযায়ী।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`customer\`, \`city\`, \`spent_cents\`, \`tier\` — খরচ নিচের ক্রমে, টাই-এ \`customer\`।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## ধারণা
তিন কাজ এক query-তে: সব কাস্টমার রাখতে \`customers LEFT JOIN orders\` — স্ট্যাটাস ফিল্টার \`ON\`-এ, \`WHERE\`-এ নয়, নাহলে অর্ডার-নেই কাস্টমার পুরো ছিঁড়ে পড়বে। এরপর \`order_items\` জুড়ে সেন্ট যোগ। খালি গ্রুপে \`SUM\` NULL দেয়, তাই \`COALESCE(..., 0)\`। \`tier\`-এর \`CASE\`-তে 'none' শাখাটা আলাদা — খরচ ০ আর অর্ডার-নেই এক নয়, আর বড়-থেকে-ছোট শাখাক্রম মানতে হবে কারণ CASE প্রথম মিলে যাওয়া শাখাতেই থেমে যায়।

## ধাপে ধাপে
১. \`customers cu LEFT JOIN orders o ON o.customer_id = cu.id AND o.status IN ('paid','shipped')\`।
২. \`LEFT JOIN order_items oi ON oi.order_id = o.id\`।
৩. \`COALESCE(SUM(oi.quantity * oi.unit_price_cents), 0) AS spent_cents\`।
৪. \`CASE WHEN COUNT(o.id) = 0 THEN 'none' WHEN SUM(...) >= 1000000 THEN 'vip' WHEN SUM(...) >= 300000 THEN 'regular' ELSE 'small' END\`।
৫. \`GROUP BY cu.id\`, \`ORDER BY spent_cents DESC, customer\`।

## কোডে দেখি
\`\`\`sql
SELECT cu.name AS customer, cu.city,
       COALESCE(SUM(oi.quantity * oi.unit_price_cents), 0) AS spent_cents,
       CASE
         WHEN COUNT(o.id) = 0 THEN 'none'
         WHEN SUM(oi.quantity * oi.unit_price_cents) >= 1000000 THEN 'vip'
         WHEN SUM(oi.quantity * oi.unit_price_cents) >= 300000 THEN 'regular'
         ELSE 'small'
       END AS tier
FROM customers cu
LEFT JOIN orders o ON o.customer_id = cu.id AND o.status IN ('paid','shipped')
LEFT JOIN order_items oi ON oi.order_id = o.id
GROUP BY cu.id
ORDER BY spent_cents DESC, customer;
\`\`\`

## সাধারণ ভুল
স্ট্যাটাস ফিল্টার \`WHERE\`-এ দিয়ে অর্ডার-নেই কাস্টমার হারানো; \`CASE\`-এ 'none' শাখা না দিয়ে খরচ-০ কাস্টমারকে \`small\` বানানো; শাখার ক্রম উল্টে দিলে সবাই \`regular\` হয়ে যাওয়া; \`COALESCE\` ছাড়া NULL খরচ ছাপা।`,
    difficulty: "HARD",
    points: 250,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    category: "SQL Basics",
    subcategory: "Aggregates",
    referencePython: "",
    referenceSql: `SELECT cu.name AS customer, cu.city, COALESCE(SUM(oi.quantity * oi.unit_price_cents), 0) AS spent_cents, CASE WHEN COUNT(o.id) = 0 THEN 'none' WHEN SUM(oi.quantity * oi.unit_price_cents) >= 1000000 THEN 'vip' WHEN SUM(oi.quantity * oi.unit_price_cents) >= 300000 THEN 'regular' ELSE 'small' END AS tier FROM customers cu LEFT JOIN orders o ON o.customer_id = cu.id AND o.status IN ('paid','shipped') LEFT JOIN order_items oi ON oi.order_id = o.id GROUP BY cu.id ORDER BY spent_cents DESC, customer;`,
    tests: [
      {
        input: ``,
        expectedOutput: `Rahim	Dhaka	3495000	vip
Nusrat	Dhaka	720000	regular
Mim	Khulna	670000	regular
Tanvir	Dhaka	380000	regular
Karim	Chattogram	180000	small
Sajid	Sylhet	0	none`,
        isSample: true
      },
      {
        input: `update orders set status='paid' where id=5;`,
        expectedOutput: `Rahim	Dhaka	3495000	vip
Nusrat	Dhaka	720000	regular
Mim	Khulna	670000	regular
Tanvir	Dhaka	380000	regular
Karim	Chattogram	180000	small
Sajid	Sylhet	170000	small`,
        isSample: true
      },
      {
        input: `update orders set status='cancelled' where id=3;`,
        expectedOutput: `Rahim	Dhaka	3495000	vip
Mim	Khulna	670000	regular
Tanvir	Dhaka	380000	regular
Karim	Chattogram	180000	small
Nusrat	Dhaka	120000	small
Sajid	Sylhet	0	none`,
        isSample: false
      },
      {
        input: `insert into orders (id,customer_id,ordered_at,status) values (11,4,'2026-11-12','paid'); insert into order_items (id,order_id,product_id,quantity,unit_price_cents) values (16,11,3,1,1850000); insert into order_items (id,order_id,product_id,quantity,unit_price_cents) values (17,11,10,5,320000);`,
        expectedOutput: `Rahim	Dhaka	3495000	vip
Sajid	Sylhet	3450000	vip
Nusrat	Dhaka	720000	regular
Mim	Khulna	670000	regular
Tanvir	Dhaka	380000	regular
Karim	Chattogram	180000	small`,
        isSample: false
      },
      {
        input: `update orders set status='pending' where id in (1,4);`,
        expectedOutput: `Nusrat	Dhaka	720000	regular
Mim	Khulna	670000	regular
Rahim	Dhaka	605000	regular
Tanvir	Dhaka	380000	regular
Karim	Chattogram	180000	small
Sajid	Sylhet	0	none`,
        isSample: false
      },
    ],
  },
  {
    slug: "sql-practice-money-and-orders-challenge",
    title: "Items vs payments reconciliation",
    statement: `ফাইন্যান্স টিম প্রতি অর্ডারের দুই দিক মেলাচ্ছে: ক্যাটালগ মোট (সেই অর্ডারের \`order_items\`-এ quantity × unit price) আর পেমেন্টে চলে যাওয়া মোট (সেই অর্ডারের \`payments\`-এর সব সারির যোগফল — স্ট্যাটাস যাই হোক)। প্রতি অর্ডারের \`order_id\`, \`items_total_cents\`, \`payments_total_cents\` বের করো — কোনো দিক খালি হলে ০ দেখাবে; অর্ডার আইডি অনুযায়ী সাজাও।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`order_id\`, \`items_total_cents\`, \`payments_total_cents\` — অর্ডার আইডি অনুযায়ী; না-থাকলে ০।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## ধারণা
একই অর্ডারের \`order_items\` এক দিকে, \`payments\` আরেক দিকে — দুটোই অর্ডারের সাথে one-to-many। দুটোকে একসাথে জুড়ে সরাসরি \`SUM\` করলেই ফ্যান-আউট: প্রতিটি আইটেম-সারি প্রতিটি পেমেন্ট-সারির সাথে জোড়া খায় (২ আইটেম × ২ পেমেন্ট = ৪ সারি), দুই যোগফলই বেড়ে যায়। নিরাপদ পথ: প্রতিটি দিক আলাদা করে aggregate — scalar সাবকোয়েরি দিয়ে প্রতি অর্ডারের নিজের যোগফল আনো।

## ধাপে ধাপে
১. \`FROM orders o\` — প্রতি অর্ডারের এক সারি নিশ্চিত।
২. \`items_total_cents\`: \`(SELECT COALESCE(SUM(oi.quantity * oi.unit_price_cents), 0) FROM order_items oi WHERE oi.order_id = o.id)\`।
৩. \`payments_total_cents\`: একইভাবে \`payments\` থেকে, \`COALESCE(..., 0)\`।
৪. \`ORDER BY o.id\`।

## কোডে দেখি
\`\`\`sql
SELECT o.id AS order_id,
       (SELECT COALESCE(SUM(oi.quantity * oi.unit_price_cents), 0)
        FROM order_items oi WHERE oi.order_id = o.id) AS items_total_cents,
       (SELECT COALESCE(SUM(p.amount_cents), 0)
        FROM payments p WHERE p.order_id = o.id) AS payments_total_cents
FROM orders o
ORDER BY o.id;
\`\`\`

## সাধারণ ভুল
\`orders JOIN order_items JOIN payments\` করে দুই \`SUM\` — ফ্যান-আউটে দুই নম্বরই ফুলে যায়; অর্ডার ১-এর মতো একাধিক পেমেন্ট (paid + refunded) ডেটাতেই আছে, তাই ভুলটা বেস ডেটাতেই ধরা পড়বে; \`COALESCE\` ছাড়া পেমেন্ট-নেই অর্ডারে NULL ছাপা; পেমেন্টের স্ট্যাটাস ছেঁটে ফেলা — টাস্ক চায় সব পেমেন্টের যোগফল।`,
    difficulty: "MEDIUM",
    points: 225,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    category: "SQL Basics",
    subcategory: "Aggregates",
    referencePython: "",
    referenceSql: `SELECT o.id AS order_id, (SELECT COALESCE(SUM(oi.quantity * oi.unit_price_cents), 0) FROM order_items oi WHERE oi.order_id = o.id) AS items_total_cents, (SELECT COALESCE(SUM(p.amount_cents), 0) FROM payments p WHERE p.order_id = o.id) AS payments_total_cents FROM orders o ORDER BY o.id;`,
    tests: [
      {
        input: ``,
        expectedOutput: `1	890000	1340000
2	180000	180000
3	600000	600000
4	2000000	2000000
5	170000	170000
6	605000	605000
7	670000	670000
8	180000	180000
9	120000	120000
10	380000	380000`,
        isSample: true
      },
      {
        input: `insert into payments (id,order_id,method,amount_cents,status,paid_at,transaction_ref) values (12,6,'bkash',100000,'paid','2026-10-21 09:00','BKPART1');`,
        expectedOutput: `1	890000	1340000
2	180000	180000
3	600000	600000
4	2000000	2000000
5	170000	170000
6	605000	705000
7	670000	670000
8	180000	180000
9	120000	120000
10	380000	380000`,
        isSample: true
      },
      {
        input: `insert into orders (id,customer_id,ordered_at,status) values (11,4,'2026-11-12','pending'); insert into order_items (id,order_id,product_id,quantity,unit_price_cents) values (16,11,5,2,95000);`,
        expectedOutput: `1	890000	1340000
2	180000	180000
3	600000	600000
4	2000000	2000000
5	170000	170000
6	605000	605000
7	670000	670000
8	180000	180000
9	120000	120000
10	380000	380000
11	190000	0`,
        isSample: false
      },
      {
        input: `delete from payments where id=11;`,
        expectedOutput: `1	890000	890000
2	180000	180000
3	600000	600000
4	2000000	2000000
5	170000	170000
6	605000	605000
7	670000	670000
8	180000	180000
9	120000	120000
10	380000	380000`,
        isSample: false
      },
      {
        input: `update payments set amount_cents=700000 where id=1;`,
        expectedOutput: `1	890000	1150000
2	180000	180000
3	600000	600000
4	2000000	2000000
5	170000	170000
6	605000	605000
7	670000	670000
8	180000	180000
9	120000	120000
10	380000	380000`,
        isSample: false
      },
    ],
  },
];
