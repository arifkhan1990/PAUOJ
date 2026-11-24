import type { SeedProblem } from "./seed-problems";

export const SQL_PROBLEMS_PRACTICE_ADVANCED_A_WINDOW_THINKING: SeedProblem[] = [
  {
    slug: "sql-practice-window-thinking-easy",
    title: "Customer order sequence",
    statement: `CRM টিম প্রতিটি কাস্টমারের কেনাকাটার ধারাবাহিকতা দেখতে চায়। paid/shipped অর্ডারগুলো কাস্টমার ধরে তারিখের ক্রমে সাজিয়ে প্রতিটি অর্ডারের পাশে লেখো সেটি ওই কাস্টমারের কততম কেনাকাটা। আউটপুট কলাম: customer, order_id, ordered_at, order_seq। একই তারিখে একাধিক অর্ডার থাকলে ছোট order_id আগে ধরা হবে। কাস্টমারের নাম, তারপর order_seq অনুযায়ী সাজাও।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`customer\`, \`order_id\`, \`ordered_at\`, \`order_seq\`, কাস্টমারের নাম ও ক্রম অনুযায়ী।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## ধারণা
\`ROW_NUMBER() OVER (PARTITION BY customer ORDER BY ordered_at, order_id)\` প্রতি কাস্টমারের ভেতরে তারিখ-ক্রমে ১, ২, ৩… নম্বর বসায়। PARTITION BY বাদ দিলে সব কাস্টমার এক লাইনে দাঁড়িয়ে যায়, নম্বর গোলমাল হয়ে যায়।

## ধাপে ধাপে
১. orders থেকে paid/shipped ফিল্টার করো।
২. customers JOIN করে নাম আনো।
৩. window-এ PARTITION BY customer আর ORDER BY ordered_at, order_id (টাই-ব্রেক) দাও।
৪. ORDER BY name, order_seq দিয়ে নির্দিষ্ট ক্রমে সাজাও।

## কোডে দেখি
\`\`\`sql
SELECT cu.name AS customer, o.id AS order_id, o.ordered_at,
       ROW_NUMBER() OVER (PARTITION BY o.customer_id ORDER BY o.ordered_at, o.id) AS order_seq
FROM orders o
JOIN customers cu ON cu.id = o.customer_id
WHERE o.status IN ('paid', 'shipped')
ORDER BY cu.name, order_seq;
\`\`\`

## সাধারণ ভুল
PARTITION BY বাদ দেওয়া; ORDER BY-তে order_id টাই-ব্রেক না দিয়ে একই তারিখে অনির্দিষ্ট নম্বর; pending/cancelled অর্ডারও গুনে ফেলা।`,
    difficulty: "EASY",
    points: 200,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    premiumModuleSlug: "advanced-sql",
    category: "SQL Advanced",
    subcategory: "Window functions",
    referencePython: "",
    referenceSql: `SELECT cu.name AS customer, o.id AS order_id, o.ordered_at, ROW_NUMBER() OVER (PARTITION BY o.customer_id ORDER BY o.ordered_at, o.id) AS order_seq FROM orders o JOIN customers cu ON cu.id = o.customer_id WHERE o.status IN ('paid','shipped') ORDER BY cu.name, order_seq;`,
    tests: [
      {
        input: ``,
        expectedOutput: `Karim	8	2026-10-25	1
Mim	7	2026-10-22	1
Nusrat	3	2026-10-05	1
Nusrat	9	2026-10-28	2
Rahim	1	2026-10-01	1
Rahim	4	2026-10-10	2
Rahim	6	2026-10-20	3
Tanvir	10	2026-11-02	1`,
        isSample: true
      },
      {
        input: `update orders set status='cancelled' where id=4;`,
        expectedOutput: `Karim	8	2026-10-25	1
Mim	7	2026-10-22	1
Nusrat	3	2026-10-05	1
Nusrat	9	2026-10-28	2
Rahim	1	2026-10-01	1
Rahim	6	2026-10-20	2
Tanvir	10	2026-11-02	1`,
        isSample: true
      },
      {
        input: `insert into orders (id,customer_id,ordered_at,status) values (11,2,'2026-11-04','paid'); insert into order_items (id,order_id,product_id,quantity,unit_price_cents) values (16,11,4,1,180000);`,
        expectedOutput: `Karim	8	2026-10-25	1
Karim	11	2026-11-04	2
Mim	7	2026-10-22	1
Nusrat	3	2026-10-05	1
Nusrat	9	2026-10-28	2
Rahim	1	2026-10-01	1
Rahim	4	2026-10-10	2
Rahim	6	2026-10-20	3
Tanvir	10	2026-11-02	1`,
        isSample: false
      },
      {
        input: `update orders set status='pending' where id=1;`,
        expectedOutput: `Karim	8	2026-10-25	1
Mim	7	2026-10-22	1
Nusrat	3	2026-10-05	1
Nusrat	9	2026-10-28	2
Rahim	4	2026-10-10	1
Rahim	6	2026-10-20	2
Tanvir	10	2026-11-02	1`,
        isSample: false
      },
      {
        input: `insert into orders (id,customer_id,ordered_at,status) values (12,5,'2026-10-21','paid'); insert into order_items (id,order_id,product_id,quantity,unit_price_cents) values (17,12,7,1,120000);`,
        expectedOutput: `Karim	8	2026-10-25	1
Mim	12	2026-10-21	1
Mim	7	2026-10-22	2
Nusrat	3	2026-10-05	1
Nusrat	9	2026-10-28	2
Rahim	1	2026-10-01	1
Rahim	4	2026-10-10	2
Rahim	6	2026-10-20	3
Tanvir	10	2026-11-02	1`,
        isSample: false
      },
    ],
  },
  {
    slug: "sql-practice-window-thinking-medium",
    title: "Vendor revenue leaderboard",
    statement: `মার্কেটপ্লেসের পুরো ভেন্ডর লিডারবোর্ড বানাও। paid/shipped অর্ডার থেকে প্রতিটি ভেন্ডরের মোট রেভিনিউ (সেন্টে) বের করো—বিক্রি না থাকলে 0—আর RANK() দিয়ে র‍্যাংক দাও: সমান রেভিনিউতে একই র‍্যাংক, তার পরের র‍্যাংক ফাঁকা রেখে এগোবে। কেউ তালিকা থেকে বাদ যাবে না। আউটপুট কলাম: vendor, revenue_cents, revenue_rank। আগে র‍্যাংক, টাইলে ভেন্ডরের নাম অনুযায়ী সাজাও।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`vendor\`, \`revenue_cents\`, \`revenue_rank\`, র‍্যাংক ও নাম অনুযায়ী।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## ধারণা
সব ভেন্ডর লাগবে তাই ভিত্তি vendors টেবিল আর LEFT JOIN। paid/shipped শর্তটা WHERE-এ না দিয়ে SUM-এর CASE-এর ভেতরে দাও—তাহলে বিক্রিহীন ভেন্ডরের সারি বাঁচে আর মান 0 হয়। এরপর \`RANK() OVER (ORDER BY revenue_cents DESC)\`; টাই হলে একই র‍্যাংক পায়, পরের র‍্যাংক বাদ যায়।

## ধাপে ধাপে
১. vendors LEFT JOIN products LEFT JOIN order_items LEFT JOIN orders।
২. SUM(CASE WHEN status='paid'/'shipped' THEN amount ELSE 0 END), vendor ধরে GROUP BY।
৩. বাইরে RANK() ORDER BY revenue DESC।
৪. ORDER BY revenue_rank, vendor।

## কোডে দেখি
\`\`\`sql
WITH vendor_revenue AS (
  SELECT v.name AS vendor,
         SUM(CASE WHEN o.status IN ('paid','shipped') THEN oi.quantity * oi.unit_price_cents ELSE 0 END) AS revenue_cents
  FROM vendors v
  LEFT JOIN products p ON p.vendor_id = v.id
  LEFT JOIN order_items oi ON oi.product_id = p.id
  LEFT JOIN orders o ON o.id = oi.order_id
  GROUP BY v.id
)
SELECT vendor, revenue_cents,
       RANK() OVER (ORDER BY revenue_cents DESC) AS revenue_rank
FROM vendor_revenue
ORDER BY revenue_rank, vendor;
\`\`\`

## সাধারণ ভুল
WHERE-এ status ফিল্টার দিয়ে LEFT JOIN ভেঙে শূন্য-বিক্রি ভেন্ডর উধাও করা; RANK-এর বদলে ROW_NUMBER দিয়ে টাই-তে ভিন্ন র‍্যাংক; COALESCE/ELSE 0 না দিয়ে NULL রেখে দেওয়া।`,
    difficulty: "MEDIUM",
    points: 300,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    premiumModuleSlug: "advanced-sql",
    category: "SQL Advanced",
    subcategory: "Window functions",
    referencePython: "",
    referenceSql: `WITH vendor_revenue AS (SELECT v.name AS vendor, SUM(CASE WHEN o.status IN ('paid','shipped') THEN oi.quantity*oi.unit_price_cents ELSE 0 END) AS revenue_cents FROM vendors v LEFT JOIN products p ON p.vendor_id=v.id LEFT JOIN order_items oi ON oi.product_id=p.id LEFT JOIN orders o ON o.id=oi.order_id GROUP BY v.id) SELECT vendor, revenue_cents, RANK() OVER (ORDER BY revenue_cents DESC) AS revenue_rank FROM vendor_revenue ORDER BY revenue_rank, vendor;`,
    tests: [
      {
        input: ``,
        expectedOutput: `TechNest	3190000	1
StyleHub	1100000	2
HomeCraft	540000	3
BookBazar	465000	4
GadgetPoint	150000	5
PaperTrail	0	6`,
        isSample: true
      },
      {
        input: `update order_items set unit_price_cents=540000 where id=7;`,
        expectedOutput: `TechNest	3190000	1
StyleHub	1100000	2
GadgetPoint	540000	3
HomeCraft	540000	3
BookBazar	465000	5
PaperTrail	0	6`,
        isSample: true
      },
      {
        input: `update orders set status='cancelled' where id=4;`,
        expectedOutput: `TechNest	1340000	1
StyleHub	1100000	2
HomeCraft	540000	3
BookBazar	465000	4
GadgetPoint	0	5
PaperTrail	0	5`,
        isSample: false
      },
      {
        input: `update orders set status='cancelled' where id=4; update orders set status='cancelled' where id=7;`,
        expectedOutput: `StyleHub	1100000	1
TechNest	890000	2
BookBazar	465000	3
HomeCraft	320000	4
GadgetPoint	0	5
PaperTrail	0	5`,
        isSample: false
      },
      {
        input: `insert into products (id,vendor_id,category_id,name,price_cents,stock,rating) values (15,6,4,'Paper Notebook',5000,50,4.5); insert into orders (id,customer_id,ordered_at,status) values (11,3,'2026-11-06','paid'); insert into order_items (id,order_id,product_id,quantity,unit_price_cents) values (16,11,15,10,5000);`,
        expectedOutput: `TechNest	3190000	1
StyleHub	1100000	2
HomeCraft	540000	3
BookBazar	465000	4
GadgetPoint	150000	5
PaperTrail	50000	6`,
        isSample: false
      },
    ],
  },
];
