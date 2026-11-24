/** Visual configs for the Basic SQL module: ShopSphere fundamentals. */

import type { LessonVisualConfig } from "@/lib/learning/visual-types";

export const BASIC_SQL_VISUALS: Record<string, LessonVisualConfig> = {
  "basic-sql/orientation": {
    kind: "sql",
    title: "প্রথম SELECT",
    caption: "কোন টেবিল, কোন কলাম, কোন শর্ত—এই তিনটা ঠিক করলেই দোকানের যেকোনো তালিকা বেরিয়ে আসে।",
    steps: [
      { label: "টেবিল আর কলাম বাছো", note: "vendors থেকে name আর city" },
      { label: "শর্তে সারি ছাঁটো", note: "rating >= 4 মানে ৪-ও থাকে" },
      { label: "ফল সাজাও", note: "ORDER BY না দিলে ক্রম অনির্দিষ্ট" },
      { label: "প্রয়োজনে LIMIT বসাও", note: "তালিকা ছোট করে দেখাও" },
    ],
    data: {
      labels: ["ভেন্ডর ১", "ভেন্ডর ২", "ভেন্ডর ৩", "ভেন্ডর ৪", "ভেন্ডর ৫"],
      values: [5, 4, 3, 4, 5],
      variant: "select",
    },
  },
  "basic-sql/money-and-orders": {
    kind: "sql",
    title: "JOIN করে হিসাব",
    caption: "টেবিল জোড়া লাগিয়ে ভেন্ডর ধরে যোগফল বের করা—JOIN আর GROUP BY ঠিক হলে রিপোর্টের সংখ্যা আসল বিক্রির সাথেই মেলে।",
    steps: [
      { label: "সম্পর্কের চেইন চিনো", note: "vendors → products → order_items" },
      { label: "JOIN-এর শর্তে সারি মেলাও", note: "ভুল কলামে জুড়লে সংখ্যা ফুলে যায়" },
      { label: "ভেন্ডর ধরে গ্রুপ করো", note: "GROUP BY-তে আইডি দাও, নাম নয়" },
      { label: "SUM-এ রেভিনিউ বের করো", note: "quantity গুণ দাম ধরে যোগ" },
      { label: "গ্রুপের শর্ত HAVING-এ দাও", note: "WHERE-এ aggregate চলে না" },
    ],
    data: {
      labels: ["ভেন্ডর A", "ভেন্ডর B", "ভেন্ডর C", "ভেন্ডর D"],
      values: [12, 8, 5, 3],
      variant: "join",
    },
  },
  "basic-sql/missing-rows": {
    kind: "sql",
    title: "নেই-সারি খোঁজা",
    caption: "বিক্রি হয়নি মানে সারিই নেই—LEFT JOIN আর NOT EXISTS না-মেলা প্রোডাক্টকেই রিপোর্টে ধরে রাখে।",
    steps: [
      { label: "LEFT JOIN-এ বাম পাশ পুরো রাখো", note: "মিল না পেলে ডান পাশ NULL" },
      { label: "NULL মানে সম্পর্ক নেই বুঝো", note: "গুনতে হয় মিল-না-হওয়া সারি" },
      { label: "নেই-শর্তে NOT EXISTS ব্যবহার করো", note: "NOT IN-এ NULL পেলে ফল খালি আসে" },
      { label: "শর্ত JOIN-এর ON-এ বসাও", note: "WHERE-এ দিলে নেই-সারি ঝরে পড়ে" },
      { label: "CASE-এ bucket বানাও", note: "dead stock আর কম-স্টক আলাদা দেখাও" },
    ],
    data: {
      labels: ["কীবোর্ড", "মাউস", "মনিটর", "ডেস্ক ল্যাম্প", "নোটবুক"],
      values: [5, 3, 0, 2, 0],
      variant: "outer",
    },
  },
  "basic-sql/subqueries": {
    kind: "sql",
    title: "প্রশ্নের ভিতরে প্রশ্ন",
    caption: "আগে ক্যাটাগরির গড় বের করে তারপর সেই গড়ের সাথে তুলনা—দুই ধাপের প্রশ্ন এক query-তেই বসে যায়।",
    steps: [
      { label: "বাইরের সারি একটা একটা ধরো", note: "প্রতিটি প্রোডাক্টের জন্য ভেতরের প্রশ্ন চলে" },
      { label: "ভেতরে ক্যাটাগরির গড় বের করো", note: "correlated মানে বাইরের সারির সাথে জুড়া" },
      { label: "দাম গড়ের চেয়ে বড় কিনা দেখো", note: "শর্তটাই বাইরের WHERE" },
      { label: "অনুপস্থিতি EXISTS দিয়ে যাচাই করো", note: "অর্ডার-নেই কাস্টমারও একই প্যাটার্নে" },
    ],
    data: {
      labels: ["ইলেকট্রনিক্স", "বই", "পোশাক"],
      values: [12, 3, 8],
      variant: "subquery",
    },
  },
  "basic-sql/set-operations": {
    kind: "sql",
    title: "সেট মেশানো",
    caption: "UNION দুই তালিকার সারি এক করে ডুপ্লিকেট ফেলে দেয়, আর এক জায়গায় আছে-অন্য জায়গায় নেই প্রশ্নের নিরাপদ হাতিয়ার NOT EXISTS।",
    steps: [
      { label: "দুই SELECT-এর কলাম মেলাও", note: "সংখ্যা আর ধরন এক হতে হবে" },
      { label: "UNION-এ ডুপ্লিকেট ফেলে দাও", note: "ঢাকা দুই তালিকাতেই, ফলে একবার" },
      { label: "EXCEPT-এ দ্বিতীয় ফল বাদ দাও", note: "পুরো সারি মেলায়, নাম নয়" },
      { label: "নেই-শর্তে NOT EXISTS বসাও", note: "আইডি ধরে প্রতি সারির যাচাই" },
      { label: "ORDER BY শুধু শেষে দাও", note: "UNION-এর ফল একটাই সেট" },
    ],
    data: {
      labels: ["ঢাকা", "চট্টগ্রাম", "সিলেট", "রাজশাহী", "খুলনা"],
      values: [2, 1, 1, 1, 1],
      variant: "set",
    },
  },
  "basic-sql/text-and-dates": {
    kind: "sql",
    title: "LIKE আর তারিখ",
    caption: "শব্দের আগে-পিছে % আর দুই পাশে lower() দিলে কেস না মেলালেও সার্চ পাওয়া যায়, আর ISO তারিখে টেক্সটের ক্রমই ক্যালেন্ডারের ক্রম।",
    steps: [
      { label: "শব্দটা যেকোনো জায়গায় হতে পারে ধরো", note: "দুপাশে % দাও" },
      { label: "কেস বাদ দিতে lower() বসাও", note: "মেলানো দুই পাশেই ছোট হরফে" },
      { label: "একাধিক শব্দে OR দাও", note: "AND দিলে দুইটাই থাকতে হবে" },
      { label: "তারিখের রেঞ্জ হাফ-ওপেন রাখো", note: "শুরুতে >= আর শেষে পরের মাসের <" },
      { label: "ORDER BY-তে টাই-ব্রেকার যোগ করো", note: "তারিখের পরে নাম দাও" },
    ],
    data: {
      labels: ["SQL Handbook", "Notebook", "Book Light", "Pen", "Bookshelf"],
      values: [1, 1, 1, 0, 1],
      variant: "text",
    },
  },
  "basic-sql/order-lifecycle": {
    kind: "sql",
    title: "অর্ডারের জীবনচক্র",
    caption: "অর্ডার হওয়া আর টাকা পাওয়া এক কথা নয়—প্রতিটি ধাপ আলাদা টেবিলে, আর বকেয়া ধরতে হয় NOT EXISTS দিয়ে।",
    steps: [
      { label: "চেইন চিনে নাও", note: "orders → payments → shipments → returns" },
      { label: "এক অর্ডারে একাধিক পেমেন্ট থাকতে পারে দেখো", note: "paid রেকর্ড আলাদা করে খোঁজো" },
      { label: "paid নেই-কি যাচাই NOT EXISTS-এ করো", note: "শর্ত সাবকোয়েরির ভেতরেই বসে" },
      { label: "রিটার্ন জোড়া লাগাও আইটেমের সাথে", note: "returns → order_items → orders → vendors" },
      { label: "হার বের করতে দুই গণনা আলাদা করো", note: "ভাগে 100.0, খালি গ্রুপে COALESCE" },
    ],
    data: {
      labels: ["অর্ডার", "পেমেন্ট", "শিপমেন্ট", "রিটার্ন"],
      values: [10, 8, 7, 2],
      variant: "lifecycle",
    },
  },
  "basic-sql/joins-in-depth": {
    kind: "sql",
    title: "সেলফ-জয়েনের ফাঁদ",
    caption: "টেবিলকে নিজের সাথে জুড়লে প্রতিটি জোড়া দুইবার আসে, আর p1.id < p2.id শর্তটা জয়েনেই বসালে জোড়া অনন্য হয়ে যায়।",
    steps: [
      { label: "একই টেবিল দুই alias-এ জোড়ো", note: "p1 আর p2 যেন দুই টেবিল" },
      { label: "জোড়া অনন্য করতে অসমতা বসাও", note: "p1.id < p2.id জয়েনের ON-এ" },
      { label: "!= দিলে জোড়া দুইবারই বেঁচে থাকে দেখো", note: "নিজ-জোড়া বাদ যায়, ডুপ্লিকেট নয়" },
      { label: "জোড়ার ভিতরের তুলনা CASE-এ করো", note: "কে সস্তা আগে থেকে ঠিক নয়" },
      { label: "query চলে FROM → WHERE → SELECT ক্রমে", note: "SELECT-এর alias WHERE-এ ধরা যায় না" },
    ],
    data: {
      labels: ["কীবোর্ড-মাউস", "কীবোর্ড-মনিটর", "মাউস-মনিটর"],
      values: [2, 5, 3],
      variant: "join",
    },
  },
  "basic-sql/pagination": {
    kind: "sql",
    title: "পেজে ভাগ করা তালিকা",
    caption: "সাজানো তালিকার m সারি লাফিয়ে পরের n সারি দেখানোই পেজ, কিন্তু টাই-ব্রেকার ছাড়া সীমানার সারি এলোমেলো হয়ে যায়।",
    steps: [
      { label: "আগে ORDER BY নিখুঁত করো", note: "সমান মানে নাম বা আইডি ধরো" },
      { label: "পেজের সূত্র বসাও", note: "পেজ ২ মানে LIMIT 3 OFFSET 3" },
      { label: "গভীর পেজে OFFSET-এর দাম দেখো", note: "আগের সারিগুলো বৃথা গোনা হয়" },
      { label: "বড় টেবিলে keyset বেছে নাও", note: "শেষ সারির মান ধরে পরেরটা টানো" },
      { label: "দলের সেরা MAX দিয়ে মেলাও", note: "correlated subquery সব ইঞ্জিনে চলে" },
    ],
    data: {
      labels: ["১", "২", "৩", "৪", "৫", "৬"],
      values: [90, 75, 60, 55, 50, 45],
      variant: "pagination",
    },
  },
  "basic-sql/text-dates-time": {
    kind: "sql",
    title: "টেক্সট, তারিখ, সময়",
    caption: "LIKE-এর % আর _ দিয়ে যেকোনো জায়গার মিল খোঁজা যায়, আর julianday-এর বিয়োগে দুই তারিখের ব্যবধান পূর্ণ দিনে বেরিয়ে আসে।",
    steps: [
      { label: "% আর _-এর মানে ধরো", note: "%dha% নামে-শহরে দুই কলামেই" },
      { label: "কেস নিরপেক্ষ করতে lower() দাও", note: "মেলানো দুই পাশেই" },
      { label: "GLOB কেস-সেনসিটিভ মনে রাখো", note: "সার্চ বাক্সে LIKE-ই নিরাপদ" },
      { label: "দিনের হিসাব julianday-এ করো", note: "বিয়োগের পর CAST-এ পূর্ণ দিন" },
      { label: "সময় রাখলে UTC ধরো", note: "নইলে তারিখ-শুধু ISO-ই থাকো" },
    ],
    data: {
      labels: ["Dhaka Shop", "Dhanmondi Mart", "Sylhet Store", "Khulna Traders"],
      values: [1, 1, 0, 0],
      variant: "text",
    },
  },
};
