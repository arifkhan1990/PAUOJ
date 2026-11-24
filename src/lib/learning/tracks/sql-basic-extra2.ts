/** Extra topics for the Basic SQL module (joins in depth, pagination, text/dates/time). */

import type { LearningTopicDefinition } from "@/lib/learning/types";

const joinsConcept = `## কেন দরকার
গ্রোথ টিম জানতে চায় একই ক্যাটাগরির কোন দুটি প্রোডাক্ট পরস্পরের প্রতিযোগী — দামের ফারাক বড় মানে ক্রেতার সামনে চওড়া বাজেট-রেঞ্জ। অপস টিম দেখে একই শহরের ভেন্ডর কে কার সাথে টানাটানিতে। দুটোই একটাই টেবিলের **ভেতরের** জোড়া বের করার প্রশ্ন — টেবিলকে তার নিজের সাথে জোড়া দিতে হয়, এটাই self-join। কিন্তু এখানেই লুকিয়ে SQL-এর অন্যতম কমন ফাঁদ: প্রতিটি জোড়া দুইবার আসা (একবার A→B, একবার B→A), এমনকি নিজের সাথে নিজের জোড়াও তালিকায় ঢুকে পড়া।

## মূল ধারণা
self-join মানে একটাই টেবিলের দুই কপি — দুটো আলাদা alias (\`p1\`, \`p2\`) ধরে জোড়া, যেন দুইটা আলাদা টেবিল। একই ক্যাটাগরির জোড়া বানাতে \`ON p2.category_id = p1.category_id\` — কিন্তু শুধু এটুকু দিলে p1-এর প্রতিটি সারি একই ক্যাটাগরির **সব** সারির সাথে জুট়বে: (কীবোর্ড, মাউস) আর (মাউস, কীবোর্ড) দুটোই, উল্টো ক্রমে। প্রতিটি জোড়া একবার রাখার চাবিকাঠি জয়েনের শর্তেই একটা **অসমতা**: \`p1.id < p2.id\` — ছোট আইডি সবসময় p1, তাই (A,B) আর (B,A) এক হয়ে যায় আর (A,A) অসম্ভব। (\`!=\` দিলে হবে না — নিজ-জোড়া বাদ যায় ঠিকই, কিন্তু (A,B) আর (B,A) দুটোই বেঁচে থাকে!) কে সস্তা কে দামি তা আগে থেকে ঠিক নয়, তাই \`CASE\` দিয়ে দাম তুলে ঠিক করো। আর বড় কথা — query যে ক্রমে **চলে**: FROM/JOIN → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT। লেখার ক্রম এর ঠিক উল্টো। এজন্য SELECT-এ বানানো alias WHERE-এ ধরা যায় না (WHERE আগে চলে গেছে), কিন্তু ORDER BY-তে ধরা যায় (SELECT তখন হয়ে গেছে)। আর LEFT JOIN-এর ON-এ শর্ত বসালে বাম পাশের unmatched সারি বেঁচে থাকে, WHERE-এ বসালে ছেঁড়ে যায় — কারণ ON জয়েনের সময়, WHERE তার পরে চলে।

| প্রশ্ন | সরঞ্জাম |
| --- | --- |
| একই টেবিলের জোড়া | দুই alias \`p1\`, \`p2\` |
| প্রতি জোড়া একবার | \`p1.id < p2.id\` — ON-এই |
| জোড়ার ভিতরের তুলনা | \`CASE\` দিয়ে সস্তা/দামি ঠিক |
| LEFT JOIN-এর শর্ত | \`ON\`-এ বসাও, \`WHERE\`-এ নয় |

## ধাপে ধাপে
১. একই টেবিল দুই alias-এ জোড়া দাও, মিলের শর্ত ON-এ।
২. \`p1.id < p2.id\` জয়েনেই বসাও — জোড়া অনন্য হলো।
৩. জোড়ার ভেতরের তুলনা (সস্তা/দামি, এগিয়ে/পিছিয়ে) CASE দিয়ে ঠিক করো।
৪. ORDER BY-তে টাই-ব্রেকার — অনন্য জোড়াও অনির্দিষ্ট ক্রমে আসতে পারে।

## কোডে দেখি
\`\`\`sql
-- একই ক্যাটাগরির অনন্য জোড়া, দামের ব্যবধানসহ
SELECT p1.name AS product_a, p2.name AS product_b,
       ABS(p2.price_cents - p1.price_cents) AS gap
FROM products p1
JOIN products p2 ON p2.category_id = p1.category_id AND p1.id < p2.id
ORDER BY gap DESC, product_a, product_b;
\`\`\`

## সাধারণ ভুল
\`p1.id < p2.id\` বাদ দিলে প্রতিটি জোড়া দুইবার আর নিজ-জোড়াও উঠে আসে; \`!=\` লিখে ভাবা যে সমাধান হয়েছে — হয়নি; জোড়া আলাদা করতে নাম ব্যবহার করা — নাম বদলালে বা দুইজনের নাম এক হলে ভাঙে, আইডি-ই নিরাপদ; WHERE-এ SELECT-এর alias ধরতে যাওয়া; LEFT JOIN-এর ON-এর শর্ত WHERE-এ সরিয়ে ফেলায় unmatched সারি হারানো।`;

