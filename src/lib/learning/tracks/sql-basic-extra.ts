/** Extra topics for the Basic SQL module (sets, text/dates, order lifecycle). */

import type { LearningTopicDefinition } from "@/lib/learning/types";

const setOpsConcept = `## কেন দরকার
ShopSphere-এর রিপোর্টে প্রায়ই দুই দিক থেকে আসা তালিকা মেশাতে হয়। কুরিয়ার পার্টনার জানতে চায় সার্ভিস কোন কোন শহরে দিতে হবে — ভেন্ডর যেখান থেকে পাঠায়, কাস্টমার যেখানে থাকে। আবার ইনগেজমেন্ট টিম খোঁজে যে-ক্রেতা কিনেছে অথচ একটি রিভিউও লেখেনি। প্রথমটা দুই তালিকা জোড়া দেওয়ার কাজ (UNION), দ্বিতীয়টা এক তালিকা থেকে আরেকটা বাদ দেওয়ার কাজ (EXCEPT / NOT EXISTS)। ডেটা কোয়ালিটির নজরদারিও এখানেই বসে — ডুপ্লিকেট শহর, চুপচাপ ক্রেতা, মিসিং রেকর্ড।

## মূল ধারণা
\`UNION\` দুই SELECT-এর সারি এক করে আর ডুপ্লিকেট ফেলে দেয়; \`UNION ALL\` ডুপ্লিকেট রাখে (তাই দ্রুত, কিন্তু ইউনিক তালিকায় বিপদ)। \`EXCEPT\` প্রথম ফল থেকে দ্বিতীয় ফলে যা আছে তা বাদ দেয়। কিন্তু EXCEPT পুরো সারি মেলায় — নাম-ভিত্তিক তুলনায় একই নামের দুইজন মানুষ গুলিয়ে যেতে পারে। তাই "নেই" ধরনের শর্তে সবচেয়ে নিরাপদ হলো \`NOT EXISTS\` — এটা আইডি ধরে প্রতি সারির জন্য আলাদাভাবে চেক করে, NULL-এর ফাঁদেও পড়ে না (\`NOT IN\` পড়ে)।

## ধাপে ধাপে
১. জোড়া দিতে হলে দুই SELECT-এর কলাম সংখ্যা ও ধরন মিলিয়ে \`UNION\` লিখো, \`ORDER BY\` শুধু শেষে।
২. বাদ দিতে হলে আগে ভাবো — কোন সারি থাকবে, কোনটা থাকবে না।
৩. "আছে এক জায়গায়, নেই অন্য জায়গায়" হলে \`EXISTS\` + \`NOT EXISTS\` জোড়া ব্যবহার করো।
৪. ক্রম ডিটারমিনিস্টিক করতে ORDER BY-তে টাই-ব্রেকার দাও।

## কোডে দেখি
\`\`\`sql
-- কভারেজ: ভেন্ডর + কাস্টমার শহরের ইউনিক তালিকা
SELECT city FROM vendors
UNION
SELECT city FROM customers
ORDER BY city;

-- চুপচাপ ক্রেতা: অর্ডার আছে, রিভিউ নেই
SELECT c.name
FROM customers c
WHERE EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id)
  AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.customer_id = c.id)
ORDER BY c.name;
\`\`\`

## সাধারণ ভুল
\`UNION ALL\` আর \`UNION\` গুলিয়ে ডুপ্লিকেট রেখে দেওয়া; EXCEPT-এ নাম মেলানো; \`NOT IN\`-এ সাবকোয়েরির NULL রেকর্ড পড়লে পুরো query খালি ফেরত দেওয়া; ORDER BY দুই SELECT-এর নিচে আলাদা আলাদা লেখা — UNION-এর ফল একটাই সেট, সাজানো হয় শেষে।`;

