/** Concept notes for the ShopSphere SQL tracks. */

export const orientationConcept = `## কেন দরকার
ShopSphere-এর মতো বড় দোকানে প্রথম প্রশ্নই হলো—কোন ডেটা কোথায় আছে? ভেন্ডর, প্রোডাক্ট, অর্ডার আলাদা টেবিলে থাকে। SQL শেখার প্রথম ধাপ এই টেবিলগুলো চেনা আর দরকারি সারি বেছে নেওয়া।

## মূল ধারণা
\`SELECT\` ঠিক করে কোন কলাম আসবে, \`WHERE\` সারি ফিল্টার করে, \`ORDER BY\` ফল সাজায়। \`LIMIT\` দিয়ে তালিকা ছোট করা যায়। এই তিনটি দিয়ে স্টোরের প্রায় সব "তালিকা দেখাও" কাজ হয়ে যায়।

| কাজ | কী লিখবে |
| --- | --- |
| কলাম বাছাই | \`SELECT name, city\` |
| শর্ত | \`WHERE rating >= 4.5\` |
| সাজানো | \`ORDER BY name\` |

## ধাপে ধাপে
১. কোন টেবিল আর কোন কলাম লাগবে ঠিক করো।
২. শর্ত দিয়ে অপ্রয়োজনীয় সারি বাদ দাও।
৩. ফল কীভাবে সাজবে তা ভাবো—না লিখলে ক্রম অনির্দিষ্ট।

## কোডে দেখি
\`\`\`sql
SELECT name, city
FROM vendors
WHERE rating >= 4.5
ORDER BY name;
\`\`\`

## বাস্তব দৃশ্য
মার্কেটপ্লেসের হোমপেজ, সার্চ ফলাফল আর অ্যাডমিন তালিকা—সবখানেই প্রথমে দরকার "কোন টেবিল, কোন কলাম, কী শর্ত"। যেমন ভালো রেটিংয়ের ভেন্ডর দেখানোর আগে ভাবতে হবে রেটিং কোথায় আছে, শহর দেখাতে হবে কি না, আর সমান রেটিংয়ের ভেন্ডরদের মধ্যে ক্রম কীভাবে ঠিক থাকবে। এই ছোট সিদ্ধান্তগুলোই পরে JOIN বা GROUP BY-এর ভিত হয়ে ওঠে। তাই প্রথমে একটি টেবিলে SELECT/WHERE/ORDER BY নিখুঁতভাবে অনুশীলন করা জরুরি—নাহলে বড় query-তে ভুল জায়গায় ফিল্টার বসিয়ে ফল খালি হয়ে যাবে।

## সাধারণ ভুল
\`>\` আর \`>=\` গুলিয়ে ফেলা; \`ORDER BY\` না দেওয়া; অথবা পুরো টেবিল দরকার না থাকলেও সব কলাম নেওয়া।`;

export const moneyConcept = `## কেন দরকার
দোকান চলে টাকায়। ম্যানেজার জানতে চায় কোন ভেন্ডর কত বিক্রি করেছে, কোন অর্ডার কত টাকার, আর কোন কাস্টমার বেশি খরচ করছে। এই প্রশ্নগুলোর উত্তর এক টেবিলে থাকে না—অর্ডার, আইটেম আর প্রোডাক্ট জোড়া লাগাতে হয়।

## মূল ধারণা
\`JOIN\` দুটি টেবিলের সম্পর্কিত সারি মেলায়। \`GROUP BY\` একই ভেন্ডর বা অর্ডারের সারিগুলোকে এক করে, \`SUM\` মোট বের করে। গ্রুপ করার পরে শর্ত দিতে হয় \`HAVING\` দিয়ে—\`WHERE\` নয়।

| ধাপ | উদাহরণ |
| --- | --- |
| জোড়া | \`JOIN order_items oi ON oi.order_id = o.id\` |
| যোগ | \`SUM(oi.quantity * oi.unit_price_cents)\` |
| গ্রুপ ফিল্টার | \`HAVING SUM(...) > 500000\` |

## ধাপে ধাপে
১. কোন টেবিলগুলো লাগবে ঠিক করো।
২. JOIN-এর শর্ত লিখো।
৩. GROUP BY-তে আইডি দাও, নাম নয়।
৪. HAVING দিয়ে গ্রুপ ফিল্টার করো।

## কোডে দেখি
\`\`\`sql
SELECT v.name, SUM(oi.quantity * oi.unit_price_cents) AS revenue
FROM vendors v
JOIN products p ON p.vendor_id = v.id
JOIN order_items oi ON oi.product_id = p.id
GROUP BY v.id;
\`\`\`

## বাস্তব দৃশ্য
ম্যানেজার সকালের মিটিংয়ে জানতে চায়—গত মাসে কোন ভেন্ডর সবচেয়ে বেশি বিক্রি করেছে, কোন অর্ডার এখনো টাকা পায়নি, আর কোন কাস্টমার সবচেয়ে বেশি খরচ করেছে। একেক প্রশ্নের জন্য একেক ফিল্টার আর গ্রুপিং লাগে, কিন্তু কাঠামো একই: সঠিক টেবিলগুলো জোড়া লাগাও, দরকারি সারি বাদ দাও, তারপর ভেন্ডর/অর্ডার ধরে যোগ করো। ভুল টেবিলে JOIN করলে বা WHERE-এ aggregate লিখলে সংখ্যা ফুলে যায়—এই ভুলগুলোই বাস্তবে সবচেয়ে বেশি দেখা যায়।

## সাধারণ ভুল
নাম দিয়ে GROUP BY করা, WHERE-এ SUM ব্যবহার, অথবা JOIN ভুল কলামে করা—এতে সংখ্যা অনেক বেড়ে যায়।`;

