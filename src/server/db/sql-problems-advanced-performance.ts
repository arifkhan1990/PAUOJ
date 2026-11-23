import type { SeedProblem } from "./seed-problems";

export const SQL_PROBLEMS_ADVANCED_PERFORMANCE: SeedProblem[] = [
  {
    slug: "sql-adv-keyset-pagination",
    title: "Keyset pagination",
    statement: `Rahim-এর \`paid\`/\`shipped\` অর্ডারগুলো \`(ordered_at, id)\` ক্রমে সাজানো তালিকার মতো ভাবো। কার্সর (শেষ দেখা সারি) হলো \`ordered_at = '2026-10-10'\`, \`id = 4\`। এই কার্সরের **পরের পেজ** বের করো — সর্বোচ্চ ৩টি অর্ডার। "পরে" মানে: \`ordered_at\` কার্সরের চেয়ে বড়, **অথবা** তারিখ সমান হলে \`id\` বড়। \`OFFSET\` ব্যবহার কোরো না — \`WHERE\` predicate দিয়ে লেখো, যেন index সরাসরি কার্সরের জায়গায় ঝাঁপ দিতে পারে।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`customer\`, \`order_id\`, \`ordered_at\`, \`order_cents\` (সেই অর্ডারের order_items যোগফল, সেন্টে) — \`ordered_at\` তারপর \`order_id\` ক্রমে, সর্বোচ্চ ৩ সারি।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## কেন দরকার
পেজিং-এর সবচেয়ে পরিচিত লেখা \`LIMIT 3 OFFSET 40\`। সমস্যা: OFFSET 40 মানে ইঞ্জিনকে প্রথম ৪০টি সারি তবু পড়ে ফেলতে হয়, তারপর ৩টি রাখে। পেজ যত গভীরে, কাজ তত বাড়ে — পেজ ১০০০-তে প্রতিবার হাজার সারি বাদ দিতে হয়, আর \`ordered_at\`-এর index-ও এই অপচায় তেমন কাজে আসে না। কার্সর-ভিত্তিক (keyset) pagination এই খরচ মুছে দেয়: পরের পেজের \`WHERE\`-এ বলে দেওয়া হয় "আগের পেজের শেষ সারির পরে যা আছে"। \`(ordered_at, id)\` index থাকলে ইঞ্জিন O(log n)-এ সরাসরি কার্সরের জায়গায় ঝাঁপ দেয় — পেজ ১ হোক বা পেজ ১০০০, প্রতি পেজে একই ছোট খরচ।

## মূল ধারণা
কার্সর হলো আগের পেজের শেষ সারির \`(ordered_at, id)\` জোড়া। "পরের সারি" মানে lexicographic তুলনা: \`ordered_at > '2026-10-10'\`, অথবা তারিখ সমান হলে \`id > 4\`। দুটোকে OR দিয়ে এক predicate-এ লেখা হয় — এটি সরাসরি index কলামগুলোর উপরে চলে, তাই index-friendly। শুধু \`ordered_at > '2026-10-10'\` লিখলে একই তারিখের \`id > 4\` সারি চুপচাপ বাদ পড়ে — এটাই এই সমস্যার লুকানো ফাঁদ। অনেক ইঞ্জিন row-value সিনট্যাক্স \`(ordered_at, id) > ('2026-10-10', 4)\`-ও চেনে (PostgreSQL, MySQL 8+, SQLite 3.15+) — অর্থ একই, লেখা ছোট।

## ধাপে ধাপে
১. পেজের ক্রম ঠিক করো: \`ORDER BY ordered_at, id\` — \`id\` টাই-ব্রেকার, না দিলে একই তারিখে ক্রম অনির্দিষ্ট।
২. কার্সর predicate লেখো: \`ordered_at > '2026-10-10' OR (ordered_at = '2026-10-10' AND id > 4)\`।
৩. ব্যবসায়িক ফিল্টার যোগ করো: কাস্টমার Rahim আর \`status IN ('paid','shipped')\`।
৪. পেজ সাইজ \`LIMIT 3\`।

## কোডে দেখি
\`\`\`sql
SELECT cu.name AS customer, o.id AS order_id, o.ordered_at,
       SUM(oi.quantity * oi.unit_price_cents) AS order_cents
FROM orders o
JOIN customers cu ON cu.id = o.customer_id
JOIN order_items oi ON oi.order_id = o.id
WHERE cu.name = 'Rahim'
  AND o.status IN ('paid', 'shipped')
  AND (o.ordered_at > '2026-10-10'
       OR (o.ordered_at = '2026-10-10' AND o.id > 4))
GROUP BY o.id, cu.name, o.ordered_at
ORDER BY o.ordered_at, o.id
LIMIT 3;
\`\`\`

## সাধারণ ভুল
OFFSET দিয়ে গভীর পেজ জোগানো; টাই-ব্রেক (\`id\`) বাদ দিয়ে একই তারিখের সারি হারানো; কার্সরের তারিখে \`>=\` লিখে cursor-সারিটাই আবার ফেরত আনা; ক্রম এলোমেলো করে predicate আর ORDER BY-র দিক মেলাতে ভুলে যাওয়া; আর status ফিল্টার ভুলে pending/cancelled অর্ডার পেজে ঢুকিয়ে দেওয়া।`,
    difficulty: "HARD",
    points: 350,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    premiumModuleSlug: "advanced-sql",
    category: "SQL Advanced",
    subcategory: "Query performance",
    referencePython: "",
    referenceSql: `SELECT cu.name AS customer, o.id AS order_id, o.ordered_at, SUM(oi.quantity*oi.unit_price_cents) AS order_cents FROM orders o JOIN customers cu ON cu.id = o.customer_id JOIN order_items oi ON oi.order_id = o.id WHERE cu.name = 'Rahim' AND o.status IN ('paid','shipped') AND (o.ordered_at > '2026-10-10' OR (o.ordered_at = '2026-10-10' AND o.id > 4)) GROUP BY o.id, cu.name, o.ordered_at ORDER BY o.ordered_at, o.id LIMIT 3;`,
    tests: [
      {
        input: ``,
        expectedOutput: `Rahim	6	2026-10-20	605000`,
        isSample: true
      },
      {
        input: `insert into orders (id,customer_id,ordered_at,status) values (11,1,'2026-10-22','paid'); insert into order_items (id,order_id,product_id,quantity,unit_price_cents) values (16,11,5,1,95000); insert into orders (id,customer_id,ordered_at,status) values (12,1,'2026-10-25','paid'); insert into order_items (id,order_id,product_id,quantity,unit_price_cents) values (17,12,8,1,85000); insert into orders (id,customer_id,ordered_at,status) values (13,1,'2026-10-26','paid'); insert into order_items (id,order_id,product_id,quantity,unit_price_cents) values (18,13,10,2,320000);`,
        expectedOutput: `Rahim	6	2026-10-20	605000
Rahim	11	2026-10-22	95000
Rahim	12	2026-10-25	85000`,
        isSample: true
      },
      {
        input: `insert into orders (id,customer_id,ordered_at,status) values (11,1,'2026-10-10','paid'); insert into order_items (id,order_id,product_id,quantity,unit_price_cents) values (16,11,4,1,180000); insert into orders (id,customer_id,ordered_at,status) values (12,1,'2026-10-25','pending'); insert into order_items (id,order_id,product_id,quantity,unit_price_cents) values (17,12,5,1,95000);`,
        expectedOutput: `Rahim	11	2026-10-10	180000
Rahim	6	2026-10-20	605000`,
        isSample: false
      },
      {
        input: `update orders set status='cancelled' where id=6; insert into orders (id,customer_id,ordered_at,status) values (14,1,'2026-10-24','paid'); insert into order_items (id,order_id,product_id,quantity,unit_price_cents) values (18,14,2,1,220000);`,
        expectedOutput: `Rahim	14	2026-10-24	220000`,
        isSample: false
      },
      {
        input: `insert into orders (id,customer_id,ordered_at,status) values (11,1,'2026-10-11','paid'); insert into order_items (id,order_id,product_id,quantity,unit_price_cents) values (16,11,1,1,450000); insert into orders (id,customer_id,ordered_at,status) values (12,1,'2026-10-15','shipped'); insert into order_items (id,order_id,product_id,quantity,unit_price_cents) values (17,12,2,2,220000); insert into orders (id,customer_id,ordered_at,status) values (13,1,'2026-10-19','paid'); insert into order_items (id,order_id,product_id,quantity,unit_price_cents) values (18,13,6,1,240000);`,
        expectedOutput: `Rahim	11	2026-10-11	450000
Rahim	12	2026-10-15	440000
Rahim	13	2026-10-19	240000`,
        isSample: false
      },
    ],
  },
  {
    slug: "sql-adv-sargable-date",
    title: "Sargable date ranges",
    statement: `অক্টোবর মাসের \`paid\`/\`shipped\` অর্ডারগুলোর রসিদ তৈরি করো — মানে \`ordered_at >= '2026-10-01'\` এবং \`ordered_at < '2026-11-01'\` (half-open range)। \`ordered_at\` কলামে **কোনো ফাংশন** (\`strftime\`, \`date\`, \`substr\`) লাগিয়ো না — সরাসরি তুলনা লেখো, যেন তারিখের index সত্যিই কাজে লাগে।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`order_id\`, \`customer\`, \`ordered_at\`, \`total_cents\` (সেই অর্ডারের order_items যোগফল, সেন্টে) — \`ordered_at\` তারপর \`order_id\` ক্রমে।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## কেন দরকার
"অক্টোবরের অর্ডার" বের করতে সবচেয়ে লোভনীয় লেখা \`strftime('%Y-%m', ordered_at) = '2026-10'\` (PostgreSQL-এ \`to_char\`) — এক লাইনেই কাজ শেষ মনে হয়। কিন্তু বড় টেবিলে এই query প্রতিটি সারি পড়ে ফাংশনটা চালায়, কারণ index-এ \`ordered_at\`-এর মান sorted থাকে, ফাংশনের ফল sorted থাকে না — planner জানতে পারে না কোন শাখায় '2026-10' পড়ে, তাই index ছেড়ে পুরো টেবিল scan করে। এই সমস্যার নাম non-sargable predicate। সমাধান: কলামে হাত না দিয়ে মানের দিকটা লেখো — \`ordered_at >= '2026-10-01' AND ordered_at < '2026-11-01'\`। এবার planner সরাসরি index-এর ১ অক্টোবরের জায়গায় ঝাঁপ দিয়ে নভেম্বরের শুরুতে থামে।

## মূল ধারণা
sargable মানে Search ARGument ABLE — predicate-টা index seek-এ ব্যবহার করা সম্ভব। নিয়ম: indexed কলামটা \`WHERE\`-এ যতটা সম্ভব অপরিবর্তিত থাকে; রূপান্তর দরকার হলে মানের দিকে করো, কলামের দিকে নয়। তারিখে half-open range (\`>= শুরু AND < পরের-মাসের-প্রথম-দিন\`) সবচেয়ে নিরাপদ: \`'2026-10-31 14:30'\`-এর মতো টাইমস্ট্যাম্প থাকলে \`<= '2026-10-31'\` ওই সারি বাদ দিয়ে দেয়, কিন্তু \`< '2026-11-01'\` ধরে রাখে। ISO টেক্সট তারিখ (\`YYYY-MM-DD\`) lexically sort হয়, তাই string comparison-ই সঠিক তারিখ comparison। \`status\`-এর মতো ছোট ফিল্টারও \`(status, ordered_at)\` composite index-এ রাখলে planner দুটোই একসাথে কাজে লাগাতে পারে।

## ধাপে ধাপে
১. মাসের শুরু আর পরের মাসের প্রথম দিন ঠিক করো: \`'2026-10-01'\` আর \`'2026-11-01'\`।
২. \`WHERE\`-এ দুটি সরাসরি তুলনা লেখো — কলামে কোনো ফাংশন নয়।
৩. \`status IN ('paid','shipped')\` যোগ করো।
৪. অর্ডার ধরে \`GROUP BY\`, শেষে \`ORDER BY ordered_at, id\` — টাই-ব্রেক ভুলো না।

## কোডে দেখি
\`\`\`sql
SELECT o.id AS order_id, cu.name AS customer, o.ordered_at,
       SUM(oi.quantity * oi.unit_price_cents) AS total_cents
FROM orders o
JOIN customers cu ON cu.id = o.customer_id
JOIN order_items oi ON oi.order_id = o.id
WHERE o.status IN ('paid', 'shipped')
  AND o.ordered_at >= '2026-10-01'
  AND o.ordered_at < '2026-11-01'
GROUP BY o.id, cu.name, o.ordered_at
ORDER BY o.ordered_at, o.id;
\`\`\`

## সাধারণ ভুল
\`strftime('%Y-%m', ordered_at)\` জাতীয় মোড়ক দিয়ে full scan ডেকে আনা; \`BETWEEN '2026-10-01' AND '2026-10-31'\` লিখে শেষ দিনের টাইমস্ট্যাম্প বাদ দেওয়া; শুধু মাস ভেবে \`status\` ফিল্টার ভুলে pending/cancelled অর্ডার ঢোকানো; আর \`ORDER BY ordered_at\` একা লিখে একই তারিখের দুই অর্ডারের ক্রম অনির্দিষ্ট রেখে দেওয়া।`,
    difficulty: "HARD",
    points: 350,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    premiumModuleSlug: "advanced-sql",
    category: "SQL Advanced",
    subcategory: "Query performance",
    referencePython: "",
    referenceSql: `SELECT o.id AS order_id, cu.name AS customer, o.ordered_at, SUM(oi.quantity*oi.unit_price_cents) AS total_cents FROM orders o JOIN customers cu ON cu.id = o.customer_id JOIN order_items oi ON oi.order_id = o.id WHERE o.status IN ('paid','shipped') AND o.ordered_at >= '2026-10-01' AND o.ordered_at < '2026-11-01' GROUP BY o.id, cu.name, o.ordered_at ORDER BY o.ordered_at, o.id;`,
    tests: [
      {
        input: ``,
        expectedOutput: `1	Rahim	2026-10-01	890000
3	Nusrat	2026-10-05	600000
4	Rahim	2026-10-10	2000000
6	Rahim	2026-10-20	605000
7	Mim	2026-10-22	670000
8	Karim	2026-10-25	180000
9	Nusrat	2026-10-28	120000`,
        isSample: true
      },
      {
        input: `update orders set ordered_at='2026-10-30' where id=10;`,
        expectedOutput: `1	Rahim	2026-10-01	890000
3	Nusrat	2026-10-05	600000
4	Rahim	2026-10-10	2000000
6	Rahim	2026-10-20	605000
7	Mim	2026-10-22	670000
8	Karim	2026-10-25	180000
9	Nusrat	2026-10-28	120000
10	Tanvir	2026-10-30	380000`,
        isSample: true
      },
      {
        input: `update orders set status='shipped' where id=2;`,
        expectedOutput: `1	Rahim	2026-10-01	890000
2	Karim	2026-10-03	180000
3	Nusrat	2026-10-05	600000
4	Rahim	2026-10-10	2000000
6	Rahim	2026-10-20	605000
7	Mim	2026-10-22	670000
8	Karim	2026-10-25	180000
9	Nusrat	2026-10-28	120000`,
        isSample: false
      },
      {
        input: `update orders set status='cancelled' where id=1;`,
        expectedOutput: `3	Nusrat	2026-10-05	600000
4	Rahim	2026-10-10	2000000
6	Rahim	2026-10-20	605000
7	Mim	2026-10-22	670000
8	Karim	2026-10-25	180000
9	Nusrat	2026-10-28	120000`,
        isSample: false
      },
      {
        input: `update orders set status='pending' where id=8; insert into orders (id,customer_id,ordered_at,status) values (11,4,'2026-10-18','paid'); insert into order_items (id,order_id,product_id,quantity,unit_price_cents) values (16,11,5,1,95000); insert into orders (id,customer_id,ordered_at,status) values (12,5,'2026-11-01','paid'); insert into order_items (id,order_id,product_id,quantity,unit_price_cents) values (17,12,5,1,95000);`,
        expectedOutput: `1	Rahim	2026-10-01	890000
3	Nusrat	2026-10-05	600000
4	Rahim	2026-10-10	2000000
11	Sajid	2026-10-18	95000
6	Rahim	2026-10-20	605000
7	Mim	2026-10-22	670000
9	Nusrat	2026-10-28	120000`,
        isSample: false
      },
    ],
  },
];
