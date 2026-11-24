/** Visual configs for the Advanced SQL module: ShopSphere analytics. */

import type { LessonVisualConfig } from "@/lib/learning/visual-types";

export const ADVANCED_SQL_VISUALS: Record<string, LessonVisualConfig> = {
  "advanced-sql/window-thinking": {
    kind: "sql",
    title: "উইন্ডো ফাংশন",
    caption: "OVER (PARTITION BY ... ORDER BY ...) সারি না কমিয়ে প্রতিটি সারির পাশে র‍্যাংক আর চলমান যোগফল বসিয়ে দেয়, GROUP BY-র ভাগ ছাড়াই।",
    steps: [
      { label: "PARTITION BY দিয়ে দল ভাগো", note: "প্রতিটি ক্যাটাগরি নিজের দলে" },
      { label: "দলের ভিতরে ORDER BY বসাও", note: "না দিলে ফল অনির্দিষ্ট হয়" },
      { label: "RANK-এ একই মানে একই র‍্যাংক", note: "ROW_NUMBER পরপর গোনে" },
      { label: "SUM OVER-এ চলমান যোগফল নাও", note: "টাই-ব্রেকার order_id দাও" },
      { label: "সারি কমে না, হিসাব পাশে বসে", note: "সেরা সারি বাছতে rn = 1 ধরো" },
    ],
    data: {
      labels: ["ইলেকট্রনিক্স", "বই", "পোশাক", "খেলনা"],
      values: [50, 30, 15, 5],
      variant: "window",
    },
  },
  "advanced-sql/hierarchies": {
    kind: "sql",
    title: "স্তরে স্তরে চেইন",
    caption: "anchor থেকে শুরু করে প্রতি ধাপে আগের ফলের সাথে টেবিল জুড়ে এক স্তর এগোলে অজানা গভীরতার চেইনও এক query-তে বেরিয়ে আসে।",
    steps: [
      { label: "anchor দিয়ে root বসাও", note: "parent_id IS NULL থেকে শুরু" },
      { label: "UNION ALL-এ recursive ধাপ জোড়ো", note: "আগের ফলের সাথে JOIN" },
      { label: "path জমিয়ে রাখো", note: "আগের path-এর সাথে নতুন নাম যোগ" },
      { label: "depth প্রতি ধাপে এক বাড়তে দেখো", note: "Electronics > Audio > Headphones" },
      { label: "রেফারেল চেইনও একই ভাবনায় নাও", note: "কে কাকে এনেছে, স্তর ধরে ধরে" },
    ],
    data: {
      labels: ["Electronics", "Audio", "Headphones", "Computers"],
      values: [0, 1, 2, 1],
      variant: "recursive",
    },
  },
  "advanced-sql/business-metrics": {
    kind: "sql",
    title: "শেয়ার ও গ্রোথ",
    caption: "SUM(...) OVER () মোটটা প্রতিটি সারির পাশে বসিয়ে দেয়, তাই শতাংশ আর LAG-এর আগের মানের তুলনা একই query-তে আসে।",
    steps: [
      { label: "CTE-তে ভিত্তি সংখ্যা বানাও", note: "মাস ধরে GROUP BY" },
      { label: "মোট বসাও SUM OVER ()-এ", note: "প্রতিটি সারির পাশে গ্রান্ড টোটাল" },
      { label: "শতাংশে 100.0 গুণ করো", note: "integer ভাগে শূন্য আসে" },
      { label: "গ্রোথে LAG দিয়ে আগের মান টানো", note: "প্রথম সারিতে NULL—সেটাই সঠিক" },
      { label: "ভাগের আগে শূন্য সামলাও", note: "COALESCE দিয়ে খালি গ্রুপ বাঁচাও" },
    ],
    data: {
      labels: ["জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর"],
      values: [40, 50, 45, 60],
      variant: "group",
    },
  },
  "advanced-sql/timelines": {
    kind: "sql",
    title: "চলমান গড়",
    caption: "একদিনের ওঠানামা আসল ধারা নয়—frame-এ আগের ছয় সারি ধরলেই noise মসৃণ হয়ে চলমান গড় বেরিয়ে আসে।",
    steps: [
      { label: "আগে দানা ঠিক করো", note: "এক দিন = এক সারির CTE" },
      { label: "frame-এ ৬ PRECEDING বসাও", note: "বর্তমান সারিসহ ৭ দিন" },
      { label: "ROWS গোনে, RANGE মান গোছায় মনে রাখো", note: "চলমান গড়ে ROWS চাই" },
      { label: "কাস্টমারের জমা PARTITION-এ রাখো", note: "running total দল ভেদ করে জমে" },
      { label: "শুরুর সারিগুলোতে ভয় পেয়ো না", note: "যত সারি আছে তার গড়—এটাই প্রত্যাশিত" },
    ],
    data: {
      labels: ["দিন ১", "দিন ২", "দিন ৩", "দিন ৪", "দিন ৫", "দিন ৬", "দিন ৭"],
      values: [12, 18, 10, 15, 22, 14, 19],
      variant: "window",
    },
  },
  "advanced-sql/funnels-coupons": {
    kind: "sql",
    title: "ফানেল ও কুপন",
    caption: "CASE দিয়ে রূপান্তরিত সারি গুনে মোট কার্ট দিয়ে ভাগ করলেই কনভার্সন বেরিয়ে আসে, আর কুপনের হিসাবে আগে অর্ডার-মোটের CTE লাগে।",
    steps: [
      { label: "মোট কার্ট আর রূপান্তর আলাদা গোনো", note: "CASE WHEN status = 'converted'" },
      { label: "ভাগের হর মোট কার্ট রাখো", note: "আগে ফিল্টার করলে ১০০%-ই দেখায়" },
      { label: "শতাংশে 100.0 ব্যবহার করো", note: "integer ভাগে শূন্য আসে" },
      { label: "কুপনে আগে অর্ডার-মোটের CTE বানাও", note: "order_items সরাসরি জুড়লে ফুলে যায়" },
      { label: "কার্টের মাস created_at থেকে নাও", note: "অর্ডারের মাস নয়" },
    ],
    data: {
      labels: ["কার্ট", "অর্ডার"],
      values: [10, 4],
      variant: "funnel",
    },
  },
  "advanced-sql/json-inventory": {
    kind: "sql",
    title: "JSON আর লেজার",
    caption: "JSON-এর ভেতরের মান json_extract দিয়ে সাধারণ কলামের মতোই পড়া যায়, আর মুভমেন্ট লেজারের যোগফল মিলিয়ে দিলে স্টকের অমিল ধরা পড়ে।",
    steps: [
      { label: "JSON পড়ো json_extract দিয়ে", note: "$.warranty_months মানে root-এর key" },
      { label: "path-এ $ ভুললে NULL আসে খেয়াল করো", note: "নীরব ব্যর্থতা, ফল ভাঙে না" },
      { label: "লেজারে চিহ্নই কথা বলে মনে রাখো", note: "কেনা ধনাত্মক, বিক্রি ঋণাত্মক" },
      { label: "প্রোডাক্ট ধরে SUM(quantity) বের করো", note: "কাগজে-থাকা স্টক বেরিয়ে আসে" },
      { label: "অমিল ABS ধরে সাজাও", note: "বেশি আর কম—দুটোই তদন্ত লাগে" },
    ],
    // values: লেজার এন্ট্রি; বিক্রি ঋণাত্মক, সমন্বয় যেদিকে দরকার সেদিকে।
    data: {
      labels: ["কেনা", "বিক্রি", "ফেরত", "সমন্বয়"],
      values: [20, -15, 3, -2],
      variant: "json",
    },
  },
  "advanced-sql/finance-reconciliation": {
    kind: "sql",
    title: "পেআউট মিলানো",
    caption: "source টেবিল থেকে নিজের হিসাব আবার করে payout-এর সাথে মেলালেই ভুল মাসের অর্ডার বা বাদ-পড়া রিফান্ড ধরা পড়ে।",
    steps: [
      { label: "মাসের payout সারি আলাদা করো", note: "period-এর ভেতরের অর্ডারই গোনো" },
      { label: "gross বের করো order_items থেকে", note: "paid/shipped অর্ডার ধরে" },
      { label: "রিফান্ড অর্ডারের মাসে বসাও", note: "approved গুলোই গোনো" },
      { label: "net = gross - কমিশন - রিফান্ড যাচাই করো", note: "১০০ - ১০ - ৫ = ৮৫" },
      { label: "পার্থক্যের চিহ্নে দিক ঠিক করো", note: "বেশি মানে overpaid, কম মানে underpaid" },
    ],
    data: {
      labels: ["gross", "কমিশন", "রিফান্ড", "net"],
      values: [100, 10, 5, 85],
      variant: "reconcile",
    },
  },
  "advanced-sql/advanced-windows": {
    kind: "sql",
    title: "LAG-এ আগের সারি",
    caption: "LAG ঠিক আগের সারির মান এনে দেয়, PARTITION BY customer দিলে আগে মানে নিজের দলের আগে, আর দলের প্রথম সারিতে NULL-ই সংকেত।",
    steps: [
      { label: "দল আর ক্রম দুটোই দাও", note: "PARTITION BY আর ORDER BY" },
      { label: "টাই-ব্রেক যোগ করো", note: "সমান তারিখে order_id ধরো" },
      { label: "LAG দিয়ে আগের সারি টানো", note: "দুই তারিখের ফাঁক julianday-এ" },
      { label: "NTILE দিয়ে দল ভাগে স্তর দাও", note: "৪ ভাগে দামের স্তর" },
      { label: "LAST_VALUE-এর frame টানো", note: "নাহলে শেষ মান মাঝপথে আটকায়" },
    ],
    data: {
      labels: ["অর্ডার ১", "অর্ডার ২", "অর্ডার ৩", "অর্ডার ৪"],
      values: [12, 20, 9, 15],
      variant: "window",
    },
  },
  "advanced-sql/pivot-grouping": {
    kind: "sql",
    title: "চওড়া রিপোর্ট",
    caption: "SUM(CASE WHEN ...) প্রতিটি কলামে বসালে লম্বা ডেটা চওড়া রিপোর্টে ঘুরে যায়, নতুন মাস এলে শুধু একটা CASE যোগ লাগে।",
    steps: [
      { label: "সারি আর কলাম ঠিক করো", note: "ভেন্ডর সারিতে, মাস কলামে" },
      { label: "প্রতিটি কলামে একটা CASE বসাও", note: "শর্ত মিললে সেই কলামে যোগ" },
      { label: "GROUP BY শুধু সারি-কলাম ধরে রাখো", note: "মাস রাখলে pivot নষ্ট হয়" },
      { label: "বিক্রি-নেই দল LEFT JOIN + COALESCE-এ ধরো", note: "শূন্য ভরে রাখো" },
      { label: "মোট-সারি UNION ALL দিয়ে জোড়ো", note: "ROLLUP-এর কাজ SQLite-এ এভাবেই" },
    ],
    data: {
      labels: ["অক্টোবর", "নভেম্বর", "মোট"],
      values: [32, 28, 60],
      variant: "pivot",
    },
  },
  "advanced-sql/query-performance": {
    kind: "sql",
    title: "EXPLAIN প্ল্যান",
    caption: "EXPLAIN প্ল্যান বলে দেয় query কোথায় সময় খাচ্ছে, আর কলামে ফাংশন মুড়লে বা %শব্দের মতো প্যাটার্নে ইনডেক্স নিজেই বাতিল হয়ে যায়।",
    steps: [
      { label: "আগে EXPLAIN দেখো", note: "SCAN নাকি SEARCH—সেটাই প্রথম সংকেত" },
      { label: "শর্ত সার্জেবল রাখো", note: "কলামে ফাংশন মুড়লে index মরে" },
      { label: "composite index-এ ক্রম ঠিক করো", note: "range কলাম শেষে রাখো" },
      { label: "গভীর পেজে keyset বেছে নাও", note: "OFFSET বৃথা কাজ করায়" },
      { label: "N+1 এড়াও", note: "লুপে প্রতি সারিতে আলাদা query নয়" },
    ],
    data: {
      labels: ["SCAN", "SEARCH", "SORT", "KEYSET"],
      values: [100, 10, 40, 5],
      variant: "plan",
    },
  },
  "advanced-sql/capstone": {
    kind: "sql",
    title: "কোহোর্ট আর স্কোরকার্ড",
    caption: "বড় রিপোর্টও ছোট ছোট CTE-তে ভাঙলে ধরা যায়—আগে ভিত্তি লেনদেন, তারপর দল ধরে সারাংশ, শেষে rank বা শতাংশ।",
    steps: [
      { label: "প্রশ্নকে ধাপে ভাঙো", note: "প্রতিটি CTE-র একটাই কাজ" },
      { label: "ভিত্তি সারিতে দরকারি লেনদেন রাখো", note: "LEFT JOIN-এর শর্ত ON-এ বসে" },
      { label: "cohort ধরে গোনো", note: "signup মাস আর অর্ডার সংখ্যা" },
      { label: "CASE দিয়ে রিপিট কাস্টমার বের করো", note: "order_count >= 2 হলে গোনো" },
      { label: "শেষে rank আর শতাংশ বসাও", note: "টাই-ব্রেকার ভুলো না" },
    ],
    data: {
      labels: ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ"],
      values: [50, 40, 60],
      variant: "capstone",
    },
  },
  "advanced-sql/ddl-and-indexes": {
    kind: "sql",
    title: "ইনডেক্স আর ভিউয়ের স্কিমা",
    caption: "Index হলো পাশের সাজানো ঠিকানা-খাতা, view হলো নাম দেওয়া query—দুটোই SELECT-এর বাইরে স্কিমার অংশ।",
    steps: [
      { label: "প্রথমে প্রশ্ন ঠিক করো", note: "ডেটা পড়া, নাকি গঠন বদল? DDL শেষে SELECT রাখো" },
      { label: "composite index-এ equality আগে", note: "customer_id, তারপর ordered_at" },
      { label: "view-তে পুরো রিপোর্ট query রাখো", note: "alias আর GROUP BY সহ" },
      { label: "sqlite_master-এ যাচাই করো", note: "type আর নাম ধরে" },
      { label: "index সবসময় লাভজনক নয়", note: "প্রতি INSERT/UPDATE-এ খরচ বাড়ে" },
    ],
    data: {
      labels: ["orders", "sqlite_master"],
      values: [100, 10],
      variant: "ddl",
    },
  },
  "advanced-sql/dml-and-transactions": {
    kind: "sql",
    title: "BEGIN, UPDATE, ROLLBACK",
    caption: "একাধিক বদল একসাথে সফল বা একসাথে বাতিল—transaction-এর ভিতরে WHERE-সহ UPDATE আর SELECT যাচাই।",
    steps: [
      { label: "আগে SELECT দিয়ে সারি দেখো", note: "কোন row বদলাবে সেটা WHERE দিয়ে ঠিক করো" },
      { label: "UPDATE-এ পুরোনো মান ব্যবহার করো", note: "stock = stock + 6, fixed মান নয়" },
      { label: "BEGIN দিয়ে সব-বা-কিছু শুরু", note: "প্রতিটি ধাপ শেষে যাচাই করো" },
      { label: "ভুল হলে ROLLBACK", note: "SELECT দিয়ে আগের মান প্রমাণ করো" },
      { label: "সব ঠিক হলে COMMIT", note: "শেষ statement SELECT রাখো" },
    ],
    data: {
      labels: ["products", "inventory_movements"],
      values: [8, 6],
      variant: "dml",
    },
  },
};