const textDateConcept = `## কেন দরকার
সার্চ বার আর ত্রৈমাসিক রিপোর্ট — দুটোই প্রতিদিনের কাজ। ক্রেতা লেখে 'book', প্রোডাক্টের নামে থাকে 'SQL Handbook' — কেস না মেলালে সার্চ ফাঁকা দেখায়। আর গ্রোথ টিমের রিপোর্ট চায় "২০২৬ সালের প্রথম তিন মাসে কে অ্যাকাউন্ট খুলেছে" — তারিখের রেঞ্জ বের করা। ShopSphere-এ তারিখ \`YYYY-MM-DD\` ফরম্যাটের টেক্সট, আর এই ফরম্যাটের সবচেয়ে বড় সুবিধা: টেক্সট তুলনাই ক্যালেন্ডারের ক্রম মেনে চলে।

## মূল ধারণা
টেক্সট ম্যাচে \`LIKE '%book%'\` — \`%\` মানে "যেকোনো কিছু"। কেস বাদ দিতে দুপাশে \`lower()\`: \`lower(name) LIKE '%book%'\`। একাধিক শব্দ হলে \`OR\` দিয়ে প্যাটার্ন জোড়ো (\`AND\` দিলে দুই শব্দই থাকতে হবে)। তারিখের রেঞ্জ দুইভাবে: \`BETWEEN '2026-01-01' AND '2026-03-31'\` (পড়তে সহজ), বা \`>= '2026-01-01' AND < '2026-04-01'\` (হাফ-ওপেন রেঞ্জ — সময়সহ টাইমস্ট্যাম্প এলেও নিরাপদ)। রিপোর্ট ডিটারমিনিস্টিক করতে ORDER BY-তে তারিখের পরে নাম — সমান তারিখে কে আগে হবে তা ঠিক থাকে।

## ধাপে ধাপে
১. সার্চ করার আগে ভাবো শব্দটা নামের যেকোনো জায়গায় হতে পারে কি না — তাহলে দুপাশে \`%\`।
২. কেস-ইনসেনসিটিভ অভ্যাস গড়ে নাও: \`lower(name) LIKE ...\`।
৩. তারিখের রেঞ্জে বছর ভুলো না — মাস ১–৩ মোটেই "২০২৬-এর Q1" নয়।
৪. ORDER BY-তে দুই কলাম দাও: প্রথমে তারিখ, তারপর নাম।

## কোডে দেখি
\`\`\`sql
-- সার্চ: book বা code — কেস যা-ই হোক
SELECT name, price_cents
FROM products
WHERE lower(name) LIKE '%book%'
   OR lower(name) LIKE '%code%'
ORDER BY name;

-- ২০২৬ Q1-এর নতুন কাস্টমার
SELECT name, signup_date
FROM customers
WHERE signup_date >= '2026-01-01'
  AND signup_date <  '2026-04-01'
ORDER BY signup_date, name;
\`\`\`

## সাধারণ ভুল
\`LIKE 'book%'\` লিখে শুধু শুরুর ম্যাচ খোঁজা; \`lower()\` না দিয়ে কেসে আটকে যাওয়া — SQLite-র \`LIKE\` ASCII-তে কেস-ইনসেনসিটিভ হলেও সব ইঞ্জিনে নয়; শেষ তারিখ '2026-03-31' দিয়ে BETWEEN করে সময়সহ রেকর্ড ('2026-03-31 10:00') বাদ ফেলা; \`MONTH()\` গুনে বছরের চেক ভুলে যাওয়া; সমান তারিখে ক্রম অনির্দিষ্ট রাখা — একই query দুইবার চালালে দুই রকম ফল আসে।`;