export const windowConcept = `## কেন দরকার
রিপোর্টে প্রায়ই "প্রতিটি ক্যাটাগরির সেরা প্রোডাক্ট" বা "আজ পর্যন্ত মোট রেভিনিউ" লাগে। এগুলো করতে গিয়ে আলাদা করে সব ডেটা এনে জোড়া লাগালে query জটিল হয়ে যায়। Window function এই কাজ একই query-তে করে।

## মূল ধারণা
\`OVER (PARTITION BY ... ORDER BY ...)\` ডেটাকে গ্রুপে ভাগ করে প্রতিটি সারির জন্য হিসাব করে, কিন্তু সারি কমায় না। \`RANK\` র‍্যাংক দেয়, \`SUM(...) OVER (ORDER BY ...)\` চলমান যোগফল দেয়।

| প্রয়োজনে | ফাংশন |
| --- | --- |
| প্রতি ক্যাটাগরিতে সেরা | \`RANK() OVER (PARTITION BY category ...)\` |
| চলমান মোট | \`SUM(x) OVER (ORDER BY date)\` |

## ধাপে ধাপে
১. প্রথমে গ্রুপ করে ভিত্তি সংখ্যা বানাও।
২. তার উপর window function চালাও।
৩. র‍্যাংক হলে বাইরের query-তে \`WHERE rn = 1\`।

## কোডে দেখি
\`\`\`sql
SELECT category, product, revenue, rn
FROM (
  SELECT c.name AS category, p.name AS product,
         SUM(oi.quantity * oi.unit_price_cents) AS revenue,
         RANK() OVER (PARTITION BY c.id ORDER BY SUM(oi.quantity * oi.unit_price_cents) DESC) AS rn
  FROM categories c
  JOIN products p ON p.category_id = c.id
  JOIN order_items oi ON oi.product_id = p.id
  GROUP BY c.id, p.id
) ranked;
\`\`\`

## সাধারণ ভুল
PARTITION BY বাদ দেওয়া; window-এর ORDER BY না দেওয়া; অথবা RANK আর ROW_NUMBER-এর পার্থক্য না বোঝা।`;

