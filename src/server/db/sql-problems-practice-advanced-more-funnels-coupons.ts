import type { SeedProblem } from "./seed-problems";

export const SQL_PROBLEMS_PRACTICE_ADVANCED_MORE_FUNNELS_COUPONS: SeedProblem[] = [
  {
    slug: "sql-practice-funnels-coupons-hard",
    title: "Abandoned cart win-back",
    statement: `মার্কেটিং টিম দেখতে চায় abandoned কার্ট কতটা ফিরিয়ে আনা যায়। প্রতিটি কাস্টমারের abandoned কার্টগুলো ধরো; কার্ট তৈরির দিন থেকে ৩ দিনের মধ্যে (০ থেকে ৩ দিন, বাউন্ডারি সহ) সেই কাস্টমারের কোনো paid/shipped অর্ডার পড়লে সেই কার্ট win-back হয়েছে ধরো। প্রতি কাস্টমারের জন্য বের করো: abandoned কার্ট সংখ্যা, win-back হওয়া কার্ট সংখ্যা ও শতকরা হার (১ দশমিক)। abandoned কার্ট আছে এমন কাস্টমারই তালিকায় আসবে। আউটপুট কলাম: customer, abandoned_carts, winback_carts, winback_pct। নাম অনুযায়ী সাজাও।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`customer\`, \`abandoned_carts\`, \`winback_carts\`, \`winback_pct\`, নাম অনুযায়ী।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## ধারণা
কার্ট-প্রতি হিসাব: প্রতিটি abandoned কার্টকে সেই কাস্টমারের সব paid অর্ডারের সাথে জোড়া দিয়ে দেখো — কার্ট তৈরির তারিখ থেকে অর্ডারের তারিখ ০–৩ দিনের ভেতরে কি না। \`julianday(order_day) - julianday(cart_day) BETWEEN 0 AND 3\` বাউন্ডারি দুটোই ধরে; ঋণাত্মক (কার্টের আগের অর্ডার) বাদ পড়ে।

## ধাপে ধাপে
১. abandoned CTE: status='abandoned' কার্ট + তৈরির তারিখ।
২. কার্ট-প্রতি LEFT JOIN কাস্টমারের paid/shipped অর্ডার — MAX(CASE ...) দিয়ে won ফ্ল্যাগ।
৩. কাস্টমার ধরে গুনে abandoned_carts, winback_carts।
৪. winback_pct = 100*winback/abandoned, ORDER BY customer।

## কোডে দেখি
\`\`\`sql
WITH abandoned AS (
  SELECT c.id AS cart_id, c.customer_id, c.created_at
  FROM carts c WHERE c.status='abandoned'),
paid_orders AS (
  SELECT o.id, o.customer_id, o.ordered_at
  FROM orders o WHERE o.status IN ('paid','shipped')),
winback AS (
  SELECT a.customer_id, a.cart_id,
         MAX(CASE WHEN julianday(p.ordered_at)
                    - julianday(substr(a.created_at,1,10))
                   BETWEEN 0 AND 3 THEN 1 ELSE 0 END) AS won
  FROM abandoned a LEFT JOIN paid_orders p ON p.customer_id = a.customer_id
  GROUP BY a.customer_id, a.cart_id, a.created_at)
SELECT cu.name AS customer, COUNT(*) AS abandoned_carts, SUM(won) AS winback_carts,
       ROUND(100.0*SUM(won)/COUNT(*), 1) AS winback_pct
FROM winback JOIN customers cu ON cu.id = winback.customer_id
GROUP BY winback.customer_id, cu.name ORDER BY customer;
\`\`\`

## সাধারণ ভুল
কার্টের আগের অর্ডারও গুনে ফেলা (BETWEEN 0 AND 3-এর 0 বাদ); কার্ট না কাস্টমার ধরে গুনলে ভুল হার; কার্টে updated_at ব্যবহার করা (তৈরির পর অনেক পরে আপডেট হতে পারে) — created_at-ই সঠিক ভিত্তি।`,
    difficulty: "HARD",
    points: 320,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    premiumModuleSlug: "advanced-sql",
    category: "SQL Advanced",
    subcategory: "Analytics",
    referencePython: "",
    referenceSql: `WITH abandoned AS (
  SELECT c.id AS cart_id, c.customer_id, c.created_at
  FROM carts c WHERE c.status='abandoned'),
paid_orders AS (
  SELECT o.id, o.customer_id, o.ordered_at
  FROM orders o WHERE o.status IN ('paid','shipped')),
winback AS (
  SELECT a.customer_id, a.cart_id,
         MAX(CASE WHEN julianday(p.ordered_at) - julianday(substr(a.created_at,1,10)) BETWEEN 0 AND 3 THEN 1 ELSE 0 END) AS won
  FROM abandoned a LEFT JOIN paid_orders p ON p.customer_id = a.customer_id
  GROUP BY a.customer_id, a.cart_id, a.created_at)
SELECT cu.name AS customer, COUNT(*) AS abandoned_carts, SUM(won) AS winback_carts,
       ROUND(100.0*SUM(won)/COUNT(*), 1) AS winback_pct
FROM winback JOIN customers cu ON cu.id = winback.customer_id
GROUP BY winback.customer_id, cu.name ORDER BY customer;`,
    tests: [
      {
        input: ``,
        expectedOutput: `Karim	1	0	0.0
Sajid	1	0	0.0`,
        isSample: true
      },
      {
        input: `insert into orders (id,customer_id,ordered_at,status) values (11,2,'2026-10-04','paid');`,
        expectedOutput: `Karim	1	1	100.0
Sajid	1	0	0.0`,
        isSample: true
      },
      {
        input: `insert into carts (id,customer_id,status,created_at,updated_at) values (9,3,'abandoned','2026-10-26 10:00','2026-10-27 10:00');`,
        expectedOutput: `Karim	1	0	0.0
Nusrat	1	1	100.0
Sajid	1	0	0.0`,
        isSample: false
      },
      {
        input: `insert into orders (id,customer_id,ordered_at,status) values (11,4,'2026-10-10','paid'); insert into order_items (id,order_id,product_id,quantity,unit_price_cents) values (16,11,8,1,85000);`,
        expectedOutput: `Karim	1	0	0.0
Sajid	1	1	100.0`,
        isSample: false
      },
      {
        input: `update carts set status='active' where id=4;`,
        expectedOutput: `Karim	1	0	0.0`,
        isSample: false
      },
    ],
  },
  {
    slug: "sql-practice-funnels-coupons-challenge",
    title: "Coupon redemption audit",
    statement: `কুপন টিম সন্দেহ করছে কিছু redemption নিয়ম ভেঙেছে। প্রতিটি কুপনের সব redemption ধরো; একটি redemption বৈধ হতে হবে দুই শর্তে — redeemed_at কুপনের starts_at ও ends_at-এর ভেতরে (দুই বাউন্ডারিও অন্তর্ভুক্ত) এবং redemption-এর অর্ডারটি paid/shipped। কোনো শর্ত ভাঙলে সেটি অবৈধ। প্রতি কুপনের জন্য বের করো: মোট redemption, বৈধ redemption সংখ্যা এবং অবৈধ redemption-গুলোর ডিসকাউন্টের যোগফল (সেন্টে)। একটিও redemption না থাকলে 0/0/0 দেখাও। আউটপুট কলাম: coupon, redemptions, valid_redemptions, invalid_discount_cents। কুপন কোড অনুযায়ী সাজাও।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`coupon\`, \`redemptions\`, \`valid_redemptions\`, \`invalid_discount_cents\`, কোড অনুযায়ী।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## ধারণা
বৈধতা একটি সারিতেই ঠেকানো যায়: \`CASE WHEN redeemed_at BETWEEN starts_at AND ends_at AND order status IN ('paid','shipped') THEN 1 ELSE 0 END\`। তারিখ দুটো TEXT, তাই BETWEEN স্ট্রিং তুলনায় বাউন্ডারি দুটোই ধরে — শুধু ফরম্যাট একরকম রাখতে হবে। সব কুপন দরকার তাই coupons LEFT JOIN redemptions।

## ধাপে ধাপে
১. redemptions CTE: coupon_redemptions + coupons + orders জোড়া, প্রতি সারিতে valid ফ্ল্যাগ।
২. coupons LEFT JOIN সেটার সাথে — redemption-হীন কুপনও থাকবে।
৩. COUNT(r.id) মোট, SUM(valid) বৈধ, CASE দিয়ে অবৈধের ডিসকাউন্ট যোগ।
৪. ORDER BY code।

## কোডে দেখি
\`\`\`sql
WITH redemptions AS (
  SELECT cr.id, cr.coupon_id, cr.discount_cents,
         CASE WHEN cr.redeemed_at BETWEEN c.starts_at AND c.ends_at
               AND o.status IN ('paid','shipped') THEN 1 ELSE 0 END AS valid
  FROM coupon_redemptions cr
  JOIN coupons c ON c.id = cr.coupon_id
  JOIN orders o ON o.id = cr.order_id)
SELECT c.code AS coupon, COUNT(r.id) AS redemptions,
       COALESCE(SUM(r.valid), 0) AS valid_redemptions,
       COALESCE(SUM(CASE WHEN r.valid=0 THEN r.discount_cents ELSE 0 END), 0) AS invalid_discount_cents
FROM coupons c LEFT JOIN redemptions r ON r.coupon_id = c.id
GROUP BY c.id, c.code ORDER BY c.code;
\`\`\`

## সাধারণ ভুল
\`WHERE redeemed_at <= ends_at\` লিখে starts_at বাদ দেওয়া; \`status='paid'\` দিয়ে shipped বাদ দেওয়া; INNER JOIN redemption করে শূন্য-redemption কুপন পুরো হারানো; cancelled অর্ডারের ডিসকাউন্ট বৈধ হিসেবে গুনে ফেলা।`,
    difficulty: "HARD",
    points: 340,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    premiumModuleSlug: "advanced-sql",
    category: "SQL Advanced",
    subcategory: "Analytics",
    referencePython: "",
    referenceSql: `WITH redemptions AS (
  SELECT cr.id, cr.coupon_id, cr.discount_cents,
         CASE WHEN cr.redeemed_at BETWEEN c.starts_at AND c.ends_at AND o.status IN ('paid','shipped') THEN 1 ELSE 0 END AS valid
  FROM coupon_redemptions cr
  JOIN coupons c ON c.id = cr.coupon_id
  JOIN orders o ON o.id = cr.order_id)
SELECT c.code AS coupon, COUNT(r.id) AS redemptions,
       COALESCE(SUM(r.valid), 0) AS valid_redemptions,
       COALESCE(SUM(CASE WHEN r.valid=0 THEN r.discount_cents ELSE 0 END), 0) AS invalid_discount_cents
FROM coupons c LEFT JOIN redemptions r ON r.coupon_id = c.id
GROUP BY c.id, c.code ORDER BY c.code;`,
    tests: [
      {
        input: ``,
        expectedOutput: `FESTIVE500	2	2	0
FREESHIP	2	2	0
TECH15	1	1	0
WELCOME10	1	1	0`,
        isSample: true
      },
      {
        input: `update orders set status='cancelled' where id=1;`,
        expectedOutput: `FESTIVE500	2	2	0
FREESHIP	2	2	0
TECH15	1	1	0
WELCOME10	1	0	89000`,
        isSample: true
      },
      {
        input: `insert into coupon_redemptions (id,coupon_id,order_id,customer_id,discount_cents,redeemed_at) values (7,4,10,6,50000,'2026-11-05');`,
        expectedOutput: `FESTIVE500	2	2	0
FREESHIP	2	2	0
TECH15	2	1	50000
WELCOME10	1	1	0`,
        isSample: false
      },
      {
        input: `update coupon_redemptions set redeemed_at='2026-11-20' where id=5;`,
        expectedOutput: `FESTIVE500	2	1	50000
FREESHIP	2	2	0
TECH15	1	1	0
WELCOME10	1	1	0`,
        isSample: false
      },
      {
        input: `update orders set status='pending' where id=6;`,
        expectedOutput: `FESTIVE500	2	2	0
FREESHIP	2	1	6000
TECH15	1	1	0
WELCOME10	1	1	0`,
        isSample: false
      },
    ],
  },
];
