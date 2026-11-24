import type { SeedProblem } from "./seed-problems";

export const SQL_PROBLEMS_ADVANCED_JSON: SeedProblem[] = [
  {
    slug: "sql-adv-brand-warranty",
    title: "Brand warranty report",
    statement: `ShopSphere-এর product_attributes টেবিলে প্রতিটি প্রোডাক্টের বাড়তি তথ্য attributes কলামে JSON আকারে থাকে। json_extract দিয়ে সেই JSON থেকে brand ($.brand) আর warranty_months ($.warranty_months) পড়ে প্রতিটি ব্র্যান্ডের জন্য বের করো: মোট কতটি প্রোডাক্ট আর গড়ে কত মাস ওয়ারেন্টি (এক দশমিক)। আউটপুট কলাম: brand, products, avg_warranty_months। আগে যে ব্র্যান্ডে প্রোডাক্ট বেশি সে আগে, সমান হলে ব্র্যান্ডের নাম অনুযায়ী সাজাও।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`brand\`, \`products\`, \`avg_warranty_months\` (এক দশমিক)।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## কেন দরকার
মার্কেটপ্লেসে প্রতিটি ক্যাটাগরির নিজস্ব বৈশিষ্ট্য—কিবোর্ডের connectivity, মনিটরের panel, বইয়ের format। প্রতিটি বৈশিষ্ট্যের জন্য আলাদা কলাম বানাতে থাকলে টেবিল কোথায় গিয়ে থামবে বলা যায় না, তাই ShopSphere সব বাড়তি তথ্য product_attributes-এর attributes কলামে JSON আকারে রাখে। কিন্তু সেই JSON পড়তে না পারলে support টিম warranty-র প্রশ্নের উত্তরও দিতে পারে না, marketing টিম ব্র্যান্ড-ভিত্তিক রিপোর্টও বানাতে পারে না। SQL-এর ভিতরেই JSON পড়া—এই সমস্যার আসল দক্ষতা সেটাই।

## মূল ধারণা
json_extract(attributes, '$.brand') — প্রথম আর্গুমেন্ট JSON টেক্সট, দ্বিতীয়টি path। $ মানে JSON-এর root, $.brand মানে root object-এর brand key। ফলটি সাধারণ SQL ভ্যালুর মতোই কাজ করে—GROUP BY-তে, AVG-এ, WHERE-এ, ORDER BY-তে সবখানে। গড়ে ROUND(AVG(...), 1) দিলে এক দশমিকে ছাঁটা হয়। মনে রাখো—product_attributes-এ brand নামে আলাদা কলামও আছে, কিন্তু এখানে JSON-ই source of truth; কেউ কলাম আপডেট করে JSON ভুলে যেতে পারে, তাই হিসাব সবসময় JSON থেকে করো।

## ধাপে ধাপে
১. product_attributes থেকে json_extract দিয়ে brand আর warranty_months বের করো।
২. JSON ব্র্যান্ড ধরে GROUP BY দাও।
৩. COUNT(*) দিয়ে প্রোডাক্ট সংখ্যা, ROUND(AVG(...), 1) দিয়ে গড় ওয়ারেন্টি।
৪. ORDER BY products DESC, brand — টাই-ব্রেকার ছাড়া ক্রম অনির্দিষ্ট থাকে।

## কোডে দেখি
\`\`\`sql
SELECT json_extract(pa.attributes, '$.brand') AS brand,
       COUNT(*) AS products,
       ROUND(AVG(CAST(json_extract(pa.attributes, '$.warranty_months') AS REAL)), 1) AS avg_warranty_months
FROM product_attributes pa
GROUP BY json_extract(pa.attributes, '$.brand')
ORDER BY products DESC, brand;
\`\`\`

## কমপ্লেক্সিটি
\`O(n log n)\` — গ্রুপ করা আর সাজানো, ছোট টেবিলে দুটোই সস্তা।

## সাধারণ ভুল
path-এ $ বাদ দেওয়া (তখন NULL আসে); brand কলাম আর JSON একই ভেবে কলাম থেকে গ্রুপ করা; ROUND ছাড়া ভগ্নাংশ রেখে দেওয়া; ORDER BY-তে শুধু products DESC দিয়ে টাই-ব্রেকার ভুলে যাওয়া।`,
    difficulty: "HARD",
    points: 350,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    premiumModuleSlug: "advanced-sql",
    category: "SQL Advanced",
    subcategory: "JSON & inventory",
    referencePython: "",
    referenceSql: `SELECT json_extract(pa.attributes, '$.brand') AS brand,
       COUNT(*) AS products,
       ROUND(AVG(CAST(json_extract(pa.attributes, '$.warranty_months') AS REAL)), 1) AS avg_warranty_months
FROM product_attributes pa
GROUP BY json_extract(pa.attributes, '$.brand')
ORDER BY products DESC, brand;`,
    tests: [
      {
        input: ``,
        expectedOutput: `Logitech	3	16.0
Aarong	1	0.0
Ace Books	1	0.0
Anker	1	18.0
ClayCraft	1	0.0
Fossil	1	12.0
Levis	1	0.0
OReilly	1	0.0
Philips	1	24.0
Prentice Hall	1	0.0
Samsung	1	36.0
Ugreen	1	24.0`,
        isSample: true
      },
      {
        input: `update product_attributes set warranty_months=36, attributes=json_set(attributes,'$.warranty_months',36) where product_id=1;`,
        expectedOutput: `Logitech	3	20.0
Aarong	1	0.0
Ace Books	1	0.0
Anker	1	18.0
ClayCraft	1	0.0
Fossil	1	12.0
Levis	1	0.0
OReilly	1	0.0
Philips	1	24.0
Prentice Hall	1	0.0
Samsung	1	36.0
Ugreen	1	24.0`,
        isSample: true
      },
      {
        input: `insert into products values (15,1,1,'Gaming Mousepad',60000,10,4.5); insert into product_attributes values (15,'Logitech','black',12,'{"brand":"Logitech","color":"black","warranty_months":12}');`,
        expectedOutput: `Logitech	4	15.0
Aarong	1	0.0
Ace Books	1	0.0
Anker	1	18.0
ClayCraft	1	0.0
Fossil	1	12.0
Levis	1	0.0
OReilly	1	0.0
Philips	1	24.0
Prentice Hall	1	0.0
Samsung	1	36.0
Ugreen	1	24.0`,
        isSample: false
      },
      {
        input: `delete from products where id=12;`,
        expectedOutput: `Logitech	2	18.0
Aarong	1	0.0
Ace Books	1	0.0
Anker	1	18.0
ClayCraft	1	0.0
Fossil	1	12.0
Levis	1	0.0
OReilly	1	0.0
Philips	1	24.0
Prentice Hall	1	0.0
Samsung	1	36.0
Ugreen	1	24.0`,
        isSample: false
      },
      {
        input: `update product_attributes set attributes=json_set(attributes,'$.brand','Anker') where product_id=9;`,
        expectedOutput: `Logitech	3	16.0
Anker	2	21.0
Aarong	1	0.0
Ace Books	1	0.0
ClayCraft	1	0.0
Fossil	1	12.0
Levis	1	0.0
OReilly	1	0.0
Philips	1	24.0
Prentice Hall	1	0.0
Samsung	1	36.0`,
        isSample: false
      },
    ],
  },
  {
    slug: "sql-adv-stock-reconciliation",
    title: "Stock reconciliation",
    statement: `গুদামের হিসাব দুই খাতায়: products টেবিলের stock কলামে এখনকার স্টক, আর inventory_movements-এ প্রতিটি purchase/sale/return/adjustment-এর signed quantity লগ। যেসব প্রোডাক্টের অন্তত একটি movement আছে শুধু সেগুলোর জন্য মিলিয়ে দেখো—products.stock-এর সাথে সেই প্রোডাক্টের সব movement-এর যোগফল মিলছে কি না। আউটপুট কলাম: product, stock, movement_net, difference (= stock − movement_net)। আগে অমিলের বিশালতা (ABS) বেশি থেকে কম, সমান হলে প্রোডাক্টের নাম অনুযায়ী সাজাও।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`product\`, \`stock\`, \`movement_net\`, \`difference\`।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## কেন দরকার
স্টক কলামে যা লেখা তাই বাস্তব নয়। চুরি, ভাঙা পণ্য, ভুল entry, হারানো return—সব কারণে সিস্টেমের স্টক আর গুদামের আসল স্টক আলাদা হয়ে যায়। তাই গুদাম টিম মাস শেষে দুই খাতা মেলায়: products.stock-এ লেখা স্টক, আর inventory_movements লেজার ধরে গুনে বের করা কাগজে-থাকা স্টক। অমিল যত বড়, তদন্ত তত জরুরি—এই query ঠিক সেই priority list বানায়।

## মূল ধারণা
inventory_movements-এর quantity signed: purchase ধনাত্মক, sale ঋণাত্মক, return আবার ধনাত্মক, adjustment যে দিকে দরকার। প্রোডাক্ট ধরে SUM(quantity) দিলেই লেজারের নিট বের হয়। দুটো নিয়ম খেয়াল রাখো: শুধু movement-আছে এমন প্রোডাক্টই তুলবে (INNER JOIN), কারণ movement-হীন প্রোডাক্টে মিল পরীক্ষার মানে নেই; আর সাজানো হবে ABS(difference) ধরে, কারণ +৫ আর −৫ দুটোই সমান জরুরি অমিল—চিহ্ন নয়, বিশালতাই দরকার।

## ধাপে ধাপে
১. inventory_movements থেকে product_id ধরে SUM(quantity) — CTE বা সাবকোয়েরি।
২. products-এর সাথে product_id ধরে জোড়া লাগাও।
৩. difference = stock − movement_net।
৪. ORDER BY ABS(difference) DESC, product।

## কোডে দেখি
\`\`\`sql
WITH movement_totals AS (
  SELECT product_id, SUM(quantity) AS movement_net
  FROM inventory_movements
  GROUP BY product_id
)
SELECT p.name AS product,
       p.stock AS stock,
       mt.movement_net AS movement_net,
       p.stock - mt.movement_net AS difference
FROM products p
JOIN movement_totals mt ON mt.product_id = p.id
ORDER BY ABS(p.stock - mt.movement_net) DESC, product;
\`\`\`

## কমপ্লেক্সিটি
\`O(n log n)\` — একটি গ্রুপিং আর একটি সাজানো।

## সাধারণ ভুল
LEFT JOIN করে movement-হীন প্রোডাক্ট ঢোকানো; sale-এর ঋণাত্মক quantity ভুলে সব ধনাত্মক ধরা; ABS ছাড়া সাজানো—তখন সবচেয়ে বড় অমিল −৫ একেবারে নিচে নেমে যায়; টাই-ব্রেকার product না দিয়ে অনির্দিষ্ট ক্রম।`,
    difficulty: "HARD",
    points: 350,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    premiumModuleSlug: "advanced-sql",
    category: "SQL Advanced",
    subcategory: "JSON & inventory",
    referencePython: "",
    referenceSql: `WITH movement_totals AS (
  SELECT product_id, SUM(quantity) AS movement_net
  FROM inventory_movements
  GROUP BY product_id
)
SELECT p.name AS product,
       p.stock AS stock,
       mt.movement_net AS movement_net,
       p.stock - mt.movement_net AS difference
FROM products p
JOIN movement_totals mt ON mt.product_id = p.id
ORDER BY ABS(p.stock - mt.movement_net) DESC, product;`,
    tests: [
      {
        input: ``,
        expectedOutput: `Webcam	2	7	-5
27in Monitor	5	5	0
Clay Dinner Set	6	6	0
Clean Code	30	30	0
Cotton Panjabi	14	14	0
Denim Jacket	7	7	0
Dune	12	12	0
Laptop Stand	11	11	0
Mechanical Keyboard	12	12	0
SQL Handbook	9	9	0
Table Lamp	18	18	0
USB-C Hub	8	8	0
Wireless Mouse	3	3	0`,
        isSample: true
      },
      {
        input: `insert into inventory_movements (id,product_id,kind,quantity,reference,created_at) values (34,12,'adjustment',-5,'CYCLE-7','2026-11-05');`,
        expectedOutput: `27in Monitor	5	5	0
Clay Dinner Set	6	6	0
Clean Code	30	30	0
Cotton Panjabi	14	14	0
Denim Jacket	7	7	0
Dune	12	12	0
Laptop Stand	11	11	0
Mechanical Keyboard	12	12	0
SQL Handbook	9	9	0
Table Lamp	18	18	0
USB-C Hub	8	8	0
Webcam	2	2	0
Wireless Mouse	3	3	0`,
        isSample: true
      },
      {
        input: `update products set stock=10 where id=1;`,
        expectedOutput: `Webcam	2	7	-5
Mechanical Keyboard	10	12	-2
27in Monitor	5	5	0
Clay Dinner Set	6	6	0
Clean Code	30	30	0
Cotton Panjabi	14	14	0
Denim Jacket	7	7	0
Dune	12	12	0
Laptop Stand	11	11	0
SQL Handbook	9	9	0
Table Lamp	18	18	0
USB-C Hub	8	8	0
Wireless Mouse	3	3	0`,
        isSample: false
      },
      {
        input: `update products set stock = stock + 3 where id in (5,13);`,
        expectedOutput: `Webcam	2	7	-5
Dune	15	12	3
SQL Handbook	12	9	3
27in Monitor	5	5	0
Clay Dinner Set	6	6	0
Clean Code	30	30	0
Cotton Panjabi	14	14	0
Denim Jacket	7	7	0
Laptop Stand	11	11	0
Mechanical Keyboard	12	12	0
Table Lamp	18	18	0
USB-C Hub	8	8	0
Wireless Mouse	3	3	0`,
        isSample: false
      },
      {
        input: `insert into inventory_movements (id,product_id,kind,quantity,reference,created_at) values (35,7,'purchase',25,'PO-1015','2026-11-01');`,
        expectedOutput: `Webcam	2	7	-5
27in Monitor	5	5	0
Clay Dinner Set	6	6	0
Clean Code	30	30	0
Cotton Panjabi	14	14	0
Denim Jacket	7	7	0
Dune	12	12	0
Laptop Stand	11	11	0
Leather Wallet	25	25	0
Mechanical Keyboard	12	12	0
SQL Handbook	9	9	0
Table Lamp	18	18	0
USB-C Hub	8	8	0
Wireless Mouse	3	3	0`,
        isSample: false
      },
    ],
  },
];