export const hierarchyConcept = `## কেন দরকার
ক্যাটাগরি কখনো এক স্তরের নয়—Electronics > Audio > Headphones। রেফারেলও একই রকম চেইন। সাধারণ JOIN দিয়ে অজানা গভীরতার এই সম্পর্ক বের করা যায় না; দরকার recursion।

## মূল ধারণা
Recursive CTE-তে দুই অংশ থাকে: anchor (শুরু) আর recursive অংশ (পরের স্তর)। প্রতিবার পূর্বের ফলাফলের সাথে টেবিল জোড়া লাগিয়ে এক স্তর এগোয়। path জমিয়ে রাখলে root থেকে পূর্ণ ঠিকানা পাওয়া যায়।

| অংশ | কাজ |
| --- | --- |
| anchor | \`WHERE parent_id IS NULL\` |
| recursive | \`JOIN tree ON c.parent_id = tree.id\` |
| path | \`tree.path || ' > ' || c.name\` |

## ধাপে ধাপে
১. CTE-র নাম আর কলাম ঠিক করো।
২. anchor দিয়ে শুরু করো।
৩. UNION ALL-এর পরে recursive ধাপ লিখো।
৪. বাইরে SELECT করে path/depth দেখাও।

## কোডে দেখি
\`\`\`sql
WITH RECURSIVE tree(id, path) AS (
  SELECT id, name FROM categories WHERE parent_id IS NULL
  UNION ALL
  SELECT c.id, tree.path || ' > ' || c.name
  FROM categories c
  JOIN tree ON c.parent_id = tree.id
)
SELECT id, path FROM tree;
\`\`\`

## বাস্তব দৃশ্য
ShopSphere-এর ক্যাটাগরি মেনু কয়েক স্তরের: Electronics-এর ভিতরে Audio, Audio-এর ভিতরে Headphones; রেফারেলও একই রকম চেইন। মেনু বা রেফারেল রিপোর্টে প্রতিটি নোডের root থেকে পূর্ণ path এবং depth দরকার। সাধারণ JOIN দিয়ে গভীরতা জানা যায় না, কারণ কত ধাপ আছে তা ডেটার উপর নির্ভর করে—recursive CTE-ই একমাত্র পরিষ্কার সমাধান।

## সাধারণ ভুল
anchor-এ \`parent_id IS NULL\` না দিলে কোন নোড দিয়ে শুরু হবে সেটাই অনির্দিষ্ট হয়ে যায়; \`UNION ALL\`-এর বদলে \`UNION\` লিখে একই নোডের ডুপ্লিকেট স্তর ঝরে যাওয়া; recursive অংশে ভুল JOIN-শর্ত (যেমন \`c.id = tree.id\`) দিলে স্তর কখনো শেষ হয় না — SQLite এমন অগ্রসরমান না-হওয়া রিকার্শনে এরর দেয়; আর anchor-এ path-এ নাম না বসিয়ে রেখে দিলে root-এর নাম বাদ পড়ে ঠিকানা অসম্পূর্ণ দেখায়।`;

export const missingConcept = `## কেন দরকার
বাস্তব ডেটাবেসে সব সম্পর্ক পূর্ণ নয়। কিছু প্রোডাক্ট কখনো বিক্রি হয়নি, কিছু কাস্টমার কখনো অর্ডার করেনি, কিছু স্টক শূন্য। এই "না থাকা" তথ্যটাই অনেক সময় সবচেয়ে দরকারি—dead stock, নিষ্ক্রিয় কাস্টমার বা ইনভেন্টরি সতর্কতা। শুধু JOIN শিখলে এই সারিগুলোই হারিয়ে যায়।

## মূল ধারণা
\`LEFT JOIN\` বাম টেবিলের সব সারি রাখে, মিল না পেলে ডান দিকের কলাম NULL হয়। \`NOT EXISTS\` দিয়ে "এই সম্পর্কটি নেই" আরও সরাসরি বলা যায়। \`CASE WHEN ... THEN ... ELSE ... END\` দিয়ে একই সারিকে অর্থপূর্ণ bucket-এ ভাগ করা যায়, তারপর সেই bucket ধরে \`GROUP BY\`।

| প্রশ্ন | কৌশল |
| --- | --- |
| কোন প্রোডাক্ট বিক্রি হয়নি? | \`NOT EXISTS (SELECT 1 ...)\` |
| কোন কাস্টমার অর্ডার করেনি? | \`LEFT JOIN ... WHERE o.id IS NULL\` |
| স্টক কতটা খারাপ? | \`CASE WHEN stock = 0 ... END\` |

## ধাপে ধাপে
১. কোন সারিগুলো "নেই" সেটা স্পষ্ট করো—অর্ডার নেই, নাকি paid অর্ডার নেই?
২. সম্পর্কের শর্ত subquery-তে বা JOIN-এর \`ON\`-এ দাও, \`WHERE\`-এ নয়।
৩. CASE-এর শর্তগুলো সংকীর্ণ থেকে প্রশস্ত ক্রমে সাজাও।
৪. NULL কীভাবে গোনা হবে তা ঠিক করো।

## কোডে দেখি
\`\`\`sql
SELECT p.name, v.name AS vendor, p.stock
FROM products p
JOIN vendors v ON v.id = p.vendor_id
WHERE NOT EXISTS (
  SELECT 1 FROM order_items oi
  JOIN orders o ON o.id = oi.order_id
  WHERE oi.product_id = p.id AND o.status IN ('paid', 'shipped')
)
ORDER BY p.name;
\`\`\`

## সাধারণ ভুল
LEFT JOIN-এর ফিল্টার \`WHERE\`-এ দেওয়া (তাহলে NULL সারি হারায়); \`NOT IN\` ব্যবহার করা যখন subquery NULL ফেরায়; CASE-এ \`ELSE\` বাদ দেওয়া।`;