const lifecycleConcept = `## কেন দরকার
অর্ডার বস্তাবন্দ হওয়া মানেই টাকা এসে গেছে তা নয়। পেমেন্ট failed হয়, COD বকেয়া থাকে, কার্ডের টাকা রিফান্ড হয়ে যায়; আর ডেলিভারির পর কিছু আইটেম রিটার্নে ফেরে। ফাইন্যান্স টিমের দৈনিক reconciliation আর অপস টিমের রিটার্ন-রেট রিপোর্ট — দুটোই এই জীবনচক্রের উপরেই দাঁড়িয়ে আছে। জানতে হবে অর্ডার → পেমেন্ট → শিপমেন্ট → রিটার্ন চেইনটা টেবিলে কীভাবে ছড়িয়ে আছে।

## মূল ধারণা
\`payments\`-এ এক অর্ডারের একাধিক রেকর্ড থাকতে পারে — সফল পেমেন্ট খুঁজতে হয় \`NOT EXISTS\` দিয়ে: "এই অর্ডারের কোনো \`paid\` রেকর্ড নেই"। শর্তটা সাবকোয়েরির ভেতরেই বসাতে হবে। \`returns\` জোড়া লাগে \`order_items\`-এর সাথে, আইটেম আবার অর্ডার আর প্রোডাক্টের সাথে — ভেন্ডর পর্যন্ত চেইন: returns → order_items → orders → products → vendors। হার বের করতে দুই আলাদা গণনা (বিক্রি আর রিটার্ন) CTE-তে করে শেষে জোড়া দাও; ভাগ করার সময় \`100.0\` (ইন্টিজার ভাগ এড়াতে) আর খালি গ্রুপে \`COALESCE(..., 0)\` মনে রেখো। রিপোর্টে শুধু কার্যকর অর্ডার (paid/shipped) গোনো।

## ধাপে ধাপে
১. "নেই" ধরনের শর্তে NOT EXISTS — ভেতরের সাবকোয়েরিতে সংযোগ আর স্ট্যাটাস দুটোই দাও।
২. cancelled/pending অর্ডারের আইটেম হিসাব থেকে বাদ।
৩. দুই সংখ্যা আলাদা চেইন থেকে এলে CTE-তে আলাদা করে গুনো, তারপর জোড়া দাও।
৪. ভাগফল ROUND করো, টাই-ব্রেকারসহ সাজাও।

## কোডে দেখি
\`\`\`sql
-- যে অর্ডারের একটিও paid পেমেন্ট নেই
SELECT o.id AS order_id, c.name AS customer, o.status
FROM orders o
JOIN customers c ON c.id = o.customer_id
WHERE NOT EXISTS (
  SELECT 1 FROM payments p
  WHERE p.order_id = o.id AND p.status = 'paid'
)
ORDER BY o.id;
\`\`\`

## সাধারণ ভুল
\`p.status != 'paid'\` লিখে refunded-সহ অর্ডারও দেখানো — এক অর্ডারে paid আর refunded দুটোই থাকতে পারে; cancelled অর্ডারের আইটেম গুনে হার কমিয়ে ফেলা; \`100\` দিয়ে গুণ করে ইন্টিজার ভাগে সব হার 0 আসা; NULL-safe নয় এমন জোড়ে রিটার্ন-নেই ভেন্ডর তালিকা থেকে ঝরে পড়া।`;

export const BASIC_SQL_EXTRA_TOPICS: LearningTopicDefinition[] = [
  {
    slug: "set-operations",
    title: "Sets & data quality",
    titleBn: "সেট ও ডেটা কোয়ালিটি",
    summary:
      "UNION, EXCEPT আর NOT EXISTS দিয়ে শহরের কভারেজ তালিকা আর রিভিউ-না-লেখা ক্রেতা — ডেটা কোয়ালিটির প্রথম পাঠ।",
    concept: setOpsConcept,
    guidedProblemSlugs: ["sql-marketplace-cities", "sql-unreviewed-buyers"],
    practiceProblemSlugs: { easy: [], medium: [], hard: [] },
    extraProblemSlugs: [],
  },
  {
    slug: "text-and-dates",
    title: "Search, text & dates",
    titleBn: "টেক্সট, তারিখ ও সার্চ",
    summary:
      "LIKE wildcard, case-insensitive সার্চ আর ISO তারিখের রেঞ্জ ফিল্টার — সার্চ বার থেকে ত্রৈমাসিক রিপোর্ট।",
    concept: textDateConcept,
    guidedProblemSlugs: ["sql-product-search", "sql-q1-signups"],
    practiceProblemSlugs: { easy: [], medium: [], hard: [] },
    extraProblemSlugs: [],
  },
  {
    slug: "order-lifecycle",
    title: "Order lifecycle",
    titleBn: "অর্ডারের জীবনচক্র",
    summary:
      "পেমেন্ট, শিপমেন্ট আর রিটার্নের চেইন — NOT EXISTS দিয়ে বকেয়া অর্ডার, CTE দিয়ে ভেন্ডর-ভিত্তিক রিটার্নের হার।",
    concept: lifecycleConcept,
    guidedProblemSlugs: [
      "sql-orders-without-payment",
      "sql-return-rate-by-vendor",
    ],
    practiceProblemSlugs: { easy: [], medium: [], hard: [] },
    extraProblemSlugs: [],
  },
];
