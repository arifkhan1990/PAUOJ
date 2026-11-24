import type { SeedProblem } from "./seed-problems";

export const SQL_PROBLEMS_PRACTICE_BASIC_MORE_SUBQUERIES: SeedProblem[] = [
  {
    slug: "sql-practice-subqueries-hard",
    title: "Above their vendor's average",
    statement: `গাইডেড প্রবলেমে ক্যাটাগরির গড় দিয়েছিলাম — এবার ভেন্ডর। \`products\` থেকে যেসব প্রোডাক্টের দাম তাদের নিজের ভেন্ডরের সব প্রোডাক্টের গড় দামের চেয়ে বেশি, তাদের \`name\`, \`vendor\` (ভেন্ডরের নাম), \`price_cents\` আর সেই ভেন্ডরের গড় \`vendor_avg_cents\` (পূর্ণসংখ্যায় round করা) বের করো; দাম নিচের ক্রমে, সমান হলে নাম অনুযায়ী।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`name\`, \`vendor\`, \`price_cents\`, \`vendor_avg_cents\` — দাম নিচের ক্রমে, টাই-এ \`name\`।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## ধারণা
correlated সাবকোয়েরি — ভেতরের \`WHERE p2.vendor_id = p.vendor_id\` বাইরের প্রতিটি সারির সাথে বাঁধা। একই সাবকোয়েরি দুই কাজে: শর্তে (গড়ের চেয়ে বড়?) আর আউটপুট কলামে (গড়টা দেখাও)। শর্তে তুলনা চলে আসল ভগ্নাংশ গড় দিয়েই; আউটপুটে দেখানোর সময় \`CAST(ROUND(...))\` দিয়ে পূর্ণসংখ্যা। দুই কাজে দুই আলাদা মান ব্যবহার করা যাবে না — নাহলে সীমানা-দামের প্রোডাক্ট ভুল দিকে পড়বে।

## ধাপে ধাপে
১. \`products p JOIN vendors v\` — ভেন্ডরের নাম।
২. \`WHERE p.price_cents > (SELECT AVG(p2.price_cents) FROM products p2 WHERE p2.vendor_id = p.vendor_id)\`।
৩. একই সাবকোয়েরি \`CAST(ROUND(...))\` মুড়ে \`vendor_avg_cents\` কলামে।
৪. \`ORDER BY p.price_cents DESC, p.name\`।

## কোডে দেখি
\`\`\`sql
SELECT p.name, v.name AS vendor, p.price_cents,
       (SELECT CAST(ROUND(AVG(p2.price_cents)) AS INTEGER)
        FROM products p2 WHERE p2.vendor_id = p.vendor_id) AS vendor_avg_cents
FROM products p
JOIN vendors v ON v.id = p.vendor_id
WHERE p.price_cents > (SELECT AVG(p2.price_cents)
                       FROM products p2 WHERE p2.vendor_id = p.vendor_id)
ORDER BY p.price_cents DESC, p.name;
\`\`\`

## সাধারণ ভুল
correlation বাদ দিয়ে সব প্রোডাক্টের গ্লোবাল গড় বানানো; সাবকোয়েরিতে \`p2\`-এর বদলে \`p\` লিখে নিজের সারির সাথেই তুলনা; আউটপুটে \`ROUND\` না দিয়ে দশমিক প্রিন্ট; শর্তেও rounded গড় ব্যবহার করে ঠিক গড়ের-উপরে-না-ও প্রোডাক্টকে ফেলা।`,
    difficulty: "HARD",
    points: 250,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    category: "SQL Basics",
    subcategory: "Subqueries",
    referencePython: "",
    referenceSql: `SELECT p.name, v.name AS vendor, p.price_cents, (SELECT CAST(ROUND(AVG(p2.price_cents)) AS INTEGER) FROM products p2 WHERE p2.vendor_id = p.vendor_id) AS vendor_avg_cents FROM products p JOIN vendors v ON v.id = p.vendor_id WHERE p.price_cents > (SELECT AVG(p2.price_cents) FROM products p2 WHERE p2.vendor_id = p.vendor_id) ORDER BY p.price_cents DESC, p.name;`,
    tests: [
      {
        input: ``,
        expectedOutput: `27in Monitor	TechNest	1850000	717500
Denim Jacket	StyleHub	380000	246667
Clay Dinner Set	HomeCraft	320000	215000
Dune	BookBazar	210000	161667
Clean Code	BookBazar	180000	161667
Laptop Stand	GadgetPoint	150000	117500`,
        isSample: true
      },
      {
        input: `update products set price_cents=80000 where id=9;`,
        expectedOutput: `27in Monitor	TechNest	1850000	717500
Denim Jacket	StyleHub	380000	246667
Clay Dinner Set	HomeCraft	320000	215000
Dune	BookBazar	210000	161667
Clean Code	BookBazar	180000	161667
Wireless Mouse	GadgetPoint	85000	82500`,
        isSample: true
      },
      {
        input: `update products set price_cents=1850000 where id=12;`,
        expectedOutput: `27in Monitor	TechNest	1850000	1092500
Webcam	TechNest	1850000	1092500
Denim Jacket	StyleHub	380000	246667
Clay Dinner Set	HomeCraft	320000	215000
Dune	BookBazar	210000	161667
Clean Code	BookBazar	180000	161667
Laptop Stand	GadgetPoint	150000	117500`,
        isSample: false
      },
      {
        input: `update products set price_cents=100000 where id=13;`,
        expectedOutput: `27in Monitor	TechNest	1850000	717500
Denim Jacket	StyleHub	380000	246667
Clay Dinner Set	HomeCraft	320000	215000
Clean Code	BookBazar	180000	125000
Laptop Stand	GadgetPoint	150000	117500`,
        isSample: false
      },
      {
        input: `update products set price_cents=300000 where id=5;`,
        expectedOutput: `27in Monitor	TechNest	1850000	717500
Denim Jacket	StyleHub	380000	246667
Clay Dinner Set	HomeCraft	320000	215000
SQL Handbook	BookBazar	300000	230000
Laptop Stand	GadgetPoint	150000	117500`,
        isSample: false
      },
    ],
  },
  {
    slug: "sql-practice-subqueries-challenge",
    title: "The second price tier",
    statement: `বাজেট-শোকেস পেজে দরকার দ্বিতীয় দামের ধাপ: সর্বোচ্চ দাম বাদ দিলে যে দামটা সবচেয়ে বড় থাকে, সেটাই second tier। \`products\` থেকে ঠিক সেই দামের সব প্রোডাক্টের \`name\` ও \`price_cents\` বের করো; নাম অনুযায়ী সাজাও। সেই দামে একাধিক প্রোডাক্ট থাকলে সবগুলোই আসবে।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`name\`, \`price_cents\` — নাম অনুযায়ী; সবার দাম একই (second tier)।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## ধারণা
সর্বোচ্চটা বাদ দিয়ে বাকিদের সর্বোচ্চ — দুই স্তরের নেস্টেড \`MAX\`। ভেতরের সাবকোয়েরি বাজারের সর্বোচ্চ দাম, বাইরেরটা সেই দামের নিচের প্রোডাক্টদের সর্বোচ্চ — এটাই second tier। টপে টাই থাকলেও যুক্তি অটুট: দুই প্রোডাক্ট সর্বোচ্চ দামে থাকলে second tier তখনও তার নিচের দাম। কিন্তু \`ORDER BY price DESC LIMIT 1 OFFSET 1\`-এর মতো শর্টকাট বিপজ্জনক — টপে টাই বসলে কোনটা 'দ্বিতীয়' হবে তা অনির্দিষ্ট, আর একই দামের বাকি প্রোডাক্ট একেবারেই হারায়।

## ধাপে ধাপে
১. ভেতরে: \`(SELECT MAX(price_cents) FROM products)\` — সর্বোচ্চ দাম।
২. মাঝে: \`SELECT MAX(price_cents) FROM products WHERE price_cents < (ভেতরেরটা)\` — second tier-এর দাম।
৩. বাইরে: \`WHERE price_cents = (মাঝেরটা)\` — সেই দামের সবাই।
৪. \`ORDER BY name\`।

## কোডে দেখি
\`\`\`sql
SELECT name, price_cents
FROM products
WHERE price_cents = (
  SELECT MAX(price_cents) FROM products
  WHERE price_cents < (SELECT MAX(price_cents) FROM products)
)
ORDER BY name;
\`\`\`

## সাধারণ ভুল
\`LIMIT 1 OFFSET 1\` — টাই-এ ভুল, টাই না-থাকলেও একই দামের বাকি প্রোডাক্ট হারায়; মাঝের তুলনায় \`<=\` লিখে সর্বোচ্চ দামের প্রোডাক্টও টেনে আনা; এক স্তরের \`MAX\` দিয়েই সর্বোচ্চ-ই বের করে ফেলা; সাবকোয়েরিতে \`products\`-এর alias না দিয়ে বাইরের-ভেতরের টেবিল গুলিয়ে ফেলা।`,
    difficulty: "MEDIUM",
    points: 225,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    category: "SQL Basics",
    subcategory: "Subqueries",
    referencePython: "",
    referenceSql: `SELECT name, price_cents FROM products WHERE price_cents = (SELECT MAX(price_cents) FROM products WHERE price_cents < (SELECT MAX(price_cents) FROM products)) ORDER BY name;`,
    tests: [
      {
        input: ``,
        expectedOutput: `Mechanical Keyboard	450000`,
        isSample: true
      },
      {
        input: `update products set price_cents=450000 where id=12;`,
        expectedOutput: `Mechanical Keyboard	450000
Webcam	450000`,
        isSample: true
      },
      {
        input: `update products set price_cents=400000 where id=1;`,
        expectedOutput: `Mechanical Keyboard	400000`,
        isSample: false
      },
      {
        input: `update products set price_cents=1850000 where id=1; update products set price_cents=380000 where id=12;`,
        expectedOutput: `Denim Jacket	380000
Webcam	380000`,
        isSample: false
      },
      {
        input: `update products set price_cents=50000 where id=3;`,
        expectedOutput: `Denim Jacket	380000`,
        isSample: false
      },
    ],
  },
];