export const subqueryConcept = `## কেন দরকার
সব প্রশ্ন এক ধাপে উত্তর দেওয়া যায় না। "যে প্রোডাক্ট তার ক্যাটাগরির গড়ের চেয়ে দামি" বলতে প্রথমে প্রতিটি ক্যাটাগরির গড় লাগে, তারপর সেই গড়ের সাথে তুলনা। Subquery এই দুই ধাপকে এক query-তে রাখে।

## মূল ধারণা
Correlated subquery বাইরের প্রতিটি সারির জন্য চলে এবং বাইরের alias ব্যবহার করতে পারে। \`EXISTS\` শুধু "অন্তত একটি সারি আছে কি না" দেখে, তাই দ্রুত। \`IN\` তালিকার জন্য ভালো, কিন্তু NULL থাকলে ফলাফল অনির্দিষ্ট হতে পারে। Window function দিয়েও একই তুলনা করা যায়, তবে subquery পড়তে সহজ, যখন প্রশ্নটি "গড়ের চেয়ে বেশি" ধরনের।

| প্রয়োজন | কৌশল |
| --- | --- |
| ক্যাটাগরির গড়ের চেয়ে দামি | Correlated \`AVG\` |
| অর্ডার আছে কি না | \`EXISTS\` / \`NOT EXISTS\` |
| একাধিক সারির তালিকা | \`IN (SELECT ...)\` |

## ধাপে ধাপে
১. ভেতরের প্রশ্নটি আলাদা করে লিখে দেখো—একা চালালে কী ফেরে?
২. বাইরের alias ভেতরে ব্যবহার করো।
৩. তুলনার অপারেটর (\`>\`, \`>=\`) ব্যবসার নিয়ম অনুযায়ী বাছো।
৪. বাইরের \`ORDER BY\` দিয়ে ফল নির্ভরযোগ্য করো।

## কোডে দেখি
\`\`\`sql
SELECT p.name, c.name AS category, p.price_cents
FROM products p
JOIN categories c ON c.id = p.category_id
WHERE p.price_cents > (
  SELECT AVG(p2.price_cents)
  FROM products p2
  WHERE p2.category_id = p.category_id
)
ORDER BY c.name, p.price_cents DESC, p.name;
\`\`\`

## সাধারণ ভুল
পুরো টেবিলের গড় নেওয়া; correlated alias বাদ দেওয়া; \`IN\`-এর তালিকায় NULL থাকলে \`NOT IN\` ব্যবহার করা।`;

export const metricsConcept = `## কেন দরকার
রিপোর্টে শুধু মোট নয়, অনুপাতও লাগে: কোন ক্যাটাগরি ব্যবসার কত শতাংশ, গত মাসের তুলনায় রেভিনিউ কত বাড়ল। এই প্রশ্নগুলোর উত্তর একই aggregation-এ পাওয়া যায়, যদি আগের সারির সাথে তুলনা করতে পারো।

## মূল ধারণা
CTE দিয়ে প্রথমে পরিষ্কার ভিত্তি টেবিল বানাও। \`SUM(...) OVER ()\` পুরো ফলের মোট দেয়, তাই শতাংশ সহজ। \`LAG(...) OVER (ORDER BY month)\` আগের সারির মান আনে; প্রথম সারিতে NULL—সেটাই সঠিক। শতাংশে \`100.0\` দিয়ে গুণ করো, নাহলে integer division শূন্য হতে পারে।

| প্রয়োজন | উইন্ডো |
| --- | --- |
| মোটের কত শতাংশ | \`SUM(x) OVER ()\` |
| আগের মাসের তুলনা | \`LAG(x) OVER (ORDER BY month)\` |
| র্যাংক | \`RANK() OVER (ORDER BY x DESC)\` |

## ধাপে ধাপে
১. CTE-তে মাস/ক্যাটাগরি ধরে ভিত্তি সংখ্যা বের করো।
২. বাইরের query-তে window function চালাও।
৩. শতাংশ/growth round করে দেখাও।
৪. division-এর আগে শূন্য বা NULL সামলাও।

## কোডে দেখি
\`\`\`sql
WITH category_revenue AS (
  SELECT c.name AS category,
         SUM(oi.quantity * oi.unit_price_cents) AS revenue_cents
  FROM categories c
  JOIN products p ON p.category_id = c.id
  JOIN order_items oi ON oi.product_id = p.id
  JOIN orders o ON o.id = oi.order_id
  WHERE o.status IN ('paid', 'shipped')
  GROUP BY c.id
)
SELECT category, revenue_cents,
       ROUND(revenue_cents * 100.0 / SUM(revenue_cents) OVER (), 1) AS share_pct
FROM category_revenue
ORDER BY revenue_cents DESC, category;
\`\`\`

## সাধারণ ভুল
প্রতিটি সারিতে মোটের বদলে নিজের মান দিয়ে ভাগ; \`LAG\`-এর \`ORDER BY\` বাদ; প্রথম মাসে ০ দেখানো।`;

