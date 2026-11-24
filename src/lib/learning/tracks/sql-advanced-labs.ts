import type { LearningTopicDefinition } from "@/lib/learning/types";

/** Concept notes for the script-mode DDL/DML labs of the advanced ShopSphere SQL track. */

const ddlAndIndexesConcept = `## কেন দরকার
ShopSphere-এর রিপোর্ট পেজে দুই ধরনের কাজ চলে: ডেটা পড়া, আর ডেটার গঠন বদলানো। দ্বিতীয় ধরনের কাজের নাম DDL—\`CREATE\`, \`ALTER\`, \`DROP\`। বাস্তব দোকানে নতুন রিপোর্ট দ্রুত করতে index যোগ করতে হয়, বারবার একই JOIN লিখতে না হয় বলে view বানানো হয়, আর পুরোনো পরীক্ষামূলক টেবিল ফেলে দেওয়া হয়। এই কাজগুলো SELECT-এর মতো ক্ষণিকের নয়; স্কিমার অংশ হয়ে থেকে যায়, তাই ভুল করলে প্রভাব বড়।

ল্যাবের ডেটাবেস মেমোরিতে থাকা fixture-এর কপি, আর প্রতিটি submission নতুন কপি পায়। অর্থাৎ CREATE/DROP যতই চালাও, আসল ডেটা বা হোস্ট ফাইল কিছুই বদলায় না; sandbox শেষ হলেই সব মুছে যায়। তবু DDL লেখার আগে ভাবতে শেখা দরকার—প্রোডাকশনে একই statement স্থায়ী। অনুমতি-তালিকা ছোট রাখা হয়েছে: index, view আর টেবিল তৈরি-মোছা চলবে, কিন্তু ATTACH, DETACH বা PRAGMA দিয়ে ফাইল বা কানেকশন ছোঁয়া যাবে না।

## মূল ধারণা
Index হলো টেবিলের পাশে রাখা ক্রম-সাজানো ঠিকানা-খাতা। \`CREATE INDEX idx_orders_customer_date ON orders (customer_id, ordered_at);\` লিখলে ইঞ্জিন customer ধরে তার ভিতরে তারিখ ধরে সরাসরি সারিতে পৌঁছায়—পুরো টেবিল পড়তে হয় না। Composite index-এ ক্রমটা খুব গুরুত্বপূর্ণ: equality-র কলাম আগে, range-এর কলাম পরে। তাই \`(customer_id, ordered_at)\` ভালো, উল্টোটা কম কাজে লাগে। বাঁয়ের কলাম একাও খোঁজা যায়, ডানের কলাম একা নয়।

View মানে সংরক্ষিত query-র নাম। \`CREATE VIEW vendor_revenue_v AS SELECT ...\` করার পর যেকোনো জায়গায় \`FROM vendor_revenue_v\` লিখলেই হয়। View নিজে ডেটা জমায় না; প্রতিবার ভিতরের query চালায়, তাই base টেবিল বদলালে view-এর ফলও বদলায়। কোথায় index বসেছে বা view আছে কি না, তা দেখা যায় \`sqlite_master\` ক্যাটালগ টেবিল থেকে—SQLite নিজের সব অবজেক্টের নাম আর ধরন সেখানেই রাখে।

Index সবসময় লাভজনক নয়: প্রতিটি INSERT, UPDATE আর DELETE-এ index-ও হালনাগাদ করতে হয়, তাই কম-ব্যবহৃত বা কম-বাছাই-ক্ষমতার কলামে index বাড়তি খরচ ডেকে আনে। ছোট টেবিলে পুরো স্ক্যানই দ্রুততর। View-ও সব জায়গায় লাগে না—একই রিপোর্ট তিন-চার জায়গায় দরকার হলে view, নইলে সাধারণ query যথেষ্ট; আর view-এর ভিতরের query ধীর হলে বাইরের SELECT-ও ধীর হয়। তাই আগে প্রশ্ন, তারপর অবজেক্ট।

| দরকার | Statement | কখন ব্যবহার |
| --- | --- | --- |
| দ্রুত lookup | \`CREATE INDEX\` | বারবার একই কলামে ফিল্টার বা JOIN |
| পুনরায় ব্যবহারযোগ্য রিপোর্ট | \`CREATE VIEW\` | একই JOIN/GROUP BY বহু জায়গায় |
| স্কিমা বদল | \`ALTER TABLE\` | কলাম যোগ করা, নাম বদলানো |
| পরিষ্কার করা | \`DROP INDEX/TABLE\` | পরীক্ষামূলক অবজেক্ট সরানো |

## ধাপে ধাপে
১. আগে প্রশ্ন ঠিক করো: ডেটা পড়া, নাকি গঠন বদল? গঠন হলে DDL, নইলে SELECT।
২. Index-এ সেই কলামগুলো নাও যেগুলো WHERE/JOIN-এ বারবার আসে; ক্রমে equality আগে, range পরে।
৩. View-এ পুরো রিপোর্ট query রাখো—alias আর GROUP BY সহ, যেন বাইরে থেকে সরল দেখায়।
৪. তৈরি হয়েছে কি না যাচাই করো \`sqlite_master\`-এ \`type\` আর নাম ধরে; PRAGMA এখানে বন্ধ।
৫. Script-এর শেষে SELECT রাখো, যাতে judge ফল দেখতে পারে।
৬. প্রোডাকশনে চালানোর আগে ভাবো: statement-টা idempotent কি? নাম কি ইতিমধ্যে আছে?

## কোডে দেখি
\`\`\`sql
CREATE INDEX idx_orders_customer_date ON orders (customer_id, ordered_at);

CREATE VIEW vendor_revenue_v AS
SELECT v.name AS vendor,
       SUM(oi.quantity * oi.unit_price_cents) AS revenue_cents
FROM vendors AS v
JOIN products AS p ON p.vendor_id = v.id
JOIN order_items AS oi ON oi.product_id = p.id
GROUP BY v.id, v.name;

SELECT name, type FROM sqlite_master
WHERE name IN ('idx_orders_customer_date', 'vendor_revenue_v')
ORDER BY name;
\`\`\`

## সাধারণ ভুল
Index-এর কলামের ক্রম উল্টে দেওয়া; একই নামে আবার CREATE চালিয়ে error খাওয়া; view-এর ভিতরে \`SELECT *\` রেখে কলাম বদলালে ভেঙে পড়া; \`sqlite_master\`-এ \`type\` ফিল্টার না করা; আর DDL-কে সাধারণ query ভেবে transaction-এর ভিতরে অযথা জটিল করা।`;

