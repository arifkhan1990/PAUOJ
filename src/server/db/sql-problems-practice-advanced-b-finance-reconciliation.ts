import type { SeedProblem } from "./seed-problems";

export const SQL_PROBLEMS_PRACTICE_ADVANCED_B_FINANCE_RECONCILIATION: SeedProblem[] = [
  {
    slug: "sql-practice-finance-reconciliation-easy",
    title: "Payment coverage check",
    statement: `ফিন্যান্স টিম প্রতিটি অর্ডারের টাকা মিলিয়ে দেখতে চায়: অর্ডারের order_items-এর মোট কত (items_cents), আর ওই অর্ডারের payments টেবিলে \`paid\` স্ট্যাটাসে জমা হওয়া টাকার যোগফল কত (paid_cents)। প্রতিটি অর্ডারের জন্য এক সারিতে দেখাও: order_id, customer, items_cents, paid_cents, difference_cents (= paid_cents − items_cents)। শুধু \`paid\` স্ট্যাটাসের payment গোনা হবে — \`pending\`, \`failed\`, \`refunded\` নয়; কোনো paid payment না থাকলে paid_cents = 0। আগে যেসব অর্ডারে টাকা জমা হয়নি (difference সবচেয়ে ঋণাত্মক), টাই হলে order_id অনুযায়ী সাজাও।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`order_id\`, \`customer\`, \`items_cents\`, \`paid_cents\`, \`difference_cents\`।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## ধারণা
reconciliation-এর সবচেয়ে ছোট রূপ: এক অর্ডারের দুই দিকের হিসাব মেলানো। order_items থেকে items_cents (অর্ডার ধরে GROUP BY), payments থেকে শুধু \`status = 'paid'\` সারির যোগফল। এক অর্ডারে একাধিক payment থাকতে পারে (যেমন অর্ডার ১-এ একটা refunded payment-ও আছে), আবার কোনো paid payment-ই না থাকতে পারে (pending/failed)। তাই দুই দিক আলাদা CTE-তে গুনে LEFT JOIN + COALESCE(..., 0) দিয়ে জোড়া — INNER JOIN করলে টাকা-জমা-হয়নি অর্ডারগুলো উধাও হয়ে যেত, আর রিপোর্ট দেখে কেউ বুঝতই না।

## ধাপে ধাপে
১. order_totals CTE: orders ⋈ customers ⋈ order_items, অর্ডার ধরে SUM।
২. paid_totals CTE: payments থেকে শুধু \`paid\`, অর্ডার ধরে SUM।
৩. LEFT JOIN দিয়ে জোড়া, না থাকলে COALESCE(..., 0)।
৪. difference_cents = paid − items, ORDER BY difference_cents, order_id।

## কোডে দেখি
\`\`\`sql
WITH order_totals AS (
  SELECT o.id AS order_id, cu.name AS customer,
         SUM(oi.quantity * oi.unit_price_cents) AS items_cents
  FROM orders o
  JOIN customers cu ON cu.id = o.customer_id
  JOIN order_items oi ON oi.order_id = o.id
  GROUP BY o.id, cu.name
), paid_totals AS (
  SELECT order_id, SUM(amount_cents) AS paid_cents
  FROM payments
  WHERE status = 'paid'
  GROUP BY order_id
)
SELECT t.order_id, t.customer, t.items_cents,
       COALESCE(p.paid_cents, 0) AS paid_cents,
       COALESCE(p.paid_cents, 0) - t.items_cents AS difference_cents
FROM order_totals t
LEFT JOIN paid_totals p ON p.order_id = t.order_id
ORDER BY difference_cents, t.order_id;
\`\`\`

## সাধারণ ভুল
pending/failed payment-ও জমা ধরা; refunded payment জোগাতে ভুলে ফেরত-যাওয়া টাকা দুইবার গোনা; payments-কে INNER JOIN করে paid payment-নেই অর্ডার হারানো; difference-এর দিক উল্টো করা — এখানে paid_cents − items_cents ধরাই সঠিক।`,
    difficulty: "EASY",
    points: 200,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    premiumModuleSlug: "advanced-sql",
    category: "SQL Advanced",
    subcategory: "Finance",
    referencePython: "",
    referenceSql: `WITH order_totals AS (
  SELECT o.id AS order_id, cu.name AS customer,
         SUM(oi.quantity * oi.unit_price_cents) AS items_cents
  FROM orders o
  JOIN customers cu ON cu.id = o.customer_id
  JOIN order_items oi ON oi.order_id = o.id
  GROUP BY o.id, cu.name
), paid_totals AS (
  SELECT order_id, SUM(amount_cents) AS paid_cents
  FROM payments
  WHERE status = 'paid'
  GROUP BY order_id
)
SELECT t.order_id, t.customer, t.items_cents,
       COALESCE(p.paid_cents, 0) AS paid_cents,
       COALESCE(p.paid_cents, 0) - t.items_cents AS difference_cents
FROM order_totals t
LEFT JOIN paid_totals p ON p.order_id = t.order_id
ORDER BY difference_cents, t.order_id;`,
    tests: [
      {
        input: ``,
        expectedOutput: `2	Karim	180000	0	-180000
5	Sajid	170000	0	-170000
1	Rahim	890000	890000	0
3	Nusrat	600000	600000	0
4	Rahim	2000000	2000000	0
6	Rahim	605000	605000	0
7	Mim	670000	670000	0
8	Karim	180000	180000	0
9	Nusrat	120000	120000	0
10	Tanvir	380000	380000	0`,
        isSample: true
      },
      {
        input: `update payments set status='paid' where id=2;`,
        expectedOutput: `5	Sajid	170000	0	-170000
1	Rahim	890000	890000	0
2	Karim	180000	180000	0
3	Nusrat	600000	600000	0
4	Rahim	2000000	2000000	0
6	Rahim	605000	605000	0
7	Mim	670000	670000	0
8	Karim	180000	180000	0
9	Nusrat	120000	120000	0
10	Tanvir	380000	380000	0`,
        isSample: true
      },
      {
        input: `update payments set amount_cents=900000 where id=1;`,
        expectedOutput: `2	Karim	180000	0	-180000
5	Sajid	170000	0	-170000
3	Nusrat	600000	600000	0
4	Rahim	2000000	2000000	0
6	Rahim	605000	605000	0
7	Mim	670000	670000	0
8	Karim	180000	180000	0
9	Nusrat	120000	120000	0
10	Tanvir	380000	380000	0
1	Rahim	890000	900000	10000`,
        isSample: false
      },
      {
        input: `update payments set status='refunded' where id=9;`,
        expectedOutput: `2	Karim	180000	0	-180000
5	Sajid	170000	0	-170000
9	Nusrat	120000	0	-120000
1	Rahim	890000	890000	0
3	Nusrat	600000	600000	0
4	Rahim	2000000	2000000	0
6	Rahim	605000	605000	0
7	Mim	670000	670000	0
8	Karim	180000	180000	0
10	Tanvir	380000	380000	0`,
        isSample: false
      },
      {
        input: `insert into orders (id,customer_id,ordered_at,status) values (11,4,'2026-10-15','paid'); insert into order_items (id,order_id,product_id,quantity,unit_price_cents) values (16,11,13,1,210000); insert into payments (id,order_id,method,amount_cents,status,paid_at,transaction_ref) values (12,11,'card',150000,'paid','2026-10-15 12:00','CRD1501');`,
        expectedOutput: `2	Karim	180000	0	-180000
5	Sajid	170000	0	-170000
11	Sajid	210000	150000	-60000
1	Rahim	890000	890000	0
3	Nusrat	600000	600000	0
4	Rahim	2000000	2000000	0
6	Rahim	605000	605000	0
7	Mim	670000	670000	0
8	Karim	180000	180000	0
9	Nusrat	120000	120000	0
10	Tanvir	380000	380000	0`,
        isSample: false
      },
    ],
  },
  {
    slug: "sql-practice-finance-reconciliation-medium",
    title: "Refund ledger reconciliation",
    statement: `রিফান্ডের টাকা দুই খাতায় লেখা পড়ে: approved হওয়া return-এ refund_cents বলে কত ফেরত দিতে হবে, আর কাস্টমারকে আসলে ফেরত পাঠানো টাকা payments টেবিলে \`refunded\` স্ট্যাটাসের সারিতে লেখা থাকে। অডিট টিম জানতে চায় কোন অর্ডারে কত টাকা ফেরত দেওয়ার কথা অথচ এখনো পাঠানো হয়নি। শুধু যেসব অর্ডারে অন্তত একটা approved return **বা** অন্তত একটা \`refunded\` payment আছে, সেগুলোর জন্য দেখাও: order_id, approved_refunds_cents (ওই অর্ডারের approved return-এর refund_cents যোগফল), refunded_payments_cents (\`refunded\` payment-এর amount_cents যোগফল), outstanding_cents (= approved_refunds_cents − refunded_payments_cents)। pending/rejected return কোনো দিকেই গোনা হবে না; বাকি সব অর্ডার বাদ। আগে বকেয়া বেশি (outstanding_cents নামতা ক্রমে), টাই হলে order_id অনুযায়ী সাজাও।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`order_id\`, \`approved_refunds_cents\`, \`refunded_payments_cents\`, \`outstanding_cents\`।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## ধারণা
দুই খাতার মিল: approved return হলো দাবি (কত ফেরত দিতে হবে), \`refunded\` payment হলো সত্যা (কত ফেরত গেছে), outstanding = দাবি − সত্যা। যে অর্ডারে কোনো দিকই নেই সে তালিকায় আসবে না, কিন্তু যেকোনো এক দিক থাকলেই আসবে — সেজন্য orders-কে বাইরে রেখে দুই aggregate-এ LEFT JOIN, তারপর WHERE-এ "অন্তত এক দিক NULL নয়" শর্ত। এভাবে এক দিক শূন্য হলেও সারি থাকে; মাইনাস outstanding মানে দাবি ছাড়াই টাকা ফেরত গেছে — সেটাও অডিটের জন্য গুরুত্বপূর্ণ সংকেত।

## ধাপে ধাপে
১. approved_refunds CTE: returns ⋈ order_items ⋈ orders, শুধু approved, অর্ডার ধরে SUM(refund_cents)।
২. refunded_payments CTE: payments থেকে শুধু \`refunded\`, অর্ডার ধরে SUM(amount_cents)।
৩. orders LEFT JOIN দুই CTE-তে; WHERE দুই দিকের যেকোনো একটা থাকা শর্ত।
৪. outstanding = COALESCE(approved) − COALESCE(refunded); ORDER BY outstanding DESC, order_id।

## কোডে দেখি
\`\`\`sql
WITH approved_refunds AS (
  SELECT o.id AS order_id, SUM(r.refund_cents) AS refund_cents
  FROM returns r
  JOIN order_items oi ON oi.id = r.order_item_id
  JOIN orders o ON o.id = oi.order_id
  WHERE r.status = 'approved'
  GROUP BY o.id
), refunded_payments AS (
  SELECT order_id, SUM(amount_cents) AS refunded_cents
  FROM payments
  WHERE status = 'refunded'
  GROUP BY order_id
)
SELECT o.id AS order_id,
       COALESCE(a.refund_cents, 0) AS approved_refunds_cents,
       COALESCE(f.refunded_cents, 0) AS refunded_payments_cents,
       COALESCE(a.refund_cents, 0) - COALESCE(f.refunded_cents, 0) AS outstanding_cents
FROM orders o
LEFT JOIN approved_refunds a ON a.order_id = o.id
LEFT JOIN refunded_payments f ON f.order_id = o.id
WHERE a.order_id IS NOT NULL OR f.order_id IS NOT NULL
ORDER BY outstanding_cents DESC, order_id;
\`\`\`

## সাধারণ ভুল
pending বা rejected return-কেও দাবি ধরা; \`refunded\` ছাড়া অন্য payment-ও ফেরত গোনা; approved_refunds-কে INNER JOIN করে শুধু refunded-payment-ওয়ালা অর্ডার (বা উল্টোটা) হারানো; outstanding-এর চিহ্ন উল্টো করা — দাবি − সত্যা ধরাই সঠিক।`,
    difficulty: "MEDIUM",
    points: 300,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    premiumModuleSlug: "advanced-sql",
    category: "SQL Advanced",
    subcategory: "Finance",
    referencePython: "",
    referenceSql: `WITH approved_refunds AS (
  SELECT o.id AS order_id, SUM(r.refund_cents) AS refund_cents
  FROM returns r
  JOIN order_items oi ON oi.id = r.order_item_id
  JOIN orders o ON o.id = oi.order_id
  WHERE r.status = 'approved'
  GROUP BY o.id
), refunded_payments AS (
  SELECT order_id, SUM(amount_cents) AS refunded_cents
  FROM payments
  WHERE status = 'refunded'
  GROUP BY order_id
)
SELECT o.id AS order_id,
       COALESCE(a.refund_cents, 0) AS approved_refunds_cents,
       COALESCE(f.refunded_cents, 0) AS refunded_payments_cents,
       COALESCE(a.refund_cents, 0) - COALESCE(f.refunded_cents, 0) AS outstanding_cents
FROM orders o
LEFT JOIN approved_refunds a ON a.order_id = o.id
LEFT JOIN refunded_payments f ON f.order_id = o.id
WHERE a.order_id IS NOT NULL OR f.order_id IS NOT NULL
ORDER BY outstanding_cents DESC, order_id;`,
    tests: [
      {
        input: ``,
        expectedOutput: `6	320000	0	320000
1	450000	450000	0`,
        isSample: true
      },
      {
        input: `update returns set status='approved' where id=4;`,
        expectedOutput: `6	320000	0	320000
4	150000	0	150000
1	450000	450000	0`,
        isSample: true
      },
      {
        input: `update payments set status='refunded' where id=8;`,
        expectedOutput: `6	320000	0	320000
1	450000	450000	0
8	0	180000	-180000`,
        isSample: false
      },
      {
        input: `update returns set status='rejected' where id=2;`,
        expectedOutput: `1	450000	450000	0`,
        isSample: false
      },
      {
        input: `insert into returns (id,order_item_id,quantity,reason,refund_cents,status,requested_at) values (5,13,1,'damaged',180000,'approved','2026-11-20');`,
        expectedOutput: `6	320000	0	320000
8	180000	0	180000
1	450000	450000	0`,
        isSample: false
      },
    ],
  },
];