const paginationConcept = `## কেন দরকার
ড্যাশবোর্ডে বিক্রির তালিকা কখনো পুরোটা একবারে দেখানো হয় না — পেজে ভাগ করে দেখানো হয়: প্রথম পেজে শীর্ষ ৫টি প্রোডাক্ট, দ্বিতীয় পেজে তার পরের ৫টি। আরেক ধরনের 'শীর্ষ'ও আছে — প্রতি কাস্টমারের সর্বশেষ অর্ডার, প্রতি শহরের সেরা ভেন্ডর: প্রতি দলের ভেতর থেকে একটা করে সারি (top-N-per-group)। pagination আর top-N — এই দুই কৌশল মিলেই রিপোর্টের প্রায় সব 'সেরা কয়েকটা' প্রশ্নের উত্তর।

## মূল ধারণা
\`LIMIT n OFFSET m\` — সাজানো ফলের শুরু থেকে m সারি লাফিয়ে পরের n সারি। পেজ k হলো \`LIMIT size OFFSET (k-1)×size\`; পেজ ২, সাইজ ৫ মানে \`LIMIT 5 OFFSET 5\`। LIMIT/OFFSET-এর দুইটা স্বীকারোক্তি আছে। প্রথমত, LIMIT কাটে সাজানো তালিকার উপরে — ORDER BY **deterministic** না হলে সীমানার সারি এলোমেলো: সমান আয়ের দুই প্রোডাক্ট ৫ম-৬ষ্ঠ স্থানে হেরফের খায়, তাই টাই-ব্রেকার (নাম, আইডি) বাধ্যতামূলক। দ্বিতীয়ত, OFFSET আসলে আগের সারিগুলো হিসাব করেই ফেলে দেয় — পেজ যত গভীর, বৃথা কাজ তত বেশি। বড় টেবিলে চলে keyset (seek) pagination: আগের পেজের **শেষ সারির মান** হাতে নিয়ে \`WHERE (revenue_cents, name) < (শেষ আয়, শেষ নাম) ORDER BY revenue_cents DESC, name LIMIT 5\` — লাফ নেই, নতুন সারি ঢুকলেও পেজের জায়গা সরে না, প্রতি পেজের খরচ একই। আর top-N-per-group: প্রতি গ্রুপের সেরাটা correlated subquery-তে \`MAX\` দিয়ে মেলাও — বাইরের সারির মান তার গ্রুপের সর্বোচ্চের সমান কি না; টাই ভাঙতে ভেতরে আবার \`MAX(id)\`। (window function একাজ সহজ করে, কিন্তু correlated subquery-র এই প্যাটার্ন সব ইঞ্জিনে চলে।)

| প্রয়োজন | কৌশল |
| --- | --- |
| পেজ k | \`LIMIT size OFFSET (k-1)×size\` |
| নির্ভরযোগ্য সীমানা | ORDER BY + টাই-ব্রেকার (নাম, আইডি) |
| গভীর পেজ | keyset: আগের শেষ সারির মান predicate-এ |
| প্রতি দলের সেরা | correlated \`MAX\` subquery, টাই-এ \`MAX(id)\` |

## ধাপে ধাপে
১. আগে পূর্ণ তালিকা সাজাও — ORDER BY + টাই-ব্রেকার।
২. পেজের সূত্র বসাও: \`LIMIT size OFFSET (k-1)×size\`।
৩. গ্রুপ-প্রশ্নে বাইরের সারি + ভেতরের \`MAX\` মেলাও, টাই-এ আইডি।
৪. ফিল্টার (যেমন status) বাইরে-ভেতরে দুই জায়গাতেই দাও।

## কোডে দেখি
\`\`\`sql
-- টপ প্রোডাক্টের দ্বিতীয় পেজ
SELECT p.name AS product,
       SUM(oi.quantity * oi.unit_price_cents) AS revenue_cents
FROM order_items oi
JOIN orders o ON o.id = oi.order_id
JOIN products p ON p.id = oi.product_id
WHERE o.status IN ('paid','shipped')
GROUP BY p.id, p.name
ORDER BY revenue_cents DESC, product
LIMIT 5 OFFSET 5;
\`\`\`

## সাধারণ ভুল
\`LIMIT 10\` লিখে পেজ ২ বানানো — পেজ ২ মানে লাফ ৫, নেওয়া ৫; টাই-ব্রেকার ছাড়া সীমানার সারি অদল-বদল; ভেতরের subquery-তে status ফিল্টার ভুলে কাস্টমার হারানো; শুধু \`MAX(ordered_at)\` মিলিয়ে টাই-এ একই গ্রুপের একাধিক সারি; গভীর পেজেও OFFSET-ই ধরে রাখা — যেখানে keyset লাগবে।`;