export const capstoneConcept = `## কেন দরকার
একটি বাস্তব রিপোর্ট কখনো এক টেবিলের এক SUM নয়। ভেন্ডর পেমেন্ট, কাস্টমার retention, ক্যাটাগরি growth—সবগুলোতে একাধিক ধাপ, একাধিক সম্পর্ক আর সঠিক ব্যবসার সংজ্ঞা লাগে। এই টপিক সেই পুরো চেইন একসাথে অনুশীলন করে।

## মূল ধারণা
জটিল প্রশ্নকে ছোট CTE-তে ভাগ করো: প্রথমে লেনদেন-স্তরের ভিত্তি, তারপর সত্তা-স্তরের aggregation, শেষে window/rank। প্রতিটি CTE-র একটি কাজ থাকা উচিত। \`LEFT JOIN\` আর conditional \`SUM(CASE ...)\` দিয়ে "কতজন ফিরে এসেছে" ধরনের cohort metric বানানো যায়।

| স্তর | কাজ |
| --- | --- |
| ভিত্তি | প্রতি অর্ডার/কাস্টমারের লেনদেন |
| সারাংশ | ভেন্ডর/cohort ধরে যোগ, গণনা |
| উপস্থাপনা | rank, শতাংশ, সাজানো |

## ধাপে ধাপে
১. প্রশ্নটিকে ২–৩টি ধাপে ভাঙো।
২. প্রথম CTE-তে শুধু দরকারি লেনদেন রাখো।
৩. দ্বিতীয় ধাপে সত্তা ধরে যোগ/গণনা করো।
৪. rank বা শতাংশ শেষ ধাপে যোগ করো।
৫. প্রতিটি ধাপ আলাদা চালিয়ে সংখ্যা মিলিয়ে নাও।

## কোডে দেখি
\`\`\`sql
WITH customer_orders AS (
  SELECT c.id, substr(c.signup_date, 1, 7) AS cohort,
         COUNT(DISTINCT o.id) AS order_count
  FROM customers c
  LEFT JOIN orders o
    ON o.customer_id = c.id AND o.status IN ('paid', 'shipped')
  GROUP BY c.id
)
SELECT cohort,
       COUNT(*) AS customers,
       SUM(CASE WHEN order_count >= 2 THEN 1 ELSE 0 END) AS repeat_customers,
       ROUND(100.0 * SUM(CASE WHEN order_count >= 2 THEN 1 ELSE 0 END) / COUNT(*), 1) AS repeat_rate_pct
FROM customer_orders
GROUP BY cohort
ORDER BY cohort;
\`\`\`

## সাধারণ ভুল
LEFT JOIN-এর শর্ত WHERE-এ ফেলা; একই সারিতে একাধিক aggregation গুলিয়ে ফেলা; rank-এর আগে টাই-ব্রেক না দেওয়া।

## পারফরম্যান্স ও নিরাপত্তা
বাস্তব ডেটাবেসে একই ফলাফল দ্রুত বা ধীর হতে পারে। \`WHERE\`/\`JOIN\`-এ যে কলাম দিয়ে খুঁজছো সেটিতে index আছে কি না দেখো; \`SELECT *\` না নিয়ে দরকারি কলাম নাও; বড় টেবিলে \`LIKE '%...'\` বা function-wrapped কলাম index ব্যবহার করতে দেয় না। সন্দেহ হলে \`EXPLAIN QUERY PLAN\` দিয়ে দেখো ডেটাবেস আসলে কী করছে। আরেকটি গুরুত্বপূর্ণ দিক safety: একাধিক ধাপের পরিবর্তন একসাথে করতে transaction লাগে, আর ভুল UPDATE/DELETE ঠেকাতে WHERE আগে পরীক্ষা করতে হয়। এই টপিকের সব সমস্যা read-only—শুধু একটি SELECT চালায়; transaction/DDL-এর হাতে-কলমে অনুশীলন আগের দুটি ল্যাব টপিকে (script-মোড sandbox)। কিন্তু উপরের নিয়মগুলো প্রতিটি query-তে প্রযোজ্য।`;
