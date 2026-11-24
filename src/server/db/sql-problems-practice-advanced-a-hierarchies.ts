import type { SeedProblem } from "./seed-problems";

export const SQL_PROBLEMS_PRACTICE_ADVANCED_A_HIERARCHIES: SeedProblem[] = [
  {
    slug: "sql-practice-hierarchies-easy",
    title: "Root category subtree size",
    statement: `ক্যাটাগরির ট্রি বড় হচ্ছে; মার্চেন্ডাইজিং টিম জানতে চায় প্রতিটি রুট ক্যাটাগরির (parent_id NULL) নিচে নিজেসহ মোট কতটি নোড আছে। recursive CTE ব্যবহার করে বের করো। আউটপুট কলাম: category (রুটের নাম), nodes। রুটের নাম অনুযায়ী সাজাও।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`category\`, \`nodes\`, রুটের নাম অনুযায়ী।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## ধারণা
ট্রির প্রতিটি নোডকে তার রুটের সাথে আটকে রাখতে হবে—নাহলে শেষে কার পরিবারে কে গোনা হলো বলা যায় না। recursive CTE-তে anchor প্রতিটি রুটকে নিজের root_id দিয়ে ছাড়ে, recursive ধাপে প্রতিটি সন্তান বাপের root_id পেয়ে যায়। শেষে root_id ধরে COUNT করলেই পরিবারের সদস্য-সংখ্যা।

## ধাপে ধাপে
১. \`WITH RECURSIVE tree(id, root_id)\` ঘোষণা করো।
২. anchor: \`parent_id IS NULL\` সারিগুলো, root_id = নিজের id।
৩. recursive: categories JOIN tree, root_id অপরিবর্তিত রেখে সন্তান যোগ।
৪. root_id ধরে GROUP BY, COUNT(*) নিজেসহ।

## কোডে দেখি
\`\`\`sql
WITH RECURSIVE tree(id, root_id) AS (
  SELECT id, id FROM categories WHERE parent_id IS NULL
  UNION ALL
  SELECT c.id, t.root_id
  FROM categories c JOIN tree t ON c.parent_id = t.id
)
SELECT r.name AS category, COUNT(*) AS nodes
FROM tree t JOIN categories r ON r.id = t.root_id
GROUP BY t.root_id
ORDER BY category;
\`\`\`

## সাধারণ ভুল
root_id বহন না করে শুধু শেষ স্তরের নোড গোনা; anchor-এ \`parent_id IS NULL\` ভুলে যাওয়া; \`UNION\` লিখে একই নামের নোড বাদ পাঠানো।`,
    difficulty: "EASY",
    points: 200,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    premiumModuleSlug: "advanced-sql",
    category: "SQL Advanced",
    subcategory: "CTEs",
    referencePython: "",
    referenceSql: `WITH RECURSIVE tree(id, root_id) AS (SELECT id, id FROM categories WHERE parent_id IS NULL UNION ALL SELECT c.id, t.root_id FROM categories c JOIN tree t ON c.parent_id = t.id) SELECT r.name AS category, COUNT(*) AS nodes FROM tree t JOIN categories r ON r.id = t.root_id GROUP BY t.root_id ORDER BY category;`,
    tests: [
      {
        input: ``,
        expectedOutput: `Books	2
Electronics	3
Fashion	2
Home	1`,
        isSample: true
      },
      {
        input: `insert into categories (id,name,parent_id) values (9,'Gaming',1);`,
        expectedOutput: `Books	2
Electronics	4
Fashion	2
Home	1`,
        isSample: true
      },
      {
        input: `update categories set parent_id=4 where id=8;`,
        expectedOutput: `Books	3
Electronics	3
Fashion	2`,
        isSample: false
      },
      {
        input: `insert into categories (id,name,parent_id) values (9,'Kids',7);`,
        expectedOutput: `Books	2
Electronics	3
Fashion	3
Home	1`,
        isSample: false
      },
      {
        input: `update categories set parent_id=2 where id=8;`,
        expectedOutput: `Books	2
Electronics	4
Fashion	2`,
        isSample: false
      },
    ],
  },
  {
    slug: "sql-practice-hierarchies-medium",
    title: "Referrer reach",
    statement: `রেফারেল প্রোগ্রামের রিপোর্টে প্রতিটি টপ-লেভেল রেফারারের নাম লাগবে—যে কাস্টমারের কোনো referrer নেই (referrals-এ তার সারিই নেই, বা referred_by NULL)। প্রতিটি টপ-লেভেল রেফারারের জন্য বের করো: তার রেফারেল ট্রিতে মোট কতজন আছে (নিজে বাদে) আর চেইনের সর্বোচ্চ depth কত (নিজে = 0)। recursive CTE ব্যবহার করো। আউটপুট কলাম: referrer, referred_count, max_depth। রেফারারের নাম অনুযায়ী সাজাও।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`referrer\`, \`referred_count\`, \`max_depth\`, নাম অনুযায়ী।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## ধারণা
টপ-লেভেল রেফারার দুই রকম হয়: referrals-এ সারি আছে কিন্তু referred_by NULL (Tanvir), বা একদম সারিই নেই (Rahim)। \`NOT EXISTS (SELECT 1 FROM referrals rr WHERE rr.customer_id = c.id AND rr.referred_by IS NOT NULL)\` দুটোকেই ধরে। anchor-এ সব টপ-লেভেল কাস্টমার depth 0, recursive ধাপে referred_by মিলিয়ে depth+1; root_id বহন করলে শেষে প্রতি রুট ধরে গোনা যায়।

## ধাপে ধাপে
১. anchor: সব টপ-লেভেল কাস্টমার, root_id = নিজে, depth = 0।
২. recursive: referrals JOIN chain, depth + 1।
৩. root_id ধরে GROUP BY; count-এ \`depth > 0\` শর্ত, MAX(depth)।
৪. রুটের নাম JOIN করে ORDER BY referrer।

## কোডে দেখি
\`\`\`sql
WITH RECURSIVE chain(id, root_id, depth) AS (
  SELECT c.id, c.id, 0
  FROM customers c
  WHERE NOT EXISTS (SELECT 1 FROM referrals rr WHERE rr.customer_id = c.id AND rr.referred_by IS NOT NULL)
  UNION ALL
  SELECT r.customer_id, chain.root_id, chain.depth + 1
  FROM referrals r JOIN chain ON r.referred_by = chain.id
)
SELECT root.name AS referrer,
       SUM(CASE WHEN chain.depth > 0 THEN 1 ELSE 0 END) AS referred_count,
       MAX(chain.depth) AS max_depth
FROM chain JOIN customers root ON root.id = chain.root_id
GROUP BY chain.root_id
ORDER BY referrer;
\`\`\`

## সাধারণ ভুল
শুধু \`referred_by IS NULL\` খুঁজে সারি-নেই কাস্টমার (Rahim) বাদ দেওয়া; anchor-এ একজনকে ঠিক করে দিয়ে বাকি রুট হারানো; নিজেকেও referred_count-এ গুনে ফেলা।`,
    difficulty: "MEDIUM",
    points: 300,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    premiumModuleSlug: "advanced-sql",
    category: "SQL Advanced",
    subcategory: "CTEs",
    referencePython: "",
    referenceSql: `WITH RECURSIVE chain(id, root_id, depth) AS (SELECT c.id, c.id, 0 FROM customers c WHERE NOT EXISTS (SELECT 1 FROM referrals rr WHERE rr.customer_id = c.id AND rr.referred_by IS NOT NULL) UNION ALL SELECT r.customer_id, chain.root_id, chain.depth + 1 FROM referrals r JOIN chain ON r.referred_by = chain.id) SELECT root.name AS referrer, SUM(CASE WHEN chain.depth > 0 THEN 1 ELSE 0 END) AS referred_count, MAX(chain.depth) AS max_depth FROM chain JOIN customers root ON root.id = chain.root_id GROUP BY chain.root_id ORDER BY referrer;`,
    tests: [
      {
        input: ``,
        expectedOutput: `Rahim	4	2
Tanvir	0	0`,
        isSample: true
      },
      {
        input: `insert into customers (id,name,city,signup_date) values (7,'Rafi','Dhaka','2026-05-01'); insert into referrals (customer_id,referred_by) values (7,5);`,
        expectedOutput: `Rahim	5	3
Tanvir	0	0`,
        isSample: true
      },
      {
        input: `delete from referrals where customer_id=2;`,
        expectedOutput: `Karim	2	1
Rahim	1	1
Tanvir	0	0`,
        isSample: false
      },
      {
        input: `update referrals set referred_by=6 where customer_id=2;`,
        expectedOutput: `Rahim	1	1
Tanvir	3	2`,
        isSample: false
      },
      {
        input: `update referrals set referred_by=3 where customer_id=6;`,
        expectedOutput: `Rahim	5	2`,
        isSample: false
      },
    ],
  },
];
