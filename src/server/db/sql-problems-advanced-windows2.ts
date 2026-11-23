import type { SeedProblem } from "./seed-problems";

export const SQL_PROBLEMS_ADVANCED_WINDOWS2: SeedProblem[] = [
  {
    slug: "sql-adv-customer-lag",
    title: "Customer order gaps",
    statement: `CRM টিম জানতে চায় কোন কাস্টমার কত নিয়মিত ফিরে আসছে। paid/shipped অর্ডারগুলো প্রতি কাস্টমারের ভেতরে তারিখ অনুযায়ী সাজিয়ে প্রতিটি অর্ডারের আগের (previous) অর্ডারের তারিখ বের করো, আর দুই অর্ডারের মাঝে কত দিন ফাঁক (gap) ছিল সেটাও। আউটপুটে দেখাও: কাস্টমারের নাম, order_id, অর্ডারের তারিখ, অর্ডারের মোট (সেন্টে), আগের অর্ডারের তারিখ (previous_ordered_at), আর দিনের ফাঁক (days_since_previous)। কাস্টমারের প্রথম অর্ডারের ক্ষেত্রে শেষ দুটো NULL হবে। একই তারিখে একাধিক অর্ডার থাকলে ছোট order_id আগে ধরা হবে। কাস্টমারের নাম, তারপর তারিখ, তারপর order_id অনুযায়ী সাজাও।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`customer\`, \`order_id\`, \`ordered_at\` (YYYY-MM-DD), \`order_cents\`, \`previous_ordered_at\` (প্রথম অর্ডারে NULL), \`days_since_previous\` (প্রথম অর্ডারে NULL)।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## কেন দরকার
কেনাকাটার অভ্যাস বোঝার সবচেয়ে জোরালো সংকেত হলো দুই অর্ডারের মাঝের সময়। যে কাস্টমার আগে প্রতি ৭ দিনে কিনত, এখন ৩০ দিনে কিনছে—তার আগ্রহ কমছে, আর ঠিক সময়ে একটা কুপন পাঠালে ফেরানো যায়। এই gap analysis-ই churn prediction আর re-engagement ক্যাম্পেইনের ভিত্তি। প্রতিটি অর্ডারের পাশে তার আগের অর্ডারের তারিখ বসানো—এই কাজটা self-join দিয়ে করা যায়, কিন্তু window function-এর \`LAG\` এক লাইনেই সেটা করে দেয়, তাও শুধু একবার সাজিয়ে।

## মূল ধারণা
\`LAG(ordered_at) OVER (PARTITION BY customer ORDER BY ordered_at, order_id)\` বলে: প্রতিটি কাস্টমারের (partition) ভেতরে তারিখ-ক্রমে সাজিয়ে ঠিক এক ঘর আগের সারির ordered_at ধরে আনো। \`PARTITION BY\` না দিলে আগের সারিটা অন্য কাস্টমারের অর্ডার হয়ে যেত—gap তখন অর্থহীন। প্রথম অর্ডারের আগে কিছু নেই, তাই \`LAG\` NULL দেয়; সেটাই প্রত্যাশিত, COALESCE দিয়ে বানানোর দরকার নেই। দিনের পার্থক্যে \`julianday\` ব্যবহার করো: \`julianday(a) - julianday(b)\` দিনের দশমিক ব্যবধান দেয়, \`CAST(... AS INTEGER)\` পুরো দিনে নামায়। একই window একাধিক জায়গায় লাগলে \`WINDOW\` clause-এ নাম দিয়ে সংজ্ঞা একবার লেখো—এখানে lagged CTE-তে সেটাই হয়েছে: \`LAG(ordered_at) OVER w\`, আর নিচে \`WINDOW w AS (PARTITION BY customer ORDER BY ordered_at, order_id)\`।

## ধাপে ধাপে
১. CTE order_totals: orders ⋈ customers ⋈ order_items, paid/shipped ফিল্টার, GROUP BY o.id দিয়ে প্রতি অর্ডারের মোট।
২. CTE lagged: \`LAG(ordered_at) OVER w\` দিয়ে আগের তারিখ আনো, window-টির নাম দাও।
৩. বাইরের SELECT-এ \`julianday\`-এর ব্যবধান \`CAST\` করে days_since_previous বানাও।
৪. \`ORDER BY customer, ordered_at, order_id\`—নির্দিষ্ট ক্রম।

## কোডে দেখি
\`\`\`sql
WITH order_totals AS (
  SELECT cu.name AS customer, o.id AS order_id, o.ordered_at,
         SUM(oi.quantity * oi.unit_price_cents) AS order_cents
  FROM orders o
  JOIN customers cu ON cu.id = o.customer_id
  JOIN order_items oi ON oi.order_id = o.id
  WHERE o.status IN ('paid', 'shipped')
  GROUP BY o.id
),
lagged AS (
  SELECT customer, order_id, ordered_at, order_cents,
         LAG(ordered_at) OVER w AS previous_ordered_at
  FROM order_totals
  WINDOW w AS (PARTITION BY customer ORDER BY ordered_at, order_id)
)
SELECT customer, order_id, ordered_at, order_cents, previous_ordered_at,
       CAST(julianday(ordered_at) - julianday(previous_ordered_at) AS INTEGER) AS days_since_previous
FROM lagged
ORDER BY customer, ordered_at, order_id;
\`\`\`

## কমপ্লেক্সিটি
JOIN ও GROUP BY-তে O(n); প্রতিটি partition সাজাতে O(m log m); LAG প্রতি সারিতে ধ্রুব। Self-join পদ্ধতির O(n²) এর বদলে মোট O(n log n)।

## সাধারণ ভুল
\`PARTITION BY customer\` বাদ দিলে আগের সারি অন্য কাস্টমারের অর্ডার হয়ে যায়; window-এর ORDER BY-তে order_id টাই-ব্রেক না দিলে একই তারিখে ফল অনির্দিষ্ট; প্রথম সারির NULL ভুলে gap-এ 0 বসিয়ে হিসাব নষ্ট করা; \`julianday\` ছাড়া তারিখ-স্ট্রিং বিয়োগ করার চেষ্টা; বাইরের \`ORDER BY\` না দিলে আউটপুটের ক্রম অনির্দিষ্ট।`,
    difficulty: "HARD",
    points: 350,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    premiumModuleSlug: "advanced-sql",
    category: "SQL Advanced",
    subcategory: "Window functions",
    referencePython: "",
    referenceSql: `WITH order_totals AS (
  SELECT cu.name AS customer, o.id AS order_id, o.ordered_at,
         SUM(oi.quantity*oi.unit_price_cents) AS order_cents
  FROM orders o JOIN customers cu ON cu.id=o.customer_id
  JOIN order_items oi ON oi.order_id=o.id
  WHERE o.status IN ('paid','shipped') GROUP BY o.id
),
lagged AS (
  SELECT customer, order_id, ordered_at, order_cents,
         LAG(ordered_at) OVER w AS previous_ordered_at
  FROM order_totals
  WINDOW w AS (PARTITION BY customer ORDER BY ordered_at, order_id)
)
SELECT customer, order_id, ordered_at, order_cents, previous_ordered_at,
       CAST(julianday(ordered_at) - julianday(previous_ordered_at) AS INTEGER) AS days_since_previous
FROM lagged ORDER BY customer, ordered_at, order_id;`,
    tests: [
      {
        input: ``,
        expectedOutput: `Karim	8	2026-10-25	180000	\\N	\\N
Mim	7	2026-10-22	670000	\\N	\\N
Nusrat	3	2026-10-05	600000	\\N	\\N
Nusrat	9	2026-10-28	120000	2026-10-05	23
Rahim	1	2026-10-01	890000	\\N	\\N
Rahim	4	2026-10-10	2000000	2026-10-01	9
Rahim	6	2026-10-20	605000	2026-10-10	10
Tanvir	10	2026-11-02	380000	\\N	\\N`,
        isSample: true
      },
      {
        input: `update orders set ordered_at='2026-10-15' where id=6;`,
        expectedOutput: `Karim	8	2026-10-25	180000	\\N	\\N
Mim	7	2026-10-22	670000	\\N	\\N
Nusrat	3	2026-10-05	600000	\\N	\\N
Nusrat	9	2026-10-28	120000	2026-10-05	23
Rahim	1	2026-10-01	890000	\\N	\\N
Rahim	4	2026-10-10	2000000	2026-10-01	9
Rahim	6	2026-10-15	605000	2026-10-10	5
Tanvir	10	2026-11-02	380000	\\N	\\N`,
        isSample: true
      },
      {
        input: `update orders set status='shipped' where id=2;`,
        expectedOutput: `Karim	2	2026-10-03	180000	\\N	\\N
Karim	8	2026-10-25	180000	2026-10-03	22
Mim	7	2026-10-22	670000	\\N	\\N
Nusrat	3	2026-10-05	600000	\\N	\\N
Nusrat	9	2026-10-28	120000	2026-10-05	23
Rahim	1	2026-10-01	890000	\\N	\\N
Rahim	4	2026-10-10	2000000	2026-10-01	9
Rahim	6	2026-10-20	605000	2026-10-10	10
Tanvir	10	2026-11-02	380000	\\N	\\N`,
        isSample: false
      },
      {
        input: `update orders set ordered_at='2026-10-28' where id=4;`,
        expectedOutput: `Karim	8	2026-10-25	180000	\\N	\\N
Mim	7	2026-10-22	670000	\\N	\\N
Nusrat	3	2026-10-05	600000	\\N	\\N
Nusrat	9	2026-10-28	120000	2026-10-05	23
Rahim	1	2026-10-01	890000	\\N	\\N
Rahim	6	2026-10-20	605000	2026-10-01	19
Rahim	4	2026-10-28	2000000	2026-10-20	8
Tanvir	10	2026-11-02	380000	\\N	\\N`,
        isSample: false
      },
      {
        input: `insert into orders (id,customer_id,ordered_at,status) values (11,3,'2026-11-05','paid'); insert into order_items (id,order_id,product_id,quantity,unit_price_cents) values (16,11,13,1,210000);`,
        expectedOutput: `Karim	8	2026-10-25	180000	\\N	\\N
Mim	7	2026-10-22	670000	\\N	\\N
Nusrat	3	2026-10-05	600000	\\N	\\N
Nusrat	9	2026-10-28	120000	2026-10-05	23
Nusrat	11	2026-11-05	210000	2026-10-28	8
Rahim	1	2026-10-01	890000	\\N	\\N
Rahim	4	2026-10-10	2000000	2026-10-01	9
Rahim	6	2026-10-20	605000	2026-10-10	10
Tanvir	10	2026-11-02	380000	\\N	\\N`,
        isSample: false
      },
    ],
  },
  {
    slug: "sql-adv-ntile-products",
    title: "Category price quartiles",
    statement: `ক্যাটাগরি ম্যানেজার প্রতিটি ক্যাটাগরির পণ্যগুলোকে দাম অনুযায়ী ৪টি স্তরে (quartile) ভাগ করতে চান—কোনগুলো প্রিমিয়াম, কোনগুলো বাজেট। প্রতিটি ক্যাটাগরির ভেতরে পণ্যগুলো দাম বেশি থেকে কম ক্রমে সাজিয়ে NTILE(4) দিয়ে price_quartile বের করো: 1 মানে সেই ক্যাটাগরির সবচেয়ে দামি পণ্যের গ্রুপ, 4 মানে সবচেয়ে সস্তার গ্রুপ। দাম সমান হলে পণ্যের নাম অনুযায়ী সাজবে। আউটপুটে দেখাও: ক্যাটাগরি, পণ্যের নাম, দাম (সেন্টে), price_quartile। ক্যাটাগরি, তারপর quartile, তারপর দাম (বেশি থেকে কম), তারপর পণ্যের নাম অনুযায়ী সাজাও।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`category\`, \`product\`, \`price_cents\`, \`price_quartile\` (1–4)।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## কেন দরকার
একটা ক্যাটাগরিতে ২০টা পণ্য থাকলে সবগুলো একসাথে দেখা অর্থহীন—দরকার স্তরভাগ: কোনগুলো প্রিমিয়াম শেলফে যাবে, কোনগুলো ডিসকাউন্ট ক্যাম্পেইনে, কোনগুলোর দাম বসানো হয়েছে প্রতিযোগীর সাথে মিলিয়ে। percentile পণ্যকে দামের স্কেলে বসিয়ে দেয়, আর ব্যবসায়িক সিদ্ধান্ত নেওয়া হয় স্তর ধরে। NTILE সবচেয়ে সরল ভাগ-যন্ত্র: সারিগুলোকে সমান কয়েকটা বালতিতে ভাগ করে—কোয়ার্টাইল হলে ৪টা বালতি, ডেসাইল হলে ১০টা। প্রাইসিং টিমের 'টপ-কোয়ার্টাইল প্রিমিয়াম ধরো' ধরনের সিদ্ধান্ত এই ভাগের উপরই দাঁড়ায়।

## মূল ধারণা
\`NTILE(4) OVER (PARTITION BY category ORDER BY price_cents DESC)\` প্রতিটি ক্যাটাগরির ভেতরে দামের নামতা অনুযায়ী সারিগুলোকে ৪ ভাগে ফেলে: n টি সারিতে প্রতিটি ভাগে পড়ে n/4 এর পূর্ণ-সংখ্যা, আর ভাগশেষ সারিগুলো শুরুর ভাগগুলোতে একটা করে বেশি। ৬টি পণ্যে ভাগ হয় ২-২-১-১; ৭টিতে ২-২-২-১। মনে রাখো—NTILE বালতির নম্বর দেয়, ঠিক করে দেয় না কত শতাংশ সারি ওই দামের নিচে; সেই কাজ \`PERCENT_RANK()\`-এর, যা partition-এ 0 থেকে 1-এর ভগ্নাংশ বসায়। কোন সারি কোন বালতিতে পড়বে সেটা শুধু ORDER BY-র উপর নির্ভর করে—দামি গ্রুপ আগে চাইলে DESC লাগবেই, আর সমান দামে অনির্দিষ্টতা এড়াতে নাম টাই-ব্রেক দাও।

## ধাপে ধাপে
১. products ⋈ categories জোড়া লাগাও—ক্যাটাগরির নাম লাগবে।
২. \`NTILE(4) OVER (PARTITION BY c.name ORDER BY p.price_cents DESC, p.name)\` চালাও।
৩. বাইরের ORDER BY-তে ক্যাটাগরি, quartile, দাম নামতা, নাম—চারটাই দাও।
৪. কোনো ফিল্টার নেই—সব পণ্য আসবে।

## কোডে দেখি
\`\`\`sql
SELECT c.name AS category, p.name AS product, p.price_cents,
       NTILE(4) OVER (PARTITION BY c.name ORDER BY p.price_cents DESC, p.name) AS price_quartile
FROM products p
JOIN categories c ON c.id = p.category_id
ORDER BY category, price_quartile, p.price_cents DESC, p.name;
\`\`\`

## কমপ্লেক্সিটি
জোড়া O(n), প্রতিটি partition সাজাতে O(m log m)। NTILE নিজে ধ্রুব সময়ে বালতি-নম্বর বসায়। মোট O(n log n)।

## সাধারণ ভুল
\`ORDER BY price_cents ASC\` লিখে সবচেয়ে সস্তা পণ্যকে quartile 1 বানিয়ে ফেলা; PARTITION BY বাদ দিয়ে পুরো মার্কেটপ্লেস জুড়ে এক ভাগ বানানো; NTILE-এর ভাগ হুবহু সমান হবে ভেবে সারি-সংখ্যা মিলিয়ে না দেখা (ভাগ প্রায় সমান, শুরুর ভাগে বাকিটা); বাইরের ORDER BY-তে শুধু quartile রেখে দাম-নামতা বাদ দিলে ভেতরের ক্রম এলোমেলো হওয়া; সমান দামে নাম-টাই-ব্রেক ভুলে যাওয়া।`,
    difficulty: "HARD",
    points: 350,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    premiumModuleSlug: "advanced-sql",
    category: "SQL Advanced",
    subcategory: "Window functions",
    referencePython: "",
    referenceSql: `SELECT c.name AS category, p.name AS product, p.price_cents,
       NTILE(4) OVER (PARTITION BY c.name ORDER BY p.price_cents DESC, p.name) AS price_quartile
FROM products p JOIN categories c ON c.id=p.category_id
ORDER BY category, price_quartile, p.price_cents DESC, p.name;`,
    tests: [
      {
        input: ``,
        expectedOutput: `Books	Clean Code	180000	1
Books	SQL Handbook	95000	2
Electronics	27in Monitor	1850000	1
Electronics	Mechanical Keyboard	450000	1
Electronics	Webcam	350000	2
Electronics	USB-C Hub	220000	2
Electronics	Laptop Stand	150000	3
Electronics	Wireless Mouse	85000	4
Fashion	Leather Wallet	120000	1
Fiction	Dune	210000	1
Home	Clay Dinner Set	320000	1
Home	Table Lamp	110000	2
Men	Denim Jacket	380000	1
Men	Cotton Panjabi	240000	2`,
        isSample: true
      },
      {
        input: `update products set price_cents=90000 where id=9;`,
        expectedOutput: `Books	Clean Code	180000	1
Books	SQL Handbook	95000	2
Electronics	27in Monitor	1850000	1
Electronics	Mechanical Keyboard	450000	1
Electronics	Webcam	350000	2
Electronics	USB-C Hub	220000	2
Electronics	Laptop Stand	90000	3
Electronics	Wireless Mouse	85000	4
Fashion	Leather Wallet	120000	1
Fiction	Dune	210000	1
Home	Clay Dinner Set	320000	1
Home	Table Lamp	110000	2
Men	Denim Jacket	380000	1
Men	Cotton Panjabi	240000	2`,
        isSample: true
      },
      {
        input: `update products set price_cents=2000000 where id=12;`,
        expectedOutput: `Books	Clean Code	180000	1
Books	SQL Handbook	95000	2
Electronics	Webcam	2000000	1
Electronics	27in Monitor	1850000	1
Electronics	Mechanical Keyboard	450000	2
Electronics	USB-C Hub	220000	2
Electronics	Laptop Stand	150000	3
Electronics	Wireless Mouse	85000	4
Fashion	Leather Wallet	120000	1
Fiction	Dune	210000	1
Home	Clay Dinner Set	320000	1
Home	Table Lamp	110000	2
Men	Denim Jacket	380000	1
Men	Cotton Panjabi	240000	2`,
        isSample: false
      },
      {
        input: `insert into products values (15,1,1,'Bluetooth Speaker',275000,10,4.5);`,
        expectedOutput: `Books	Clean Code	180000	1
Books	SQL Handbook	95000	2
Electronics	27in Monitor	1850000	1
Electronics	Mechanical Keyboard	450000	1
Electronics	Webcam	350000	2
Electronics	Bluetooth Speaker	275000	2
Electronics	USB-C Hub	220000	3
Electronics	Laptop Stand	150000	3
Electronics	Wireless Mouse	85000	4
Fashion	Leather Wallet	120000	1
Fiction	Dune	210000	1
Home	Clay Dinner Set	320000	1
Home	Table Lamp	110000	2
Men	Denim Jacket	380000	1
Men	Cotton Panjabi	240000	2`,
        isSample: false
      },
      {
        input: `update products set price_cents=185000 where id=6;`,
        expectedOutput: `Books	Clean Code	180000	1
Books	SQL Handbook	95000	2
Electronics	27in Monitor	1850000	1
Electronics	Mechanical Keyboard	450000	1
Electronics	Webcam	350000	2
Electronics	USB-C Hub	220000	2
Electronics	Laptop Stand	150000	3
Electronics	Wireless Mouse	85000	4
Fashion	Leather Wallet	120000	1
Fiction	Dune	210000	1
Home	Clay Dinner Set	320000	1
Home	Table Lamp	110000	2
Men	Denim Jacket	380000	1
Men	Cotton Panjabi	185000	2`,
        isSample: false
      },
    ],
  },
];
