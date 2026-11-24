import type { SeedProblem } from "./seed-problems";

export const SQL_PROBLEMS_PRACTICE_BASIC_JOINS_IN_DEPTH: SeedProblem[] = [
  {
    slug: "sql-practice-joins-in-depth-easy",
    title: "Category breadcrumbs",
    statement: `ওয়েব টিম ক্যাটাগরি মেনুর breadcrumb বানাচ্ছে — প্রতিটি ক্যাটাগরির নামের পাশে তার প্যারেন্ট ক্যাটাগরির নাম, আর যার প্যারেন্ট নেই (শীর্ষ স্তর) তার জায়গায় \`(root)\` দেখাবে। \`categories\` টেবিলকে নিজের সাথেই জোড়া দাও — শীর্ষ ক্যাটাগরির কোনো ম্যাচ না-থাকায় \`LEFT JOIN\` লাগবে; ক্যাটাগরির নাম অনুযায়ী সাজাও।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`category\`, \`parent\` — ক্যাটাগরির নাম অনুযায়ী সাজানো; প্যারেন্ট না থাকলে \`(root)\`।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## ধারণা
একই টেবিলের ভেতরের সম্পর্ক মেলাতে self-join — \`categories\`-এর দুই কপি, দুই alias (\`c\`, \`p\`)। \`c.parent_id\` যে সারি নির্দেশ করে, \`p.id\` সেটা — \`ON p.id = c.parent_id\`। শীর্ষ ক্যাটাগরির \`parent_id\` NULL, তাই INNER JOIN হলে সেগুলো ঝরে পড়তো; \`LEFT JOIN\` রাখলে সারিটি বেঁচে থাকে, আর খালি জায়গাটা \`COALESCE(p.name, '(root)')\` দিয়ে লেবেল হয়। জোড়া অনন্য রাখতে অসমতা লাগে না — এক ক্যাটাগরির প্যারেন্ট একজনই।

## ধাপে ধাপে
১. \`categories c LEFT JOIN categories p ON p.id = c.parent_id\`।
২. \`COALESCE(p.name, '(root)') AS parent\`।
৩. \`ORDER BY c.name\`।

## কোডে দেখি
\`\`\`sql
SELECT c.name AS category, COALESCE(p.name, '(root)') AS parent
FROM categories c
LEFT JOIN categories p ON p.id = c.parent_id
ORDER BY c.name;
\`\`\`

## সাধারণ ভুল
INNER JOIN করে শীর্ষ ক্যাটাগরি হারানো; শর্তের দুই পাশ উল্টে সব সারির সাথে সব সারি জুড়ে ফেলা; NULL-এর জায়গায় \`COALESCE\` না দিয়ে খালি লেবেল রাখা; দুই কপিতে এক alias দিয়ে নিজেকেই বিভ্রান্ত করা।`,
    difficulty: "EASY",
    points: 150,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    category: "SQL Basics",
    subcategory: "Joins",
    referencePython: "",
    referenceSql: `SELECT c.name AS category, COALESCE(p.name, '(root)') AS parent FROM categories c LEFT JOIN categories p ON p.id = c.parent_id ORDER BY c.name;`,
    tests: [
      {
        input: ``,
        expectedOutput: `Audio	Electronics
Books	(root)
Electronics	(root)
Fashion	(root)
Fiction	Books
Headphones	Audio
Home	(root)
Men	Fashion`,
        isSample: true
      },
      {
        input: `update categories set parent_id=8 where id=3;`,
        expectedOutput: `Audio	Electronics
Books	(root)
Electronics	(root)
Fashion	(root)
Fiction	Books
Headphones	Home
Home	(root)
Men	Fashion`,
        isSample: true
      },
      {
        input: `insert into categories (id,name,parent_id) values (9,'Kitchen',8);`,
        expectedOutput: `Audio	Electronics
Books	(root)
Electronics	(root)
Fashion	(root)
Fiction	Books
Headphones	Audio
Home	(root)
Kitchen	Home
Men	Fashion`,
        isSample: false
      },
      {
        input: `update categories set parent_id=NULL where id=2;`,
        expectedOutput: `Audio	(root)
Books	(root)
Electronics	(root)
Fashion	(root)
Fiction	Books
Headphones	Audio
Home	(root)
Men	Fashion`,
        isSample: false
      },
      {
        input: `update categories set parent_id=1 where id=4;`,
        expectedOutput: `Audio	Electronics
Books	Electronics
Electronics	(root)
Fashion	(root)
Fiction	Books
Headphones	Audio
Home	(root)
Men	Fashion`,
        isSample: false
      },
    ],
  },
  {
    slug: "sql-practice-joins-in-depth-medium",
    title: "Fulfillment dashboard",
    statement: `ফুলফিলমেন্ট ডেস্ক প্রতিটি কার্যকর অর্ডারের (\`paid\`/\`shipped\`) ডেলিভারি অবস্থা দেখতে চায় — শিপমেন্ট রেকর্ড থাকলে তার \`status\`, না থাকলে \`not_shipped\`। প্রতি অর্ডারের \`order_id\`, কাস্টমারের নাম (\`customer\`) আর \`delivery_status\` বের করো — অর্ডার আইডি অনুযায়ী সাজাও।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`order_id\`, \`customer\`, \`delivery_status\` — অর্ডার আইডি অনুযায়ী; শিপমেন্ট না থাকলে \`not_shipped\`।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## ধারণা
বাম পাশের প্রতিটি সারি রাখতে \`LEFT JOIN shipments\` — ম্যাচ না পেলে ডান পাশ NULL, সারিটি কিন্তু বেঁচে থাকে। কার্যকর-অর্ডারের শর্তটা \`WHERE\`-এ বসে (বাম টেবিলের কলামে), আর শিপমেন্টের অনুপস্থিতি বাইরে চেক না করে \`COALESCE(s.status, 'not_shipped')\` দিয়ে NULL থেকে লেবেল বানানো হয়। সাবধান — \`WHERE\`-এ ডান টেবিলের কলামে সরাসরি শর্ত (\`s.status = ...\`) দিলে NULL সারিগুলো ছেঁড়ে যায়, LEFT JOIN নীরবে INNER JOIN হয়ে যায়।

## ধাপে ধাপে
১. \`orders o JOIN customers c\` — নাম আনো।
২. \`LEFT JOIN shipments s ON s.order_id = o.id\`।
৩. \`WHERE o.status IN ('paid','shipped')\`।
৪. \`COALESCE(s.status, 'not_shipped')\`, \`ORDER BY o.id\`।

## কোডে দেখি
\`\`\`sql
SELECT o.id AS order_id, c.name AS customer,
       COALESCE(s.status, 'not_shipped') AS delivery_status
FROM orders o
JOIN customers c ON c.id = o.customer_id
LEFT JOIN shipments s ON s.order_id = o.id
WHERE o.status IN ('paid','shipped')
ORDER BY o.id;
\`\`\`

## সাধারণ ভুল
INNER JOIN করে শিপমেন্ট-নেই অর্ডার হারানো; বাম টেবিলের শর্ত \`ON\`-এ সরিয়ে অপেক্ষমাণ/বাতিল অর্ডারও ফলাফলে আনা; \`COALESCE\` ছাড়া NULL ছাপা; অর্ডার আইডি ছাড়া অন্য ক্রমে সাজানো।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    category: "SQL Basics",
    subcategory: "Joins",
    referencePython: "",
    referenceSql: `SELECT o.id AS order_id, c.name AS customer, COALESCE(s.status, 'not_shipped') AS delivery_status FROM orders o JOIN customers c ON c.id = o.customer_id LEFT JOIN shipments s ON s.order_id = o.id WHERE o.status IN ('paid','shipped') ORDER BY o.id;`,
    tests: [
      {
        input: ``,
        expectedOutput: `1	Rahim	delivered
3	Nusrat	delivered
4	Rahim	shipped
6	Rahim	delivered
7	Mim	shipped
8	Karim	delivered
9	Nusrat	delivered
10	Tanvir	pending`,
        isSample: true
      },
      {
        input: `delete from shipments where order_id=10;`,
        expectedOutput: `1	Rahim	delivered
3	Nusrat	delivered
4	Rahim	shipped
6	Rahim	delivered
7	Mim	shipped
8	Karim	delivered
9	Nusrat	delivered
10	Tanvir	not_shipped`,
        isSample: true
      },
      {
        input: `delete from shipments where order_id in (4,7);`,
        expectedOutput: `1	Rahim	delivered
3	Nusrat	delivered
4	Rahim	not_shipped
6	Rahim	delivered
7	Mim	not_shipped
8	Karim	delivered
9	Nusrat	delivered
10	Tanvir	pending`,
        isSample: false
      },
      {
        input: `update orders set status='paid' where id=2;`,
        expectedOutput: `1	Rahim	delivered
2	Karim	not_shipped
3	Nusrat	delivered
4	Rahim	shipped
6	Rahim	delivered
7	Mim	shipped
8	Karim	delivered
9	Nusrat	delivered
10	Tanvir	pending`,
        isSample: false
      },
      {
        input: `update orders set status='cancelled' where id in (7,9);`,
        expectedOutput: `1	Rahim	delivered
3	Nusrat	delivered
4	Rahim	shipped
6	Rahim	delivered
8	Karim	delivered
10	Tanvir	pending`,
        isSample: false
      },
    ],
  },
];
