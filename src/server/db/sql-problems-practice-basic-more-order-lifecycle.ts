import type { SeedProblem } from "./seed-problems";

export const SQL_PROBLEMS_PRACTICE_BASIC_MORE_ORDER_LIFECYCLE: SeedProblem[] = [
  {
    slug: "sql-practice-order-lifecycle-hard",
    title: "Order health report",
    statement: `সাপোর্ট ডেস্ক প্রতিটি কার্যকর অর্ডারের (\`paid\`/\`shipped\`) তিনটা সিগন্যাল এক নজরে চায়। প্রতি অর্ডারের \`order_id\`, \`has_paid\` (অর্ডারের কোনো পেমেন্ট \`paid\` হলে ১, নাহলে ০), \`shipment\` (শিপমেন্ট থাকলে তার status, না থাকলে \`none\`) আর \`return_count\` (এই অর্ডারের আইটেমগুলোর বিরুদ্ধে মোট return সংখ্যা) বের করো; অর্ডার আইডি অনুযায়ী সাজাও।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`order_id\`, \`has_paid\`, \`shipment\`, \`return_count\` — অর্ডার আইডি অনুযায়ী।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## ধারণা
তিন টেবিল-তিন প্রশ্ন, উত্তর এক সারিতে। পেমেন্ট-চেক existential: \`EXISTS (... AND p.status = 'paid')\` — গুনতি লাগে না, আছে/নেই বললেই হয় (failed/refunded পেমেন্ট থাকলেও উত্তর ০)। শিপমেন্ট \`LEFT JOIN\` + \`COALESCE\` — এক অর্ডারে একটার বেশি শিপমেন্ট নেই, তাই জোড়া নিরাপদ। রিটার্ন-কাউন্ট correlated সাবকোয়েরিতে \`returns → order_items → orders\` শৃঙ্খল ধরে — returns টেবিলে orders-এর সরাসরি কোনো কলাম নেই।

## ধাপে ধাপে
১. \`FROM orders o LEFT JOIN shipments s ON s.order_id = o.id\`, \`WHERE o.status IN ('paid','shipped')\`।
২. \`CASE WHEN EXISTS (SELECT 1 FROM payments p WHERE p.order_id = o.id AND p.status = 'paid') THEN 1 ELSE 0 END AS has_paid\`।
৩. \`COALESCE(s.status, 'none') AS shipment\`।
৪. \`(SELECT COUNT(*) FROM returns r JOIN order_items oi ON oi.id = r.order_item_id WHERE oi.order_id = o.id) AS return_count\`।
৫. \`ORDER BY o.id\`।

## কোডে দেখি
\`\`\`sql
SELECT o.id AS order_id,
       CASE WHEN EXISTS (SELECT 1 FROM payments p
                          WHERE p.order_id = o.id AND p.status = 'paid')
            THEN 1 ELSE 0 END AS has_paid,
       COALESCE(s.status, 'none') AS shipment,
       (SELECT COUNT(*) FROM returns r
        JOIN order_items oi ON oi.id = r.order_item_id
        WHERE oi.order_id = o.id) AS return_count
FROM orders o
LEFT JOIN shipments s ON s.order_id = o.id
WHERE o.status IN ('paid','shipped')
ORDER BY o.id;
\`\`\`

## সাধারণ ভুল
returns সরাসরি orders-এ জুড়ে খালি গুনতি পাওয়া — সংযোগটা \`order_item_id\` দিয়ে; has_paid-এ সব পেমেন্ট গুনে শুধু 'পেমেন্ট-আছে' মাপা — failed/refunded-ও গোনা হয়ে যাবে; INNER JOIN করে শিপমেন্ট-নেই অর্ডার ঝরে পড়া; কার্যকর-অর্ডার ছাঁকনি ভুলে বাতিল/অপেক্ষমাণ অর্ডারও তালিকায় আনা।`,
    difficulty: "HARD",
    points: 250,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    category: "SQL Basics",
    subcategory: "Order lifecycle",
    referencePython: "",
    referenceSql: `SELECT o.id AS order_id, CASE WHEN EXISTS (SELECT 1 FROM payments p WHERE p.order_id = o.id AND p.status = 'paid') THEN 1 ELSE 0 END AS has_paid, COALESCE(s.status, 'none') AS shipment, (SELECT COUNT(*) FROM returns r JOIN order_items oi ON oi.id = r.order_item_id WHERE oi.order_id = o.id) AS return_count FROM orders o LEFT JOIN shipments s ON s.order_id = o.id WHERE o.status IN ('paid','shipped') ORDER BY o.id;`,
    tests: [
      {
        input: ``,
        expectedOutput: `1	1	delivered	1
3	1	delivered	0
4	1	shipped	1
6	1	delivered	1
7	1	shipped	1
8	1	delivered	0
9	1	delivered	0
10	1	pending	0`,
        isSample: true
      },
      {
        input: `update payments set status='failed' where id=1;`,
        expectedOutput: `1	0	delivered	1
3	1	delivered	0
4	1	shipped	1
6	1	delivered	1
7	1	shipped	1
8	1	delivered	0
9	1	delivered	0
10	1	pending	0`,
        isSample: true
      },
      {
        input: `update shipments set status='delivered', delivered_at='2026-11-09' where order_id=10;`,
        expectedOutput: `1	1	delivered	1
3	1	delivered	0
4	1	shipped	1
6	1	delivered	1
7	1	shipped	1
8	1	delivered	0
9	1	delivered	0
10	1	delivered	0`,
        isSample: false
      },
      {
        input: `insert into returns (id,order_item_id,quantity,reason,refund_cents,status,requested_at) values (5,15,1,'damaged',380000,'pending','2026-11-12');`,
        expectedOutput: `1	1	delivered	1
3	1	delivered	0
4	1	shipped	1
6	1	delivered	1
7	1	shipped	1
8	1	delivered	0
9	1	delivered	0
10	1	pending	1`,
        isSample: false
      },
      {
        input: `update orders set status='cancelled' where id in (7,9);`,
        expectedOutput: `1	1	delivered	1
3	1	delivered	0
4	1	shipped	1
6	1	delivered	1
8	1	delivered	0
10	1	pending	0`,
        isSample: false
      },
    ],
  },
  {
    slug: "sql-practice-order-lifecycle-challenge",
    title: "Carrier only when delivered",
    statement: `ফুলফিলমেন্ট বোর্ডে প্রতি কার্যকর অর্ডারের (\`paid\`/\`shipped\`) ক্যারিয়ার দেখাতে হবে — কিন্তু শুধু যে অর্ডারের শিপমেন্ট delivered হয়েছে, সেটার ক্যারিয়ার; delivered হয়নি এমন অর্ডারের (শিপমেন্ট shipped/pending, বা শিপমেন্টই নেই) জায়গায় \`in_transit\` লেখা আসবে। কলাম: \`order_id\`, \`customer\` (নাম), \`carrier\`; অর্ডার আইডি অনুযায়ী সাজাও।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`order_id\`, \`customer\`, \`carrier\` — delivered হলে ক্যারিয়ার, নাহলে \`in_transit\`; অর্ডার আইডি অনুযায়ী।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## ধারণা
অর্ডারগুলো সব রাখতে \`LEFT JOIN shipments\` — কিন্তু 'delivered' শর্তটা কোথায় বসাবে? \`WHERE\`-এ বসালে NULL-সারিগুলোই ছিঁড়ে পড়ে: LEFT JOIN নীরবে INNER JOIN হয়ে যায়, \`in_transit\` কেউ দেখতেই পাবে না। সমাধান — শর্তটা জোড়ার \`ON\`-এ: ম্যাচ খোঁজা হবে শুধু delivered শিপমেন্টের সাথে, না পেলে NULL থাকবে আর অর্ডারের সারি বাঁচবে; NULL-টা \`COALESCE(..., 'in_transit')\` হয়ে লেবেল হবে।

## ধাপে ধাপে
১. \`orders o JOIN customers c\` — নাম, \`WHERE o.status IN ('paid','shipped')\`।
২. \`LEFT JOIN shipments s ON s.order_id = o.id AND s.status = 'delivered'\` — শর্ত ON-এ।
৩. \`COALESCE(s.carrier, 'in_transit') AS carrier\`।
৪. \`ORDER BY o.id\`।

## কোডে দেখি
\`\`\`sql
SELECT o.id AS order_id, c.name AS customer,
       COALESCE(s.carrier, 'in_transit') AS carrier
FROM orders o
JOIN customers c ON c.id = o.customer_id
LEFT JOIN shipments s ON s.order_id = o.id AND s.status = 'delivered'
WHERE o.status IN ('paid','shipped')
ORDER BY o.id;
\`\`\`

## সাধারণ ভুল
\`WHERE s.status = 'delivered'\` লিখে পুরো LEFT JOIN ভেঙে ফেলা — স্যাম্পলেই সারি কমে ধরা পড়বে; ON-এ শর্ত না দিয়ে শুধু কলামে CASE খোঁজা — তখন delivered-না-হওয়া শিপমেন্টও জোড়ায় এসে ভুল ক্যারিয়ার দেখাবে; \`COALESCE\` ছাড়া NULL ছাপা; \`o.status\`-এর ছাঁকনি বাদ দিয়ে বাতিল/অপেক্ষমাণ অর্ডারও বোর্ডে আনা।`,
    difficulty: "MEDIUM",
    points: 225,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    category: "SQL Basics",
    subcategory: "Order lifecycle",
    referencePython: "",
    referenceSql: `SELECT o.id AS order_id, c.name AS customer, COALESCE(s.carrier, 'in_transit') AS carrier FROM orders o JOIN customers c ON c.id = o.customer_id LEFT JOIN shipments s ON s.order_id = o.id AND s.status = 'delivered' WHERE o.status IN ('paid','shipped') ORDER BY o.id;`,
    tests: [
      {
        input: ``,
        expectedOutput: `1	Rahim	Sundarban
3	Nusrat	Pathao
4	Rahim	in_transit
6	Rahim	Pathao
7	Mim	in_transit
8	Karim	Pathao
9	Nusrat	Sundarban
10	Tanvir	in_transit`,
        isSample: true
      },
      {
        input: `update shipments set status='delivered', delivered_at='2026-11-09' where order_id=10;`,
        expectedOutput: `1	Rahim	Sundarban
3	Nusrat	Pathao
4	Rahim	in_transit
6	Rahim	Pathao
7	Mim	in_transit
8	Karim	Pathao
9	Nusrat	Sundarban
10	Tanvir	Pathao`,
        isSample: true
      },
      {
        input: `update shipments set status='delivered' where order_id=4;`,
        expectedOutput: `1	Rahim	Sundarban
3	Nusrat	Pathao
4	Rahim	Sundarban
6	Rahim	Pathao
7	Mim	in_transit
8	Karim	Pathao
9	Nusrat	Sundarban
10	Tanvir	in_transit`,
        isSample: false
      },
      {
        input: `delete from shipments where order_id=9;`,
        expectedOutput: `1	Rahim	Sundarban
3	Nusrat	Pathao
4	Rahim	in_transit
6	Rahim	Pathao
7	Mim	in_transit
8	Karim	Pathao
9	Nusrat	in_transit
10	Tanvir	in_transit`,
        isSample: false
      },
      {
        input: `update orders set status='cancelled' where id=8;`,
        expectedOutput: `1	Rahim	Sundarban
3	Nusrat	Pathao
4	Rahim	in_transit
6	Rahim	Pathao
7	Mim	in_transit
9	Nusrat	Sundarban
10	Tanvir	in_transit`,
        isSample: false
      },
    ],
  },
];
