import type { LearningTopicDefinition } from "@/lib/learning/types";

/** Concept notes for the advanced data & finance topics of the ShopSphere SQL track. */

const jsonInventoryConcept = `## কেন দরকার
আসল দোকানের প্রতিটি ক্যাটাগরির চাহিদা আলাদা। ইলেকট্রনিক্সে চাই ওয়ারেন্টি আর connectivity, বইয়ে চাই format, পোশাকে চাই fabric—প্রতিটি নতুন ধরনের প্রোডাক্টের জন্য টেবিলে নতুন কলাম বানাতে থাকলে স্কিমা অগোছালো হয়ে যাবে। তাই ShopSphere এসব বাড়তি বৈশিষ্ট্য product_attributes টেবিলের attributes কলামে JSON আকারে রাখে—নতুন key যোগ করলেই হয়, স্কিমা ছোঁয়া লাগে না। আর গুদামের হিসাবও এক খাতায় চলে না: products.stock-এ লেখা থাকে এখনকার স্টক, কিন্তু কেনা-বেচা-ফেরত-সমন্বয়ের প্রতিটি ঘটনা লেখা থাকে inventory_movements লেজারে। দুই খাতা মিলিয়ে না দেখলে চুরি, ভুল entry নাকি ভাঙা পণ্য—কিছুই ধরা যায় না। একটা বাস্তব দৃশ্য ভাবো: কাস্টমার ফোন করে জানতে চায় তার কেনা কিবোর্ডের ওয়ারেন্টি কত মাস—উত্তরটা JSON-এর ভেতরে লুকিয়ে আছে। আবার গুদামে হাতে গোনা স্টক আর সিস্টেমের স্টকে পাঁচটা পার্থক্য দেখা দিলে ম্যানেজার প্রথমেই জানতে চাইবেন কোন পণ্যে কত বড় অমিল—কোনটা আগে তদন্ত করা হবে। এই টপিক শেখায় কীভাবে SQL-এর ভিতরেই JSON পড়ে রিপোর্ট বানানো যায়, আর কীভাবে লেজার ধরে গুনে স্টকের অমিল ধরে তদন্তের তালিকা বানানো যায়।

## মূল ধারণা
JSON পড়ার হাতিয়ার json_extract: প্রথম আর্গুমেন্টে JSON টেক্সট, দ্বিতীয়টিতে path। $ মানে JSON-এর root, তাই $.brand মানে root object-এর brand key, $.warranty_months মানে ওয়ারেন্টির মান। এর ফল সাধারণ SQL ভ্যালু—GROUP BY, AVG, WHERE, ORDER BY সব জায়গায় বসতে পারে। প্রয়োজনে path এক স্তর থেকে আরেক স্তরেও নামতে পারে, আর JSON বদলাতে চাইলে json_set কাজ করে—তবে পড়ার কাজটাই এখানে সবচেয়ে বেশি লাগে। আর গুদামের হিসাবে মূল কৌশল movement লেজার: purchase ধনাত্মক, sale ঋণাত্মক, return আবার ধনাত্মক, adjustment যে দিকে খুশি। প্রোডাক্ট ধরে SUM(quantity) দিলে কাগজে-থাকা স্টক বের হয়; products.stock-এর সাথে বিয়োগ করলে অমিল। অমিল সাজানো হয় ABS() ধরে, কারণ বেশি আর কম—দুটোই সমান দুশ্চিন্তার, আর তদন্তের ক্রম ঠিক হয় অমিলের বিশালতা দিয়েই।

| প্রয়োজন | কী লিখবে |
| --- | --- |
| JSON-এ ব্র্যান্ড | \`json_extract(pa.attributes, '$.brand')\` |
| JSON-এ ওয়ারেন্টি | \`json_extract(pa.attributes, '$.warranty_months')\` |
| লেজারের নিট | \`SUM(quantity)\` |
| অমিলের মাপ | \`ABS(stock - movement_net)\` |

## ধাপে ধাপে
১. আগে দেখো তথ্য কোথায়—নিয়মিত কলামে না JSON-এ। JSON হলে json_extract-এর path ঠিক করো।
২. রিপোর্ট কী ধরে গোছাবে (ব্র্যান্ড? প্রোডাক্ট?) ঠিক করে GROUP BY দাও।
৩. গড় বা হার চাইলে ROUND দিয়ে দশমিক ছাঁটো।
৪. স্টক মেলাতে আগে প্রোডাক্ট ধরে movement-এর যোগফল, তারপর products-এর সাথে JOIN।
৫. ORDER BY সবসময় deterministic রাখো—টাই হলে tie-breaker কলাম যোগ করো।

## কোডে দেখি
\`\`\`sql
WITH movement_totals AS (
  SELECT product_id, SUM(quantity) AS movement_net
  FROM inventory_movements
  GROUP BY product_id
)
SELECT p.name AS product, p.stock, mt.movement_net,
       p.stock - mt.movement_net AS difference
FROM products p
JOIN movement_totals mt ON mt.product_id = p.id
ORDER BY ABS(p.stock - mt.movement_net) DESC, p.name;
\`\`\`

## সাধারণ ভুল
JSON path-এ $ ভুলে যাওয়া (ফলে NULL আসে); ব্র্যান্ড কলাম আর JSON একই ভেবে ভুল জায়গা থেকে পড়া; movement-এর ঋণাত্মক quantity ভুলে সব যোগ করা; ABS ছাড়া ORDER BY দিলে বড় ঋণাত্মক অমিল একেবারে নিচে নেমে যাওয়া; আর movement-হীন প্রোডাক্ট LEFT JOIN করে NULL-এর সাথে হিসাব করে বসা।`;

