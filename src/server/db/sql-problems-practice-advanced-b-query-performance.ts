import type { SeedProblem } from "./seed-problems";

export const SQL_PROBLEMS_PRACTICE_ADVANCED_B_QUERY_PERFORMANCE: SeedProblem[] = [
  {
    slug: "sql-practice-query-performance-easy",
    title: "October delivery log",
    statement: `ডেলিভারি টিমের অক্টোবর 2026-এর ডেলিভারি লগ দরকার: যেসব shipment 2026-10-01 থেকে 2026-11-01-এর আগে delivered হয়েছে (half-open range)। \`delivered_at\` কলামে **কোনো ফাংশন** (\`strftime\`, \`date\`, \`substr\`) লাগিও না — সরাসরি তুলনা লেখো, যেন তারিখের index সত্যিই কাজে লাগে। এখনো ডেলিভারি হয়নি এমন (delivered_at NULL) সারি আসবে না। আউটপুট: tracking_no, carrier, shipped_at, delivered_at — delivered_at, তারপর id অনুযায়ী সাজাও।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`tracking_no\`, \`carrier\`, \`shipped_at\`, \`delivered_at\` (YYYY-MM-DD বা YYYY-MM-DD HH:MM)।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## ধারণা
sargable predicate: indexed কলাম (delivered_at) অপরিবর্তিত রেখে সরাসরি তুলনা লিখলে index রেঞ্জে ঝাঁপ দেয়; strftime/substr মুড়লে প্রতি সারিতে ফাংশন চালাতে হয়, index বাতিল। half-open range (\`>= '2026-10-01' AND < '2026-11-01'\`) শেষ দিনের টাইমস্ট্যাম্প-ওয়ালা মান ('2026-10-31 14:00'-এর মতো) ধরে রাখে — \`BETWEEN ... AND '2026-10-31'\` লিখলে ওই সারি বাদ পড়ত। NULL delivered_at কোনো তুলনায় TRUE হয় না, তাই অডিট ছাড়াই পেন্ডিং শিপমেন্ট বাদ।

## ধাপে ধাপে
১. shipments থেকে সরাসরি \`delivered_at >= '2026-10-01' AND delivered_at < '2026-11-01'\`।
২. কলামে কোনো ফাংশন নয় — মানের দিকটা লেখো, কলামের দিকে নয়।
৩. ORDER BY delivered_at, id — id টাই-ব্রেক, ক্রম deterministic।

## কোডে দেখি
\`\`\`sql
SELECT tracking_no, carrier, shipped_at, delivered_at
FROM shipments
WHERE delivered_at >= '2026-10-01'
  AND delivered_at < '2026-11-01'
ORDER BY delivered_at, id;
\`\`\`

## সাধারণ ভুল
substr/strftime দিয়ে মাস বানিয়ে index বাতিল করা; \`BETWEEN ... '2026-10-31'\` লিখে শেষ দিনের টাইমস্ট্যাম্প হারানো; শুধু \`delivered_at > NULL\` ভেবে আলাদা ফিল্টার জোগাড় করা (দরকার নেই); ORDER BY-তে id টাই-ব্রেক না দেওয়া।`,
    difficulty: "EASY",
    points: 200,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    premiumModuleSlug: "advanced-sql",
    category: "SQL Advanced",
    subcategory: "Query performance",
    referencePython: "",
    referenceSql: `SELECT tracking_no, carrier, shipped_at, delivered_at
FROM shipments
WHERE delivered_at >= '2026-10-01'
  AND delivered_at < '2026-11-01'
ORDER BY delivered_at, id;`,
    tests: [
      {
        input: ``,
        expectedOutput: `SUN-1001	Sundarban	2026-10-02	2026-10-04
PAT-1003	Pathao	2026-10-06	2026-10-07
PAT-1006	Pathao	2026-10-21	2026-10-23
PAT-1008	Pathao	2026-10-26	2026-10-28
SUN-1009	Sundarban	2026-10-29	2026-10-31`,
        isSample: true
      },
      {
        input: `update shipments set delivered_at='2026-10-31 14:00' where id=7;`,
        expectedOutput: `SUN-1001	Sundarban	2026-10-02	2026-10-04
PAT-1003	Pathao	2026-10-06	2026-10-07
PAT-1006	Pathao	2026-10-21	2026-10-23
PAT-1008	Pathao	2026-10-26	2026-10-28
SUN-1009	Sundarban	2026-10-29	2026-10-31 14:00`,
        isSample: true
      },
      {
        input: `update shipments set delivered_at='2026-11-01 09:00' where id=6;`,
        expectedOutput: `SUN-1001	Sundarban	2026-10-02	2026-10-04
PAT-1003	Pathao	2026-10-06	2026-10-07
PAT-1006	Pathao	2026-10-21	2026-10-23
SUN-1009	Sundarban	2026-10-29	2026-10-31`,
        isSample: false
      },
      {
        input: `update shipments set status='shipped', delivered_at=NULL where id=1;`,
        expectedOutput: `PAT-1003	Pathao	2026-10-06	2026-10-07
PAT-1006	Pathao	2026-10-21	2026-10-23
PAT-1008	Pathao	2026-10-26	2026-10-28
SUN-1009	Sundarban	2026-10-29	2026-10-31`,
        isSample: false
      },
      {
        input: `insert into shipments (id,order_id,carrier,tracking_no,status,shipped_at,delivered_at) values (9,2,'Pathao','PAT-1002B','delivered','2026-10-28','2026-10-30');`,
        expectedOutput: `SUN-1001	Sundarban	2026-10-02	2026-10-04
PAT-1003	Pathao	2026-10-06	2026-10-07
PAT-1006	Pathao	2026-10-21	2026-10-23
PAT-1008	Pathao	2026-10-26	2026-10-28
PAT-1002B	Pathao	2026-10-28	2026-10-30
SUN-1009	Sundarban	2026-10-29	2026-10-31`,
        isSample: false
      },
    ],
  },
  {
    slug: "sql-practice-query-performance-medium",
    title: "Reverse keyset feed",
    statement: `সাপোর্ট টিমের অর্ডার টাইমলাইন নত থেকে পুরোনো ক্রমে (ordered_at DESC, id DESC) চলে। এখনকার কার্সর: \`ordered_at = '2026-10-12'\`, \`id = 5\`। এই কার্সরের **আগের** পেজ চাই: কার্সরের চেয়ে পুরোনো সর্বোচ্চ ৪টি অর্ডার, নত থেকে পুরোনো ক্রমে দেখাও। 'পুরোনো' মানে: \`ordered_at < '2026-10-12'\`, **অথবা** তারিখ সমান হলে \`id < 5\`। \`OFFSET\` ব্যবহার কোরো না — \`WHERE\` predicate দিয়ে লেখো, যেন index সরাসরি কার্সরের জায়গায় ঝাঁপ দিতে পারে। সব স্ট্যাটাসের অর্ডারই টাইমলাইনে থাকবে; প্রতিটি অর্ডারের মোট (order_cents) order_items থেকে বের কোরো। আউটপুট: customer, order_id, ordered_at, status, order_cents।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`customer\`, \`order_id\`, \`ordered_at\`, \`status\`, \`order_cents\` — ordered_at নামতা, order_id নামতা ক্রমে, সর্বোচ্চ ৪ সারি।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## ধারণা
keyset pagination-এ "পেজ" মানে কার্সরের সাথে lexicographic তুলনা। নত-থেকে-পুরোনো ফিডে "পুরোনো" হলো: \`ordered_at < কার্সর\`, অথবা তারিখ সমান হলে \`id < কার্সরের id\`। সমান তারিখের বড় id সারি এই predicate-এ ধরা পড়ে না — ঠিক এখানেই শুদ্ধতা লুকানো। predicate আর ORDER BY একই কলাম-জোড়া (ordered_at, id) উল্টো দিকে ব্যবহার করলে ইঞ্জিন index থেকে সরাসরি কার্সরে ঝাঁপ দিয়ে নিচের দিকে হাঁটে — গভীর পেজেও প্রতি পেজের খরচ এক, OFFSET-এর মতো পুরোনো সারি বারবার পড়ার অপচয় নেই।

## ধাপে ধাপে
১. WHERE: \`ordered_at < '2026-10-12' OR (ordered_at = '2026-10-12' AND id < 5)\`।
২. ORDER BY ordered_at DESC, id DESC; LIMIT 4 — predicate-এর দিকের সাথে মিলবে।
৩. অর্ডার ধরে order_items যোগ করে order_cents।

## কোডে দেখি
\`\`\`sql
SELECT cu.name AS customer, o.id AS order_id, o.ordered_at, o.status,
       SUM(oi.quantity * oi.unit_price_cents) AS order_cents
FROM orders o
JOIN customers cu ON cu.id = o.customer_id
JOIN order_items oi ON oi.order_id = o.id
WHERE (o.ordered_at < '2026-10-12'
       OR (o.ordered_at = '2026-10-12' AND o.id < 5))
GROUP BY o.id, cu.name, o.ordered_at, o.status
ORDER BY o.ordered_at DESC, o.id DESC
LIMIT 4;
\`\`\`

## সাধারণ ভুল
\`<\`-এর জায়গায় \`<=\` লিখে কার্সর-সারিটাই ফিরিয়ে আনা; শুধু \`ordered_at <\` লিখে সমান তারিখের ছোট id সারি হারানো; OFFSET দিয়ে পেজ মেপে ফেলা; ORDER BY-তে id DESC না দিয়ে predicate-এর সাথে দিক না মেলানো।`,
    difficulty: "MEDIUM",
    points: 300,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    premiumModuleSlug: "advanced-sql",
    category: "SQL Advanced",
    subcategory: "Query performance",
    referencePython: "",
    referenceSql: `SELECT cu.name AS customer, o.id AS order_id, o.ordered_at, o.status,
       SUM(oi.quantity * oi.unit_price_cents) AS order_cents
FROM orders o
JOIN customers cu ON cu.id = o.customer_id
JOIN order_items oi ON oi.order_id = o.id
WHERE (o.ordered_at < '2026-10-12'
       OR (o.ordered_at = '2026-10-12' AND o.id < 5))
GROUP BY o.id, cu.name, o.ordered_at, o.status
ORDER BY o.ordered_at DESC, o.id DESC
LIMIT 4;`,
    tests: [
      {
        input: ``,
        expectedOutput: `Rahim	4	2026-10-10	paid	2000000
Nusrat	3	2026-10-05	paid	600000
Karim	2	2026-10-03	pending	180000
Rahim	1	2026-10-01	paid	890000`,
        isSample: true
      },
      {
        input: `insert into orders (id,customer_id,ordered_at,status) values (11,4,'2026-10-11','paid'); insert into order_items (id,order_id,product_id,quantity,unit_price_cents) values (16,11,4,1,180000);`,
        expectedOutput: `Sajid	11	2026-10-11	paid	180000
Rahim	4	2026-10-10	paid	2000000
Nusrat	3	2026-10-05	paid	600000
Karim	2	2026-10-03	pending	180000`,
        isSample: true
      },
      {
        input: `insert into orders (id,customer_id,ordered_at,status) values (11,6,'2026-10-10','shipped'); insert into order_items (id,order_id,product_id,quantity,unit_price_cents) values (16,11,5,1,95000);`,
        expectedOutput: `Tanvir	11	2026-10-10	shipped	95000
Rahim	4	2026-10-10	paid	2000000
Nusrat	3	2026-10-05	paid	600000
Karim	2	2026-10-03	pending	180000`,
        isSample: false
      },
      {
        input: `update orders set ordered_at='2026-11-01' where id=1;`,
        expectedOutput: `Rahim	4	2026-10-10	paid	2000000
Nusrat	3	2026-10-05	paid	600000
Karim	2	2026-10-03	pending	180000`,
        isSample: false
      },
      {
        input: `update orders set ordered_at='2026-10-12' where id=2;`,
        expectedOutput: `Karim	2	2026-10-12	pending	180000
Rahim	4	2026-10-10	paid	2000000
Nusrat	3	2026-10-05	paid	600000
Rahim	1	2026-10-01	paid	890000`,
        isSample: false
      },
    ],
  },
];
