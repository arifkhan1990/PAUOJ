import type { SeedProblem } from "./seed-problems";

export const SQL_PROBLEMS_ADVANCED_FUNNELS: SeedProblem[] = [
  {
    slug: "sql-adv-cart-conversion",
    title: "Cart conversion funnel",
    statement: `মার্কেটিং টিম জানতে চায় কার্টে রাখা পণ্য কতটুকু আসলে কেনা হচ্ছে। carts টেবিল থেকে কার্ট তৈরির মাস ধরে: মোট কার্ট, কতগুলো 'converted' হয়েছে, আর conversion শতাংশ (এক দশমিক পর্যন্ত) বের করো। মাস অনুযায়ী সাজাও।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`month\` (YYYY-MM), \`carts\`, \`converted\`, \`conversion_pct\`।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## কেন দরকার
ই-কমার্সের সবচেয়ে বড় লিক হলো কার্ট: মানুষ পণ্য কার্টে রাখে, তারপর অর্ধেক চলে যায়। কোন মাসে কার্ট বাড়ল কিন্তু রূপান্তর কমল—এই তথ্য ছাড়া মার্কেটিং টিম অন্ধকারে ঢিল ছোড়ে। ফানেল রিপোর্ট বলে দেয় কোথায় কাস্টমার হারাচ্ছে, আর কোন মাসের ক্যাম্পেইন সত্যিই কাজ করেছে।

## মূল ধারণা
\`created_at\` থেকে \`substr(created_at,1,7)\` দিয়ে মাস বানাও, তারপর মাস ধরে GROUP BY। 'converted' কার্ট গোনার জন্য \`SUM(CASE WHEN status='converted' THEN 1 ELSE 0 END)\`—একই GROUP BY-র ভেতরে মোট (\`COUNT(*)\`) আর রূপান্তর দুটোই বের হয়, আলাদা query লাগে না। শতাংশে \`100.0\` দিয়ে গুণ করো, নাহলে integer division ভগ্নাংশ কেটে শূন্য দেখায়।

## ধাপে ধাপে
১. \`substr(created_at,1,7)\` দিয়ে মাস বানাও।
২. GROUP BY month দিয়ে \`COUNT(*)\`—মোট কার্ট।
৩. CASE দিয়ে converted কার্ট গোনো।
৪. \`ROUND(100.0 * converted / carts, 1)\` শতাংশ, \`ORDER BY month\` দিয়ে সাজাও।

## কোডে দেখি
\`\`\`sql
SELECT substr(created_at, 1, 7) AS month,
       COUNT(*) AS carts,
       SUM(CASE WHEN status = 'converted' THEN 1 ELSE 0 END) AS converted,
       ROUND(100.0 * SUM(CASE WHEN status = 'converted' THEN 1 ELSE 0 END) / COUNT(*), 1) AS conversion_pct
FROM carts
GROUP BY month
ORDER BY month;
\`\`\`

## কমপ্লেক্সিটি
একটাই টেবিল-স্ক্যান O(n), গ্রুপ করায় O(g) (g = মাসের সংখ্যা)। JOIN নেই—তাই সবচেয়ে সস্তা ফানেল রিপোর্ট।

## সাধারণ ভুল
\`100\` দিয়ে গুণ করলে integer division-এ শতাংশ শূন্য হয়ে যায় (যেমন 3/5 → 0); \`updated_at\` ধরে গ্রুপ করা (কার্ট কোন মাসে তৈরি হয়েছে সেটা \`created_at\` বলে); \`WHERE status='converted'\` দিয়ে আগেই ফিল্টার করলে abandoned কার্ট হারিয়ে যায় আর conversion সবসময় ১০০% দেখায়; শতাংশে মোট কার্টের বদলে converted দিয়ে ভাগ করা।`,
    difficulty: "HARD",
    points: 320,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    premiumModuleSlug: "advanced-sql",
    category: "SQL Advanced",
    subcategory: "Analytics",
    referencePython: "",
    referenceSql: `SELECT substr(created_at,1,7) AS month, COUNT(*) AS carts,
       SUM(CASE WHEN status='converted' THEN 1 ELSE 0 END) AS converted,
       round(100.0 * SUM(CASE WHEN status='converted' THEN 1 ELSE 0 END) / COUNT(*), 1) AS conversion_pct
FROM carts GROUP BY month ORDER BY month;`,
    tests: [
      {
        input: ``,
        expectedOutput: `2026-09	1	1	100.0
2026-10	5	3	60.0
2026-11	2	0	0.0`,
        isSample: true
      },
      {
        input: `update carts set status='abandoned' where id in (3,5);`,
        expectedOutput: `2026-09	1	1	100.0
2026-10	5	1	20.0
2026-11	2	0	0.0`,
        isSample: true
      },
      {
        input: `update carts set created_at='2026-10-25 11:00', updated_at='2026-10-25 11:30' where id=6;`,
        expectedOutput: `2026-09	1	1	100.0
2026-10	6	3	50.0
2026-11	1	0	0.0`,
        isSample: false
      },
      {
        input: `update carts set status='converted' where id in (6,7);`,
        expectedOutput: `2026-09	1	1	100.0
2026-10	5	3	60.0
2026-11	2	2	100.0`,
        isSample: false
      },
      {
        input: `insert into carts (id,customer_id,status,created_at,updated_at) values (9,3,'abandoned','2026-11-12 09:00','2026-11-12 09:10');`,
        expectedOutput: `2026-09	1	1	100.0
2026-10	5	3	60.0
2026-11	3	0	0.0`,
        isSample: false
      },
    ],
  },
  {
    slug: "sql-adv-coupon-performance",
    title: "Coupon performance",
    statement: `মার্কেটিং টিম যাচাই করতে চায় কোন কুপন সত্যিই টাকা আনছে। paid/shipped অর্ডারে redeem হওয়া প্রতিটি কুপন কোডের জন্য: redemption-এর সংখ্যা, মোট ছাড় (সেন্টে), সেই অর্ডারগুলোর মোট রেভিনিউ (সেন্টে), আর গড় অর্ডারের মান (দুই দশমিক পর্যন্ত) বের করো। যেসব কুপন একবারও redeem হয়নি সেগুলো বাদ। বেশি রেভিনিউ আগে, টাই হলে কোড নাম অনুযায়ী।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`code\`, \`redemptions\`, \`discount_cents\`, \`revenue_cents\`, \`avg_order_cents\`।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## কেন দরকার
কুপন দুই ধারায় টানে: ছাড়ের টাকা খরচ হয়, আবার নতুন অর্ডারও আনে। শুধু "কতবার redeem হলো" দেখলে অর্ধেক ছবি—সেই redemption আসলে কত টাকার অর্ডার এনেছে সেটাই আসল প্রশ্ন। এই রিপোর্ট বলে দেয় কোন কুপন টাকা ওঠাচ্ছে আর কোনটা শুধু ছাড় দিয়ে লোকসান করছে।

## মূল ধারণা
সবচেয়ে বড় ফাঁদ: coupons → coupon_redemptions → orders → order_items এক JOIN-এ সরাসরি জোড়া লাগালে প্রতিটি order_item সারির জন্য redemption সারি repeat হয়। তখন \`SUM(cr.discount_cents)\` প্রতি আইটেমে একবার করে গোনা হয়ে ফুলে যায়, আর \`AVG\` হয়ে যায় গড় অর্ডারের বদলে গড় আইটেম। সমাধান: প্রথমে CTE-তে order_id ধরে অর্ডারের মোট বের করো (এক অর্ডার = এক সারি), শুধু তারপর redemptions-এর সাথে জোড়া লাগাও—তাহলে প্রতিটি redemption ঠিক একবারই গোনা হয়।

## ধাপে ধাপে
১. CTE order_revenue: orders ⋈ order_items, paid/shipped ফিল্টার, GROUP BY o.id।
২. coupons ⋈ coupon_redemptions ⋈ order_revenue জোড়া লাগাও (INNER JOIN—redeem না হওয়া কুপন বাদ)।
৩. GROUP BY c.id দিয়ে COUNT(*), SUM(discount), SUM(revenue), AVG(revenue)।
৪. ROUND করে \`ORDER BY revenue_cents DESC, code\` দিয়ে সাজাও।

## কোডে দেখি
\`\`\`sql
WITH order_revenue AS (
  SELECT o.id AS order_id,
         SUM(oi.quantity * oi.unit_price_cents) AS revenue_cents
  FROM orders o
  JOIN order_items oi ON oi.order_id = o.id
  WHERE o.status IN ('paid', 'shipped')
  GROUP BY o.id
)
SELECT c.code,
       COUNT(*) AS redemptions,
       SUM(cr.discount_cents) AS discount_cents,
       SUM(orev.revenue_cents) AS revenue_cents,
       ROUND(AVG(orev.revenue_cents), 2) AS avg_order_cents
FROM coupons c
JOIN coupon_redemptions cr ON cr.coupon_id = c.id
JOIN order_revenue orev ON orev.order_id = cr.order_id
GROUP BY c.id
ORDER BY revenue_cents DESC, c.code;
\`\`\`

## কমপ্লেক্সিটি
দুটি ছোট aggregation—প্রতিটি O(n log n)। সরাসরি বড় JOIN-এর চেয়ে সারিও কম: CTE-তে অর্ডার-সংখ্যক সারি, আইটেম-সংখ্যক নয়।

## সাধারণ ভুল
order_items-কে সরাসরি redemption-এ জুড়ে discount যোগ করা (প্রতি আইটেমে একবার করে গোনা হয়); \`AVG\`-কে item-সারিতে চালিয়ে গড় অর্ডারের বদলে গড় আইটেম বের হওয়া; paid/shipped ফিল্টার ভুলে যাওয়া—তখন cancelled অর্ডারের ছাড়ও খরচ হিসাবে গোনা হয়; ORDER BY-তে টাই-ব্রেক (\`code\`) না দিলে সমান রেভিনিউতে ক্রম অনির্দিষ্ট।`,
    difficulty: "HARD",
    points: 320,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    premiumModuleSlug: "advanced-sql",
    category: "SQL Advanced",
    subcategory: "Analytics",
    referencePython: "",
    referenceSql: `WITH order_revenue AS (
  SELECT o.id AS order_id, SUM(oi.quantity*oi.unit_price_cents) AS revenue_cents
  FROM orders o JOIN order_items oi ON oi.order_id=o.id
  WHERE o.status IN ('paid','shipped') GROUP BY o.id
)
SELECT c.code, COUNT(*) AS redemptions, SUM(cr.discount_cents) AS discount_cents,
       SUM(orev.revenue_cents) AS revenue_cents, round(AVG(orev.revenue_cents),2) AS avg_order_cents
FROM coupons c
JOIN coupon_redemptions cr ON cr.coupon_id=c.id
JOIN order_revenue orev ON orev.order_id=cr.order_id
GROUP BY c.id
ORDER BY revenue_cents DESC, c.code;`,
    tests: [
      {
        input: ``,
        expectedOutput: `TECH15	1	300000	2000000	2000000.0
FESTIVE500	2	100000	1270000	635000.0
FREESHIP	2	12000	985000	492500.0
WELCOME10	1	89000	890000	890000.0`,
        isSample: true
      },
      {
        input: `update orders set status='cancelled' where id in (3,6);`,
        expectedOutput: `TECH15	1	300000	2000000	2000000.0
WELCOME10	1	89000	890000	890000.0
FESTIVE500	1	50000	670000	670000.0
FREESHIP	1	6000	380000	380000.0`,
        isSample: true
      },
      {
        input: `insert into coupon_redemptions (id,coupon_id,order_id,customer_id,discount_cents,redeemed_at) values (7,1,8,2,18000,'2026-10-25');`,
        expectedOutput: `TECH15	1	300000	2000000	2000000.0
FESTIVE500	2	100000	1270000	635000.0
WELCOME10	2	107000	1070000	535000.0
FREESHIP	2	12000	985000	492500.0`,
        isSample: false
      },
      {
        input: `delete from coupon_redemptions where id=2;`,
        expectedOutput: `TECH15	1	300000	2000000	2000000.0
FREESHIP	2	12000	985000	492500.0
WELCOME10	1	89000	890000	890000.0
FESTIVE500	1	50000	670000	670000.0`,
        isSample: false
      },
      {
        input: `update orders set status='pending' where id in (7,10);`,
        expectedOutput: `TECH15	1	300000	2000000	2000000.0
WELCOME10	1	89000	890000	890000.0
FREESHIP	1	6000	605000	605000.0
FESTIVE500	1	50000	600000	600000.0`,
        isSample: false
      },
    ],
  },
];