const textDatesTimeConcept = `## কেন দরকার
সাপোর্টের সার্চ বাক্স আর ফাইন্যান্সের মাসিক রিপোর্ট — একদিনের কাজের দুই মেরু। এজেন্ট টাইপ করে 'DHA', খুঁজতে হয় নামে-শহরে কেস না মেলালেও; আর রিপোর্টে চাই 'এই অর্ডার কতদিনের পুরনো'। টেক্সট ম্যাচিং আর তারিখের গণিত — দুই-ই বাস্তব দুনিয়ার SQL-এর রোজকার কাজ।

## মূল ধারণা
টেক্সটে \`%\` মানে 'যেকোনো কিছু', \`_\` মানে 'ঠিক এক অক্ষর' — \`LIKE '%dha%'\` দুপাশ-খোলা ম্যাচ, অংশটা শব্দের যেকোনো জায়গায়। কেস উপেক্ষা করতে দুই পাশে \`lower()\`: \`lower(name) LIKE '%dha%'\` — SQLite-র LIKE ASCII-তে নিজেই কেস-ইনসেনসিটিভ, কিন্তু সব ইঞ্জিনে নয়। আরেকটা আছে \`GLOB\` — \`%\`/\`_\`-এর বদলে \`*\`/\`?\`, আর **কেস-সেনসিটিভ**; ফাইলনেম-ধাঁচের প্যাটার্নে কাজে লাগে, সার্চ বাক্সে LIKE-ই নিরাপদ। দুই কলামে খুঁজলে \`OR\` দিয়ে জোড়ো। তারিখ: ShopSphere ISO টেক্সট (\`YYYY-MM-DD\`) ব্যবহার করে — এই ফরম্যাটের সবচেয়ে বড় গুণ, টেক্সটের অভিধান-ক্রমই ক্যালেন্ডারের ক্রম। রেঞ্জ দুইভাবে: \`BETWEEN '2026-10-01' AND '2026-10-31'\` পড়তে সহজ, কিন্তু সময়-সহ মান (\`'2026-10-31 15:00'\`) BETWEEN-এর বন্ধ শেষ-প্রান্তে ঢুকে পড়ে — নিরাপদ হাফ-ওপেন রেঞ্জ \`>= '2026-10-01' AND < '2026-11-01'\`। বয়সের হিসাব: \`julianday(x)\` তারিখকে দিন-সংখ্যায় (float) নামায়, দুই তারিখের বিয়োগ দিন দেয়, \`CAST(... AS INTEGER)\` পূর্ণ দিন রাখে (ভগ্নাংশ ফেলে)। সতর্কতা — টাইমজোন: julianday UTC ধরে কাজ করে; লোকাল টাইমে লেখা টাইমস্ট্যাম্প আধা-দিন এদিক-ওদিক সরে যেতে পারে, আর তুলনার এক পাশে তারিখ-শুধু আর আরেক পাশে সময়-সহ মান থাকলে হিসাব ভুল হয়ে যায়। নিয়ম একটাই: সময় রাখলে UTC রাখো, নইলে তারিখ-শুধু ISO।

| কাজ | হাতিয়ার |
| --- | --- |
| অংশের মিল | \`LIKE '%dha%'\` — দুপাশে \`%\` |
| ঠিক এক অক্ষরের মিল | \`_\` (যেমন \`LIKE 'dha_'\`) |
| কেস-নিরপেক্ষ | দুই পাশে \`lower()\` |
| বয়স (পূর্ণ দিন) | \`CAST(julianday(a) - julianday(b) AS INTEGER)\` |

## ধাপে ধাপে
১. সার্চে দুপাশে \`%\`, দুই পাশে \`lower()\`, কলামগুলো \`OR\`-এ।
২. তারিখের রেঞ্জে হাফ-ওপেন \`>=\` + \`<\` অভ্যাস করো।
৩. বয়স নির্ণয়ে \`julianday\`-এর বিয়োগ + \`CAST\`।
৪. ORDER BY-তে তারিখের পরে নাম/আইডি — টাই-ব্রেকার।

## কোডে দেখি
\`\`\`sql
-- কেস-নিরপেক্ষ খোঁজা নামে-শহরে
SELECT name, city, signup_date
FROM customers
WHERE lower(name) LIKE '%dha%' OR lower(city) LIKE '%dha%'
ORDER BY signup_date, name;

-- রিপোর্ট তারিখ থেকে অর্ডারের বয়স, পূর্ণ দিনে
SELECT id, ordered_at,
       CAST(julianday('2026-11-30') - julianday(ordered_at) AS INTEGER) AS age_days
FROM orders
WHERE status IN ('paid','shipped')
ORDER BY age_days DESC, id;
\`\`\`

## সাধারণ ভুল
\`LIKE 'dha%'\` দিয়ে শুধু শুরুর ম্যাচ — মাঝের শব্দ হারায়; GLOB-কে LIKE ভেবে কেস-সেনসিটিভ মিলে খালি ফল; \`lower()\` এক পাশে দিয়ে অন্য পাশ বড় হাতের রাখা; BETWEEN-এর বন্ধ শেষ-তারিখে সময়-সহ রেকর্ড বাদ পড়া; তারিখ থেকে সংখ্যা-বিয়োগ (\`20261130 - 20261001\`) করে আজব ফল; টাইমজোন-মিশ্রিত টাইমস্ট্যাম্পে julianday-এর আধা-দিন এদিক-ওদিক সরে যাওয়া; টাই-ব্রেকার ছাড়া তারিখ-সাজানো তালিকা।`;

