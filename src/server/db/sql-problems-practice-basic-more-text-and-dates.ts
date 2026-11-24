import type { SeedProblem } from "./seed-problems";

export const SQL_PROBLEMS_PRACTICE_BASIC_MORE_TEXT_AND_DATES: SeedProblem[] = [
  {
    slug: "sql-practice-text-and-dates-hard",
    title: "October coupon performance",
    statement: `মার্কেটিং অক্টোবরের কুপন-পারফরম্যান্স রিপোর্ট চায়। শুধু যেসব কুপন অক্টোবরে (১ অক্টোবর থেকে ৩১ অক্টোবর সারাদিন — অর্থাৎ ১ নভেম্বরের আগে) অন্তত একবার redeem হয়েছে: তাদের \`code\`, \`kind\`, কতবার redeem হয়েছে (\`redemptions\`) আর মোট ডিসকাউন্ট (\`discount_cents\`) বের করো। মোট ডিসকাউন্ট নিচের ক্রমে, সমান হলে কোড অনুযায়ী।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`code\`, \`kind\`, \`redemptions\`, \`discount_cents\` — ডিসকাউন্ট নিচের ক্রমে, টাই-এ \`code\`।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## ধারণা
JOIN + GROUP BY + তারিখ-বাউন্ডারি একসাথে। এক কুপনে অনেক redemption, তাই কুপন-প্রতি গোনায় \`GROUP BY c.id\`। তারিখ ছাঁকতে অর্ধ-খোলা ব্যবধান — \`>= '2026-10-01' AND < '2026-11-01'\` — দুই প্রান্তের দিন পুরো ঢোকে, সময়-ওয়ালা মান নিয়েও নিরাপদ। যে কুপন অক্টোবরে redeem-ই হয়নি সে তালিকায় আসবে না — INNER JOIN সেটা নিজেই সামলায়।

## ধাপে ধাপে
১. \`coupons c JOIN coupon_redemptions r ON r.coupon_id = c.id\`।
২. \`WHERE r.redeemed_at >= '2026-10-01' AND r.redeemed_at < '2026-11-01'\`।
৩. \`GROUP BY c.id\` — \`COUNT(r.id) AS redemptions\`, \`SUM(r.discount_cents) AS discount_cents\`।
৪. \`ORDER BY discount_cents DESC, c.code\`।

## কোডে দেখি
\`\`\`sql
SELECT c.code, c.kind,
       COUNT(r.id) AS redemptions,
       SUM(r.discount_cents) AS discount_cents
FROM coupons c
JOIN coupon_redemptions r ON r.coupon_id = c.id
WHERE r.redeemed_at >= '2026-10-01' AND r.redeemed_at < '2026-11-01'
GROUP BY c.id
ORDER BY discount_cents DESC, c.code;
\`\`\`

## সাধারণ ভুল
\`BETWEEN ... AND '2026-10-31'\` লিখে শেষ দিনের সময়-ওয়ালা মান হারানোর ঝুঁকি — অর্ধ-খোলা ব্যবধানই অভ্যাস করো; না-ব্যবহৃত কুপনকে ০-সহ আনতে LEFT JOIN করা — টাস্ক চায় শুধু redeem-হওয়া কুপন; \`COUNT(*)\` আর \`COUNT(r.id)\` এখানে একই, কিন্তু LEFT JOIN করলে ফারাক ধরা পড়ত — কলাম-নামে গোনাই শৃঙ্খলা; \`SUM\`-এর নাম \`discount_cents\` আর ORDER BY-র নাম না মিলিয়ে এলোমেলো ক্রম।`,
    difficulty: "HARD",
    points: 250,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    category: "SQL Basics",
    subcategory: "Date filtering",
    referencePython: "",
    referenceSql: `SELECT c.code, c.kind, COUNT(r.id) AS redemptions, SUM(r.discount_cents) AS discount_cents FROM coupons c JOIN coupon_redemptions r ON r.coupon_id = c.id WHERE r.redeemed_at >= '2026-10-01' AND r.redeemed_at < '2026-11-01' GROUP BY c.id ORDER BY discount_cents DESC, c.code;`,
    tests: [
      {
        input: ``,
        expectedOutput: `TECH15	percent	1	300000
FESTIVE500	fixed	2	100000
WELCOME10	percent	1	89000
FREESHIP	fixed	1	6000`,
        isSample: true
      },
      {
        input: `insert into coupon_redemptions (id,coupon_id,order_id,customer_id,discount_cents,redeemed_at) values (7,4,3,3,300000,'2026-10-15');`,
        expectedOutput: `TECH15	percent	2	600000
FESTIVE500	fixed	2	100000
WELCOME10	percent	1	89000
FREESHIP	fixed	1	6000`,
        isSample: true
      },
      {
        input: `update coupon_redemptions set redeemed_at='2026-11-02' where id=1;`,
        expectedOutput: `TECH15	percent	1	300000
FESTIVE500	fixed	2	100000
FREESHIP	fixed	1	6000`,
        isSample: false
      },
      {
        input: `insert into coupon_redemptions (id,coupon_id,order_id,customer_id,discount_cents,redeemed_at) values (8,3,10,6,6000,'2026-10-30');`,
        expectedOutput: `TECH15	percent	1	300000
FESTIVE500	fixed	2	100000
WELCOME10	percent	1	89000
FREESHIP	fixed	2	12000`,
        isSample: false
      },
      {
        input: `delete from coupon_redemptions where coupon_id=2;`,
        expectedOutput: `TECH15	percent	1	300000
WELCOME10	percent	1	89000
FREESHIP	fixed	1	6000`,
        isSample: false
      },
    ],
  },
  {
    slug: "sql-practice-text-and-dates-challenge",
    title: "Names that begin with it",
    statement: `সার্চ-অটোকমপ্লিট বানাচ্ছে ওয়েব টিম। \`products\` থেকে যেসব প্রোডাক্টের নাম শুরু হয় \`Table\` বা \`Wireless\` শব্দে — তাদের \`name\`, \`price_cents\`, \`stock\` বের করো; নাম অনুযায়ী সাজাও। খেয়াল: শব্দটা নামের শুরুতে থাকতে হবে — মাঝে বা শেষে থাকলে গ্রাহ্য হবে না।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`name\`, \`price_cents\`, \`stock\` — নাম অনুযায়ী।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## ধারণা
LIKE-এর \`%\` মানে 'যা-ই আসুক'। শুরুতে আঁকতে প্যাটার্ন শব্দ দিয়ে শুরু হয়ে \`%\` দিয়ে শেষ হবে: \`'Table%'\` — বাম প্রান্ত আঁটা। \`'%Table%'\` দিলে নামের যেকোনো জায়গায় ম্যাচ — শুরুর শর্ত হারিয়ে যায়। লুকানো টেস্টে এমন নাম আছে যেখানে শব্দটা শেষে বসেছে — \`'%Table%'\` তাদের ভুলভাবে তুলে আনবে।

## ধাপে ধাপে
১. \`WHERE name LIKE 'Table%' OR name LIKE 'Wireless%'\` — দুই anchor।
২. \`SELECT name, price_cents, stock\`।
৩. \`ORDER BY name\`।

## কোডে দেখি
\`\`\`sql
SELECT name, price_cents, stock
FROM products
WHERE name LIKE 'Table%' OR name LIKE 'Wireless%'
ORDER BY name;
\`\`\`

## সাধারণ ভুল
\`'%Table%'\` লিখে মাঝে/শেষে শব্দ-ওয়ালা নামও টেনে আনা; দুই শর্তের একটায় anchor ভুলে যাওয়া; \`^\` regex anchor মনে করা — LIKE-এ প্রান্ত বোঝায় প্যাটার্নের অবস্থান, কোনো চিহ্ন নয়; দুই শর্তের মাঝে \`AND\` দিয়ে দুইটাই-শুরু-হওয়া নাম খোঁজা (এমন নাম নেই, ফল খালি)।`,
    difficulty: "MEDIUM",
    points: 225,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    category: "SQL Basics",
    subcategory: "Text search",
    referencePython: "",
    referenceSql: `SELECT name, price_cents, stock FROM products WHERE name LIKE 'Table%' OR name LIKE 'Wireless%' ORDER BY name;`,
    tests: [
      {
        input: ``,
        expectedOutput: `Table Lamp	110000	18
Wireless Mouse	85000	3`,
        isSample: true
      },
      {
        input: `insert into products (id,vendor_id,category_id,name,price_cents,stock,rating) values (15,4,1,'Tablet Stand',130000,10,4.0);`,
        expectedOutput: `Table Lamp	110000	18
Tablet Stand	130000	10
Wireless Mouse	85000	3`,
        isSample: true
      },
      {
        input: `update products set name='Lamp Table' where id=11;`,
        expectedOutput: `Wireless Mouse	85000	3`,
        isSample: false
      },
      {
        input: `insert into products (id,vendor_id,category_id,name,price_cents,stock,rating) values (16,4,1,'Wireless Charging Pad',90000,15,4.1);`,
        expectedOutput: `Table Lamp	110000	18
Wireless Charging Pad	90000	15
Wireless Mouse	85000	3`,
        isSample: false
      },
      {
        input: `update products set name='Tablet Sleeve' where id=7;`,
        expectedOutput: `Table Lamp	110000	18
Tablet Sleeve	120000	25
Wireless Mouse	85000	3`,
        isSample: false
      },
    ],
  },
];
