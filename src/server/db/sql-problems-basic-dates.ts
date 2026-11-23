import type { SeedProblem } from "./seed-problems";

export const SQL_PROBLEMS_BASIC_DATES: SeedProblem[] = [
  {
    slug: "sql-customer-search",
    title: "Customer search box",
    statement: `সাপোর্ট এজেন্ট ফোনে যা শুনে তাই সার্চ বাক্সে টাইপ করে — কাস্টমারের নামের টুকরোও হতে পারে, আবার শহরের নামও। এবার এজেন্ট টাইপ করেছে \`DHA\` — সব বড় হাতের অক্ষরে, অথচ ডেটাবেসে শহরের নাম লেখা 'Dhaka'। এমন সব কাস্টমার খুঁজে আনো যার **নাম বা শহরে** \`dha\` অংশটি আছে — অক্ষরের কেস বাধা হবে না: \`name\`, \`city\`, \`signup_date\` দাও। সাজাও সাইনআপের তারিখ অনুযায়ী, সমান তারিখে নাম অনুযায়ী।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`name\`, \`city\`, \`signup_date\` — সাইনআপের তারিখ অনুযায়ী, সমান তারিখে \`name\` অনুযায়ী।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## কেন দরকার
সাপোর্টের সার্চ বাক্স কখনো নিখুঁত নয় — এজেন্ট শুনে শুনে টাইপ করে, অক্ষরের কেস তো নিয়ন্ত্রণেই নেই। তাই মিলাতে হয় কেস উপেক্ষা করে, আর খুঁজতে হয় দুই জায়গায় — নামেও, শহরেও — কারণ এজেন্ট জানেই না সে যেটা শুনেছে সেটা কোনটা। এই প্রশ্নে \`dha\` অংশটা 'Dhaka'-র ভেতরে আছে, আবার কারো নামের ভেতরেও থাকতে পারে।

## মূল ধারণা
\`LIKE '%dha%'\` — দুপাশের \`%\` মানে অংশটা শব্দের যেকোনো জায়গায় (শুরু, মাঝ, শেষ)। কেস উপেক্ষা করতে দুই দিকই lowercase করো: \`lower(name) LIKE '%dha%'\` — SQLite-র \`LIKE\` ASCII-তে নিজে থেকেই কেস-ইনসেনসিটিভ, কিন্তু সব ইঞ্জিনে তা নয়, তাই \`lower()\` অভ্যাসটা গোড়া থেকে গড়ে নাও। দুই কলামে খুঁজতে \`OR\` দিয়ে দুই প্যাটার্ন জোড়ো — \`AND\` দিলে নাম **এবং** শহর দুইতেই \`dha\` থাকতে হতো। আর সাজানো: \`signup_date\` টেক্সট হলেও ISO (\`YYYY-MM-DD\`) ফরম্যাটে — এই ফরম্যাটের সবচেয়ে বড় গুণ, টেক্সটের অভিধান-ক্রম আর ক্যালেন্ডারের ক্রম একই; তাই \`ORDER BY signup_date, name\`-ই যথেষ্ট, কোনো রূপান্তর লাগে না।

## ধাপে ধাপে
১. \`customers\` থেকে \`name\`, \`city\`, \`signup_date\` নাও।
২. \`WHERE lower(name) LIKE '%dha%' OR lower(city) LIKE '%dha%'\`।
৩. \`ORDER BY signup_date, name\` — টাই-ব্রেকারসহ।

## কোডে দেখি
\`\`\`sql
SELECT c.name, c.city, c.signup_date
FROM customers c
WHERE lower(c.name) LIKE '%dha%'
   OR lower(c.city) LIKE '%dha%'
ORDER BY c.signup_date, c.name;
\`\`\`

## কমপ্লেক্সিটি
\`LIKE '%...%'\` প্যাটার্ন প্রতিটি সারি পুরো পড়ে — \`O(n)\` স্ক্যান; \`%\`-শুরু প্যাটার্নে B-tree ইনডেক্স কাজে আসে না, তাই ছোট টেবিলে এমন স্ক্যানই স্বাভাবিক।

## সাধারণ ভুল
\`LIKE 'dha%'\` লিখে শুধু শুরুর ম্যাচ খোঁজা — নামের মাঝে বা শেষে থাকা অংশ হারিয়ে যায়; \`AND\` দিয়ে দুই কলামের শর্ত জোড়া; \`lower()\` এক পাশে দিয়ে অন্য পাশ বড় হাতের রাখা — \`lower(name) LIKE '%DHA%'\` কখনোই মিলবে না; তারিখ সাজাতে মাস-দিন আগে এমন ফরম্যাট ধরা — ISO ফরম্যাটে টেক্সট-ক্রমই তারিখ-ক্রম।`,
    difficulty: "EASY",
    points: 150,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    category: "SQL Basics",
    subcategory: "Text, dates & time",
    referencePython: "",
    referenceSql: `SELECT c.name, c.city, c.signup_date FROM customers c WHERE lower(c.name) LIKE '%dha%' OR lower(c.city) LIKE '%dha%' ORDER BY c.signup_date, c.name;`,
    tests: [
      {
        input: ``,
        expectedOutput: `Rahim	Dhaka	2026-01-12
Nusrat	Dhaka	2026-02-21
Tanvir	Dhaka	2026-04-02`,
        isSample: true
      },
      {
        input: `update customers set name='Dhali Mim' where id=5;`,
        expectedOutput: `Rahim	Dhaka	2026-01-12
Nusrat	Dhaka	2026-02-21
Dhali Mim	Khulna	2026-03-18
Tanvir	Dhaka	2026-04-02`,
        isSample: true
      },
      {
        input: `update customers set city='Dhaka' where id=2;`,
        expectedOutput: `Rahim	Dhaka	2026-01-12
Karim	Dhaka	2026-02-03
Nusrat	Dhaka	2026-02-21
Tanvir	Dhaka	2026-04-02`,
        isSample: false
      },
      {
        input: `update customers set city='Sylhet' where id in (1,6);`,
        expectedOutput: `Nusrat	Dhaka	2026-02-21`,
        isSample: false
      },
      {
        input: `insert into customers (id,name,city,signup_date) values (7,'Dhiman Rahman','Dhaka','2026-05-09');`,
        expectedOutput: `Rahim	Dhaka	2026-01-12
Nusrat	Dhaka	2026-02-21
Tanvir	Dhaka	2026-04-02
Dhiman Rahman	Dhaka	2026-05-09`,
        isSample: false
      },
    ],
  },
  {
    slug: "sql-order-age",
    title: "Order age in days",
    statement: `ফাইন্যান্স টিমের মাসিক রিপোর্ট বানায় নির্দিষ্ট তারিখে — এবার \`2026-11-30\`। রিপোর্টে চায় প্রতিটি কার্যকর (\`paid\`/\`shipped\`) অর্ডার রিপোর্টের তারিখ থেকে কতদিন আগে হয়েছিল — বয়স্ক অর্ডারগুলোই দীর্ঘ ডেলিভারি-চক্র বা ডেটা-গোলমালের প্রধান সন্দেহভাজন। প্রতিটি কার্যকর অর্ডারের জন্য বের করো: \`order_id\`, কাস্টমারের নাম (\`customer\`), \`ordered_at\` আর রিপোর্ট তারিখ \`2026-11-30\` থেকে অর্ডারের বয়স **পূর্ণ দিনে** (\`age_days\`) — ভগ্নাংশ বাদ, মানে ৬০.৯ দিন হলে বয়স ৬০। সাজাও বয়স কমানো ক্রমে, সমান হলে \`order_id\` অনুযায়ী।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`order_id\`, \`customer\`, \`ordered_at\`, \`age_days\` — বয়স কমানো ক্রমে, সমান হলে \`order_id\` অনুযায়ী।`,
    constraints: "ShopSphere fixture. SQLite-compatible SQL; date arithmetic uses julianday.",
    editorial: `## কেন দরকার
'কতদিন আগে' — বয়সের হিসাব রিপোর্টের প্রাণ। SLA মনিটরিং, বকেয়া তালিকা, ডেলিভারি-চক্রের বিশ্লেষণ — সবই দুই তারিখের পার্থক্য থেকে শুরু। ISO টেক্সট তারিখে তুলনা (\`<\`, \`>=\`) চলে, কিন্তু **বিয়োগ** চলে না — তাই দরকার এমন ফাংশন যেটা তারিখকে সংখ্যায় নামায়।

## মূল ধারণা
SQLite-এ \`julianday(x)\` যেকোনো বৈধ তারিখ/সময়কে জুলিয়ান দিন-সংখ্যায় (একটা float) নামায় — তাই দুই তারিখের বিয়োগই দিনের পার্থক্য: \`julianday('2026-11-30') - julianday(ordered_at)\`। পূর্ণ দিন রাখতে \`CAST(... AS INTEGER)\` — ভগ্নাংশ ফেলে দেয়। সতর্কতা দুইটা। প্রথমত, সময়-সহ টাইমস্ট্যাম্প (\`2026-10-01 15:30\`) হলে বিয়োগে ভগ্নাংশ আসে — ৬০.৯ দিনের অর্ডার ৬০-ই থাকবে, নিয়ম মেনেই; কিন্তু তুলনার এক পাশে তারিখ-শুধু আর আরেক পাশে সময়-সহ মান থাকলে আধা-দিনের এদিক-ওদিক হতে পারে। দ্বিতীয়ত, টাইমজোন — \`julianday\` UTC ধরে কাজ করে; স্থানীয় সময়ে লেখা টাইমস্ট্যাম্প আধা-দিন এদিক-ওদিক সরে যেতে পারে। ShopSphere-এর সব তারিখ তারিখ-শুধু ISO টেক্সট, তাই এই ফাঁদে পড়ার ঝুঁকি নেই — নিজের প্রজেক্টে সময় রাখলে নিয়ম একটাই: UTC রাখো, নইলে তারিখ-শুধু ISO।

## ধাপে ধাপে
১. \`orders\` + \`customers\` জোড়া দাও, \`WHERE status IN ('paid','shipped')\`।
২. \`CAST(julianday('2026-11-30') - julianday(o.ordered_at) AS INTEGER)\` বয়স বানাও।
৩. \`ORDER BY age_days DESC, o.id\` — পুরনো আগে, টাই-তে আইডি।

## কোডে দেখি
\`\`\`sql
SELECT o.id AS order_id,
       c.name AS customer,
       o.ordered_at,
       CAST(julianday('2026-11-30') - julianday(o.ordered_at) AS INTEGER) AS age_days
FROM orders o
JOIN customers c ON c.id = o.customer_id
WHERE o.status IN ('paid','shipped')
ORDER BY age_days DESC, o.id;
\`\`\`

## কমপ্লেক্সিটি
প্রতি সারিতে \`julianday(ordered_at)\` একবার পার্স — \`O(n)\`; রিপোর্ট তারিখটা ধ্রুবক, একবারই পার্স হয়।

## সাধারণ ভুল
তারিখকে সংখ্যা ভেবে \`20261130 - 20261001\`-এর মতো বিয়োগ — মাসের গণিত পুরো ভেঙে যায়; \`CAST\` ছাড়া রিপোর্টে \`60.0\`-এর জায়গায় দশমিকসহ সংখ্যা; রিপোর্ট তারিখের জায়গায় \`date('now')\` লিখে ফেলা — প্রতিদিন ফল বদলে যাবে, এই প্রশ্নে তারিখ নির্দিষ্ট \`2026-11-30\`; status ফিল্টার ভুলে cancelled অর্ডারও বয়স্ক তালিকায় তোলা; \`age_days DESC\` আর \`ordered_at DESC\` একই ভেবে টাই-ব্রেকার (\`order_id\`) বাদ দেওয়া।`,
    difficulty: "MEDIUM",
    points: 175,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    category: "SQL Basics",
    subcategory: "Text, dates & time",
    referencePython: "",
    referenceSql: `SELECT o.id AS order_id, c.name AS customer, o.ordered_at, CAST(julianday('2026-11-30') - julianday(o.ordered_at) AS INTEGER) AS age_days FROM orders o JOIN customers c ON c.id = o.customer_id WHERE o.status IN ('paid','shipped') ORDER BY age_days DESC, o.id;`,
    tests: [
      {
        input: ``,
        expectedOutput: `1	Rahim	2026-10-01	60
3	Nusrat	2026-10-05	56
4	Rahim	2026-10-10	51
6	Rahim	2026-10-20	41
7	Mim	2026-10-22	39
8	Karim	2026-10-25	36
9	Nusrat	2026-10-28	33
10	Tanvir	2026-11-02	28`,
        isSample: true
      },
      {
        input: `update orders set ordered_at='2026-11-28' where id=8;`,
        expectedOutput: `1	Rahim	2026-10-01	60
3	Nusrat	2026-10-05	56
4	Rahim	2026-10-10	51
6	Rahim	2026-10-20	41
7	Mim	2026-10-22	39
9	Nusrat	2026-10-28	33
10	Tanvir	2026-11-02	28
8	Karim	2026-11-28	2`,
        isSample: true
      },
      {
        input: `update orders set status='paid' where id=5;`,
        expectedOutput: `1	Rahim	2026-10-01	60
3	Nusrat	2026-10-05	56
4	Rahim	2026-10-10	51
5	Sajid	2026-10-12	49
6	Rahim	2026-10-20	41
7	Mim	2026-10-22	39
8	Karim	2026-10-25	36
9	Nusrat	2026-10-28	33
10	Tanvir	2026-11-02	28`,
        isSample: false
      },
      {
        input: `update orders set ordered_at='2026-10-01' where id=3;`,
        expectedOutput: `1	Rahim	2026-10-01	60
3	Nusrat	2026-10-01	60
4	Rahim	2026-10-10	51
6	Rahim	2026-10-20	41
7	Mim	2026-10-22	39
8	Karim	2026-10-25	36
9	Nusrat	2026-10-28	33
10	Tanvir	2026-11-02	28`,
        isSample: false
      },
      {
        input: `update orders set status='cancelled' where id in (6,7);`,
        expectedOutput: `1	Rahim	2026-10-01	60
3	Nusrat	2026-10-05	56
4	Rahim	2026-10-10	51
8	Karim	2026-10-25	36
9	Nusrat	2026-10-28	33
10	Tanvir	2026-11-02	28`,
        isSample: false
      },
    ],
  },
];
