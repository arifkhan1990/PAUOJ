/**
 * Work tickets for the remaining ShopSphere topics.
 *
 * Each ticket is the squad request behind one lesson topic; the deliverables are
 * that topic's two judge-backed guided problems.
 */

import type { SqlProjectTicket } from "./sql-project";

export const SQL_PROJECT_TICKETS_B: SqlProjectTicket[] = [
  {
    id: "SHOP-CAT-05",
    topicSlug: "json-inventory",
    moduleSlug: "advanced-sql",
    epicSlug: "catalog-health",
    role: "Data Engineer",
    title: "Brand and warranty report from JSON",
    titleBn: "JSON থেকে ব্র্যান্ড ও ওয়ারেন্টি",
    brief:
      "ক্যাটালগ টিম `product_attributes.attributes`-এর ভেতরের brand আর warranty_months দিয়ে ব্র্যান্ডভিত্তিক রিপোর্ট চায়; একই সাথে movement লেজার ধরে `products.stock`-এর অমিলের তালিকা। JSON path ভুল হলে পুরো কলাম NULL আসবে, তাই যাচাই দরকার।",
    acceptance: [
      "`json_extract` path `$.brand` আর `$.warranty_months`।",
      "ব্র্যান্ড ধরে প্রোডাক্ট-সংখ্যা ও গড় ওয়ারেন্টি মাস।",
      "স্টক-অমিল `ABS` দিয়ে সাজানো, বড় অমিল আগে।",
    ],
    tables: ["product_attributes", "products", "inventory_movements"],
    deliverableProblemSlugs: [
      "sql-adv-brand-warranty",
      "sql-adv-stock-reconciliation",
    ],
  },
  {
    id: "SHOP-FIN-01",
    topicSlug: "finance-reconciliation",
    moduleSlug: "advanced-sql",
    epicSlug: "vendor-finance",
    role: "Finance Analyst",
    title: "October payout audit",
    titleBn: "অক্টোবর পেআউট অডিট",
    brief:
      "মাস শেষে ফাইন্যান্স টিম অক্টোবরের প্রতিটি vendor payout source থেকে আবার গুনে মেলাবে: gross, ১০% কমিশন, approved রিফান্ড আর expected net। approved না-হওয়া রিটার্ন বাদ যাবে, আর রিফান্ডের মাস ঠিক হবে অর্ডারের তারিখে।",
    acceptance: [
      "chained CTE: payout, gross, refunds, expected।",
      "difference = `payout_net_cents − expected_net_cents`।",
      "রিফান্ড-নেই ভেন্ডরও `LEFT JOIN` + `COALESCE`-এ থাকে।",
    ],
    tables: [
      "vendor_payouts",
      "orders",
      "order_items",
      "products",
      "returns",
      "vendors",
    ],
    deliverableProblemSlugs: [
      "sql-adv-payout-reconciliation",
      "sql-adv-refund-impact",
    ],
  },
  {
    id: "SHOP-FIN-02",
    topicSlug: "capstone",
    moduleSlug: "advanced-sql",
    epicSlug: "vendor-finance",
    role: "Staff Engineer",
    title: "Vendor scorecard and signup-cohort retention",
    titleBn: "ভেন্ডর স্কোরকার্ড ও কোহর্ট রিটেনশন",
    brief:
      "কোয়ার্টার-রিভিউতে ভেন্ডর স্কোরকার্ড (রেভিনিউ, অর্ডার-সংখ্যা, গড় অর্ডার, rank) আর সাইনআপ-মাস কোহর্টের repeat rate একসাথে লাগবে। দুটোই একাধিক CTE আর conditional aggregation, তাই rank-এর টাই আর খালি কোহর্ট দুইটাই ভাবতে হবে।",
    acceptance: [
      "স্কোরকার্ডে window rank, সমান রেভিনিউতে নাম দিয়ে টাই-ব্রেক।",
      "কোহর্টে অন্তত দুটি কার্যকর অর্ডার করা কাস্টমার গোনা।",
      "কোনো অর্ডার নেই এমন ভেন্ডর/কাস্টমারও রিপোর্টে থাকে।",
    ],
    tables: [
      "vendors",
      "products",
      "orders",
      "order_items",
      "customers",
    ],
    deliverableProblemSlugs: [
      "sql-adv-vendor-scorecard",
      "sql-adv-cohort-retention",
    ],
  },
  {
    id: "SHOP-FUL-03",
    topicSlug: "timelines",
    moduleSlug: "advanced-sql",
    epicSlug: "fulfillment",
    role: "Analytics Engineer",
    title: "Daily moving average and customer running total",
    titleBn: "দৈনিক চলমান গড় ও কাস্টমার রানিং টোটাল",
    brief:
      "ড্যাশবোর্ডে দৈনিক রেভিনিউয়ের ৭-দিনের গড় আর প্রতি কাস্টমারের ক্রমজমা টাকা দেখাতে হবে। দিন-সারি বানানোর আগে window চালালে এক অর্ডারের আইটেম-সারি আলাদা দিন হিসেবে গুনে যাবে।",
    acceptance: [
      "CTE-তে দিন/অর্ডার grain, paid/shipped ফিল্টার সেখানেই।",
      "`ROWS BETWEEN 6 PRECEDING AND CURRENT ROW` দিয়ে ৭-দিনের গড়।",
      "`PARTITION BY` কাস্টমার, `ORDER BY`-তে `order_id` টাই-ব্রেক।",
    ],
    tables: ["orders", "order_items", "customers"],
    deliverableProblemSlugs: [
      "sql-adv-moving-average",
      "sql-adv-customer-running",
    ],
  },
  {
    id: "SHOP-GRW-02",
    topicSlug: "funnels-coupons",
    moduleSlug: "advanced-sql",
    epicSlug: "growth",
    role: "Analytics Engineer",
    title: "Cart conversion and coupon attribution",
    titleBn: "কার্ট কনভার্সন ও কুপন attribution",
    brief:
      "মার্কেটিং টিম মাসিক কার্ট-কনভার্সন আর কুপন-প্রতি রেভিনিউ/ছাড় দেখতে চায়। কুপনের রিপোর্টে order_items সরাসরি JOIN করলে ছাড় বারবার গুনে ফুলে যাবে, তাই আগে অর্ডার-মোটের CTE বানাতে হবে।",
    acceptance: [
      "`carts.created_at` ধরে মাস, হরে সব কার্ট।",
      "`SUM(CASE WHEN ...)` দিয়ে converted গণনা, `100.0` দিয়ে শতাংশ।",
      "কুপন রিপোর্টে order-level CTE, redemption grain অটুট।",
    ],
    tables: ["carts", "coupons", "coupon_redemptions", "orders", "order_items"],
    deliverableProblemSlugs: [
      "sql-adv-cart-conversion",
      "sql-adv-coupon-performance",
    ],
  },
  {
    id: "SHOP-GRW-03",
    topicSlug: "advanced-windows",
    moduleSlug: "advanced-sql",
    epicSlug: "growth",
    role: "Data Engineer",
    title: "Order gaps and price quartiles",
    titleBn: "অর্ডার-ব্যবধান ও দামের কোয়ার্টাইল",
    brief:
      "গ্রোথ টিম কাস্টমার ফেরার ব্যবধান (আগের অর্ডার থেকে দিন) আর ক্যাটাগরির ভেতরে দামের চার স্তর দেখতে চায়। self-join-এর বদলে window ব্যবহার করলে এক স্ক্যানেই হবে, তবে প্রথম অর্ডারে NULL আসাটাই সঠিক সংকেত।",
    acceptance: [
      "`LAG` partition কাস্টমার, `ORDER BY`-তে `order_id`।",
      "`NTILE(4)` partition ক্যাটাগরি, দাম desc।",
      "প্রথম অর্ডারে `days_since_previous` NULL থাকে।",
    ],
    tables: ["orders", "order_items", "customers", "products", "categories"],
    deliverableProblemSlugs: ["sql-adv-customer-lag", "sql-adv-ntile-products"],
  },
  {
    id: "SHOP-ANL-01",
    topicSlug: "window-thinking",
    moduleSlug: "advanced-sql",
    epicSlug: "analytics-platform",
    role: "Analytics Engineer",
    title: "Top product per category and running revenue",
    titleBn: "ক্যাটাগরিপ্রতি সেরা প্রোডাক্ট ও চলমান রেভিনিউ",
    brief:
      "অ্যানালিটিক্স প্ল্যাটফর্ম প্রতিটি ক্যাটাগরির শীর্ষ প্রোডাক্ট আর দিন-ধরে চলমান রেভিনিউয়ের এক reusable query চায়। rank-এ সমান রেভিনিউ হলে প্রোডাক্টের নাম দিয়ে টাই ভাঙতে হবে।",
    acceptance: [
      "`RANK()` partition ক্যাটাগরি, রেভিনিউ desc।",
      "চলমান যোগ `SUM() OVER (ORDER BY day)`।",
      "শীর্ষ-১ ফিল্টার বাইরের query-তে, window-এর ভেতরে নয়।",
    ],
    tables: ["orders", "order_items", "products", "categories"],
    deliverableProblemSlugs: [
      "sql-adv-top-product",
      "sql-adv-running-revenue",
    ],
  },
  {
    id: "SHOP-ANL-02",
    topicSlug: "hierarchies",
    moduleSlug: "advanced-sql",
    epicSlug: "analytics-platform",
    role: "Data Engineer",
    title: "Category paths and referral depth",
    titleBn: "ক্যাটাগরি path ও রেফারেল depth",
    brief:
      "ক্যাটাগরি-ট্রি এখন দুই স্তরের, কিন্তু নতুন সাব-ক্যাটাগরি যোগ হলে path নিজে থেকেই বাড়তে হবে—তাই recursive CTE লাগবে। একই কৌশলে রেফারেল চেইনের depth বের করতে হবে, আর যিনি কাউকে আনেননি তাঁর depth শূন্য।",
    acceptance: [
      "`WITH RECURSIVE` দিয়ে পূর্ণ category path।",
      "রেফারেল chain depth root-এ থামে।",
      "চেইনে `referred_by` NULL হলে থামে, অসীম লুপ হয় না।",
    ],
    tables: ["categories", "customers", "referrals"],
    deliverableProblemSlugs: [
      "sql-adv-category-tree",
      "sql-adv-referral-depth",
    ],
  },
  {
    id: "SHOP-ANL-03",
    topicSlug: "pivot-grouping",
    moduleSlug: "advanced-sql",
    epicSlug: "analytics-platform",
    role: "Analytics Engineer",
    title: "Vendor-month pivot and status matrix",
    titleBn: "ভেন্ডর-মাস পিভট ও স্ট্যাটাস ম্যাট্রিক্স",
    brief:
      "লিডারশিপ এক নজরে চওড়া রিপোর্ট চায়: সারিতে ভেন্ডর, কলামে অক্টোবর/নভেম্বর, শেষে মোট; আরেকটি ম্যাট্রিক্সে সারিতে ভেন্ডর, কলামে অর্ডার-স্ট্যাটাস। SQLite-এ `GROUPING SETS` নেই, তাই `SUM(CASE ...)` আর `UNION ALL` পথেই করতে হবে।",
    acceptance: [
      "প্রতি মাসে এক `SUM(CASE ...)` কলাম, `ELSE 0` সহ।",
      "বিক্রি-নেই ভেন্ডর `LEFT JOIN` + `COALESCE`-এ থাকে।",
      "স্ট্যাটাস-ম্যাট্রিক্সে সারি-কলাম ক্রম নির্দিষ্ট।",
    ],
    tables: ["vendors", "products", "orders", "order_items"],
    deliverableProblemSlugs: [
      "sql-adv-vendor-month-pivot",
      "sql-adv-status-matrix",
    ],
  },
  {
    id: "SHOP-PLT-02",
    topicSlug: "query-performance",
    moduleSlug: "advanced-sql",
    epicSlug: "platform-quality",
    role: "Staff Engineer",
    title: "Keyset pagination and sargable dates",
    titleBn: "Keyset পেজিনেশন ও sargable তারিখ",
    brief:
      "অর্ডার ফিডে গভীর পেজে `OFFSET` ধীর হয়ে যাচ্ছে, আর তারিখ ফিল্টারে `strftime()` থাকায় index কাজ করছে না। ডেলিভারেবল: keyset কার্সর আর ফাংশন-মুক্ত predicate—দুটোর ফল আগের query-র সাথে হুবহু মিলতে হবে।",
    acceptance: [
      "কার্সর predicate `(ordered_at, id) > (আগের মান)`, আউটপুট বদলায় না।",
      "`ordered_at >= ... AND < ...` ফর্মে ফিল্টার, কলামে ফাংশন নয়।",
      "প্ল্যানে পুরো টেবিল `SCAN` নয়, index `SEARCH`।",
    ],
    tables: ["orders", "customers"],
    deliverableProblemSlugs: [
      "sql-adv-keyset-pagination",
      "sql-adv-sargable-date",
    ],
  },
  {
    id: "SHOP-PLT-03",
    topicSlug: "ddl-and-indexes",
    moduleSlug: "advanced-sql",
    epicSlug: "platform-quality",
    role: "Data Engineer",
    title: "Index and view rollout",
    titleBn: "ইনডেক্স ও ভিউ রোলআউট",
    brief:
      "রিপোর্ট টিম একই ভেন্ডর-রেভিনিউ JOIN বারবার লিখছে, আর `orders(customer_id, ordered_at)`-এ lookup ধীর। ল্যাবে composite index আর একটি view তৈরি করে `sqlite_master` দিয়ে প্রমাণ দিতে হবে; প্রোডাকশনে এই script একবারই চলবে বলে নাম সংঘর্ষও মাথায় রাখতে হবে।",
    acceptance: [
      "equality আগে, range পরে—composite index-এর ক্রম।",
      "view-এ পুরো রিপোর্ট query, `SELECT *` নয়।",
      "`sqlite_master`-এ type আর name দিয়ে যাচাই।",
    ],
    tables: ["orders", "vendors", "products", "order_items"],
    deliverableProblemSlugs: ["sql-lab-create-index", "sql-lab-create-view"],
  },
  {
    id: "SHOP-PLT-04",
    topicSlug: "dml-and-transactions",
    moduleSlug: "advanced-sql",
    epicSlug: "platform-quality",
    role: "Backend Engineer",
    title: "Stock adjustment transaction",
    titleBn: "স্টক সমন্বয় ট্রানজেকশন",
    brief:
      "গুদাম টিম একটি প্রোডাক্টের স্টক বাড়াবে আর ভেন্ডর-রেটিং ঠিক করবে, কিন্তু ভুল হলে সব বাতিল হতে হবে। `BEGIN`/`ROLLBACK` দিয়ে প্রমাণ করতে হবে যে ব্যর্থ ধাপের পরও আগের মান অটুট, আর শেষ SELECT-ই judge-এর ফল।",
    acceptance: [
      "`WHERE` ছাড়া `UPDATE`/`DELETE` নেই।",
      "`stock = stock + n` আপেক্ষিক মান, fixed সংখ্যা নয়।",
      "ROLLBACK-এর পর SELECT-এ পুরনো মান ফিরে আসে।",
    ],
    tables: ["products", "vendors"],
    deliverableProblemSlugs: ["sql-lab-dml", "sql-lab-transaction"],
  },
];
