import type { SeedProblem } from "./seed-problems";

export const SQL_PROBLEMS_PRACTICE_ADVANCED_MORE_JSON_INVENTORY: SeedProblem[] = [
  {
    slug: "sql-practice-json-inventory-hard",
    title: "Warranty tiers from JSON",
    statement: `প্রোডাক্টের JSON attributes-এ \`warranty_months\` কী আছে। সেই মান ধরে প্রতিটি প্রোডাক্টকে চার টিয়ারে ভাগ করো: \`none\` (0 মাস), \`short\` (1–12), \`mid\` (13–24), \`long\` (25+)। প্রতিটি টিয়ারের জন্য বের করো প্রোডাক্ট সংখ্যা, মোট স্টক (products টেবিলের stock) এবং গড় দাম (সেন্টে, পূর্ণসংখ্যা)। খালি টিয়ার তালিকায় আসবে না। আউটপুট কলাম: tier, products, stock_units, avg_price_cents। টিয়ারের নাম অনুযায়ী সাজাও।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`tier\`, \`products\`, \`stock_units\`, \`avg_price_cents\`, টিয়ারের নাম অনুযায়ী।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## ধারণা
\`json_extract(attributes, '$.warranty_months')\` মানটা তোলে; CASE দিয়ে টিয়ার লেবেল বানিয়ে সেই লেবেল ধরে GROUP BY — এটাই JSON-থেকে-গ্রুপিং প্যাটার্ন। লেবেল আগে এক CTE-তে ঠিক করে নিলে বাইরের কোড পরিষ্কার থাকে।

## ধাপে ধাপে
১. tiers CTE: প্রতি প্রোডাক্টের tier লেবেল (CASE, 0/12/24 বাউন্ডারি সহ)।
২. products জোড়া দিয়ে stock ও price আনো।
৩. tier ধরে COUNT, SUM(stock), CAST(ROUND(AVG(price)))।
৪. ORDER BY tier।

## কোডে দেখি
\`\`\`sql
WITH tiers AS (
  SELECT pa.product_id,
         CASE WHEN json_extract(pa.attributes,'$.warranty_months') = 0 THEN 'none'
              WHEN json_extract(pa.attributes,'$.warranty_months') <= 12 THEN 'short'
              WHEN json_extract(pa.attributes,'$.warranty_months') <= 24 THEN 'mid'
              ELSE 'long' END AS tier
  FROM product_attributes pa)
SELECT tier, COUNT(*) AS products, SUM(p.stock) AS stock_units,
       CAST(ROUND(AVG(p.price_cents),0) AS INTEGER) AS avg_price_cents
FROM tiers t JOIN products p ON p.id = t.product_id
GROUP BY tier ORDER BY tier;
\`\`\`

## সাধারণ ভুল
warranty_months কলাম ব্যবহার করা কাজটা JSON থেকে করতে বলা হয়েছে — কলামটা এখানে ফাঁদ; বাউন্ডারি উল্টানো (<=24 আগে মিললে mid-এর আগে none/short ধরা হয়ে যায় — CASE-এর ক্রম গুরুত্বপূর্ণ); json_extract NULL হলে ELSE 'long'-এ পড়ে — এই ডেটায় কী-টি সবসময় আছে, তবু সচেতন থাকো।`,
    difficulty: "HARD",
    points: 320,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    premiumModuleSlug: "advanced-sql",
    category: "SQL Advanced",
    subcategory: "JSON & inventory",
    referencePython: "",
    referenceSql: `WITH tiers AS (
  SELECT pa.product_id,
         CASE WHEN json_extract(pa.attributes,'$.warranty_months') = 0 THEN 'none'
              WHEN json_extract(pa.attributes,'$.warranty_months') <= 12 THEN 'short'
              WHEN json_extract(pa.attributes,'$.warranty_months') <= 24 THEN 'mid'
              ELSE 'long' END AS tier
  FROM product_attributes pa)
SELECT tier, COUNT(*) AS products, SUM(p.stock) AS stock_units,
       CAST(ROUND(AVG(p.price_cents),0) AS INTEGER) AS avg_price_cents
FROM tiers t JOIN products p ON p.id = t.product_id
GROUP BY tier ORDER BY tier;`,
    tests: [
      {
        input: ``,
        expectedOutput: `long	1	5	1850000
mid	4	49	232500
none	6	78	237500
short	3	30	185000`,
        isSample: true
      },
      {
        input: `update product_attributes set attributes='{"brand":"Samsung","color":"black","panel":"IPS","warranty_months":12}' where product_id=3;`,
        expectedOutput: `mid	4	49	232500
none	6	78	237500
short	4	35	601250`,
        isSample: true
      },
      {
        input: `update product_attributes set attributes='{"brand":"Ace Books","color":"orange","format":"paperback","warranty_months":30}' where product_id=13;`,
        expectedOutput: `long	2	17	1030000
mid	4	49	232500
none	5	66	243000
short	3	30	185000`,
        isSample: false
      },
      {
        input: `insert into products (id,vendor_id,category_id,name,price_cents,stock,rating) values (15,1,1,'Gaming Headset',750000,9,4.4); insert into product_attributes (product_id,brand,color,warranty_months,attributes) values (15,'Asus','black',36,'{"brand":"Asus","color":"black","warranty_months":36}');`,
        expectedOutput: `long	2	14	1300000
mid	4	49	232500
none	6	78	237500
short	3	30	185000`,
        isSample: false
      },
      {
        input: `update product_attributes set warranty_months=0, attributes='{"brand":"Fossil","color":"brown","material":"leather","warranty_months":0}' where product_id=7;`,
        expectedOutput: `long	1	5	1850000
mid	4	49	232500
none	7	103	220714
short	2	5	217500`,
        isSample: false
      },
    ],
  },
  {
    slug: "sql-practice-json-inventory-challenge",
    title: "Column vs JSON warranty audit",
    statement: `product_attributes টেবিলে warranty_months দুই জায়গায় থাকে — একটি সাধারণ কলাম, আরেকটি attributes JSON-এর ভেতরে \`$.warranty_months\`। ডেটা এন্ট্রি টিমের ভুলে দুটো নামমাত্র সামঞ্জস্যহীন হতে পারে। প্রতিটি প্রোডাক্টের জন্য দুই মান পাশাপাশি দেখাও আর status বসাও: দুটির মান সমান হলে \`ok\`, ভিন্ন হলে \`mismatch\`, JSON-এ কী-টাই না থাকলে \`missing\`। সব প্রোডাক্ট তালিকায় আসবে। আউটপুট কলাম: product, column_warranty, json_warranty, status। আগে status (mismatch আগে, তারপর missing, তারপর ok), তারপর প্রোডাক্টের নাম অনুযায়ী সাজাও।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`product\`, \`column_warranty\`, \`json_warranty\`, \`status\`। \`missing\`-এ json_warranty \`\\N\`। সাজানো: status, product — mismatch আগে।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## ধারণা
সবচেয়ে বড় ফাঁদ: \`json_warranty <> column_warranty\` লিখলে NULL সারি বেঁচে যায় (NULL তুলনার ফল NULL, WHERE/CASE দুটোতেই “সত্য নয়”)। তাই আগে \`IS NULL\` দিয়ে missing আলাদা করতে হবে, তারপর মান তুলনা। status স্ট্রিং বর্ণানুক্রমে mismatch < missing < ok — ORDER BY status দিলেই সমস্যাযুক্ত সারি ওপরে উঠে আসে।

## ধাপে ধাপে
১. products JOIN product_attributes — সব প্রোডাক্ট রাখো।
২. json_extract দুইবার করে CASE-এর শর্তে ব্যবহার করো (IS NULL আগে)।
৩. status বসাও: missing → mismatch → ok ক্রমে পরীক্ষা।
৪. ORDER BY status, product।

## কোডে দেখি
\`\`\`sql
SELECT p.name AS product, pa.warranty_months AS column_warranty,
       json_extract(pa.attributes, '$.warranty_months') AS json_warranty,
       CASE WHEN json_extract(pa.attributes, '$.warranty_months') IS NULL THEN 'missing'
            WHEN json_extract(pa.attributes, '$.warranty_months') = pa.warranty_months THEN 'ok'
            ELSE 'mismatch' END AS status
FROM products p JOIN product_attributes pa ON pa.product_id = p.id
ORDER BY status, product;
\`\`\`

## সাধারণ ভুল
\`<>\` দিয়ে তুলনা করে missing সারিকে ok বানিয়ে ফেলা — NULL তুলনা সবসময় NULL; \`='missing'\` আগে না দিয়ে উল্টো ক্রমে CASE সাজালো NULL সারি ভুয়া mismatch দেখায়; JSON-এ সংখ্যা int হলেও \`= column\` ঠিকই কাজ করে — কিন্তু কী নেই মানে তুলনাই নয়, শনাক্তের জন্য আলাদা শাখা লাগবে।`,
    difficulty: "HARD",
    points: 340,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    premiumModuleSlug: "advanced-sql",
    category: "SQL Advanced",
    subcategory: "JSON & inventory",
    referencePython: "",
    referenceSql: `SELECT p.name AS product, pa.warranty_months AS column_warranty,
       json_extract(pa.attributes, '$.warranty_months') AS json_warranty,
       CASE WHEN json_extract(pa.attributes, '$.warranty_months') IS NULL THEN 'missing'
            WHEN json_extract(pa.attributes, '$.warranty_months') = pa.warranty_months THEN 'ok'
            ELSE 'mismatch' END AS status
FROM products p JOIN product_attributes pa ON pa.product_id = p.id
ORDER BY status, product;`,
    tests: [
      {
        input: ``,
        expectedOutput: `27in Monitor	36	36	ok
Clay Dinner Set	0	0	ok
Clean Code	0	0	ok
Cotton Panjabi	0	0	ok
Denim Jacket	0	0	ok
Dune	0	0	ok
Laptop Stand	24	24	ok
Leather Wallet	12	12	ok
Mechanical Keyboard	24	24	ok
SQL Handbook	0	0	ok
Table Lamp	24	24	ok
USB-C Hub	18	18	ok
Webcam	12	12	ok
Wireless Mouse	12	12	ok`,
        isSample: true
      },
      {
        input: `update product_attributes set warranty_months=36 where product_id=1;`,
        expectedOutput: `Mechanical Keyboard	36	24	mismatch
27in Monitor	36	36	ok
Clay Dinner Set	0	0	ok
Clean Code	0	0	ok
Cotton Panjabi	0	0	ok
Denim Jacket	0	0	ok
Dune	0	0	ok
Laptop Stand	24	24	ok
Leather Wallet	12	12	ok
SQL Handbook	0	0	ok
Table Lamp	24	24	ok
USB-C Hub	18	18	ok
Webcam	12	12	ok
Wireless Mouse	12	12	ok`,
        isSample: true
      },
      {
        input: `update product_attributes set attributes='{"brand":"Anker","color":"gray","ports":7}' where product_id=2;`,
        expectedOutput: `USB-C Hub	18	\\N	missing
27in Monitor	36	36	ok
Clay Dinner Set	0	0	ok
Clean Code	0	0	ok
Cotton Panjabi	0	0	ok
Denim Jacket	0	0	ok
Dune	0	0	ok
Laptop Stand	24	24	ok
Leather Wallet	12	12	ok
Mechanical Keyboard	24	24	ok
SQL Handbook	0	0	ok
Table Lamp	24	24	ok
Webcam	12	12	ok
Wireless Mouse	12	12	ok`,
        isSample: false
      },
      {
        input: `update product_attributes set warranty_months=0 where product_id=12;`,
        expectedOutput: `Webcam	0	12	mismatch
27in Monitor	36	36	ok
Clay Dinner Set	0	0	ok
Clean Code	0	0	ok
Cotton Panjabi	0	0	ok
Denim Jacket	0	0	ok
Dune	0	0	ok
Laptop Stand	24	24	ok
Leather Wallet	12	12	ok
Mechanical Keyboard	24	24	ok
SQL Handbook	0	0	ok
Table Lamp	24	24	ok
USB-C Hub	18	18	ok
Wireless Mouse	12	12	ok`,
        isSample: false
      },
      {
        input: `insert into products (id,vendor_id,category_id,name,price_cents,stock,rating) values (15,1,1,'Gaming Headset',750000,9,4.4); insert into product_attributes (product_id,brand,color,warranty_months,attributes) values (15,'Asus','black',36,'{"brand":"Asus","color":"black","warranty_months":12}');`,
        expectedOutput: `Gaming Headset	36	12	mismatch
27in Monitor	36	36	ok
Clay Dinner Set	0	0	ok
Clean Code	0	0	ok
Cotton Panjabi	0	0	ok
Denim Jacket	0	0	ok
Dune	0	0	ok
Laptop Stand	24	24	ok
Leather Wallet	12	12	ok
Mechanical Keyboard	24	24	ok
SQL Handbook	0	0	ok
Table Lamp	24	24	ok
USB-C Hub	18	18	ok
Webcam	12	12	ok
Wireless Mouse	12	12	ok`,
        isSample: false
      },
    ],
  },
];
