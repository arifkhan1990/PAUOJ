import type { SeedProblem } from "./seed-problems";

export const SQL_PROBLEMS_PRACTICE_BASIC_MORE_JOINS_IN_DEPTH: SeedProblem[] = [
  {
    slug: "sql-practice-joins-in-depth-hard",
    title: "Root category shelf size",
    statement: `ক্যাটাগরি মেনু রিডিজাইনের জন্য দরকার প্রতিটি শীর্ষ (root, \`parent_id\` NULL) ক্যাটাগরির নিচে মোট কতটা প্রোডাক্ট জমা আছে — নিজের নামে, সরাসরি সন্তানে আর নাতি-ক্যাটাগরিতে বসা প্রোডাক্ট মিলিয়ে। প্রতি শীর্ষ ক্যাটাগরির \`category\` (নাম) ও \`products\` (সেই পুরো গাছের প্রোডাক্ট সংখ্যা) বের করো; বেশি প্রোডাক্ট আগে, সমান হলে নাম অনুযায়ী।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`category\`, \`products\` — সংখ্যা নিচের ক্রমে, টাই-এ \`category\`।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## ধারণা
গাছটা মাত্র তিন স্তর — তাই শীর্ষ থেকে দুই ধাপ self-join দিয়েই পুরো বংশ ধরা যায়: root → child (\`child.parent_id = root.id\`) → grandchild (\`gc.parent_id = child.id\`)। প্রোডাক্ট জোড়ার শর্তে তিন আইডির যেকোনো একটাই যথেষ্ট: \`p.category_id IN (root.id, child.id, gc.id)\`। এক প্রোডাক্ট একাধিক জোড়া-সারিতে মিলতে পারে (একই root-এর একাধিক সন্তান-নাতি জুটি), তাই গোনায় \`COUNT(DISTINCT p.id)\` — নাহলে ফ্যান-আউটে সংখ্যা ফুলে যাবে।

## ধাপে ধাপে
১. \`categories root\` — \`WHERE root.parent_id IS NULL\`।
২. \`LEFT JOIN categories child ON child.parent_id = root.id\`।
৩. \`LEFT JOIN categories gc ON gc.parent_id = child.id\`।
৪. \`LEFT JOIN products p ON p.category_id IN (root.id, child.id, gc.id)\`।
৫. \`COUNT(DISTINCT p.id) AS products\`, \`GROUP BY root.id\`, \`ORDER BY products DESC, category\`।

## কোডে দেখি
\`\`\`sql
SELECT root.name AS category, COUNT(DISTINCT p.id) AS products
FROM categories root
LEFT JOIN categories child ON child.parent_id = root.id
LEFT JOIN categories gc ON gc.parent_id = child.id
LEFT JOIN products p ON p.category_id IN (root.id, child.id, gc.id)
WHERE root.parent_id IS NULL
GROUP BY root.id
ORDER BY products DESC, category;
\`\`\`

## সাধারণ ভুল
\`COUNT(p.id)\` লিখে জোড়া-জুটির কারণে একই প্রোডাক্ট বারবার গোনা; সন্তান/নাতি ধাপে \`LEFT\` না দিয়ে নিঃসন্তান root-কে (যেমন Home) পুরো হারানো; \`IN\`-তিন আইডির কোনোটা বাদ পড়লে সেই স্তরের প্রোডাক্ট হারানো; \`WHERE root.parent_id IS NULL\` ছাঁকনি না দিয়ে ভেতরের ক্যাটাগরিও আলাদা সারিতে গোনা।`,
    difficulty: "HARD",
    points: 250,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    category: "SQL Basics",
    subcategory: "Joins",
    referencePython: "",
    referenceSql: `SELECT root.name AS category, COUNT(DISTINCT p.id) AS products FROM categories root LEFT JOIN categories child ON child.parent_id = root.id LEFT JOIN categories gc ON gc.parent_id = child.id LEFT JOIN products p ON p.category_id IN (root.id, child.id, gc.id) WHERE root.parent_id IS NULL GROUP BY root.id ORDER BY products DESC, category;`,
    tests: [
      {
        input: ``,
        expectedOutput: `Electronics	6
Books	3
Fashion	3
Home	2`,
        isSample: true
      },
      {
        input: `insert into categories (id,name,parent_id) values (9,'Kitchen',8); insert into products (id,vendor_id,category_id,name,price_cents,stock,rating) values (15,5,9,'Steel Pot',140000,9,4.3);`,
        expectedOutput: `Electronics	6
Books	3
Fashion	3
Home	3`,
        isSample: true
      },
      {
        input: `update products set category_id=5 where id=1;`,
        expectedOutput: `Electronics	5
Books	4
Fashion	3
Home	2`,
        isSample: false
      },
      {
        input: `insert into categories (id,name,parent_id) values (10,'Monitors',1); insert into products (id,vendor_id,category_id,name,price_cents,stock,rating) values (16,1,10,'4K Monitor',5200000,3,4.7);`,
        expectedOutput: `Electronics	7
Books	3
Fashion	3
Home	2`,
        isSample: false
      },
      {
        input: `update products set category_id=8 where id=1;`,
        expectedOutput: `Electronics	5
Books	3
Fashion	3
Home	3`,
        isSample: false
      },
    ],
  },
  {
    slug: "sql-practice-joins-in-depth-challenge",
    title: "Vendor reach",
    statement: `ব্যবসা-টিম প্রতি ভেন্ডরের রিচ মাপছে: তাদের প্রোডাক্ট অন্তত একটা অর্ডারে কেনা হয়েছে এমন কতজন আলাদা কাস্টমার আছে (অর্ডারের স্ট্যাটাস যাই হোক — বাতিলও গোনা হবে)। প্রতি ভেন্ডরের \`vendor\` (নাম) ও \`buyers\` বের করো — কেউ কিনেনি এমন ভেন্ডরও তালিকায় থাকবে ০ সংখ্যায়; বেশি buyers আগে, সমান হলে নাম অনুযায়ী।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`vendor\`, \`buyers\` — সংখ্যা নিচের ক্রমে, টাই-এ \`vendor\`; ক্রেতা না থাকলে ০।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## ধারণা
শৃঙ্খল: \`vendors → products → order_items → orders\` — শেষ প্রান্তে কাস্টমার। দুই ফাঁদ একসাথে: (১) একই কাস্টমার একই ভেন্ডরের প্রোডাক্ট একাধিক অর্ডারে বা এক অর্ডারের একাধিক আইটেমে কিনতে পারে — সাধারণ \`COUNT\` সারি গোনে, মানুষ নয়; চাই \`COUNT(DISTINCT o.customer_id)\`। (২) প্রোডাক্ট-হীন ভেন্ডরকে রাখতে পুরো শৃঙ্খলে \`LEFT JOIN\` — শূন্য ভেন্ডরের কাউন্ট শূন্যই আসবে।

## ধাপে ধাপে
১. \`vendors v LEFT JOIN products p ON p.vendor_id = v.id\`।
২. \`LEFT JOIN order_items oi ON oi.product_id = p.id\`, \`LEFT JOIN orders o ON o.id = oi.order_id\`।
৩. \`COUNT(DISTINCT o.customer_id) AS buyers\` — খালি শৃঙ্খলে NULL-গুলো ০-তে পড়ে।
৪. \`GROUP BY v.id\`, \`ORDER BY buyers DESC, vendor\`।

## কোডে দেখি
\`\`\`sql
SELECT v.name AS vendor, COUNT(DISTINCT o.customer_id) AS buyers
FROM vendors v
LEFT JOIN products p ON p.vendor_id = v.id
LEFT JOIN order_items oi ON oi.product_id = p.id
LEFT JOIN orders o ON o.id = oi.order_id
GROUP BY v.id
ORDER BY buyers DESC, vendor;
\`\`\`

## সাধারণ ভুল
\`COUNT(*)\` বা \`COUNT(o.customer_id)\` — একই ক্রেতার বারবার কেনা প্রোডাক্ট আলাদা মানুষ হিসেবে গোনা; কোথাও INNER JOIN করে প্রোডাক্ট-নেই ভেন্ডর হারানো; অর্ডারের status ফিল্টার ঢুকিয়ে বাতিল-অর্ডারের ক্রেতা বাদ দেওয়া — টাস্ক সব অর্ডার চায়; DISTINCT ভুলে ভেন্ডরের ক্যাটালগ-সাইজই মাপা।`,
    difficulty: "MEDIUM",
    points: 225,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    category: "SQL Basics",
    subcategory: "Joins",
    referencePython: "",
    referenceSql: `SELECT v.name AS vendor, COUNT(DISTINCT o.customer_id) AS buyers FROM vendors v LEFT JOIN products p ON p.vendor_id = v.id LEFT JOIN order_items oi ON oi.product_id = p.id LEFT JOIN orders o ON o.id = oi.order_id GROUP BY v.id ORDER BY buyers DESC, vendor;`,
    tests: [
      {
        input: ``,
        expectedOutput: `BookBazar	2
GadgetPoint	2
HomeCraft	2
StyleHub	2
TechNest	2
PaperTrail	0`,
        isSample: true
      },
      {
        input: `update orders set customer_id=4 where id=7;`,
        expectedOutput: `BookBazar	2
GadgetPoint	2
HomeCraft	2
StyleHub	2
TechNest	2
PaperTrail	0`,
        isSample: true
      },
      {
        input: `insert into products (id,vendor_id,category_id,name,price_cents,stock,rating) values (15,6,4,'Paper Notebook',60000,50,4.2); insert into orders (id,customer_id,ordered_at,status) values (11,6,'2026-11-12','paid'); insert into order_items (id,order_id,product_id,quantity,unit_price_cents) values (16,11,15,1,60000);`,
        expectedOutput: `BookBazar	2
GadgetPoint	2
HomeCraft	2
StyleHub	2
TechNest	2
PaperTrail	1`,
        isSample: false
      },
      {
        input: `insert into order_items (id,order_id,product_id,quantity,unit_price_cents) values (17,8,9,1,150000);`,
        expectedOutput: `GadgetPoint	3
BookBazar	2
HomeCraft	2
StyleHub	2
TechNest	2
PaperTrail	0`,
        isSample: false
      },
      {
        input: `delete from order_items where order_id=5;`,
        expectedOutput: `BookBazar	2
HomeCraft	2
StyleHub	2
TechNest	2
GadgetPoint	1
PaperTrail	0`,
        isSample: false
      },
    ],
  },
];
