import type { SeedProblem } from "./seed-problems";

export const SQL_PROBLEMS_PRACTICE_BASIC_MORE_ORIENTATION: SeedProblem[] = [
  {
    slug: "sql-practice-orientation-hard",
    title: "Restock priority list",
    statement: `ইনভেন্টরি টিম সাপ্তাহিক রিস্টক প্ল্যান বানাচ্ছে। \`products\` থেকে যেসব প্রোডাক্ট রিস্টক-তালিকায় পড়বে সেগুলো বের করো — শর্ত: \`stock\` ১২ বা তার কম, অথবা \`rating\` অন্তত ৪.৫। প্রতি প্রোডাক্টের \`name\`, \`stock\`, \`rating\` সাথে একটি \`priority\` কলাম দেখাও — স্টক ৫ বা তার কম হলে \`high\`, নাহলে \`normal\`। আগে সব \`high\`, তারপর \`normal\` — দুই গ্রুপের ভেতরেই স্টক ঊর্ধ্বক্রমে, একই স্টকে নাম অনুযায়ী।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`name\`, \`stock\`, \`rating\`, \`priority\` — আগে \`high\` গ্রুপ (স্টক ঊর্ধ্বক্রম, টাই-এ \`name\`), তারপর \`normal\` গ্রুপ একই নিয়মে।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## ধারণা
এক query-তে চারটা জিনিস একসাথে কাজ করছে: \`OR\` দিয়ে দুই শর্তের ইউনিয়ন, \`CASE\` দিয়ে লেবেল, আর গ্রুপ-সহ deterministic ক্রম। \`ORDER BY\`-তে সরাসরি \`CASE\` বসানো যায় — \`high\`-কে আগে আনতে লেবেলের বদলে সংখ্যা ব্যবহার করো (high → ০, normal → ১)। মনে রেখো: ফিল্টারে \`rating\` আছে বলেই \`priority\` ঠিক করছে শুধু \`stock\` — রেটিং ভালো হলেও স্টক বেশি থাকলে \`normal\`।

## ধাপে ধাপে
১. \`WHERE stock <= 12 OR rating >= 4.5\`।
২. \`CASE WHEN stock <= 5 THEN 'high' ELSE 'normal' END AS priority\`।
৩. \`ORDER BY CASE WHEN stock <= 5 THEN 0 ELSE 1 END, stock, name\` — গ্রুপ, তারপর স্টক, তারপর নাম।

## কোডে দেখি
\`\`\`sql
SELECT name, stock, rating,
       CASE WHEN stock <= 5 THEN 'high' ELSE 'normal' END AS priority
FROM products
WHERE stock <= 12 OR rating >= 4.5
ORDER BY CASE WHEN stock <= 5 THEN 0 ELSE 1 END, stock, name;
\`\`\`

## সাধারণ ভুল
\`AND\` লিখে দুই শর্তের ছেদ বানিয়ে অনেক প্রোডাক্ট হারানো; \`priority\` ঠিক করতে \`rating\`-ও মেশানো; \`ORDER BY priority\` (স্ট্রিং) লিখে লেবেল বদলালেই ভেঙে পড়া — সংখ্যা-ভিত্তিক কেস নিরাপদ; টাই-ব্রেকার \`name\` বাদ দিয়ে একই স্টকে অনির্দিষ্ট ক্রম।`,
    difficulty: "HARD",
    points: 250,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    category: "SQL Basics",
    subcategory: "Orientation",
    referencePython: "",
    referenceSql: `SELECT name, stock, rating, CASE WHEN stock <= 5 THEN 'high' ELSE 'normal' END AS priority FROM products WHERE stock <= 12 OR rating >= 4.5 ORDER BY CASE WHEN stock <= 5 THEN 0 ELSE 1 END, stock, name;`,
    tests: [
      {
        input: ``,
        expectedOutput: `Webcam	2	4.0	high
Wireless Mouse	3	4.0	high
27in Monitor	5	4.6	high
Clay Dinner Set	6	4.8	normal
Denim Jacket	7	4.5	normal
USB-C Hub	8	4.2	normal
SQL Handbook	9	4.5	normal
Laptop Stand	11	4.3	normal
Dune	12	4.9	normal
Mechanical Keyboard	12	4.7	normal
Clean Code	30	4.9	normal`,
        isSample: true
      },
      {
        input: `update products set stock=4 where id=4;`,
        expectedOutput: `Webcam	2	4.0	high
Wireless Mouse	3	4.0	high
Clean Code	4	4.9	high
27in Monitor	5	4.6	high
Clay Dinner Set	6	4.8	normal
Denim Jacket	7	4.5	normal
USB-C Hub	8	4.2	normal
SQL Handbook	9	4.5	normal
Laptop Stand	11	4.3	normal
Dune	12	4.9	normal
Mechanical Keyboard	12	4.7	normal`,
        isSample: true
      },
      {
        input: `update products set stock=15, rating=4.4 where id=5;`,
        expectedOutput: `Webcam	2	4.0	high
Wireless Mouse	3	4.0	high
27in Monitor	5	4.6	high
Clay Dinner Set	6	4.8	normal
Denim Jacket	7	4.5	normal
USB-C Hub	8	4.2	normal
Laptop Stand	11	4.3	normal
Dune	12	4.9	normal
Mechanical Keyboard	12	4.7	normal
Clean Code	30	4.9	normal`,
        isSample: false
      },
      {
        input: `insert into products (id,vendor_id,category_id,name,price_cents,stock,rating) values (15,4,1,'Wireless Earbuds',175000,2,4.6);`,
        expectedOutput: `Webcam	2	4.0	high
Wireless Earbuds	2	4.6	high
Wireless Mouse	3	4.0	high
27in Monitor	5	4.6	high
Clay Dinner Set	6	4.8	normal
Denim Jacket	7	4.5	normal
USB-C Hub	8	4.2	normal
SQL Handbook	9	4.5	normal
Laptop Stand	11	4.3	normal
Dune	12	4.9	normal
Mechanical Keyboard	12	4.7	normal
Clean Code	30	4.9	normal`,
        isSample: false
      },
      {
        input: `update products set stock=1 where id=10;`,
        expectedOutput: `Clay Dinner Set	1	4.8	high
Webcam	2	4.0	high
Wireless Mouse	3	4.0	high
27in Monitor	5	4.6	high
Denim Jacket	7	4.5	normal
USB-C Hub	8	4.2	normal
SQL Handbook	9	4.5	normal
Laptop Stand	11	4.3	normal
Dune	12	4.9	normal
Mechanical Keyboard	12	4.7	normal
Clean Code	30	4.9	normal`,
        isSample: false
      },
    ],
  },
  {
    slug: "sql-practice-orientation-challenge",
    title: "Outside the Electronics tree",
    statement: `মেনু টিম Electronics ক্যাটাগরির (id ১) সরাসরি-নিচের সাব-ক্যাটাগরিগুলো নতুন মেনুতে সরাবে। \`categories\` থেকে যেসব ক্যাটাগরি সরানো হবে না — অর্থাৎ যাদের প্যারেন্ট Electronics (id ১) নয় — তাদের \`name\` ও \`parent_id\` বের করো। প্যারেন্ট নেই এমন (শীর্ষ) ক্যাটাগরিও তালিকায় থাকবে, তাদের \`parent_id\` ফাঁকা (NULL) দেখাবে; নাম অনুযায়ী সাজাও।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`name\`, \`parent_id\` — নাম অনুযায়ী; প্যারেন্ট না থাকলে ফাঁকা (NULL)।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## ধারণা
গোপন ফাঁদটা NULL-এ। \`parent_id <> 1\` লিখলে যেসব সারির \`parent_id\` NULL, তুলনার ফলও NULL — শর্ত সত্য হয় না, শীর্ষ ক্যাটাগরিগুলো নীরবে বাদ পড়ে যায়। SQLite-এর NULL-safe অসমতা হলো \`IS NOT\`: NULL \`IS NOT\` 1 → সত্য। চাইলে \`parent_id IS NULL OR parent_id <> 1\` দিয়েও একই ফল পাওয়া যায়।

## ধাপে ধাপে
১. \`SELECT name, parent_id FROM categories\`।
২. \`WHERE parent_id IS NOT 1\` — NULL সারিগুলোও বাঁচবে।
৩. \`ORDER BY name\`।

## কোডে দেখি
\`\`\`sql
SELECT name, parent_id
FROM categories
WHERE parent_id IS NOT 1
ORDER BY name;
\`\`\`

## সাধারণ ভুল
\`<> 1\` বা \`!= 1\` লিখে চারটে শীর্ষ ক্যাটাগরি হারানো — ফল খালি না দেখায় বলে ভুলটা সহজে ধরা পড়ে না; \`parent_id\` সিলেক্ট না করলে NULL চোখেই পড়ে না; সাবধান-সংস্করণ \`IS NULL OR <> 1\`-এর দুই শাখার ক্রম উল্টে লিখলেও চলবে, কিন্তু \`IS NOT\`-ই সবচেয়ে টেকনিক্যাল ও সংক্ষিপ্ত।`,
    difficulty: "MEDIUM",
    points: 225,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    category: "SQL Basics",
    subcategory: "Orientation",
    referencePython: "",
    referenceSql: `SELECT name, parent_id FROM categories WHERE parent_id IS NOT 1 ORDER BY name;`,
    tests: [
      {
        input: ``,
        expectedOutput: `Books	\\N
Electronics	\\N
Fashion	\\N
Fiction	4
Headphones	2
Home	\\N
Men	6`,
        isSample: true
      },
      {
        input: `update categories set parent_id=1 where id=5;`,
        expectedOutput: `Books	\\N
Electronics	\\N
Fashion	\\N
Headphones	2
Home	\\N
Men	6`,
        isSample: true
      },
      {
        input: `insert into categories (id,name,parent_id) values (9,'Sports',NULL);`,
        expectedOutput: `Books	\\N
Electronics	\\N
Fashion	\\N
Fiction	4
Headphones	2
Home	\\N
Men	6
Sports	\\N`,
        isSample: false
      },
      {
        input: `update categories set parent_id=1 where id in (5,8);`,
        expectedOutput: `Books	\\N
Electronics	\\N
Fashion	\\N
Headphones	2
Men	6`,
        isSample: false
      },
      {
        input: `update categories set parent_id=2 where id=8;`,
        expectedOutput: `Books	\\N
Electronics	\\N
Fashion	\\N
Fiction	4
Headphones	2
Home	2
Men	6`,
        isSample: false
      },
    ],
  },
];
