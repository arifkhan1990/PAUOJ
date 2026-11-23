import type { LearningTopicDefinition } from "@/lib/learning/types";

/** Extra topics for the Advanced SQL module: advanced window functions and pivot/grouping. */
export const ADVANCED_SQL_WINDOW_TOPICS: LearningTopicDefinition[] = [
  {
    slug: "advanced-windows",
    title: "Advanced windows",
    titleBn: "অ্যাডভান্সড উইন্ডো",
    summary:
      "LAG/LEAD, NTILE, PERCENT_RANK, FIRST_VALUE/LAST_VALUE, named window আর ROWS/RANGE frame—কাস্টমারের অর্ডার-ফাঁক আর ক্যাটাগরির দাম-স্তর বের করা।",
    concept: `## কেন দরকার
running total আর moving average তো গেল; window-এর বাকি যন্ত্রপাতি এবার। ব্যবসার অনেক প্রশ্ন আসলে "আগের সারির সাথে তুলনা": এই কাস্টমার আগের অর্ডার থেকে কত দিন পরে ফিরল, এই মাসের বিক্রি গত মাসের চেয়ে কত গুণ, ক্যাটাগরির পণ্যটা দামের কোন স্তরে পড়ে, প্রিমিয়াম গ্রুপের সবচেয়ে দামি পণ্যটা কোনটা। এর একটার জন্য দরকার পাশের সারি (LAG/LEAD), আরেকটার জন্য ভাগ (NTILE, PERCENT_RANK), আরেকটার জন্য দলের প্রথম-শেষ মান (FIRST_VALUE/LAST_VALUE)। self-join দিয়ে এগুলো করা গেলেও প্রতিটি সারির জন্য টেবিল আবার ছোঁয়া লাগে—window function একবার সাজিয়েই সব সারিতে একসাথে উত্তর বসিয়ে দেয়।

## মূল ধারণা
\`LAG(x)\` ঠিক এক ঘর আগের সারির মান আনে, \`LEAD(x)\` এক ঘর পরেরটা; \`PARTITION BY\` দিলে "আগে" মানে শুধু নিজের দলের ভেতরে, আর দ্বিতীয় আর্গুমেন্টে \`LAG(x,2)\` দুই ঘর পিছনে যাওয়া যায়। দলের প্রথম সারিতে LAG-এর কিছু পাওয়া যায় না—NULL দেয়, সেটাই সংকেত যে এই সারির আগে ইতিহাস নেই। র‍্যাংকিংয়ের দুই ভাই: \`NTILE(k)\` সারিগুলোকে k-টা সমান-কাছাকাছি বালতিতে ফেলে (ভাগশেষ সারিগুলো শুরুর বালতিগুলোতে একটা করে বেশি), আর \`PERCENT_RANK()\` বলে দেয় সারিটা দলের কত শতাংশ আগে—মান (rank-1)/(rows-1), 0 থেকে 1-এর মধ্যে। \`FIRST_VALUE(x)\` আর \`LAST_VALUE(x)\` window-এর প্রথম ও শেষ মান ধরে আনে; সাবধান—ORDER BY থাকলে ডিফল্ট frame বর্তমান সারি পর্যন্ত, তাই "দলের শেষ মান" চাইলে frame পুরো দল জুড়ে টানতে হয়, যেমন \`ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING\`। এই জায়গাতেই ROWS/RANGE পার্থক্যটা জীবন্ত হয়: ROWS সারির সংখ্যা গোনে, RANGE সমান ORDER BY-মানের সারিগুলোকে এক গুচ্ছে ধরে—moving average-এ ROWS চাই, একই দিনের সব সারিকেই একসাথে ধরতে হলে RANGE। একই window বারবার লাগলে নাম দিয়ে একবার লেখো: \`WINDOW w AS (PARTITION BY ... ORDER BY ...)\`, তারপর শুধু \`OVER w\`—কোড ছোট, ভুল কম।

| প্রশ্ন | যন্ত্র |
| --- | --- |
| আগের অর্ডারের তারিখ | \`LAG(ordered_at) OVER (PARTITION BY customer ORDER BY ordered_at, order_id)\` |
| দামের চার স্তর | \`NTILE(4) OVER (PARTITION BY category ORDER BY price_cents DESC)\` |
| কত শতাংশ সারি আগে | \`PERCENT_RANK() OVER (ORDER BY price_cents)\` |
| দলের সর্বোচ্চ দাম | \`FIRST_VALUE(price_cents) OVER (PARTITION BY category ORDER BY price_cents DESC)\` |

## ধাপে ধাপে
১. আগে ঠিক করো "আগে/পরে" কীসের দিক থেকে—PARTITION BY দল, ORDER BY ক্রম, দুটোই দরকার।
২. টাই-ব্রেক যোগ করো (যেমন order_id)—নাহলে সমান মানে ফল অনির্দিষ্ট।
৩. দানা ঠিক করো: অর্ডার-সারিতে হিসাব হলে আগে CTE-তে GROUP BY করে এক অর্ডার = এক সারি বানাও।
৪. একাধিক ফাংশন একই window ব্যবহার করলে WINDOW clause-এ নাম দাও।
৫. শেষে নির্দিষ্ট ORDER BY দিয়ে সাজাও—window-এর ভেতরের ক্রম আর আউটপুটের ক্রম দুটো আলাদা জিনিস।

## কোডে দেখি
\`\`\`sql
WITH order_totals AS (
  SELECT cu.name AS customer, o.id AS order_id, o.ordered_at,
         SUM(oi.quantity * oi.unit_price_cents) AS order_cents
  FROM orders o
  JOIN customers cu ON cu.id = o.customer_id
  JOIN order_items oi ON oi.order_id = o.id
  WHERE o.status IN ('paid', 'shipped')
  GROUP BY o.id
),
lagged AS (
  SELECT customer, order_id, ordered_at, order_cents,
         LAG(ordered_at) OVER w AS previous_ordered_at
  FROM order_totals
  WINDOW w AS (PARTITION BY customer ORDER BY ordered_at, order_id)
)
SELECT customer, order_id, ordered_at, order_cents, previous_ordered_at,
       CAST(julianday(ordered_at) - julianday(previous_ordered_at) AS INTEGER) AS days_since_previous
FROM lagged
ORDER BY customer, ordered_at, order_id;
\`\`\`

## সাধারণ ভুল
PARTITION BY বাদ দিয়ে LAG-এ অন্য কাস্টমারের অর্ডার টেনে আনা; window-এর ORDER BY-তে টাই-ব্রেক না দিয়ে একই তারিখে ফল অদল-বদল; NTILE-এ ASC/DESC উল্টে সবচেয়ে সস্তাকে ১ নম্বর স্তর বানানো; FIRST_VALUE/LAST_VALUE-এর ডিফল্ট frame ভুলে শেষ মান চেয়ে মাঝপথের মান পাওয়া; ROWS-এর বদলে RANGE লিখে সমান মানের সারিগুলোকে একসাথে ধরা; WINDOW clause-এর নাম আর OVER-এর নাম না মেলানো; শেষে বাইরের ORDER BY না দিলে আউটপুটের ক্রমই অনির্দিষ্ট হয়ে যাওয়া।`,
    guidedProblemSlugs: ["sql-adv-customer-lag", "sql-adv-ntile-products"],
    practiceProblemSlugs: { easy: [], medium: [], hard: [] },
    extraProblemSlugs: [],
  },
  {
    slug: "pivot-grouping",
    title: "Pivot & grouping",
    titleBn: "পিভট ও গ্রুপিং",
    summary:
      "SUM+CASE দিয়ে চওড়া রিপোর্ট (pivot), GROUPING SETS/ROLLUP/CUBE-এর ধারণা আর SQLite-এর UNION ALL বিকল্প—মাস কলামে, ভেন্ডর ও স্ট্যাটাস সারিতে।",
    concept: `## কেন দরকার
রিপোর্ট দুই রকম সারিতে আসে: লম্বা (long)—প্রতি সারিতে একটা মান, যেমন "ভেন্ডর X, অক্টোবর মাস, ৩১৯০০০ সেন্ট"; আর চওড়া (wide)—ভেন্ডর X-এর একটাই সারিতে অক্টোবর, নভেম্বর, মোট পাশাপাশি কলামে। ডেটাবেস জমায় লম্বা আকারে, মানুষ আর ড্যাশবোর্ড পড়ে চওড়া আকারে। এই ঘুরিয়ে সাজানোর নাম pivot, আর একই সাথে রিপোর্টের আরেকটা চাহিদা—ভাঙনের নিচে মোট: ক্যাটাগরি ধরে বিক্রি, তার নিচে সব মিলিয়ে গ্রান্ড টোটাল, একই টেবিলে। অ্যানালিটিক্স টিমের রোজকার কাজের অর্ধেকই এই দুই ধারার ভেতরে।

## মূল ধারণা
pivot-এর মানক কৌশল conditional aggregation: GROUP BY-তে সারি-দল ঠিক রেখে প্রতিটি আউটপুট কলামের জন্য \`SUM(CASE WHEN শর্ত THEN মান ELSE 0 END)\` বসাও—শর্ত মেটলে সারিটা সেই কলামের যোগে পড়ে, নাহলে শূন্য। এক স্ক্যানেই যত কলাম চাই, আর নতুন মাস এলে শুধু একটা CASE যোগ করলেই হয়। PostgreSQL-এ একই কাজের জন্য আলাদা crosstab ফাংশন আছে, Excel-এর pivot টেবিলও একই কাজ করে—কিন্তু SUM+CASE সব ডেটাবেসে চলে, তাই এটাই আসল হাতিয়ার। ভাঙনের দিকে বড় ডেটাবেসগুলোতে GROUPING SETS এক query-তে একাধিক গ্রুপিং-স্তর দেয় (শুধু ক্যাটাগরি, শুধু মাস, দুটো মিলিয়ে, আর সব-মোট), ROLLUP hierarchy-র ধাপে ধাপে মোট বসায় (ক্যাটাগরি → সাব-ক্যাটাগরি → গ্রান্ড টোটাল), CUBE সব সম্ভাব্য জোড়ার মোট বানায়। SQLite-এ GROUPING SETS নেই, কিন্তু UNION ALL দিয়ে একই ফল পাওয়া যায়: ভিন্ন গ্রুপিং-স্তরের প্রতিটি SELECT আলাদা লিখে সারি জুড়ে দাও, মোট-সারিতে গ্রুপিং কলামে NULL বসাও—দেখতে অনেকটা ROLLUP-এর মতোই, ব্যবহারও এক।

| প্রয়োজন | কৌশল |
| --- | --- |
| মাসগুলো কলামে | \`SUM(CASE WHEN month='2026-10' THEN cents ELSE 0 END)\` |
| স্ট্যাটাস-গণনা ম্যাট্রিক্স | \`SUM(CASE WHEN status='paid' THEN 1 ELSE 0 END)\` |
| মোট-সহ ভাঙন (SQLite) | ভিন্ন স্তরের SELECT গুলো \`UNION ALL\` দিয়ে জোড়া |
| শূন্য ভরাট | \`COALESCE(SUM(...), 0)\` |

## ধাপে ধাপে
১. সারি (row) কী হবে ঠিক করো—ভেন্ডর, নাকি মাস।
২. কলামগুলো ঠিক করো—কোন কোন মাস বা স্ট্যাটাস।
৩. শর্ত লেখো: প্রতিটি কলামে একটা CASE, আর GROUP BY শুধু সারি-কলাম ধরে।
৪. LEFT JOIN + COALESCE দিয়ে বিক্রি-নেই দলও শূন্য ভরে ধরে রাখো।
৫. নির্দিষ্ট ORDER BY দিয়ে সাজাও—মোটের নামতা চাইলে টাই-ব্রেক ভুলো না।

## কোডে দেখি
\`\`\`sql
WITH vendor_sales AS (
  SELECT p.vendor_id AS vendor_id, substr(o.ordered_at, 1, 7) AS month,
         oi.quantity * oi.unit_price_cents AS cents
  FROM orders o
  JOIN order_items oi ON oi.order_id = o.id
  JOIN products p ON p.id = oi.product_id
  WHERE o.status IN ('paid', 'shipped')
)
SELECT v.name AS vendor,
       COALESCE(SUM(CASE WHEN vs.month = '2026-10' THEN vs.cents ELSE 0 END), 0) AS oct_cents,
       COALESCE(SUM(CASE WHEN vs.month = '2026-11' THEN vs.cents ELSE 0 END), 0) AS nov_cents,
       COALESCE(SUM(vs.cents), 0) AS total_cents
FROM vendors v
LEFT JOIN vendor_sales vs ON vs.vendor_id = v.id
GROUP BY v.id
ORDER BY total_cents DESC, vendor;
\`\`\`

## সাধারণ ভুল
GROUP BY-তে মাসও রেখে pivot নষ্ট করা—মাস তখন সারিতে নেমে আসে, কলামে নয়; CASE-এ ELSE 0 বাদ দিয়ে NULL যোগফল পাঠানো; INNER JOIN-এ বিক্রি-নেই ভেন্ডর হারিয়ে ফেলা, আর LEFT JOIN করলেও COALESCE ছাড়া NULL-ই রিপোর্টে বসে যাওয়া; স্ট্যাটাসের বানান ভুল হলে ঐ কলাম নীরবে শূন্য থাকে—আউটপুট ভাঙে না, তাই ধরা কঠিন; UNION ALL-এর জায়গায় UNION লিখে একই মানের দুটি সারি মিশিয়ে ফেলা, আর জোড়ার সময় কলাম-সংখ্যা না মেলানো; শেষে ORDER BY ভুলে যাওয়া।`,
    guidedProblemSlugs: ["sql-adv-vendor-month-pivot", "sql-adv-status-matrix"],
    practiceProblemSlugs: { easy: [], medium: [], hard: [] },
    extraProblemSlugs: [],
  },
];
