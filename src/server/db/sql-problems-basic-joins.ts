import type { SeedProblem } from "./seed-problems";

export const SQL_PROBLEMS_BASIC_JOINS: SeedProblem[] = [
  {
    slug: "sql-same-category-pairs",
    title: "Same-category product pairs",
    statement: `মার্কেটিং টিম প্রতি ক্যাটাগরির ভেতরে দামের বিস্তার নিয়ে ভাবে — একই ক্যাটাগরিতে দুটি প্রোডাক্টের দামের ফারাক যত বড়, ক্রেতার সামনে তত চওড়া বাজেট-রেঞ্জ। \`products\` টেবিলের একই ক্যাটাগরির প্রতিটি **অনন্য জোড়া** নিয়ে বের করো: ক্যাটাগরির নাম (\`category\`), জোড়ার সস্তা প্রোডাক্ট (\`cheaper_product\`), দামি প্রোডাক্ট (\`expensive_product\`) আর দামের ব্যবধান (\`price_gap_cents\`)। সাবধান: 'Mechanical Keyboard' বনাম 'USB-C Hub' আর 'USB-C Hub' বনাম 'Mechanical Keyboard' একই জোড়া — প্রতিটি জোড়া তালিকায় **মাত্র একবার** আসবে। দুই প্রোডাক্টের দাম সমান হলে আইডি ছোটটি \`cheaper_product\` এবং বড়টি \`expensive_product\` হিসেবে গণ্য হবে। সাজাও: ক্যাটাগরির নাম অনুযায়ী, তার ভেতরে ব্যবধান কমানো ক্রমে, সমান ব্যবধানে সস্তা প্রোডাক্টের নাম, তারপর দামি প্রোডাক্টের নাম অনুযায়ী।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`category\`, \`cheaper_product\`, \`expensive_product\`, \`price_gap_cents\` — ক্যাটাগরি অনুযায়ী, তার ভেতরে ব্যবধান কমানো ক্রমে, সমান হলে \`cheaper_product\` তারপর \`expensive_product\` অনুযায়ী।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## কেন দরকার
একটাই টেবিলের ভেতরের সম্পর্ক বের করা — একই ক্যাটাগরির প্রোডাক্টগুলো পরস্পরের প্রতিযোগী, আর তাদের দামের ফারাক বলে দেয় ক্রেতার কাছে কতটা দামের রেঞ্জ সে ক্যাটাগরিতে খোলা আছে। এই ধরনের প্রশ্নে জোড়া দিতে হয় টেবিলকে তার নিজের সাথেই — self-join। কিন্তু self-join-এর সবচেয়ে কমন ফাঁদ: প্রতিটি জোড়া দুইবার আসা (একবার A→B, একবার B→A), এমনকি নিজের সাথে নিজের জোড়াও ঢুকে পড়া।

## মূল ধারণা
একই টেবিলকে দুইটা আলাদা alias দিয়ে জোড়া দাও — \`products p1 JOIN products p2\`। শুধু \`p2.category_id = p1.category_id\` দিলে p1-এর প্রতিটি সারি p2-এর একই ক্যাটাগরির **সব** সারির সাথে জুট়বে — ফলে (A,B) আর (B,A) দুটোই, আর আইডি মিললে (A,A)-ও। একবার রাখার চাবিকাঠি: জয়েনের শর্তেই \`p1.id < p2.id\` — আইডি ছোটটা সবসময় p1 হয়ে যায়, ফলে (A,B) বনাম (B,A) একটাই সারি, আর নিজের সাথে জোড়া অসম্ভব (\`A < A\` কখনো সত্য নয়)। এবার 'সস্তা/দামি' ঠিক করতে হয় দাম দেখে — p1 সবসময় সস্তা নয়, তাই \`CASE WHEN p1.price_cents <= p2.price_cents\` দিয়ে বেছে নাও কার নাম কোন কলামে বসবে; ব্যবধান \`ABS(p2.price_cents - p1.price_cents)\`। আরেকটা বড় ধারণা: query চলে ক্রমে FROM/JOIN → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT — লেখার ক্রমের উল্টো। এজন্য SELECT-এ বানানো alias WHERE-এ ধরা যায় না (WHERE আগে চলে), কিন্তু ORDER BY-তে ধরা যায় (SELECT তখন শেষ হয়ে গেছে)।

## ধাপে ধাপে
১. \`products p1 JOIN products p2\` — একই টেবিল, দুই পোশাক।
২. \`ON p2.category_id = p1.category_id AND p1.id < p2.id\` — জোড়া অনন্য করার শর্ত জয়েনেই।
৩. \`categories\` জোড়ে ক্যাটাগরির নাম আনো।
৪. দাম তুলে \`CASE\` দিয়ে সস্তা/দামি ঠিক করো, \`ABS()\` দিয়ে ব্যবধান।
৫. \`ORDER BY category, price_gap_cents DESC, cheaper_product, expensive_product\` — সম্পূর্ণ deterministic।

## কোডে দেখি
\`\`\`sql
SELECT c.name AS category,
       CASE WHEN p1.price_cents <= p2.price_cents THEN p1.name ELSE p2.name END AS cheaper_product,
       CASE WHEN p1.price_cents <= p2.price_cents THEN p2.name ELSE p1.name END AS expensive_product,
       ABS(p2.price_cents - p1.price_cents) AS price_gap_cents
FROM products p1
JOIN products p2 ON p2.category_id = p1.category_id AND p1.id < p2.id
JOIN categories c ON c.id = p1.category_id
ORDER BY c.name, price_gap_cents DESC, cheaper_product, expensive_product;
\`\`\`

## কমপ্লেক্সিটি
একই ক্যাটাগরির kটি প্রোডাক্ট k(k-1)/2 জোড়া বানায় — মোট \`O(Σk²)\`; ছোট ক্যাটাগরিতে সস্তা, কিন্তু হাজার-হাজার প্রোডাক্টের ক্যাটাগরিতে সারি-সংখ্যা দ্রুত বাড়ে — সেখানে জোড়ার তালিকার বদলে গ্রুপ স্ট্যাটিসটিক্স (MIN/MAX) ভাবতে হয়।

## সাধারণ ভুল
\`p1.id < p2.id\` বাদ দিয়ে প্রতিটি জোড়া দুইবার দেখানো; \`p1.id <= p2.id\` লিখে (A,A) জোড়া ঢুকিয়ে ফেলা; \`p1.id != p2.id\` লেখা — এতে সমান আইডি বাদ যায় ঠিকই, কিন্তু (A,B) আর (B,A) দুটোই থেকে যায়; সস্তা/দামি না ভেবে শুধু p1-এর নাম আগে বসিয়ে দেওয়া — p1 সবসময় সস্তা নয়; ORDER BY-তে টাই-ব্রেকার না দিলে একই query-র দুই রানে ভিন্ন ক্রম।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    category: "SQL Basics",
    subcategory: "Joins",
    referencePython: "",
    referenceSql: `SELECT c.name AS category, CASE WHEN p1.price_cents <= p2.price_cents THEN p1.name ELSE p2.name END AS cheaper_product, CASE WHEN p1.price_cents <= p2.price_cents THEN p2.name ELSE p1.name END AS expensive_product, ABS(p2.price_cents - p1.price_cents) AS price_gap_cents FROM products p1 JOIN products p2 ON p2.category_id = p1.category_id AND p1.id < p2.id JOIN categories c ON c.id = p1.category_id ORDER BY c.name, price_gap_cents DESC, cheaper_product, expensive_product;`,
    tests: [
      {
        input: ``,
        expectedOutput: `Books	SQL Handbook	Clean Code	85000
Electronics	Wireless Mouse	27in Monitor	1765000
Electronics	Laptop Stand	27in Monitor	1700000
Electronics	USB-C Hub	27in Monitor	1630000
Electronics	Webcam	27in Monitor	1500000
Electronics	Mechanical Keyboard	27in Monitor	1400000
Electronics	Wireless Mouse	Mechanical Keyboard	365000
Electronics	Laptop Stand	Mechanical Keyboard	300000
Electronics	Wireless Mouse	Webcam	265000
Electronics	USB-C Hub	Mechanical Keyboard	230000
Electronics	Laptop Stand	Webcam	200000
Electronics	Wireless Mouse	USB-C Hub	135000
Electronics	USB-C Hub	Webcam	130000
Electronics	Webcam	Mechanical Keyboard	100000
Electronics	Laptop Stand	USB-C Hub	70000
Electronics	Wireless Mouse	Laptop Stand	65000
Home	Table Lamp	Clay Dinner Set	210000
Men	Cotton Panjabi	Denim Jacket	140000`,
        isSample: true
      },
      {
        input: `update products set price_cents=180000 where id=5;`,
        expectedOutput: `Books	Clean Code	SQL Handbook	0
Electronics	Wireless Mouse	27in Monitor	1765000
Electronics	Laptop Stand	27in Monitor	1700000
Electronics	USB-C Hub	27in Monitor	1630000
Electronics	Webcam	27in Monitor	1500000
Electronics	Mechanical Keyboard	27in Monitor	1400000
Electronics	Wireless Mouse	Mechanical Keyboard	365000
Electronics	Laptop Stand	Mechanical Keyboard	300000
Electronics	Wireless Mouse	Webcam	265000
Electronics	USB-C Hub	Mechanical Keyboard	230000
Electronics	Laptop Stand	Webcam	200000
Electronics	Wireless Mouse	USB-C Hub	135000
Electronics	USB-C Hub	Webcam	130000
Electronics	Webcam	Mechanical Keyboard	100000
Electronics	Laptop Stand	USB-C Hub	70000
Electronics	Wireless Mouse	Laptop Stand	65000
Home	Table Lamp	Clay Dinner Set	210000
Men	Cotton Panjabi	Denim Jacket	140000`,
        isSample: true
      },
      {
        input: `update products set category_id=8 where id=12;`,
        expectedOutput: `Books	SQL Handbook	Clean Code	85000
Electronics	Wireless Mouse	27in Monitor	1765000
Electronics	Laptop Stand	27in Monitor	1700000
Electronics	USB-C Hub	27in Monitor	1630000
Electronics	Mechanical Keyboard	27in Monitor	1400000
Electronics	Wireless Mouse	Mechanical Keyboard	365000
Electronics	Laptop Stand	Mechanical Keyboard	300000
Electronics	USB-C Hub	Mechanical Keyboard	230000
Electronics	Wireless Mouse	USB-C Hub	135000
Electronics	Laptop Stand	USB-C Hub	70000
Electronics	Wireless Mouse	Laptop Stand	65000
Home	Table Lamp	Webcam	240000
Home	Table Lamp	Clay Dinner Set	210000
Home	Clay Dinner Set	Webcam	30000
Men	Cotton Panjabi	Denim Jacket	140000`,
        isSample: false
      },
      {
        input: `insert into products (id,vendor_id,category_id,name,price_cents,stock,rating) values (15,4,8,'Desk Organizer',130000,10,4.1);`,
        expectedOutput: `Books	SQL Handbook	Clean Code	85000
Electronics	Wireless Mouse	27in Monitor	1765000
Electronics	Laptop Stand	27in Monitor	1700000
Electronics	USB-C Hub	27in Monitor	1630000
Electronics	Webcam	27in Monitor	1500000
Electronics	Mechanical Keyboard	27in Monitor	1400000
Electronics	Wireless Mouse	Mechanical Keyboard	365000
Electronics	Laptop Stand	Mechanical Keyboard	300000
Electronics	Wireless Mouse	Webcam	265000
Electronics	USB-C Hub	Mechanical Keyboard	230000
Electronics	Laptop Stand	Webcam	200000
Electronics	Wireless Mouse	USB-C Hub	135000
Electronics	USB-C Hub	Webcam	130000
Electronics	Webcam	Mechanical Keyboard	100000
Electronics	Laptop Stand	USB-C Hub	70000
Electronics	Wireless Mouse	Laptop Stand	65000
Home	Table Lamp	Clay Dinner Set	210000
Home	Desk Organizer	Clay Dinner Set	190000
Home	Table Lamp	Desk Organizer	20000
Men	Cotton Panjabi	Denim Jacket	140000`,
        isSample: false
      },
      {
        input: `update products set price_cents=50000 where id=1;`,
        expectedOutput: `Books	SQL Handbook	Clean Code	85000
Electronics	Mechanical Keyboard	27in Monitor	1800000
Electronics	Wireless Mouse	27in Monitor	1765000
Electronics	Laptop Stand	27in Monitor	1700000
Electronics	USB-C Hub	27in Monitor	1630000
Electronics	Webcam	27in Monitor	1500000
Electronics	Mechanical Keyboard	Webcam	300000
Electronics	Wireless Mouse	Webcam	265000
Electronics	Laptop Stand	Webcam	200000
Electronics	Mechanical Keyboard	USB-C Hub	170000
Electronics	Wireless Mouse	USB-C Hub	135000
Electronics	USB-C Hub	Webcam	130000
Electronics	Mechanical Keyboard	Laptop Stand	100000
Electronics	Laptop Stand	USB-C Hub	70000
Electronics	Wireless Mouse	Laptop Stand	65000
Electronics	Mechanical Keyboard	Wireless Mouse	35000
Home	Table Lamp	Clay Dinner Set	210000
Men	Cotton Panjabi	Denim Jacket	140000`,
        isSample: false
      },
    ],
  },
  {
    slug: "sql-vendor-city-peers",
    title: "Vendor peers by city",
    statement: `অপস টিম প্রতি শহরের লোকাল ভেন্ডর ম্যানেজ করে — একই শহরের ভেন্ডররা একে অপরের সরাসরি প্রতিদ্বন্দ্বী, আর রেটিং-এর ফারাক বলে দেয় কে কতটা এগিয়ে, কাকে কোচিং দিতে হবে। \`vendors\` থেকে একই শহরের প্রতিটি **অনন্য ভেন্ডর-জোড়া** বের করো: \`city\`, দুই ভেন্ডরের নাম (\`vendor_a\`-এর আইডি ছোট, \`vendor_b\`-এর বড়) আর দুজনের রেটিং-এর পার্থক্য (\`rating_gap\`, এক দশমিক ঘর)। একই জোড়া দুইবার আসবে না। সাজাও: শহর অনুযায়ী, তার ভেতরে ফারাক কমানো ক্রমে, সমান হলে \`vendor_a\` তারপর \`vendor_b\` অনুযায়ী।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`city\`, \`vendor_a\`, \`vendor_b\`, \`rating_gap\` — শহর অনুযায়ী, তার ভেতরে ফারাক কমানো ক্রমে, সমান হলে \`vendor_a\` তারপর \`vendor_b\` অনুযায়ী।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## কেন দরকার
লোকাল মার্কেটে একই শহরের ভেন্ডররা একই ক্রেতার দৃষ্টি ধরে রাখতে লড়ে। অপস টিমের কাছে 'শহরের ভেতরের প্রতিযোগিতার মানচিত্র' মানে জোড়া-তালিকা: কে কার সাথে, আর রেটিং-এ কত পরস্পর থেকে। এই রিপোর্ট বানাতে হয় vendors টেবিলকেই তার নিজের সাথে জোড়া দিয়ে — এবং জোড়া একবারই দেখাতে হয়।

## মূল ধারণা
\`vendors v1 JOIN vendors v2 ON v2.city = v1.city AND v1.id < v2.id\` — শহর মিলিয়ে জোড়া, আর \`v1.id < v2.id\` নিশ্চিত করে প্রতিটি জোড়া ঠিক একবারই আসে (v1 সবসময় ছোট আইডি)। রেটিং-এর ফারাক \`ABS(v2.rating - v1.rating)\` — ABS দরকার কারণ কার রেটিং বড় তা আগে থেকে ঠিক নয়, আর 'ফারাক' ঋণাত্মক হলে অর্থহীন। আর একটা বাস্তব সতর্কতা: রেটিং REAL — \`4.8 - 4.6\` ভাসমান-বিন্দুর ভেতরে \`0.20000000000000018\`, সরাসরি বের করলে রিপোর্ট আউটপুট পড়াই যায় না। তাই \`ROUND(..., 1)\` দিয়ে এক দশমিকে থাকো — দশমিকের কাজে ভাসমান-বিন্দুর ধার সবসময় ROUND দিয়ে সামলাও।

## ধাপে ধাপে
১. \`vendors\`-কে \`v1\`, \`v2\` দুই alias-এ জোড়া দাও, \`ON v2.city = v1.city\`।
২. \`AND v1.id < v2.id\` — জোড়া অনন্য করার চাবি।
৩. \`ROUND(ABS(v2.rating - v1.rating), 1)\` দিয়ে ফারাক।
৪. \`ORDER BY city, rating_gap DESC, vendor_a, vendor_b\` — টাই-ব্রেকারসহ।

## কোডে দেখি
\`\`\`sql
SELECT v1.city AS city,
       v1.name AS vendor_a,
       v2.name AS vendor_b,
       ROUND(ABS(v2.rating - v1.rating), 1) AS rating_gap
FROM vendors v1
JOIN vendors v2 ON v2.city = v1.city AND v1.id < v2.id
ORDER BY v1.city, rating_gap DESC, vendor_a, vendor_b;
\`\`\`

## কমপ্লেক্সিটি
শহরে k জন ভেন্ডর থাকলে k(k-1)/2 জোড়া — ছোট টেবিলে উপেক্ষণীয়; \`city\`-তে ইনডেক্স থাকলে জয়েন কার্যত লিনিয়ার।

## সাধারণ ভুল
\`v1.id < v2.id\` ছাড়া লিখে প্রতিটি জোড়া দুইবার পাওয়া; নামের ক্রম (\`v1.name < v2.name\`) দিয়ে জোড়া সাজানো — কাজ করে, কিন্তু নাম বদলালে বা দুইজনের নাম এক হলে ভেঙে পড়ে, আইডি অনন্য তাই আইডিই নিরাপদ; \`ABS\` ছাড়া ঋণাত্মক ফারাক; \`ROUND\` ছাড়া \`4.8 - 4.6\`-এর মতো ভাসমান-বিন্দুর ধার রিপোর্টে লম্বা সংখ্যা টেনে আনা; ORDER BY-তে টাই-ব্রেকার না দেওয়া।`,
    difficulty: "EASY",
    points: 150,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    category: "SQL Basics",
    subcategory: "Joins",
    referencePython: "",
    referenceSql: `SELECT v1.city AS city, v1.name AS vendor_a, v2.name AS vendor_b, ROUND(ABS(v2.rating - v1.rating), 1) AS rating_gap FROM vendors v1 JOIN vendors v2 ON v2.city = v1.city AND v1.id < v2.id ORDER BY v1.city, rating_gap DESC, vendor_a, vendor_b;`,
    tests: [
      {
        input: ``,
        expectedOutput: `Dhaka	TechNest	StyleHub	0.2`,
        isSample: true
      },
      {
        input: `update vendors set city='Dhaka' where id in (5,6);`,
        expectedOutput: `Dhaka	HomeCraft	PaperTrail	0.9
Dhaka	TechNest	PaperTrail	0.8
Dhaka	StyleHub	PaperTrail	0.6
Dhaka	StyleHub	HomeCraft	0.3
Dhaka	TechNest	StyleHub	0.2
Dhaka	TechNest	HomeCraft	0.1`,
        isSample: true
      },
      {
        input: `update vendors set rating=4.6 where id=1;`,
        expectedOutput: `Dhaka	TechNest	StyleHub	0.0`,
        isSample: false
      },
      {
        input: `insert into vendors (id,name,city,rating) values (7,'GadgetFlow','Sylhet',4.2),(8,'BookWorm','Chattogram',4.5);`,
        expectedOutput: `Chattogram	BookBazar	BookWorm	0.2
Dhaka	TechNest	StyleHub	0.2
Sylhet	GadgetPoint	GadgetFlow	0.1`,
        isSample: false
      },
      {
        input: `update vendors set city='Chattogram' where id=4;`,
        expectedOutput: `Chattogram	BookBazar	GadgetPoint	0.2
Dhaka	TechNest	StyleHub	0.2`,
        isSample: false
      },
    ],
  },
];
