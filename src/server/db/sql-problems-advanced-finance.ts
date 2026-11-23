import type { SeedProblem } from "./seed-problems";

export const SQL_PROBLEMS_ADVANCED_FINANCE: SeedProblem[] = [
  {
    slug: "sql-adv-payout-reconciliation",
    title: "Payout reconciliation",
    statement: `অক্টোবর ২০২৬ (ordered_at 2026-10-01 থেকে 2026-10-31) এর প্রতিটি vendor payout অডিট করো। নিজে হিসাব করো: ওই সময়ের paid/shipped অর্ডারের order_items থেকে ভেন্ডর ধরে gross; ওইসব অর্ডারের approved return-এর মোট রিফান্ড (হিসাব অর্ডারের তারিখ ধরে, return-এর requested_at নয়); কমিশন gross-এর ১০%; expected net = gross − কমিশন − রিফান্ড। এবার vendor_payouts-এ লেখা gross আর net-এর সাথে মেলাও। আউটপুট কলাম: vendor, payout_gross_cents, expected_gross_cents, payout_net_cents, expected_net_cents, difference_cents (= payout_net_cents − expected_net_cents)। ভেন্ডরের নাম অনুযায়ী সাজাও।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`vendor\`, \`payout_gross_cents\`, \`expected_gross_cents\`, \`payout_net_cents\`, \`expected_net_cents\`, \`difference_cents\`।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## কেন দরকার
ভেন্ডর পেআউট এমন জায়গা যেখানে ছোট ভুলেই বড় টাকা চলে যায়। একটা নভেম্বরের অর্ডার অক্টোবরের payout-এ ঢুকলে ভেন্ডর এমনিতেই বেশি পায়; approved রিফান্ড বাদ পড়লে কম পায়; কমিশন ভুল হলে প্ল্যাটফর্ম নিজেই ক্ষতিগ্রস্ত হয়। তাই ফিন্যান্স টিম মাস শেষে payout টেবিলের লেখাকে বিশ্বাস করে না—orders, order_items আর returns থেকে আবার শুরু করে গুণে মিলিয়ে দেখে। এই পুনরায় হিসাব করে মেলানোর কাজটিই reconciliation, আর বড় মার্কেটপ্লেসে এটা মাসিক বাধ্যতামূলক ধাপ।

## মূল ধারণা
হিসাব দুই দিকে ভাগ করো—payout (যা লেখা আছে) আর expected (নিজে গুণে যা হওয়া উচিত)। expected-এর নিয়ম: অক্টোবরের paid/shipped অর্ডার ধরে gross; রিফান্ড হিসাব হবে অর্ডারের তারিখ ধরে, requested_at নয়; কমিশন gross-এর ১০%; net = gross − কমিশন − approved রিফান্ড। চারটি CTE-তে ভাগ করলে প্রতিটি ধাপ ছোট একটি প্রশ্ন হয়—payout, gross, refunds, expected—ফলে query পড়ার মতো থাকে আর ভুল ধরা সহজ হয়। টাকা সব integer সেন্টে, তাই ভগ্নাংশের দুশ্চিন্তা নেই।

## ধাপে ধাপে
১. payouts: অক্টোবরের period ফিল্টার করা vendor_payouts সারি।
২. october_items: অক্টোবরের paid/shipped অর্ডারের আইটেম থেকে ভেন্ডর ধরে gross।
৩. october_refunds: approved return অর্ডারের তারিখ মিলিয়ে ভেন্ডর ধরে মোট রিফান্ড।
৪. expected: gross − ১০% gross − রিফান্ড।
৫. payout আর expected ভেন্ডর ধরে জুড়ে difference_cents = payout_net − expected_net।

## কোডে দেখি
\`\`\`sql
WITH payouts AS (
  SELECT vendor_id, gross_cents, net_cents
  FROM vendor_payouts
  WHERE period_start = '2026-10-01' AND period_end = '2026-10-31'
), october_items AS (
  SELECT p.vendor_id, SUM(oi.quantity * oi.unit_price_cents) AS gross_cents
  FROM order_items oi
  JOIN orders o ON o.id = oi.order_id
  JOIN products p ON p.id = oi.product_id
  WHERE o.status IN ('paid', 'shipped')
    AND o.ordered_at BETWEEN '2026-10-01' AND '2026-10-31'
  GROUP BY p.vendor_id
), october_refunds AS (
  SELECT p.vendor_id, SUM(r.refund_cents) AS refund_cents
  FROM returns r
  JOIN order_items oi ON oi.id = r.order_item_id
  JOIN orders o ON o.id = oi.order_id
  JOIN products p ON p.id = oi.product_id
  WHERE r.status = 'approved'
    AND o.status IN ('paid', 'shipped')
    AND o.ordered_at BETWEEN '2026-10-01' AND '2026-10-31'
  GROUP BY p.vendor_id
), expected AS (
  SELECT i.vendor_id, i.gross_cents,
         i.gross_cents - CAST(ROUND(i.gross_cents * 0.10, 0) AS INTEGER)
           - COALESCE(f.refund_cents, 0) AS net_cents
  FROM october_items i
  LEFT JOIN october_refunds f ON f.vendor_id = i.vendor_id
)
SELECT v.name AS vendor,
       pay.gross_cents AS payout_gross_cents,
       e.gross_cents AS expected_gross_cents,
       pay.net_cents AS payout_net_cents,
       e.net_cents AS expected_net_cents,
       pay.net_cents - e.net_cents AS difference_cents
FROM payouts pay
JOIN vendors v ON v.id = pay.vendor_id
LEFT JOIN expected e ON e.vendor_id = pay.vendor_id
ORDER BY vendor;
\`\`\`

## কমপ্লেক্সিটি
\`O(n log n)\` — কয়েকটি গ্রুপিং, টেবিল ছোট।

## সাধারণ ভুল
ordered_at-এর অক্টোবর ফিল্টার ভুলে নভেম্বরের অর্ডার ঢোকানো; pending বা rejected return রিফান্ডে ধরা; কমিশন (gross − refund)-এর শতকরা ভেবে হিসাব ভাঙা; রিফান্ড CTE-কে INNER JOIN করে রিফান্ডহীন ভেন্ডর হারানো; difference-এর চিহ্ন উল্টো করা—এখানে payout_net − expected_net ধরাই সঠিক।`,
    difficulty: "HARD",
    points: 350,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    premiumModuleSlug: "advanced-sql",
    category: "SQL Advanced",
    subcategory: "Finance",
    referencePython: "",
    referenceSql: `WITH payouts AS (
  SELECT vendor_id, gross_cents, net_cents
  FROM vendor_payouts
  WHERE period_start = '2026-10-01' AND period_end = '2026-10-31'
), october_items AS (
  SELECT p.vendor_id, SUM(oi.quantity*oi.unit_price_cents) AS gross_cents
  FROM order_items oi
  JOIN orders o ON o.id=oi.order_id
  JOIN products p ON p.id=oi.product_id
  WHERE o.status IN ('paid','shipped')
    AND o.ordered_at BETWEEN '2026-10-01' AND '2026-10-31'
  GROUP BY p.vendor_id
), october_refunds AS (
  SELECT p.vendor_id, SUM(r.refund_cents) AS refund_cents
  FROM returns r
  JOIN order_items oi ON oi.id=r.order_item_id
  JOIN orders o ON o.id=oi.order_id
  JOIN products p ON p.id=oi.product_id
  WHERE r.status='approved'
    AND o.status IN ('paid','shipped')
    AND o.ordered_at BETWEEN '2026-10-01' AND '2026-10-31'
  GROUP BY p.vendor_id
), expected AS (
  SELECT i.vendor_id, i.gross_cents,
         i.gross_cents - CAST(ROUND(i.gross_cents*0.10, 0) AS INTEGER)
           - COALESCE(f.refund_cents, 0) AS net_cents
  FROM october_items i
  LEFT JOIN october_refunds f ON f.vendor_id=i.vendor_id
)
SELECT v.name AS vendor,
       pay.gross_cents AS payout_gross_cents,
       e.gross_cents AS expected_gross_cents,
       pay.net_cents AS payout_net_cents,
       e.net_cents AS expected_net_cents,
       pay.net_cents - e.net_cents AS difference_cents
FROM payouts pay
JOIN vendors v ON v.id=pay.vendor_id
LEFT JOIN expected e ON e.vendor_id=pay.vendor_id
ORDER BY vendor;`,
    tests: [
      {
        input: ``,
        expectedOutput: `BookBazar	465000	465000	418500	418500	0
GadgetPoint	150000	150000	135000	135000	0
HomeCraft	540000	540000	166000	166000	0
StyleHub	1100000	720000	880000	648000	232000
TechNest	3190000	3190000	2421000	2421000	0`,
        isSample: true
      },
      {
        input: `update orders set ordered_at='2026-10-30' where id=10;`,
        expectedOutput: `BookBazar	465000	465000	418500	418500	0
GadgetPoint	150000	150000	135000	135000	0
HomeCraft	540000	540000	166000	166000	0
StyleHub	1100000	1100000	880000	990000	-110000
TechNest	3190000	3190000	2421000	2421000	0`,
        isSample: true
      },
      {
        input: `update returns set status='approved' where id=4;`,
        expectedOutput: `BookBazar	465000	465000	418500	418500	0
GadgetPoint	150000	150000	135000	-15000	150000
HomeCraft	540000	540000	166000	166000	0
StyleHub	1100000	720000	880000	648000	232000
TechNest	3190000	3190000	2421000	2421000	0`,
        isSample: false
      },
      {
        input: `update returns set status='rejected' where id=1;`,
        expectedOutput: `BookBazar	465000	465000	418500	418500	0
GadgetPoint	150000	150000	135000	135000	0
HomeCraft	540000	540000	166000	166000	0
StyleHub	1100000	720000	880000	648000	232000
TechNest	3190000	3190000	2421000	2871000	-450000`,
        isSample: false
      },
      {
        input: `insert into orders (id,customer_id,ordered_at,status) values (11,6,'2026-10-15','paid'); insert into order_items (id,order_id,product_id,quantity,unit_price_cents) values (16,11,11,1,110000);`,
        expectedOutput: `BookBazar	465000	465000	418500	418500	0
GadgetPoint	150000	150000	135000	135000	0
HomeCraft	540000	650000	166000	265000	-99000
StyleHub	1100000	720000	880000	648000	232000
TechNest	3190000	3190000	2421000	2421000	0`,
        isSample: false
      },
    ],
  },
  {
    slug: "sql-adv-refund-impact",
    title: "Refund impact",
    statement: `ভেন্ডর ধরে রিফান্ডের আসল প্রভাব মাপো। paid/shipped অর্ডারের order_items থেকে প্রতিটি ভেন্ডরের মোট বিক্রি (gross), ওইসব অর্ডারের approved return-এর মোট রিফান্ড, রিফান্ডের হার শতকরায় (এক দশমিক, refunds/gross × ১০০) আর net = gross − refunds বের করো। আউটপুট কলাম: vendor, gross_cents, refunds_cents, refund_rate_pct, net_cents। আগে রিফান্ডের হার বেশি থেকে কম, সমান হলে ভেন্ডরের নাম অনুযায়ী সাজাও।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`vendor\`, \`gross_cents\`, \`refunds_cents\`, \`refund_rate_pct\`, \`net_cents\`।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## কেন দরকার
শুধু বিক্রির সংখ্যা দেখলে অর্ধেক গল্প দেখা হয়। যে ভেন্ডরের প্রতি একশ টাকার বিক্রিতে ষাট টাকা ফেরত যাচ্ছে, তার আসল আয় দাঁড়ায় মাত্র চল্লিশ। মার্কেটপ্লেসের কাছে refund rate হলো প্রোডাক্ট মানের অ্যালার্ম—কাকে সতর্ক জানানো হবে, কার নতুন অর্ডার আটকানো হবে, সব নির্ভর করে এই হারের উপর। তাই ভেন্ডর ধরে gross, রিফান্ড, হার আর net একসাথে দেখার রিপোর্ট দরকার।

## মূল ধারণা
দুটো আলাদা aggregate: gross আসে order_items থেকে (শুধু paid/shipped অর্ডার), রিফান্ড আসে returns থেকে (শুধু approved, আর সেই অর্ডারও paid/shipped)। দুটো ভেন্ডর ধরে জোড়া লাগাও—কিন্তু সব ভেন্ডরের রিফান্ড থাকে না, তাই refunds পাশে LEFT JOIN আর COALESCE(..., 0)। হারের হিসাবে 100.0 লিখে integer division এড়াও, আর ROUND(..., 1) দিয়ে এক দশমিকে ছাঁটো। এই রিপোর্টে কোনো মাসের ফিল্টার নেই—paid/shipped সব বিক্রি ধরেই হার বের হয়।

## ধাপে ধাপে
১. vendor_gross CTE: paid/shipped অর্ডারের আইটেম থেকে ভেন্ডর ধরে gross।
২. vendor_refunds CTE: approved return থেকে ভেন্ডর ধরে মোট রিফান্ড।
৩. LEFT JOIN + COALESCE দিয়ে দুটো জোড়া।
৪. refund_rate_pct = ROUND(100.0 * refunds / gross, 1), net = gross − refunds।
৫. ORDER BY refund_rate_pct DESC, vendor।

## কোডে দেখি
\`\`\`sql
WITH vendor_gross AS (
  SELECT p.vendor_id, SUM(oi.quantity * oi.unit_price_cents) AS gross_cents
  FROM order_items oi
  JOIN orders o ON o.id = oi.order_id
  JOIN products p ON p.id = oi.product_id
  WHERE o.status IN ('paid', 'shipped')
  GROUP BY p.vendor_id
), vendor_refunds AS (
  SELECT p.vendor_id, SUM(r.refund_cents) AS refund_cents
  FROM returns r
  JOIN order_items oi ON oi.id = r.order_item_id
  JOIN orders o ON o.id = oi.order_id
  JOIN products p ON p.id = oi.product_id
  WHERE r.status = 'approved' AND o.status IN ('paid', 'shipped')
  GROUP BY p.vendor_id
)
SELECT v.name AS vendor,
       g.gross_cents AS gross_cents,
       COALESCE(f.refund_cents, 0) AS refunds_cents,
       ROUND(100.0 * COALESCE(f.refund_cents, 0) / g.gross_cents, 1) AS refund_rate_pct,
       g.gross_cents - COALESCE(f.refund_cents, 0) AS net_cents
FROM vendor_gross g
JOIN vendors v ON v.id = g.vendor_id
LEFT JOIN vendor_refunds f ON f.vendor_id = g.vendor_id
ORDER BY refund_rate_pct DESC, vendor;
\`\`\`

## কমপ্লেক্সিটি
\`O(n log n)\` — দুটি গ্রুপিং আর একটি সাজানো।

## সাধারণ ভুল
pending বা rejected রিটার্নও রিফান্ডে যোগ করা; LEFT JOIN ছাড়া রিফান্ডহীন ভেন্ডর বাদ পড়া; 100 লিখে integer division-এ হার শূন্য আসা; ROUND ছাড়া লম্বা ভগ্নাংশ রেখে দেওয়া; টাই-ব্রেকার vendor ভুলে যাওয়া।`,
    difficulty: "HARD",
    points: 350,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    premiumModuleSlug: "advanced-sql",
    category: "SQL Advanced",
    subcategory: "Finance",
    referencePython: "",
    referenceSql: `WITH vendor_gross AS (
  SELECT p.vendor_id, SUM(oi.quantity*oi.unit_price_cents) AS gross_cents
  FROM order_items oi
  JOIN orders o ON o.id=oi.order_id
  JOIN products p ON p.id=oi.product_id
  WHERE o.status IN ('paid','shipped')
  GROUP BY p.vendor_id
), vendor_refunds AS (
  SELECT p.vendor_id, SUM(r.refund_cents) AS refund_cents
  FROM returns r
  JOIN order_items oi ON oi.id=r.order_item_id
  JOIN orders o ON o.id=oi.order_id
  JOIN products p ON p.id=oi.product_id
  WHERE r.status='approved' AND o.status IN ('paid','shipped')
  GROUP BY p.vendor_id
)
SELECT v.name AS vendor,
       g.gross_cents AS gross_cents,
       COALESCE(f.refund_cents, 0) AS refunds_cents,
       ROUND(100.0 * COALESCE(f.refund_cents, 0) / g.gross_cents, 1) AS refund_rate_pct,
       g.gross_cents - COALESCE(f.refund_cents, 0) AS net_cents
FROM vendor_gross g
JOIN vendors v ON v.id=g.vendor_id
LEFT JOIN vendor_refunds f ON f.vendor_id=g.vendor_id
ORDER BY refund_rate_pct DESC, vendor;`,
    tests: [
      {
        input: ``,
        expectedOutput: `HomeCraft	540000	320000	59.3	220000
TechNest	3190000	450000	14.1	2740000
BookBazar	465000	0	0.0	465000
GadgetPoint	150000	0	0.0	150000
StyleHub	1100000	0	0.0	1100000`,
        isSample: true
      },
      {
        input: `update returns set status='approved' where id=4;`,
        expectedOutput: `GadgetPoint	150000	150000	100.0	0
HomeCraft	540000	320000	59.3	220000
TechNest	3190000	450000	14.1	2740000
BookBazar	465000	0	0.0	465000
StyleHub	1100000	0	0.0	1100000`,
        isSample: true
      },
      {
        input: `update returns set status='rejected' where id=1;`,
        expectedOutput: `HomeCraft	540000	320000	59.3	220000
BookBazar	465000	0	0.0	465000
GadgetPoint	150000	0	0.0	150000
StyleHub	1100000	0	0.0	1100000
TechNest	3190000	0	0.0	3190000`,
        isSample: false
      },
      {
        input: `update returns set refund_cents=200000 where id=2;`,
        expectedOutput: `HomeCraft	540000	200000	37.0	340000
TechNest	3190000	450000	14.1	2740000
BookBazar	465000	0	0.0	465000
GadgetPoint	150000	0	0.0	150000
StyleHub	1100000	0	0.0	1100000`,
        isSample: false
      },
      {
        input: `insert into returns (id,order_item_id,quantity,reason,refund_cents,status,requested_at) values (5,4,1,'damaged',100000,'approved','2026-11-15');`,
        expectedOutput: `HomeCraft	540000	320000	59.3	220000
TechNest	3190000	450000	14.1	2740000
StyleHub	1100000	100000	9.1	1000000
BookBazar	465000	0	0.0	465000
GadgetPoint	150000	0	0.0	150000`,
        isSample: false
      },
    ],
  },
];