export const BASIC_SQL_EXTRA2_TOPICS: LearningTopicDefinition[] = [
  {
    slug: "joins-in-depth",
    title: "Joins in depth",
    titleBn: "জয়েনের গভীরে",
    summary:
      "Self-join দিয়ে একই ক্যাটাগরির প্রোডাক্ট আর একই শহরের ভেন্ডরের অনন্য জোড়া — ডুপ্লিকেট-জোড়ার ফাঁদ, query execution order পর্যন্ত।",
    concept: joinsConcept,
    guidedProblemSlugs: ["sql-same-category-pairs", "sql-vendor-city-peers"],
    practiceProblemSlugs: { easy: [], medium: [], hard: [] },
    extraProblemSlugs: [],
  },
  {
    slug: "pagination",
    title: "Pagination & top-N",
    titleBn: "পেজিনেশন ও টপ-এন",
    summary:
      "LIMIT/OFFSET দিয়ে রেভিনিউ তালিকার দ্বিতীয় পেজ, correlated subquery-তে MAX দিয়ে প্রতি কাস্টমারের সর্বশেষ অর্ডার।",
    concept: paginationConcept,
    guidedProblemSlugs: ["sql-top-products-page", "sql-latest-order-per-customer"],
    practiceProblemSlugs: { easy: [], medium: [], hard: [] },
    extraProblemSlugs: [],
  },
  {
    slug: "text-dates-time",
    title: "Text, dates & time",
    titleBn: "টেক্সট, তারিখ ও সময়",
    summary:
      "LIKE দিয়ে কেস-নিরপেক্ষ কাস্টমার সার্চ, julianday দিয়ে অর্ডারের বয়স — টাইমজোনের সতর্কতাসহ।",
    concept: textDatesTimeConcept,
    guidedProblemSlugs: ["sql-customer-search", "sql-order-age"],
    practiceProblemSlugs: { easy: [], medium: [], hard: [] },
    extraProblemSlugs: [],
  },
];