const financeReconciliationConcept = `## কেন দরকার
মার্কেটপ্লেসে টাকার হিসাব দুইবার হয়। প্রথমবার অর্ডার হওয়ার সময়—order_items-এ প্রতিটি আইটেমের দাম লেখা পড়ে। দ্বিতীয়বার মাস শেষে—ভেন্ডরকে পেআউট দেওয়ার সময় vendor_payouts টেবিলে gross, কমিশন, রিফান্ড আর net লেখা হয়। সমস্যা হলো দুই হিসাব কখনো কখনো মেলে না: ভুল মাসের অর্ডার ঢুকে যেতে পারে, রিফান্ড বাদ পড়তে পারে, কমিশন ভুলভাবে ধরা যেতে পারে। প্রতিটি ভুলই সরাসরি ভেন্ডরের পকেট থেকে যায় বা পকেটে ঢোকে—তাই ফিন্যান্স টিম মাস শেষে source টেবিল থেকে আবার হিসাব করে payout-এর সাথে মেলায়। ধরো অক্টোবরের payout-এ একটা নভেম্বরের অর্ডার ঢুকে গেছে—ভেন্ডর এখন এমনিতেই বেশি টাকা পাবে, আর নভেম্বরের হিসাবে ওই বিক্রি আর ধরা যাবে না। আবার রিফান্ডের এন্ট্রি পরের মাসে হলেও রিফান্ড হওয়া অর্ডারটা যে মাসের, রিফান্ড সেই মাসের হিসাবেই ধরতে হবে—নাহলে দুই মাসের খাতাই একসাথে ভুল হয়ে যায়। এই reconciliation কাজটাই অডিটের প্রাণ, আর প্রতিটি বড় ই-কমার্স প্রতিষ্ঠানে এটা মাসিক বাধ্যতামূলক ধাপ।

## মূল ধারণা
reconciliation-এর সোজা নিয়ম: এক দিকে দাবি (payout-এ যা লেখা), আরেক দিকে নিজের হিসাব (source থেকে যা বের হওয়া উচিত)। নিজের হিসাবে gross আসে paid/shipped অর্ডারের order_items থেকে, ভেন্ডর ধরে গুছানো; রিফান্ড আসে approved return থেকে—কিন্তু মাস ধরা হয় অর্ডারের তারিখ, রিফান্ড চাওয়ার তারিখ নয়; কমিশন হলো gross-এর নির্দিষ্ট শতকরা; net = gross − কমিশন − রিফান্ড। জটিল হিসাবকে CTE-তে ধাপে ধাপে ভাগ করো—প্রতিটি CTE একটি ছোট প্রশ্নের উত্তর দেয়, ফলে পুরোটা পড়া যায় আর ভুল ধরা সহজ হয়। পার্থক্যের চিহ্নও অর্থবহ—payout_net বেশি হলে ভেন্ডর বেশি পেয়েছে (overpaid), কম হলে কম পেয়েছে (underpaid); তদন্তের দিক ঠিক হয় সেই চিহ্ন দেখেই। আর যে ভেন্ডরের কোনো approved রিফান্ড নেই, তাকে LEFT JOIN আর COALESCE(..., 0) দিয়ে রিপোর্টে রাখো—INNER JOIN করলে ভেন্ডর উধাও হয়ে যাবে, রিপোর্ট দেখে কেউ বুঝবেই না সে হিসাবের বাইরে গেছে। টাকা সবসময় integer সেন্টে রাখো—float-এ টাকা গুনলে ভগ্নাংশের জন্য হিসাব কখনো মেলে না।

| ধাপ | কাজ |
| --- | --- |
| gross | \`SUM(oi.quantity * oi.unit_price_cents)\` |
| রিফান্ড | \`SUM(r.refund_cents)\` শুধু approved |
| কমিশন | \`CAST(ROUND(gross * 0.10, 0) AS INTEGER)\` |
| মিল | \`payout_net - expected_net\` |

## ধাপে ধাপে
১. মাসের payout সারি আলাদা করো (period_start/period_end)।
২. প্রথম CTE-তে মাসের paid/shipped অর্ডার থেকে ভেন্ডর ধরে gross।
৩. দ্বিতীয় CTE-তে approved রিফান্ড, অর্ডারের তারিখ মিলিয়ে।
৪. তৃতীয় CTE-তে কমিশন বাদ দিয়ে expected net।
৫. payout-এর সাথে ভেন্ডর ধরে জুড়ে difference বের করো, শেষে deterministic ORDER BY।

## কোডে দেখি
\`\`\`sql
WITH october_gross AS (
  SELECT p.vendor_id, SUM(oi.quantity * oi.unit_price_cents) AS gross_cents
  FROM order_items oi
  JOIN orders o ON o.id = oi.order_id
  JOIN products p ON p.id = oi.product_id
  WHERE o.status IN ('paid', 'shipped')
    AND o.ordered_at >= '2026-10-01' AND o.ordered_at < '2026-11-01'
  GROUP BY p.vendor_id
)
SELECT v.name AS vendor, g.gross_cents
FROM october_gross g
JOIN vendors v ON v.id = g.vendor_id
ORDER BY vendor;
\`\`\`

## সাধারণ ভুল
date ফিল্টার না দিয়ে পরের মাসের অর্ডার ঢোকিয়ে দেওয়া; pending বা rejected রিফান্ডও বাদ দিতে ভুলে যাওয়া; কমিশন ভুল ভিত্তির (gross নাকি gross−refund) শতকরা ধরা; রিফান্ড নেই এমন ভেন্ডরকে INNER JOIN-এ হারিয়ে ফেলা; আর সেন্টের বদলে float টাকায় হিসাব করে মিল না হওয়া।`;