const dmlAndTransactionsConcept = `## কেন দরকার
DDL স্কিমা বদলায়, DML ডেটা বদলায়: \`INSERT\` নতুন সারি যোগ করে, \`UPDATE\` বিদ্যমান সারি বদলায়, \`DELETE\` সারি সরায়। ShopSphere-এ নতুন পণ্য তোলা, স্টক বাড়ানো, বন্ধ পণ্য সরানো—সব DML। কিন্তু বাস্তব হিসাবে এক ধাপ বদল একা থাকে না: স্টক কাটার সাথে সাথে inventory_movements-এ এন্ট্রি, পেমেন্টে রেকর্ড, অর্ডারে স্ট্যাটাস—একসাথে হয়। মাঝপথে কোনো statement ব্যর্থ হলে অর্ধেক বদল থেকে গেলে হিসাব মেলে না।

এই কারণেই transaction: \`BEGIN\`-এর পর সব বদল অস্থায়ী, \`COMMIT\` দিলে স্থায়ী, \`ROLLBACK\` দিলে সব বাতিল। ল্যাবের রানার autocommit মোডে চলে, তাই BEGIN সত্যিই transaction খোলে; আর ডেটাবেস মেমোরিতে থাকা কপি, তাই কোনো বদলই বাইরে যায় না। নিরাপদ অভ্যাস: আগে SELECT দিয়ে দেখো কোন সারি বদলাবে, তারপর WHERE সহ UPDATE/DELETE; আর বড় কাজের আগে transaction-এ মুড়ে রাখো, যেন ভুল হলে এক নির্দেশে ফেরা যায়।

## মূল ধারণা
\`UPDATE products SET stock = stock + 6 WHERE name = 'Webcam';\`—এখানে \`stock = stock + 6\` আগের মানের ওপর হিসাব করে, আর WHERE না থাকলে গোটা টেবিল বদলে যেত। \`DELETE\`-ও তাই: WHERE বাদ পড়লে সব সারি চলে যায়, ফেরানোর উপায় থাকে না। INSERT-এ কলাম-তালিকা আর VALUE-এর ক্রম হুবহু মিলতে হবে; FK থাকলে রেফারেন্স করা সারি মুছলে constraint error হয়—আগে নির্ভরশীল সারি সামলাতে হয়।

Transaction-এর অঙ্গ: \`BEGIN\` কাজ শুরু, \`COMMIT\` চূড়ান্ত, \`ROLLBACK\` বাতিল। বড় script-এ মাঝপথের চেকপয়েন্ট রাখতে \`SAVEPOINT\` কাজে লাগে; \`ROLLBACK TO\` দিয়ে শুধু শেষ অংশ ফেরানো যায়। কখন transaction দরকার? যখন একাধিক statement একসাথে সফল বা একসাথে বাতিল হতে হবে—টাকা সরানো, স্টক-লেজার মেলানো, ব্যাচ আপডেট। একক সারির সাধারণ বদলে আলাদা transaction না খুললেও চলে; রানার নিজেই প্রতিটি statement নিরাপদে চালায়।

Sandbox-এর সীমা মনে রাখো: ফাইল বা অন্য ডেটাবেস খোলার সুযোগ নেই, তাই অনুশীলনে যত UPDATE বা DELETE-ই চালাও, প্রভাব শুধু ওই submission-এর কপিতে। আরেকটি সূক্ষ্ম বিষয়—SAVEPOINT: বড় transaction-এ প্রতিটি ধাপের আগে savepoint রাখলে কোনো ধাপ ব্যর্থ হলে শুধু সেটুকু ফেরানো যায়, পুরো কাজ বাতিল না করে। আর autocommit মোডে BEGIN না লিখলে প্রতিটি statement আলাদা transaction; তাই সব-বা-কিছু চাইলে BEGIN স্পষ্ট লেখো, নইলে ROLLBACK-এর ফেরানোর কিছু থাকে না।

| কাজ | Statement | সতর্কতা |
| --- | --- | --- |
| নতুন সারি | \`INSERT INTO ... VALUES (...)\` | কলাম আর মানের ক্রম |
| সারি বদল | \`UPDATE ... SET ... WHERE ...\` | WHERE ছাড়া বিপদ |
| সারি মোছা | \`DELETE FROM ... WHERE ...\` | FK নির্ভরতা |
| সব-বা-কিছু | \`BEGIN ... COMMIT/ROLLBACK\` | শেষে SELECT দিয়ে যাচাই |

## ধাপে ধাপে
১. কোন সারি বদলাবে তা SELECT দিয়ে দেখে নাও; WHERE ঠিক করে নাও।
২. INSERT-এ কলাম-তালিকা স্পষ্ট লেখো, AUTOINCREMENT হলে id বাদ দাও।
৩. UPDATE-এ নতুন মান আগের মানের ওপর হিসাব করলে সেটাই লেখো, fixed সংখ্যা নয়।
৪. কয়েক ধাপ একসাথে করলে BEGIN দিয়ে শুরু করো, প্রতিটি ধাপ শেষে যাচাই করো, শেষে COMMIT বা ROLLBACK।
৫. ROLLBACK-এর পরে SELECT দিয়ে প্রমাণ করো যে মান আগের মতোই আছে।
৬. Script-এর শেষ statement SELECT রাখো—শুধু শেষ SELECT-এর ফল judge মেলায়।

## কোডে দেখি
\`\`\`sql
BEGIN;

UPDATE products SET stock = stock + 100 WHERE id = 8;
UPDATE vendors SET rating = 1.0 WHERE id = 4;

ROLLBACK;

SELECT p.name AS product, p.stock, v.name AS vendor, v.rating
FROM products AS p
JOIN vendors AS v ON v.id = p.vendor_id
WHERE p.id = 8;
\`\`\`

## সাধারণ ভুল
WHERE ছাড়া UPDATE/DELETE চালানো; \`stock = stock + 6\`-এর বদলে ভুলে fixed মান বসানো; FK-তে আটকে থাকা সারি মুছতে যাওয়া; BEGIN ছাড়া ROLLBACK লেখা; COMMIT-এর পর আবার একই UPDATE চালিয়ে মান দ্বিগুণ করা; আর script SELECT-এ শেষ না করে UPDATE-এ থেমে যাওয়া।`;

