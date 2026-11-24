import type { SeedProblem } from "./seed-problems";

export const SQL_PROBLEMS_PRACTICE_ADVANCED_MORE_CAPSTONE: SeedProblem[] = [
  {
    slug: "sql-practice-capstone-hard",
    title: "Vendor 360 with return rate",
    statement: `প্রতিটি ভেন্ডরের পূর্ণ স্কোরকার্ড: মোট প্রোডাক্ট সংখ্যা, paid/shipped অর্ডারে বিক্রীত ইউনিট ও রেভিনিউ (সেন্টে), approved রিটার্নে ফেরত যাওয়া ইউনিট, আর return_rate = approved রিটার্ন ইউনিট / বিক্রীত ইউনিট (শতকরা, ১ দশমিক)। একটিও প্রোডাক্ট বা বিক্রি না থাকা ভেন্ডরও তালিকায় থাকবে — সংখ্যাগুলো 0 আর হার NULL (বিক্রি শূন্য হলে ভাগই অর্থহীন)। আউটপুট কলাম: vendor, products, units_sold, revenue_cents, returned_units, return_rate_pct। আগে revenue_cents (বড় থেকে ছোট), টাইলে ভেন্ডরের নাম অনুযায়ী সাজাও।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`vendor\`, \`products\`, \`units_sold\`, \`revenue_cents\`, \`returned_units\`, \`return_rate_pct\`। বিক্রি শূন্যে \`return_rate_pct\` \`\\N\`।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## ধারণা
চার টেবিল-জগৎ এক রিপোর্টে: products (প্রোডাক্ট গুনতে), order_items+orders (বিক্রি), returns (ফেরত)। প্রতিটি সাব-হিসাব আলাদা CTE-তে ভেন্ডর ধরে গুছিয়ে নাও, তারপর vendors LEFT JOIN সবাইকে — তাহলে PaperTrail-এর মতো খালি ভেন্ডরও বাঁচে। হারের ভাগে NULLIF দিয়ে শূন্য-ভাগ থেকে জিগিয়ে নাও।

## ধাপে ধাপে
১. vendor_sales: paid/shipped অর্ডারের আইটেম ধরে ইউনিট ও রেভিনিউ।
২. vendor_returns: approved রিটার্নের ইউনিট।
৩. vendors LEFT JOIN products (COUNT(p.id)), বাকি CTE-গুলোও LEFT JOIN।
৪. 100*returned/NULLIF(units_sold,0), ORDER BY revenue DESC, vendor।

## কোডে দেখি
\`\`\`sql
WITH vendor_sales AS (
  SELECT p.vendor_id, SUM(oi.quantity) AS units_sold,
         SUM(oi.quantity*oi.unit_price_cents) AS revenue_cents
  FROM order_items oi JOIN orders o ON o.id=oi.order_id
  JOIN products p ON p.id=oi.product_id
  WHERE o.status IN ('paid','shipped') GROUP BY p.vendor_id),
vendor_returns AS (
  SELECT p.vendor_id,
         SUM(CASE WHEN r.status='approved' THEN r.quantity ELSE 0 END) AS returned_units
  FROM returns r JOIN order_items oi ON oi.id=r.order_item_id
  JOIN products p ON p.id=oi.product_id
  GROUP BY p.vendor_id)
SELECT v.name AS vendor, COUNT(p.id) AS products,
       COALESCE(vs.units_sold,0) AS units_sold,
       COALESCE(vs.revenue_cents,0) AS revenue_cents,
       COALESCE(vr.returned_units,0) AS returned_units,
       ROUND(100.0*COALESCE(vr.returned_units,0)/NULLIF(COALESCE(vs.units_sold,0),0), 1) AS return_rate_pct
FROM vendors v
LEFT JOIN products p ON p.vendor_id=v.id
LEFT JOIN vendor_sales vs ON vs.vendor_id=v.id
LEFT JOIN vendor_returns vr ON vr.vendor_id=v.id
GROUP BY v.id, v.name ORDER BY revenue_cents DESC, v.name;
\`\`\`

## সাধারণ ভুল
returns-এর pending/rejected-ও ফেরত ইউনিটে গুনে হার ফুলিয়ে ফেলা; vendors না ধরে sales থেকে শুরু করা — PaperTrail-এর মতো বিক্রিহীন ভেন্ডর রিপোর্ট থেকে উধাও; units_sold=0 হলে সরাসরি ভাগ করে 0.0 দেখানো — NULL আসলেই, কারণ হারের ভিত্তিই নেই; COUNT(p.id)-এর জায়গায় COUNT(*) লিখে খালি ভেন্ডরে 1 দেখানো।`,
    difficulty: "HARD",
    points: 320,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    premiumModuleSlug: "advanced-sql",
    category: "SQL Advanced",
    subcategory: "Capstone",
    referencePython: "",
    referenceSql: `WITH vendor_sales AS (
  SELECT p.vendor_id, SUM(oi.quantity) AS units_sold,
         SUM(oi.quantity*oi.unit_price_cents) AS revenue_cents
  FROM order_items oi JOIN orders o ON o.id=oi.order_id
  JOIN products p ON p.id=oi.product_id
  WHERE o.status IN ('paid','shipped') GROUP BY p.vendor_id),
vendor_returns AS (
  SELECT p.vendor_id,
         SUM(CASE WHEN r.status='approved' THEN r.quantity ELSE 0 END) AS returned_units
  FROM returns r JOIN order_items oi ON oi.id=r.order_item_id
  JOIN products p ON p.id=oi.product_id
  GROUP BY p.vendor_id)
SELECT v.name AS vendor, COUNT(p.id) AS products,
       COALESCE(vs.units_sold,0) AS units_sold,
       COALESCE(vs.revenue_cents,0) AS revenue_cents,
       COALESCE(vr.returned_units,0) AS returned_units,
       ROUND(100.0*COALESCE(vr.returned_units,0)/NULLIF(COALESCE(vs.units_sold,0),0), 1) AS return_rate_pct
FROM vendors v
LEFT JOIN products p ON p.vendor_id=v.id
LEFT JOIN vendor_sales vs ON vs.vendor_id=v.id
LEFT JOIN vendor_returns vr ON vr.vendor_id=v.id
GROUP BY v.id, v.name ORDER BY revenue_cents DESC, v.name;`,
    tests: [
      {
        input: ``,
        expectedOutput: `TechNest	4	5	3190000	1	20.0
StyleHub	3	5	1100000	0	0.0
HomeCraft	2	3	540000	1	33.3
BookBazar	3	4	465000	0	0.0
GadgetPoint	2	1	150000	0	0.0
PaperTrail	0	0	0	0	\\N`,
        isSample: true
      },
      {
        input: `update returns set status='rejected' where id=1;`,
        expectedOutput: `TechNest	4	5	3190000	0	0.0
StyleHub	3	5	1100000	0	0.0
HomeCraft	2	3	540000	1	33.3
BookBazar	3	4	465000	0	0.0
GadgetPoint	2	1	150000	0	0.0
PaperTrail	0	0	0	0	\\N`,
        isSample: true
      },
      {
        input: `insert into products (id,vendor_id,category_id,name,price_cents,stock,rating) values (15,6,4,'Paper Notebook',30000,50,4.2); insert into orders (id,customer_id,ordered_at,status) values (11,2,'2026-11-04','paid'); insert into order_items (id,order_id,product_id,quantity,unit_price_cents) values (16,11,15,2,30000);`,
        expectedOutput: `TechNest	4	5	3190000	1	20.0
StyleHub	3	5	1100000	0	0.0
HomeCraft	2	3	540000	1	33.3
BookBazar	3	4	465000	0	0.0
GadgetPoint	2	1	150000	0	0.0
PaperTrail	1	2	60000	0	0.0`,
        isSample: false
      },
      {
        input: `update returns set status='pending' where id=2;`,
        expectedOutput: `TechNest	4	5	3190000	1	20.0
StyleHub	3	5	1100000	0	0.0
HomeCraft	2	3	540000	0	0.0
BookBazar	3	4	465000	0	0.0
GadgetPoint	2	1	150000	0	0.0
PaperTrail	0	0	0	0	\\N`,
        isSample: false
      },
      {
        input: `update orders set status='cancelled' where id=1;`,
        expectedOutput: `TechNest	4	2	2300000	1	50.0
StyleHub	3	5	1100000	0	0.0
HomeCraft	2	3	540000	1	33.3
BookBazar	3	4	465000	0	0.0
GadgetPoint	2	1	150000	0	0.0
PaperTrail	0	0	0	0	\\N`,
        isSample: false
      },
    ],
  },
  {
    slug: "sql-practice-capstone-challenge",
    title: "Churn risk register",
    statement: `রিটেনশন টিম ঝুঁকিপূর্ণ কাস্টমার চিহ্নিত করবে। বেঞ্চমার্ক হলো সার্বিক সর্বশেষ paid/shipped অর্ডারের তারিখ (ডেটার মধ্যে সবচেয়ে নতুন)। প্রতিটি কাস্টমারের জন্য বের করো: তার সর্বশেষ paid/shipped অর্ডারের তারিখ, বেঞ্চমার্ক থেকে কত দিন পেছনে আছে, lifetime খরচ (সব paid/shipped অর্ডারের আইটেম-যোগফল, সেন্টে) আর status: কোনো paid অর্ডারই নেই হলে \`never_paid\`, সর্বশেষ অর্ডার বেঞ্চমার্কের চেয়ে ঠিক ৩০ দিনের বেশি পুরনো হলে \`churned\`, নাহলে \`active\`। সব কাস্টমার তালিকায় আসবে। আউটপুট কলাম: customer, last_paid_at, days_since_last, ltv_cents, status। status, তারপর নাম অনুযায়ী সাজাও।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`customer\`, \`last_paid_at\`, \`days_since_last\`, \`ltv_cents\`, \`status\`। never_paid-তে \`last_paid_at\`, \`days_since_last\` \`\\N\`, \`ltv_cents\` 0।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## ধারণা
তিন আলাদা হিসাব তিন CTE-তে: কাস্টমারের সর্বশেষ paid অর্ডার, পুরো ডেটার সর্বশেষ তারিখ (একক সারি, CROSS JOIN-এ সবার সাথে জোড়া যায়), আর কাস্টমারের LTV। NULL-হ্যান্ডলিং-ই আসল পরীক্ষা: never_paid কাস্টমারের paid_orders NULL — COALESCE না দিলে CASE ভুল শাখায় পড়ে তাকে active বানিয়ে দেয়।

## ধাপে ধাপে
১. paid: শুধু paid/shipped অর্ডার।
২. last_paid: কাস্টমার ধরে MAX(ordered_at) ও COUNT(*)।
৩. latest: পুরো সেটের MAX(ordered_at), CROSS JOIN দিয়ে সব কাস্টমারে বসাও।
৪. status: COALESCE(paid_orders,0)=0 → never_paid; julianday পার্থক্য > 30 → churned; নাহলে active।

## কোডে দেখি
\`\`\`sql
WITH paid AS (
  SELECT o.id, o.customer_id, o.ordered_at
  FROM orders o WHERE o.status IN ('paid','shipped')),
last_paid AS (
  SELECT customer_id, MAX(ordered_at) AS last_at, COUNT(*) AS paid_orders
  FROM paid GROUP BY customer_id),
latest AS (SELECT MAX(ordered_at) AS latest_at FROM paid),
ltv AS (
  SELECT o.customer_id, SUM(oi.quantity*oi.unit_price_cents) AS ltv_cents
  FROM paid o JOIN order_items oi ON oi.order_id=o.id GROUP BY o.customer_id)
SELECT cu.name AS customer, lp.last_at AS last_paid_at,
       CAST(julianday(latest.latest_at) - julianday(lp.last_at) AS INTEGER) AS days_since_last,
       COALESCE(ltv.ltv_cents,0) AS ltv_cents,
       CASE WHEN COALESCE(lp.paid_orders,0) = 0 THEN 'never_paid'
            WHEN julianday(latest.latest_at) - julianday(lp.last_at) > 30 THEN 'churned'
            ELSE 'active' END AS status
FROM customers cu
LEFT JOIN last_paid lp ON lp.customer_id = cu.id
CROSS JOIN latest
LEFT JOIN ltv ON ltv.customer_id = cu.id
ORDER BY status, customer;
\`\`\`

## সাধারণ ভুল
\`paid_orders = 0\` দিয়ে পরীক্ষা করা — LEFT JOIN-এ মান NULL, শাখায় ঢোকেই না; ঠিক ৩০ দিন পেছনে থাকলে churned নয় (শর্ত > 30, বাউন্ডারি সহ); সাইনআপ তারিখ বা ক্যালেন্ডারের “আজকের” তারিখ বেঞ্চমার্ক ধরা — ডেটার নিজের সর্বশেষ তারিখই বেঞ্চমার্ক; বিশেষণ-ক্রমে status সাজালে active < churned < never_paid ঠিকঠাক গুছিয়ে যায় — ORDER BY status যথেষ্ট।`,
    difficulty: "HARD",
    points: 340,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    premiumModuleSlug: "advanced-sql",
    category: "SQL Advanced",
    subcategory: "Capstone",
    referencePython: "",
    referenceSql: `WITH paid AS (
  SELECT o.id, o.customer_id, o.ordered_at
  FROM orders o WHERE o.status IN ('paid','shipped')),
last_paid AS (
  SELECT customer_id, MAX(ordered_at) AS last_at, COUNT(*) AS paid_orders
  FROM paid GROUP BY customer_id),
latest AS (SELECT MAX(ordered_at) AS latest_at FROM paid),
ltv AS (
  SELECT o.customer_id, SUM(oi.quantity*oi.unit_price_cents) AS ltv_cents
  FROM paid o JOIN order_items oi ON oi.order_id=o.id GROUP BY o.customer_id)
SELECT cu.name AS customer, lp.last_at AS last_paid_at,
       CAST(julianday(latest.latest_at) - julianday(lp.last_at) AS INTEGER) AS days_since_last,
       COALESCE(ltv.ltv_cents,0) AS ltv_cents,
       CASE WHEN COALESCE(lp.paid_orders,0) = 0 THEN 'never_paid'
            WHEN julianday(latest.latest_at) - julianday(lp.last_at) > 30 THEN 'churned'
            ELSE 'active' END AS status
FROM customers cu
LEFT JOIN last_paid lp ON lp.customer_id = cu.id
CROSS JOIN latest
LEFT JOIN ltv ON ltv.customer_id = cu.id
ORDER BY status, customer;`,
    tests: [
      {
        input: ``,
        expectedOutput: `Karim	2026-10-25	8	180000	active
Mim	2026-10-22	11	670000	active
Nusrat	2026-10-28	5	720000	active
Rahim	2026-10-20	13	3495000	active
Tanvir	2026-11-02	0	380000	active
Sajid	\\N	\\N	0	never_paid`,
        isSample: true
      },
      {
        input: `update orders set ordered_at='2026-09-01' where id=10;`,
        expectedOutput: `Karim	2026-10-25	3	180000	active
Mim	2026-10-22	6	670000	active
Nusrat	2026-10-28	0	720000	active
Rahim	2026-10-20	8	3495000	active
Tanvir	2026-09-01	57	380000	churned
Sajid	\\N	\\N	0	never_paid`,
        isSample: true
      },
      {
        input: `insert into customers (id,name,city,signup_date) values (7,'Farhana','Sylhet','2026-11-05');`,
        expectedOutput: `Karim	2026-10-25	8	180000	active
Mim	2026-10-22	11	670000	active
Nusrat	2026-10-28	5	720000	active
Rahim	2026-10-20	13	3495000	active
Tanvir	2026-11-02	0	380000	active
Farhana	\\N	\\N	0	never_paid
Sajid	\\N	\\N	0	never_paid`,
        isSample: false
      },
      {
        input: `update orders set status='paid' where id=5;`,
        expectedOutput: `Karim	2026-10-25	8	180000	active
Mim	2026-10-22	11	670000	active
Nusrat	2026-10-28	5	720000	active
Rahim	2026-10-20	13	3495000	active
Sajid	2026-10-12	21	170000	active
Tanvir	2026-11-02	0	380000	active`,
        isSample: false
      },
      {
        input: `update orders set ordered_at='2026-08-15' where id in (1,4,6);`,
        expectedOutput: `Karim	2026-10-25	8	180000	active
Mim	2026-10-22	11	670000	active
Nusrat	2026-10-28	5	720000	active
Tanvir	2026-11-02	0	380000	active
Rahim	2026-08-15	79	3495000	churned
Sajid	\\N	\\N	0	never_paid`,
        isSample: false
      },
    ],
  },
];
