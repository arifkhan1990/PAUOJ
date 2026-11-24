import type { SeedProblem } from "./seed-problems";

export const SQL_PROBLEMS_PRACTICE_BASIC_TEXT_AND_DATES: SeedProblem[] = [
  {
    slug: "sql-practice-text-and-dates-easy",
    title: "Sundarban parcels",
    statement: `সাপোর্ট ডেস্কে কাস্টমার ফোন করে জানতে চায় তার পার্সেল কোন কুরিয়ারের হাতে। সুন্দরবন কুরিয়ারের সব পার্সেলের ট্র্যাকিং নম্বর \`SUN-\` দিয়ে শুরু হয়। \`shipments\` থেকে সেই পার্সেলগুলোর \`tracking_no\`, \`order_id\` ও \`status\` বের করো — ট্র্যাকিং নম্বর অনুযায়ী সাজাও।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`tracking_no\`, \`order_id\`, \`status\` — ট্র্যাকিং নম্বর অনুযায়ী সাজানো।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## ধারণা
\`LIKE 'SUN%'\` মানে 'শুরুতে \`SUN\`, তারপর যা-ই হোক' — প্যাটার্নটা শুরুর, তাই \`%\` শুধু শেষে। দুপাশে \`%\` (\`%SUN%\`) দিলে মাঝের ম্যাচও ঢুকে পড়তো, আর প্রিফিক্স-ম্যাচ ইনডেক্সেও চলে — দুপাশ-খোলা ম্যাচ চলে না। \`orders\`-এর সাথে জোড়া দিয়ে অর্ডার আইডি আনা হয়, কারণ \`shipments\`-এ আছলে কেবল \`order_id\`।

## ধাপে ধাপে
১. \`shipments\` + \`orders\` JOIN করো।
২. \`WHERE s.tracking_no LIKE 'SUN%'\`।
৩. \`ORDER BY s.tracking_no\`।

## কোডে দেখি
\`\`\`sql
SELECT s.tracking_no, o.id AS order_id, s.status
FROM shipments s
JOIN orders o ON o.id = s.order_id
WHERE s.tracking_no LIKE 'SUN%'
ORDER BY s.tracking_no;
\`\`\`

## সাধারণ ভুল
দুপাশে \`%\` দিয়ে (\`%SUN%\`) শুধু-শুরুর শর্ত নরম করা; \`GLOB\` ব্যবহার করে \`*\` wildcard আশা করা; \`=\` দিয়ে পুরো নম্বর মেলাতে যাওয়া; \`order_id\` আনতে JOIN বাদ দেওয়া।`,
    difficulty: "EASY",
    points: 150,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    category: "SQL Basics",
    subcategory: "Text search",
    referencePython: "",
    referenceSql: `SELECT s.tracking_no, o.id AS order_id, s.status FROM shipments s JOIN orders o ON o.id = s.order_id WHERE s.tracking_no LIKE 'SUN%' ORDER BY s.tracking_no;`,
    tests: [
      {
        input: ``,
        expectedOutput: `SUN-1001	1	delivered
SUN-1004	4	shipped
SUN-1007	7	shipped
SUN-1009	9	delivered`,
        isSample: true
      },
      {
        input: `insert into shipments (id,order_id,carrier,tracking_no,status,shipped_at,delivered_at) values (9,2,'Sundarban','SUN-1102','shipped','2026-11-04',NULL);`,
        expectedOutput: `SUN-1001	1	delivered
SUN-1004	4	shipped
SUN-1007	7	shipped
SUN-1009	9	delivered
SUN-1102	2	shipped`,
        isSample: true
      },
      {
        input: `update shipments set carrier='Pathao', tracking_no='PAT-1001' where id=1;`,
        expectedOutput: `SUN-1004	4	shipped
SUN-1007	7	shipped
SUN-1009	9	delivered`,
        isSample: false
      },
      {
        input: `update shipments set status='delivered', delivered_at='2026-10-13' where id=5;`,
        expectedOutput: `SUN-1001	1	delivered
SUN-1004	4	shipped
SUN-1007	7	delivered
SUN-1009	9	delivered`,
        isSample: false
      },
      {
        input: `delete from shipments where id=3;`,
        expectedOutput: `SUN-1001	1	delivered
SUN-1007	7	shipped
SUN-1009	9	delivered`,
        isSample: false
      },
    ],
  },
  {
    slug: "sql-practice-text-and-dates-medium",
    title: "October payments",
    statement: `ফাইন্যান্স টিম অক্টোবর মাসে প্রসেস হওয়া পেমেন্টের খতিয়ান তৈরি করছে। \`payments\` থেকে যেসব পেমেন্ট \`paid_at\` অক্টোবরে (২০২৬-১০-০১ থেকে ২০২৬-১১-০১-এর আগে), তাদের \`payment_id\`, \`method\`, \`amount_cents\`, \`paid_at\` বের করো — \`paid_at\` অনুযায়ী, একই সময়ে আইডি অনুযায়ী।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`payment_id\`, \`method\`, \`amount_cents\`, \`paid_at\` — \`paid_at\` ঊর্ধ্বক্রম, সমান হলে \`payment_id\` অনুযায়ী।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## ধারণা
\`paid_at\`-এ সময়ও লেখা আছে (\`2026-10-25 11:00\`-এর মতো), তাই মাসের রেঞ্জ লিখতে হাফ-ওপেন রূপ: \`>= '2026-10-01' AND < '2026-11-01'\`। \`BETWEEN '2026-10-01' AND '2026-10-31'\` লিখলে \`2026-10-31 15:00\`-এর রেকর্ড বাদ পড়ে, আবার শেষ সীমা \`'2026-11-01'\` দিলে নভেম্বরের প্রথম মুহূর্ত ঢুকে পড়ে। ISO ফরম্যাটে টেক্সট-তুলনাই ক্যালেন্ডার-ক্রম মেনে চলে। আর \`paid_at\` NULL হলে (এখনো জমা হয়নি) কোনো তুলনাই সত্য হয় না — সেই সারি স্বাভাবিকভাবেই বাদ।

## ধাপে ধাপে
১. \`WHERE p.paid_at >= '2026-10-01' AND p.paid_at < '2026-11-01'\`।
২. NULL \`paid_at\` নিজেই বাদ পড়বে — আলাদা কিছু লাগে না।
৩. \`ORDER BY p.paid_at, p.id\`।

## কোডে দেখি
\`\`\`sql
SELECT p.id AS payment_id, p.method, p.amount_cents, p.paid_at
FROM payments p
WHERE p.paid_at >= '2026-10-01' AND p.paid_at < '2026-11-01'
ORDER BY p.paid_at, p.id;
\`\`\`

## সাধারণ ভুল
\`BETWEEN ... '2026-10-31'\` লিখে শেষ দিনের সময়-সহ রেকর্ড হারানো; হাফ-ওপেন রেঞ্জের বদলে \`substr\` দিয়ে মাস কেটে ইনডেক্স-বান্ধুনী পথ ছাড়া; NULL \`paid_at\` আলাদা করে সামলাতে গিয়ে শর্ত জটিল করা; টাই-ব্রেকার \`payment_id\` না দেওয়া।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    category: "SQL Basics",
    subcategory: "Date filtering",
    referencePython: "",
    referenceSql: `SELECT p.id AS payment_id, p.method, p.amount_cents, p.paid_at FROM payments p WHERE p.paid_at >= '2026-10-01' AND p.paid_at < '2026-11-01' ORDER BY p.paid_at, p.id;`,
    tests: [
      {
        input: ``,
        expectedOutput: `1	bkash	890000	2026-10-01 10:15
3	card	600000	2026-10-05 12:40
11	bkash	450000	2026-10-08 09:00
4	bkash	2000000	2026-10-10 09:05
5	card	170000	2026-10-12 15:20
6	cod	605000	2026-10-20 18:10
7	bkash	670000	2026-10-22 14:30
8	card	180000	2026-10-25 11:00
9	bkash	120000	2026-10-28 16:45`,
        isSample: true
      },
      {
        input: `update payments set paid_at='2026-10-31 23:59' where id=10;`,
        expectedOutput: `1	bkash	890000	2026-10-01 10:15
3	card	600000	2026-10-05 12:40
11	bkash	450000	2026-10-08 09:00
4	bkash	2000000	2026-10-10 09:05
5	card	170000	2026-10-12 15:20
6	cod	605000	2026-10-20 18:10
7	bkash	670000	2026-10-22 14:30
8	card	180000	2026-10-25 11:00
9	bkash	120000	2026-10-28 16:45
10	card	380000	2026-10-31 23:59`,
        isSample: true
      },
      {
        input: `update payments set paid_at='2026-11-01 00:00' where id=9;`,
        expectedOutput: `1	bkash	890000	2026-10-01 10:15
3	card	600000	2026-10-05 12:40
11	bkash	450000	2026-10-08 09:00
4	bkash	2000000	2026-10-10 09:05
5	card	170000	2026-10-12 15:20
6	cod	605000	2026-10-20 18:10
7	bkash	670000	2026-10-22 14:30
8	card	180000	2026-10-25 11:00`,
        isSample: false
      },
      {
        input: `update payments set paid_at=NULL where id in (4,11);`,
        expectedOutput: `1	bkash	890000	2026-10-01 10:15
3	card	600000	2026-10-05 12:40
5	card	170000	2026-10-12 15:20
6	cod	605000	2026-10-20 18:10
7	bkash	670000	2026-10-22 14:30
8	card	180000	2026-10-25 11:00
9	bkash	120000	2026-10-28 16:45`,
        isSample: false
      },
      {
        input: `update payments set paid_at='2026-10-28 16:45' where id=10;`,
        expectedOutput: `1	bkash	890000	2026-10-01 10:15
3	card	600000	2026-10-05 12:40
11	bkash	450000	2026-10-08 09:00
4	bkash	2000000	2026-10-10 09:05
5	card	170000	2026-10-12 15:20
6	cod	605000	2026-10-20 18:10
7	bkash	670000	2026-10-22 14:30
8	card	180000	2026-10-25 11:00
9	bkash	120000	2026-10-28 16:45
10	card	380000	2026-10-28 16:45`,
        isSample: false
      },
    ],
  },
];
