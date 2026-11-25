/**
 * The seven ShopSphere feature squads and the epics they own.
 *
 * Topic slugs come from `sql-track.ts`; table and metric ids are validated by
 * `sql-project.test.ts` against the fixture and the metric catalog.
 */

import { SQL_PROJECT_TABLES } from "./sql-project-schema";

import type { SqlProjectEpic } from "./sql-project";

type SqlProjectEpicDefinition = Omit<SqlProjectEpic, "tables">;

const EPIC_DEFINITIONS: SqlProjectEpicDefinition[] = [
  {
    slug: "catalog-health",
    ticketPrefix: "SHOP-CAT",
    title: "Catalog health",
    titleBn: "ক্যাটালগের স্বাস্থ্য",
    squad: "Catalog Health squad",
    mission:
      "প্রতিটি প্রোডাক্ট, ভ্যারিয়েন্ট আর অ্যাট্রিবিউট ঠিক আছে কি না, আর কোনটা বিক্রি হচ্ছে না—সেটা প্রতিদিন দেখা।",
    story:
      "ক্যাটালগে ১৪টি প্রোডাক্ট আছে, কিন্তু সবগুলো সমানভাবে বিক্রি হয় না। ক্যাটালগ টিম জানতে চায় কোন প্রোডাক্ট কখনো বিক্রিই হয়নি, কোন ভেন্ডরের স্টক শেষের পথে, আর JSON অ্যাট্রিবিউটে লেখা ব্র্যান্ড/ওয়ারেন্টি তথ্য আসলেই পড়া যাচ্ছে কি না। এই রিপোর্ট ভুল হলে মার্কেটিং অপ্রচলিত পণ্যে বাজেট নষ্ট করে, আর সাপোর্ট ভুল ওয়ারেন্টির প্রতিশ্রুতি দেয়।",
    tracks: ["basic-sql", "advanced-sql"],
    topicSlugs: [
      "orientation",
      "missing-rows",
      "text-and-dates",
      "joins-in-depth",
      "json-inventory",
    ],
    metricIds: ["dead-stock"],
    acceptance: [
      "প্রতিটি রিপোর্টে ব্যবহৃত টেবিল আর JOIN-এর grain এক লাইনে লেখা আছে।",
      "শূন্য-বিক্রি প্রোডাক্ট, কম-স্টক প্রোডাক্ট আর বিক্রি-হয়েছে—তিন অবস্থাই আলাদা করে দেখা যায়।",
      "JSON path ভুল হলে NULL আসে, তাই রিপোর্টে JSON কলামের মান যাচাই করা হয়।",
      "ফল deterministic; একই ডেটায় দুইবার চালালে একই ক্রম আসে।",
    ],
  },
  {
    slug: "order-desk",
    ticketPrefix: "SHOP-ORD",
    title: "Order desk",
    titleBn: "অর্ডার ডেস্ক",
    squad: "Order Desk squad",
    mission:
      "প্রতিটি অর্ডারের টাকা, ভেন্ডরের রেভিনিউ আর ক্যাটাগরির শেয়ার একই grain-এ মিলিয়ে দেখা।",
    story:
      "অর্ডার ডেস্ক প্রতিদিন সকালে ভেন্ডরদের রেভিনিউ আর অর্ডার-প্রাপ্তি মেলায়। প্রশ্ন আসে—এই অর্ডারের মোট কত, কোন ভেন্ডর বেশি বিক্রি করছে, কোন ক্যাটাগরি বোর্ড ডেকে বড় হচ্ছে। আইটেম আর পেমেন্ট দুই জায়গায় গুনে ফেললে পুরো রিপোর্ট ভুল হয়ে যায়, তাই grain পরিষ্কার রাখা এই স্কোয়াডের প্রধান কাজ।",
    tracks: ["basic-sql", "advanced-sql"],
    topicSlugs: ["money-and-orders", "subqueries", "business-metrics"],
    metricIds: ["gmv", "aov", "collected-revenue"],
    acceptance: [
      "শুধু `paid`/`shipped` অর্ডারই রেভিনিউ হিসেবে গোনা হয়।",
      "ভেন্ডর-রেভিনিউ আর অর্ডার-রসিদ আলাদা grain-এ, ডুপ্লিকেট ছাড়া।",
      "ক্যাটাগরি-শেয়ারের হর পুরো প্ল্যাটফর্মের মোট রেভিনিউ, শুধু ওই ক্যাটাগরি নয়।",
      "টাকা সেন্টে থাকে, রিপোর্টে ১০০ দিয়ে ভাগ করে টাকা দেখানো হয়।",
    ],
  },
  {
    slug: "fulfillment",
    ticketPrefix: "SHOP-FUL",
    title: "Fulfillment desk",
    titleBn: "ফুলফিলমেন্ট ডেস্ক",
    squad: "Fulfillment squad",
    mission:
      "অর্ডার থেকে পেমেন্ট, শিপমেন্ট আর রিটার্ন পর্যন্ত প্রতিটি ধাপের বিলম্ব ও ব্যর্থতা ধরা।",
    story:
      "কুরিয়ার আর পেমেন্ট গেটওয়ে—দুটোই অর্ডারের বাইরের সিস্টেম, কিন্তু গ্রাহক অভিজ্ঞতা পুরোটাই এদের উপর দাঁড়ানো। কোন অর্ডারের একটিও সফল পেমেন্ট নেই, কোনটা কত দিন ধরে শিপ হয়নি, আর কোন ভেন্ডরের রিটার্ন বেশি—এসব উত্তর দেরি হলে সাপোর্ট টিম অন্ধভাবে কাজ করে।",
    tracks: ["basic-sql", "advanced-sql"],
    topicSlugs: ["order-lifecycle", "text-dates-time", "timelines"],
    metricIds: ["refund-rate", "collected-revenue"],
    acceptance: [
      "এক অর্ডারে একাধিক পেমেন্ট থাকলেও সফল/ব্যর্থ অবস্থা `NOT EXISTS` দিয়ে ঠিক ধরা হয়।",
      "বয়স ও SLA দিনে মাপা হয়, সময়-অংশ বাদ দিয়ে।",
      "রিটার্ন-হারের হর আর লব দুই আলাদা CTE থেকে আসে, তাই fan-out নেই।",
      "চলমান গড়ের আগে দিন-grain ঠিক করা হয়, আইটেম-সারিতে নয়।",
    ],
  },
  {
    slug: "vendor-finance",
    ticketPrefix: "SHOP-FIN",
    title: "Vendor finance",
    titleBn: "ভেন্ডর ফিন্যান্স",
    squad: "Vendor Finance squad",
    mission:
      "মাস শেষে ভেন্ডরকে দেওয়া পেআউট source ডেটা থেকে আবার গুনে মেলানো, আর কোহর্ট পারফরম্যান্স দেখা।",
    story:
      "ভেন্ডর পেআউট ভুল হলে টাকা সরাসরি কারও পকেট থেকে যায়। ফাইন্যান্স টিম payout টেবিল বিশ্বাস করে না—orders, order_items আর approved returns থেকে expected net আবার বের করে difference দেখে। এরপর ভেন্ডর scorecard আর সাইনআপ-কোহর্ট রিটেনশন দিয়ে বোঝে কে সত্যিই লম্বা সময়ের জন্য মূল্য দিচ্ছে।",
    tracks: ["advanced-sql"],
    topicSlugs: ["finance-reconciliation", "capstone"],
    metricIds: ["payout-variance", "retention"],
    acceptance: [
      "payout আর expected net আলাদা CTE-তে, শেষে ভেন্ডর ধরে মিলানো হয়।",
      "রিফান্ডের মাস অর্ডারের তারিখ ধরে; `requested_at` নয়।",
      "difference-এর চিহ্ন বলে দেয় কে বেশি আর কে কম পেয়েছে।",
      "scorecard-এ rank-এর টাই-ব্রেকার নির্দিষ্ট।",
    ],
  },
  {
    slug: "growth",
    ticketPrefix: "SHOP-GRW",
    title: "Growth experiments",
    titleBn: "গ্রোথ এক্সপেরিমেন্ট",
    squad: "Growth squad",
    mission:
      "কার্ট-ফানেল, কুপন আর কাস্টমার-ব্যবধানের ডেটা দিয়ে কোন ক্যাম্পেইন সত্যিই কাজ করছে তা মাপা।",
    story:
      "মার্কেটিং বাজেট বাড়ানোর আগে গ্রোথ টিম জানে কার্টের কত শতাংশ অর্ডারে পরিণত হয়, কোন কুপন আসল রেভিনিউ আনে আর কোনটা শুধু ছাড় বিলায়। পাশাপাশি কাস্টমার আবার কত দিন পরে ফেরে সেটাও দেখতে হয়—নাহলে নতুন কাস্টমার আনার খরচ আর পুরনো কাস্টমার ধরে রাখার লাভের তুলনা করা যায় না।",
    tracks: ["basic-sql", "advanced-sql"],
    topicSlugs: ["set-operations", "funnels-coupons", "advanced-windows"],
    metricIds: ["cart-conversion", "discount-cost", "repeat-rate"],
    acceptance: [
      "শহর-কভারেজে ডুপ্লিকেট নেই, আর `UNION`-এর পরে একটাই `ORDER BY`।",
      "কার্ট-ফানেলের হরে abandoned আর active কার্টও থাকে।",
      "কুপন-রিপোর্টের আগে order-level CTE, তাই ছাড় বারবার গোনা হয় না।",
      "প্রথম অর্ডারে `LAG` থেকে NULL আসে—সেটাই সঠিক সংকেত।",
    ],
  },
  {
    slug: "analytics-platform",
    ticketPrefix: "SHOP-ANL",
    title: "Analytics platform",
    titleBn: "অ্যানালিটিক্স প্ল্যাটফর্ম",
    squad: "Analytics Platform squad",
    mission:
      "র‍্যাংকিং, ক্যাটাগরি-ট্রি আর পিভট—টিমের সব রিপোর্টের reusable query-ভিত্তি তৈরি করা।",
    story:
      "প্রতিটি স্কোয়াড নিজের মতো করে 'সেরা প্রোডাক্ট' বা 'মাসভিত্তিক রেভিনিউ' লিখলে তিন জায়গায় তিন রকম সংখ্যা আসে। অ্যানালিটিক্স প্ল্যাটফর্ম স্কোয়াড তাই একবার ঠিকভাবে লিখে দেয়: window দিয়ে র‍্যাংকিং, recursive CTE দিয়ে ক্যাটাগরি path, আর conditional aggregation দিয়ে চওড়া মাস-কলামের রিপোর্ট। বাকিরা এটাই ব্যবহার করে।",
    tracks: ["advanced-sql"],
    topicSlugs: ["window-thinking", "hierarchies", "pivot-grouping"],
    metricIds: ["gmv", "retention"],
    acceptance: [
      "প্রতি ক্যাটাগরিতে ঠিক একটি শীর্ষ প্রোডাক্ট, টাই হলে নাম দিয়ে নির্ধারিত।",
      "ক্যাটাগরি path যত গভীরই হোক, recursive query নিজে থেকেই বাড়ে।",
      "পিভটে বিক্রি-নেই ভেন্ডরও শূন্য নিয়ে থাকে।",
      "প্রতিটি রিপোর্টের output ক্রম window-এর ক্রম থেকে আলাদা করে দেওয়া।",
    ],
  },
  {
    slug: "platform-quality",
    ticketPrefix: "SHOP-PLT",
    title: "Platform quality",
    titleBn: "প্ল্যাটফর্ম কোয়ালিটি",
    squad: "Platform Quality squad",
    mission:
      "রিপোর্টের পেজিং, query প্ল্যান, index আর নিরাপদ স্কিমা-বদল ঠিক রাখা—যাতে ডেটা বড় হলেও উত্তর একই থাকে।",
    story:
      "একই query আজ ৩০ মিলিসেকেন্ডে চলে, অর্ডার টেবিলে লক্ষ লক্ষ সারি হলে ৩০ সেকেন্ডে। রিপোর্ট পেজের দ্বিতীয় পাতা ভুল সারি দেখালে বা index ছাড়া পুরো টেবিল স্ক্যান হলে ব্যবহারকারীই প্রথম টের পায়। এই স্কোয়াড pagination, EXPLAIN, index আর transaction-এর নিয়ম ঠিক করে, যাতে প্রতিটি রিপোর্ট deterministic আর নিরাপদ থাকে।",
    tracks: ["basic-sql", "advanced-sql"],
    topicSlugs: [
      "pagination",
      "query-performance",
      "ddl-and-indexes",
      "dml-and-transactions",
    ],
    metricIds: ["gmv"],
    acceptance: [
      "প্রতিটি পেজের সীমানা deterministic; টাই-ব্রেকার ছাড়া `LIMIT` নেই।",
      "গভীর পেজে OFFSET নয়, keyset কার্সর ব্যবহার হয়।",
      "index-এর ক্রম equality আগে, range পরে।",
      "স্ক্রিপ্টের শেষ statement একটি SELECT, আর DML `WHERE` ছাড়া চলে না।",
    ],
  },
];

/** Epic tables are derived from the dictionary so the two views cannot drift. */
export const SQL_PROJECT_EPICS: SqlProjectEpic[] = EPIC_DEFINITIONS.map(
  (epic) => ({
    ...epic,
    tables: SQL_PROJECT_TABLES.filter((table) =>
      table.usedByEpicSlugs.includes(epic.slug),
    ).map((table) => table.name),
  }),
);
