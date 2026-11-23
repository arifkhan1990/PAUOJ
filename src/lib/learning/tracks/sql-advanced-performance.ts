import type { LearningTopicDefinition } from "@/lib/learning/types";

/** Concept notes for the advanced query-performance topic of the ShopSphere SQL track. */

const queryPerformanceConcept = `## কেন দরকার
একই প্রশ্নের দুটি query-র ফল এক, অথচ একটা চলে ৩০ মিলিসেকেন্ডে, আরেকটা ৩০ সেকেন্ডে। পার্থক্যটা লেখার ধরনে, অর্থাৎ ইঞ্জিন query-টা কীভাবে চালাচ্ছে। ShopSphere-এর কয়েক ডজন সারিতে ধীরত্ব চোখে পড়ে না, কিন্তু আসল দোকানে orders টেবিলে কোটি সারি — সেখানে একটা ধীর query মানে টাইমআউট, জমে থাকা লক, আর ব্যবহারকারীর ধৈর্যের শেষ। ভালো খবর: ধীর query-র কারণ লুকানো থাকে না — ডেটাবেস নিজেই জানায় সে কী করছে, শুধু সেই প্রতিবেদন পড়তে হয়। এই টপিক সেই পড়া শেখায়: প্ল্যান পড়া, index-এর ভেতরটা বোঝা, ফিল্টার এমনভাবে লেখা যেন index সত্যিই কাজে লাগে, pagination-এর সঠিক কৌশল, আর অ্যাপ কোডের N+1 জাতীয় নীরব ফাঁদ এড়ানো। অভ্যাস ছোট ডেটাতেই গড়া হয় — এখানে প্রতিটি query-তে প্ল্যান দেখে অভ্যস্ত হও, পরে প্রোডাকশনে এটাই বাঁচবে।

## মূল ধারণা
প্ল্যান পড়া: SQLite-এ \`EXPLAIN QUERY PLAN\`, PostgreSQL/MySQL-এ \`EXPLAIN\` দেখায় ইঞ্জিন কী করবে — \`SCAN orders\` মানে পুরো টেবিল পড়া, \`SEARCH ... USING INDEX\` মানে সরাসরি কাঙ্ক্ষিত সারিতে ঝাঁপ। PostgreSQL-এর \`EXPLAIN ANALYZE\` query সত্যিই চালিয়ে প্রতি ধাপের সময় আর সারির সংখ্যা মেপে দেখায় — অনুমান নয়, মাপা সত্য। আর \`ANALYZE\` আলাদা কাজ করে: টেবিলের statistics সংগ্রহ করে; planner সেই পরিসংখ্যান দেখেই ঠিক করে কোন index আর কোন join-ক্রম সস্তা। statistics পুরোনো হলে ভালো index থাকা সত্ত্বেও প্ল্যান খারাপ হয়ে যায়।

index-এর ভেতরটা: বেশির ভাগ index B-tree — বহু-স্তরের গাছ, প্রতিটি নোডে ক্রম-সাজানো মান, পাতায় সারির pointer (rowid)। খোঁজ O(log n) — শিকড় থেকে কয়েক ধাপে পাতায়; রেঞ্জ ফিল্টারে পাতায় পাশাপাশি হাঁটা হয়। কম্পোজিট index \`(status, ordered_at)\`-এ ক্রম আগে status, ভেতরে ordered_at — তাই বাঁয়ের কলাম (status) একাও খোঁজা যায়, ডানের কলাম একা নয়। কলাম order-এর নিয়ম: equality কলাম আগে, range কলাম পরে। এক ধাপ এগিয়ে covering index: query-র সব কলাম index-এই থাকলে টেবিলে নামতেই হয় না — index-only scan।

sargability: indexed কলামে ফাংশন পরালে (\`strftime\`, \`UPPER\`, টাইপ-কাস্ট) index-এর ক্রম ভেঙে পড়ে, planner পুরো টেবিল স্ক্যান করে। শুরুতে wildcard-ওয়ালা \`LIKE '%keyboard'\`-ও একই কাজ করে — গাছে কোন শাখায় \`k\`-দিয়ে-শুরু-না-হওয়া মান পড়ে বলা যায় না। মোক্ষণ: মানকে বদলাও, কলামকে নয় — \`ordered_at >= '2026-10-01' AND ordered_at < '2026-11-01'\` sargable, \`strftime('%Y-%m', ordered_at) = '2026-10'\` নয়।

join আর পেজিং: planner সাধারণত ছোট সেট বাইরের লুপে রেখে বড় টেবিলে index দিয়ে খোঁজে (nested loop), বড়-বড় জোড়ায় hash join বেছে নেয় — সিদ্ধান্ত statistics-নির্ভর, তাই join order হাতে ঠিক করার চেয়ে index আর statistics ঠিক রাখাই আসল কাজ। পেজিং-এ \`LIMIT/OFFSET\` প্রথম কয়েক পেজে ঠিক, কিন্তু \`OFFSET 50000\` মানে ৫০ হাজার সারি পড়ে বাদ দেওয়া; keyset pagination-এ বদলে কার্সরের মান predicate-এ বসে (\`ordered_at > আগের-মান OR (সমান AND id > আগের-id)\`), ইঞ্জিন সরাসরি জায়গায় ঝাঁপ দেয়। অ্যাপ কোডের দুই নীরব ফাঁদ: N+1 — লুপে প্রতি অর্ডারে আলাদা query মানে হাজার রাউন্ডট্রিপ, এক JOIN/IN-এ মিলিয়ে দাও; আর CTE materialization — অনেক ইঞ্জিন বড় CTE-কে অস্থায়ী টেবিলে জমিয়ে রাখে, একবার-ব্যবহারের CTE জমলে সেটা অপচয় — SQLite 3.35+/PostgreSQL 12+ নিজেই বেছে নেয়, দরকারে \`MATERIALIZED\`/\`NOT MATERIALIZED\` দিয়ে নিয়ন্ত্রণ করা যায়।

| প্ল্যানে যা দেখা যায় | আসল মানে | প্রতিকার |
| --- | --- | --- |
| \`SCAN table\` | পুরো টেবিল পড়ছে | ফিল্টার কলামে index, sargable predicate |
| কলামে ফাংশন | index কাজে আসছে না | মান বদলাও, কলাম নয় |
| \`LIKE '%...'\` | শুরুর wildcard রেঞ্জ ভাঙছে | শুরু-নির্দিষ্ট প্যাটার্ন বা full-text index |
| বড় \`OFFSET\` | প্রতি পেজে অপচয় | keyset কার্সর \`(ordered_at, id)\` |
| লুপে হাজার query | N+1 | এক JOIN/IN |

## ধাপে ধাপে
১. আগে মাপো: \`EXPLAIN QUERY PLAN\` (বা \`EXPLAIN ANALYZE\`) চালিয়ে দেখো SCAN না SEARCH।
২. ফিল্টার আর ORDER BY-র কলাম ঠিক করো; equality আগে, range পরে রেখে composite index দাও।
৩. predicate সরল রাখো — কলামে ফাংশন নয়, LIKE-এর শুরুতে wildcard নয়।
৪. ORDER BY index-এর ক্রমের সাথে মেলাও; tie-breaker কলাম (যেমন id) যোগ করো যেন ক্রম deterministic হয়।
৫. পেজিং কার্সর দিয়ে; অ্যাপে লুপ-প্রতি-query নয়, এক query-তে JOIN।
শিপ-করার আগের চেকলিস্ট: প্ল্যান দেখেছি? ফিল্টার কলাম indexed? composite-র ক্রম equality→range? কলামে ফাংশন বা শুরু-wildcard নেই? ORDER BY deterministic? পেজিং keyset? লুপে লুকানো query (N+1) নেই? বড় CTE কি একবারই ব্যবহার হয়? statistics সাজানো?

## কোডে দেখি
\`\`\`sql
EXPLAIN QUERY PLAN
SELECT id FROM orders
WHERE ordered_at >= '2026-10-01' AND ordered_at < '2026-11-01';

-- sargable রেঞ্জ + keyset পেজ: প্ল্যান বলবে SEARCH, প্রতি পেজে একই খরচ
SELECT cu.name, o.id, o.ordered_at
FROM orders o JOIN customers cu ON cu.id = o.customer_id
WHERE o.status = 'paid'
  AND (o.ordered_at > '2026-10-10'
       OR (o.ordered_at = '2026-10-10' AND o.id > 4))
ORDER BY o.ordered_at, o.id
LIMIT 3;
\`\`\`

## সাধারণ ভুল
\`EXPLAIN\` না দেখে "index আছে, তাই দ্রুত হবে" ভাবা; কলামে ফাংশন মুড়ে index নিজেই বাতিল করা; \`LIKE '%শব্দ'\` দিয়ে সার্চ-এ index আশা করা; composite index-এ range কলাম বাঁয়ে রেখে ডানের কলাম খোঁজা; গভীর পেজে OFFSET জোগানো; লুপে প্রতি সারিতে আলাদা query (N+1); একবারের CTE-র অযথা materialization; আর statistics আপডেট না করে হঠাৎ প্ল্যান-পরিবর্তনে অবাক হওয়া।`;

export const ADVANCED_SQL_PERFORMANCE_TOPICS: LearningTopicDefinition[] = [
  {
    slug: "query-performance",
    title: "Query performance",
    titleBn: "কোয়েরি পারফরম্যান্স",
    summary:
      "EXPLAIN প্ল্যান পড়ে, sargable predicate, composite index আর keyset pagination দিয়ে ধীর query-কে দ্রুত query-তে বদলানো।",
    concept: queryPerformanceConcept,
    guidedProblemSlugs: ["sql-adv-keyset-pagination", "sql-adv-sargable-date"],
    practiceProblemSlugs: { easy: [], medium: [], hard: [] },
    extraProblemSlugs: [],
  },
];