export const ADVANCED_SQL_LAB_TOPICS: LearningTopicDefinition[] = [
  {
    slug: "ddl-and-indexes",
    title: "DDL & indexes",
    titleBn: "DDL ও ইনডেক্স",
    summary:
      "Sandbox-এ CREATE INDEX আর CREATE VIEW লিখে স্কিমা বদলানো, sqlite_master দিয়ে যাচাই করা, আর কখন index বা view ব্যবহার করবে তা বোঝা।",
    concept: ddlAndIndexesConcept,
    guidedProblemSlugs: ["sql-lab-create-index", "sql-lab-create-view"],
    practiceProblemSlugs: { easy: [], medium: [], hard: [] },
    extraProblemSlugs: [],
  },
  {
    slug: "dml-and-transactions",
    title: "DML & transactions",
    titleBn: "DML ও ট্রানজেকশন",
    summary:
      "INSERT/UPDATE/DELETE নিরাপদে চালানো, BEGIN/COMMIT/ROLLBACK দিয়ে সব-বা-কিছু নীতি, আর কোন কাজে transaction লাগে তা ঠিক করা।",
    concept: dmlAndTransactionsConcept,
    guidedProblemSlugs: ["sql-lab-dml", "sql-lab-transaction"],
    practiceProblemSlugs: { easy: [], medium: [], hard: [] },
    extraProblemSlugs: [],
  },
];
