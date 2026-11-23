export type SqlTopic = {
  slug: string;
  level: "basic" | "advanced";
  title: string;
  titleBn: string;
  summary: string;
  concept: string;
  problemSlugs: string[];
};

/** Sequential ShopSphere topics; each one is a chapter in the project story. */
export const SQL_TOPICS: SqlTopic[] = [
  {
    slug: "orientation",
    level: "basic",
    title: "Meet the marketplace",
    titleBn: "দোকান চেনা",
    summary:
      "শুরুতে দোকানের টেবিলগুলোর সাথে পরিচয়। কোন টেবিলে কী আছে, কীভাবে একজন ভেন্ডর বা প্রোডাক্ট খুঁজে বের করবে।",
    concept:
      "প্রথম দিনে তুমি স্টোর ম্যানেজারের পাশে বসে আছো। তোমার প্রথম কাজ — ভালো রেটিংয়ের ভেন্ডর আর কম স্টকের প্রোডাক্টের তালিকা বানানো। এখানেই `SELECT`, `WHERE`, `ORDER BY` আর অর্ডার করা রেজাল্টের ধারণা তৈরি হবে।",
    problemSlugs: ["sql-vendor-directory", "sql-low-stock"],
  },
  {
    slug: "money-and-orders",
    level: "basic",
    title: "Money & orders",
    titleBn: "টাকার হিসাব",
    summary:
      "প্রোডাক্ট, অর্ডার আর অর্ডার আইটেম জোড়া লাগিয়ে ভেন্ডরের রেভিনিউ আর প্রতিটি অর্ডারের মোট টাকা বের করা।",
    concept:
      "দোকান চলে টাকায়। এখন তোমাকে দেখতে হবে কোন ভেন্ডর কত বিক্রি করেছে আর প্রতিটি অর্ডার আসলে কত টাকার। JOIN, GROUP BY, HAVING আর যোগফলের হাতে-কলমে অভ্যাস এখানেই।",
    problemSlugs: ["sql-vendor-revenue", "sql-order-receipts"],
  },
  {
    slug: "window-thinking",
    level: "advanced",
    title: "Rankings & timelines",
    titleBn: "র‍্যাংক ও টাইমলাইন",
    summary:
      "একই ডেটার ভেতরে ক্যাটাগরি ধরে র‍্যাংক করা আর দিনের পর দিন রেভিনিউর চলমান যোগফল বের করা।",
    concept:
      "ব্যবসা বড় হলে প্রশ্ন বদলায়: 'সবচেয়ে বেশি বিক্রি হওয়া প্রোডাক্ট কে?' 'এই মাসের রেভিনিউ গত দিনগুলোর সাথে কেমন?' Window function (`RANK`, `SUM() OVER`) দিয়ে একই query-তে গ্রুপ ধরে হিসাব করা যায় — আলাদা করে সব ডেটা এনে জোড়া লাগাতে হয় না।",
    problemSlugs: ["sql-adv-top-product", "sql-adv-running-revenue"],
  },
  {
    slug: "hierarchies",
    level: "advanced",
    title: "Trees & referrals",
    titleBn: "সম্পর্কের গভীরে",
    summary:
      "ক্যাটাগরি হায়ারার্কি আর রেফারেল চেইন — যেখানে একটি সারি আরেকটি সারির উপর নির্ভর করে, recursion দিয়ে সমাধান।",
    concept:
      "ক্যাটাগরি কখনো এক স্তরের নয়: Electronics → Audio → Headphones। রেফারেলও একই রকম চেইন। Recursive CTE দিয়ে এই সম্পর্কগুলো ধাপে ধাপে ঘুরে পুরো path বা depth বের করা যায় — এটাই বাস্তব সিস্টেমের সবচেয়ে দরকারি কৌশলগুলোর একটি।",
    problemSlugs: ["sql-adv-category-tree", "sql-adv-referral-depth"],
  },
];

export const SQL_TRACK_INTRO = {
  title: "ShopSphere: query the marketplace",
  summary:
    "একটি মাল্টি-ভেন্ডর অনলাইন দোকান। ভেন্ডর, কাস্টমার, প্রোডাক্ট, অর্ডার, রিভিউ, ক্যাটাগরি আর রেফারেল — সব একই ডেটাবেসে। প্রতিটি টপিক বাস্তব প্রশ্ন দিয়ে শুরু হয়, তারপর সেই প্রশ্নের SQL সমাধান।",
  tables: [
    ["vendors", "id, name, city, rating"],
    ["customers", "id, name, city, signup_date"],
    ["categories", "id, name, parent_id"],
    ["products", "id, vendor_id, category_id, name, price_cents, stock, rating"],
    ["orders", "id, customer_id, ordered_at, status"],
    ["order_items", "id, order_id, product_id, quantity, unit_price_cents"],
    ["reviews", "id, product_id, customer_id, rating, created_at"],
    ["referrals", "customer_id, referred_by"],
  ],
} as const;
