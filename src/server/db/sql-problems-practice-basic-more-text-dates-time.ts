import type { SeedProblem } from "./seed-problems";

export const SQL_PROBLEMS_PRACTICE_BASIC_MORE_TEXT_DATES_TIME: SeedProblem[] = [
  {
    slug: "sql-practice-text-dates-time-hard",
    title: "Payment to doorstep",
    statement: `লজিস্টিক টিম ডেলিভারি-স্পিড মাপছে: পেমেন্ট সেটেল হওয়া থেকে পার্সেল হাতে পৌঁছাতে কত দিন লাগে। যেসব অর্ডারের একটা \`paid\` পেমেন্ট আছে এবং শিপমেন্ট \`delivered\` — তাদের \`order_id\`, \`method\` (পেমেন্টের) আর \`days_to_deliver\` (delivered_at থেকে paid_at বাদ দিয়ে পূর্ণ দিন, ভগ্নাংশ বাদ) বের করো; দিন নিচের ক্রমে, সমান হলে অর্ডার আইডি অনুযায়ী।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`order_id\`, \`method\`, \`days_to_deliver\` — দিন নিচের ক্রমে, টাই-এ \`order_id\`।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## ধারণা
দুই টেবিলের টাইমস্ট্যাম্পের ব্যবধান: \`julianday(s.delivered_at) - julianday(p.paid_at)\` — জুলিয়ান দিনে দশমিক ব্যবধান, তারপর \`CAST(... AS INTEGER)\` ভগ্নাংশ ফেলে দেয়। \`paid_at\`-এ সময়ও বসে আছে (\`2026-10-01 10:15\`-এর মতো) কিন্তু \`delivered_at\` শুধু তারিখ — julianday দুটোকেই এক স্কেলে টেনে আনে, নিজে বিয়োগ করতে হয় না। দুই জোড়াই INNER, শর্তগুলো \`ON\`-এ বা \`WHERE\`-এ — এখানে দুই-ই সমান।

## ধাপে ধাপে
১. \`orders o JOIN payments p ON p.order_id = o.id AND p.status = 'paid'\`।
২. \`JOIN shipments s ON s.order_id = o.id AND s.status = 'delivered'\`।
৩. \`CAST(julianday(s.delivered_at) - julianday(p.paid_at) AS INTEGER) AS days_to_deliver\`।
৪. \`ORDER BY days_to_deliver, o.id\`।

## কোডে দেখি
\`\`\`sql
SELECT o.id AS order_id, p.method,
       CAST(julianday(s.delivered_at) - julianday(p.paid_at) AS INTEGER) AS days_to_deliver
FROM orders o
JOIN payments p ON p.order_id = o.id AND p.status = 'paid'
JOIN shipments s ON s.order_id = o.id AND s.status = 'delivered'
ORDER BY days_to_deliver, o.id;
\`\`\`

## সাধারণ ভুল
স্ট্যাটাস ফিল্টার ছাড়া জুড়ে \`refunded\`/\`failed\` পেমেন্টও আনা — এক অর্ডারে একাধিক পেমেন্ট থাকতে পারে, তখন একই অর্ডার দুইবার ফলে; দিনের হিসাবে স্ট্রিং-বিয়োগ (\`substr\` ইত্যাদি) খাটানো; CAST ছাড়া দশমিক প্রিন্ট; টাই-এ \`o.id\` না দিয়ে ক্রম অনির্দিষ্ট রাখা।`,
    difficulty: "HARD",
    points: 250,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    category: "SQL Basics",
    subcategory: "Text, dates & time",
    referencePython: "",
    referenceSql: `SELECT o.id AS order_id, p.method, CAST(julianday(s.delivered_at) - julianday(p.paid_at) AS INTEGER) AS days_to_deliver FROM orders o JOIN payments p ON p.order_id = o.id AND p.status = 'paid' JOIN shipments s ON s.order_id = o.id AND s.status = 'delivered' ORDER BY days_to_deliver, o.id;`,
    tests: [
      {
        input: ``,
        expectedOutput: `3	card	1
1	bkash	2
6	cod	2
8	card	2
9	bkash	2`,
        isSample: true
      },
      {
        input: `update shipments set delivered_at='2026-10-09' where order_id=1;`,
        expectedOutput: `3	card	1
6	cod	2
8	card	2
9	bkash	2
1	bkash	7`,
        isSample: true
      },
      {
        input: `update payments set paid_at='2026-10-22 08:00' where id=6;`,
        expectedOutput: `6	cod	0
3	card	1
1	bkash	2
8	card	2
9	bkash	2`,
        isSample: false
      },
      {
        input: `update shipments set status='shipped', delivered_at=NULL where order_id=9;`,
        expectedOutput: `3	card	1
1	bkash	2
6	cod	2
8	card	2`,
        isSample: false
      },
      {
        input: `update shipments set status='delivered', delivered_at='2026-11-03' where order_id=10;`,
        expectedOutput: `10	card	0
3	card	1
1	bkash	2
6	cod	2
8	card	2
9	bkash	2`,
        isSample: false
      },
    ],
  },
  {
    slug: "sql-practice-text-dates-time-challenge",
    title: "Campaign week carts",
    statement: `ক্যাম্পেইন-উইকের (১ নভেম্বর ০০:০০ থেকে ৭ নভেম্বর সারাদিন — অর্থাৎ ৮ নভেম্বরের আগে) ভেতরে যেসব কার্ট শেষবার ছোঁয়া হয়েছিল (\`updated_at\`), সেগুলোর রিপোর্ট লাগবে। প্রতি কার্টের \`cart_id\`, কাস্টমারের \`customer\` (নাম), \`status\` ও \`updated_at\` বের করো; \`updated_at\` অনুযায়ী, সমান হলে কার্ট আইডি অনুযায়ী। ৭ নভেম্বরের রাত এগারোটা-বারোটার টাচও ভেতরেই গোনা হবে।`,
    inputFormat: "কোনো ইনপুট নেই — একটি SQL query লেখো।",
    outputFormat: `প্রতি লাইনে \`cart_id\`, \`customer\`, \`status\`, \`updated_at\` — \`updated_at\` অনুযায়ী, টাই-এ \`cart_id\`।`,
    constraints: "ShopSphere fixture. Standard SQL (SQLite-compatible engine).",
    editorial: `## ধারণা
\`updated_at\`-এ সময়ও বসে আছে (\`2026-11-07 22:15\`-এর মতো)। \`<= '2026-11-07'\` দিলে সেই দিনের যেকোনো সময়-ওয়ালা মান বাদ পড়ে — স্ট্রিং-তুলনায় \`'2026-11-07 22:15' > '2026-11-07'\`। নিরাপদ প্যাটার্ন অর্ধ-খোলা ব্যবধান: \`>= '2026-11-01' AND < '2026-11-08'\` — তারিখ-স্ট্রিং-এ সময় যা-ই থাকুক, শেষ দিনটা পুরো ঢুকে যায়। \`date(updated_at)\` দিয়েও চলতো, কিন্তু সব সারিতে ফাংশন-কল চালানোর চেয়ে প্রান্ত-তুলনাই হালকা ও অভ্যাসযোগ্য।

## ধাপে ধাপে
১. \`carts ca JOIN customers cu ON cu.id = ca.customer_id\` — নাম আনো।
২. \`WHERE ca.updated_at >= '2026-11-01' AND ca.updated_at < '2026-11-08'\`।
৩. \`ORDER BY ca.updated_at, ca.id\`।

## কোডে দেখি
\`\`\`sql
SELECT ca.id AS cart_id, cu.name AS customer, ca.status, ca.updated_at
FROM carts ca
JOIN customers cu ON cu.id = ca.customer_id
WHERE ca.updated_at >= '2026-11-01' AND ca.updated_at < '2026-11-08'
ORDER BY ca.updated_at, ca.id;
\`\`\`

## সাধারণ ভুল
\`BETWEEN '2026-11-01' AND '2026-11-07'\` — ৭ তারিখের রাতের টাচ চুপচাপ হারায়, লুকানো টেস্টেই ধরা পড়বে; শুধু সময়-অংশ মিলিয়ে (\`substr(updated_at, 12, 2)\` জাতীয়) জটিল তুলনা বানানো; \`ORDER BY\`-তে শুধু updated_at দিয়ে টাই এলোমেলো রাখা; ৮ তারিখের ভোররাত ঢোকানো — \`< '2026-11-08'\` সেটাকে বাইরেই রাখবে।`,
    difficulty: "MEDIUM",
    points: 225,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["SQL", "Project"], judgeLanguage: "sql",
    category: "SQL Basics",
    subcategory: "Text, dates & time",
    referencePython: "",
    referenceSql: `SELECT ca.id AS cart_id, cu.name AS customer, ca.status, ca.updated_at FROM carts ca JOIN customers cu ON cu.id = ca.customer_id WHERE ca.updated_at >= '2026-11-01' AND ca.updated_at < '2026-11-08' ORDER BY ca.updated_at, ca.id;`,
    tests: [
      {
        input: ``,
        expectedOutput: `6	Tanvir	active	2026-11-01 10:00`,
        isSample: true
      },
      {
        input: `insert into carts (id,customer_id,status,created_at,updated_at) values (9,3,'abandoned','2026-11-07 09:00','2026-11-07 22:15');`,
        expectedOutput: `6	Tanvir	active	2026-11-01 10:00
9	Nusrat	abandoned	2026-11-07 22:15`,
        isSample: true
      },
      {
        input: `update carts set updated_at='2026-11-03 14:00' where id=7;`,
        expectedOutput: `6	Tanvir	active	2026-11-01 10:00
7	Rahim	active	2026-11-03 14:00`,
        isSample: false
      },
      {
        input: `update carts set updated_at='2026-11-05 10:00' where id=2; update carts set updated_at='2026-11-06 09:30' where id=4;`,
        expectedOutput: `6	Tanvir	active	2026-11-01 10:00
2	Karim	abandoned	2026-11-05 10:00
4	Sajid	abandoned	2026-11-06 09:30`,
        isSample: false
      },
      {
        input: `update carts set updated_at='2026-11-07 23:59' where id=6;`,
        expectedOutput: `6	Tanvir	active	2026-11-07 23:59`,
        isSample: false
      },
    ],
  },
];