export const ADVANCED_SQL_DATA_TOPICS: LearningTopicDefinition[] = [
  {
    slug: "json-inventory",
    title: "JSON & inventory",
    titleBn: "JSON ও ইনভেন্টরি",
    summary:
      "json_extract দিয়ে JSON attributes পড়ে ব্র্যান্ড-ওয়ারেন্টি রিপোর্ট, আর inventory_movements লেজার গুনে products.stock-এর অমিল ধরা।",
    concept: jsonInventoryConcept,
    guidedProblemSlugs: ["sql-adv-brand-warranty", "sql-adv-stock-reconciliation"],
    practiceProblemSlugs: { easy: [], medium: [], hard: [] },
    extraProblemSlugs: [],
  },
  {
    slug: "finance-reconciliation",
    title: "Finance & payouts",
    titleBn: "ফিন্যান্স ও পেআউট",
    summary:
      "CTE দিয়ে payout আবার হিসাব করে vendor_payouts যাচাই, আর ভেন্ডর ধরে রিফান্ডের হার ও net রেভিনিউ বের করা।",
    concept: financeReconciliationConcept,
    guidedProblemSlugs: ["sql-adv-payout-reconciliation", "sql-adv-refund-impact"],
    practiceProblemSlugs: { easy: [], medium: [], hard: [] },
    extraProblemSlugs: [],
  },
];
