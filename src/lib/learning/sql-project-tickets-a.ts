/**
 * Work tickets for the ten Basic SQL topics plus `business-metrics`.
 *
 * `business-metrics` is the one Advanced SQL topic whose squad ticket sits with
 * the order-desk batch; the rest live in `sql-project-tickets-b.ts`. Each ticket
 * is the request behind one lesson topic, and its deliverables are that topic's
 * two judge-backed guided problems.
 */

import type { SqlProjectTicket } from "./sql-project";

export const SQL_PROJECT_TICKETS_A: SqlProjectTicket[] = [
  {
    id: "SHOP-CAT-01",
    topicSlug: "orientation",
    moduleSlug: "basic-sql",
    epicSlug: "catalog-health",
    role: "Analytics Engineer",
    title: "Catalog orientation report",
    titleBn: "ক্যাটালগ ওরিয়েন্টেশন রিপোর্ট",
    brief:
      "ক্যাটালগ টিমের নতুন অনবোর্ডিং পেজে ভেন্ডর ডিরেক্টরি (নাম ও শহর) আর ১০টির কম স্টক থাকা প্রোডাক্টের তালিকা দরকার। দুটো রিপোর্ট একই ড্যাশবোর্ডে যাবে, তাই ক্রম deterministic হতে হবে।",
    acceptance: [
      "ভেন্ডর ডিরেক্টরিতে শুধু দরকারি কলাম, আর নাম দিয়ে নির্দিষ্ট ক্রম।",
      "কম-স্টকের সীমা ১০ এবং প্রতিটি সারিতে ভেন্ডরের নাম থাকে।",
      "একই ডেটায় দুইবার চালালে ফল হুবহু একই আসে।",
    ],
    tables: ["vendors", "products"],
    deliverableProblemSlugs: ["sql-vendor-directory", "sql-low-stock"],
  },
  {
    id: "SHOP-CAT-02",
    topicSlug: "missing-rows",
    moduleSlug: "basic-sql",
    epicSlug: "catalog-health",
    role: "Ops Analyst",
    title: "Dead stock and stock-health buckets",
    titleBn: "ডেড স্টক ও স্টক-হেলথ",
    brief:
      "মার্কেটিং অপ্রচলিত পণ্যে বাজেট দিচ্ছে। অর্ডার-আইটেমে একবারও না-আসা প্রোডাক্টের তালিকা আর স্টককে স্বাস্থ্যকর/কম/শেষ bucket-এ ভাগ করা রিপোর্ট দরকার; যেসব প্রোডাক্ট কোনো অর্ডারেই নেই সেগুলো যেন হারিয়ে না যায়।",
    acceptance: [
      "শূন্য-বিক্রি প্রোডাক্ট `LEFT JOIN` বা `NOT EXISTS` দিয়েও ধরা পড়ে।",
      "স্টক bucket-এর সীমা রিপোর্টেই লেখা, বাইরের অনুমান নয়।",
      "unmatched সারি বাদ পড়ে না—শূন্য গণনাও ফল হিসেবে থাকে।",
    ],
    tables: ["products", "vendors", "order_items", "orders"],
    deliverableProblemSlugs: ["sql-unsold-products", "sql-stock-health"],
  },
  {
    id: "SHOP-CAT-03",
    topicSlug: "text-and-dates",
    moduleSlug: "basic-sql",
    epicSlug: "catalog-health",
    role: "Analytics Engineer",
    title: "Support search and Q1 signup list",
    titleBn: "সাপোর্ট সার্চ ও Q1 সাইনআপ",
    brief:
      "সাপোর্ট এজেন্ট প্রোডাক্টের নামে কেস-নিরপেক্ষ সার্চ চায়, আর গ্রোথ টিম ২০২৬ Q1-এ খোলা অ্যাকাউন্টের তালিকা চায়। মাস-সীমা ভুল হলে quarter-এর সংখ্যা ভুল হবে, তাই রেঞ্জ সাবধানে লিখতে হবে।",
    acceptance: [
      "`lower()` আর `LIKE '%...%'` দিয়ে কেস-নিরপেক্ষ ম্যাচ।",
      "Q1 রেঞ্জ হাফ-ওপেন: `>= '2026-01-01'` আর `< '2026-04-01'`।",
      "সমান তারিখে নাম দিয়ে টাই-ব্রেক, যেন ক্রম স্থির থাকে।",
    ],
    tables: ["products", "customers"],
    deliverableProblemSlugs: ["sql-product-search", "sql-q1-signups"],
  },
  {
    id: "SHOP-CAT-04",
    topicSlug: "joins-in-depth",
    moduleSlug: "basic-sql",
    epicSlug: "catalog-health",
    role: "Data Engineer",
    title: "Competitor pairs in the same category",
    titleBn: "একই ক্যাটাগরির প্রতিযোগী জোড়া",
    brief:
      "ক্যাটালগ টিম একই ক্যাটাগরির প্রোডাক্ট-জোড়া আর একই শহরের ভেন্ডর-জোড়া দেখতে চায়, দামের ব্যবধানসহ। আগের রিপোর্টে প্রতিটি জোড়া দুইবার আর নিজের সাথে নিজের জোড়া এসেছিল—সেটা ঠিক করতে হবে।",
    acceptance: [
      "self-join-এ `id <` শর্ত, তাই প্রতিটি জোড়া ঠিক একবার।",
      "দামের ব্যবধান `ABS` দিয়ে, দিক নিরপেক্ষ।",
      "জোড়ার ভেতরের কে সস্তা/দামি তা `CASE` দিয়ে নির্ধারিত।",
    ],
    tables: ["products", "categories", "vendors"],
    deliverableProblemSlugs: ["sql-same-category-pairs", "sql-vendor-city-peers"],
  },
  {
    id: "SHOP-ORD-01",
    topicSlug: "money-and-orders",
    moduleSlug: "basic-sql",
    epicSlug: "order-desk",
    role: "Analytics Engineer",
    title: "Vendor revenue and order receipts",
    titleBn: "ভেন্ডর রেভিনিউ ও অর্ডার রসিদ",
    brief:
      "অর্ডার ডেস্ক প্রতিদিন ভেন্ডরকে রেভিনিউ পাঠায় আর কাস্টমারকে অর্ডার-রসিদ দেখায়। দুই রিপোর্টের grain আলাদা—একটা ভেন্ডর-ধরে, আরেকটা অর্ডার-ধরে—তাই JOIN-এ ডুপ্লিকেট গুনা যাবে না।",
    acceptance: [
      "শুধু `paid` আর `shipped` অর্ডার রেভিনিউ হিসেবে গোনা।",
      "ভেন্ডর-ধরে `SUM(quantity * unit_price_cents)`।",
      "খালি গ্রুপ বাদ দিতে `HAVING`, আর নাম দিয়ে নির্দিষ্ট ক্রম।",
    ],
    tables: ["orders", "order_items", "products", "vendors", "customers"],
    deliverableProblemSlugs: ["sql-vendor-revenue", "sql-order-receipts"],
  },
  {
    id: "SHOP-ORD-02",
    topicSlug: "subqueries",
    moduleSlug: "basic-sql",
    epicSlug: "order-desk",
    role: "Analytics Engineer",
    title: "Above-average pricing and dormant customers",
    titleBn: "গড়ের উপরে দাম আর নিষ্ক্রিয় কাস্টমার",
    brief:
      "ক্যাটাগরি টিম জানে কোন প্রোডাক্ট নিজের ক্যাটাগরির গড়ের চেয়ে দামি, আর রিটেনশন টিম চায় এমন কাস্টমারের তালিকা যিনি অ্যাকাউন্ট খুলেও একবারও অর্ডার করেননি। দুটোই এক টেবিলের সাথে আরেক টেবিলের সম্পর্ক, তাই subquery-র ধরন ঠিক করতে হবে।",
    acceptance: [
      "ক্যাটাগরি-গড়ের তুলনা correlated subquery-তে, বাইরের ক্যাটাগরির সাথে বাঁধা।",
      "অর্ডারহীন কাস্টমারে `NOT EXISTS`, `NOT IN` নয়।",
      "ফল নাম/আইডি দিয়ে স্থির ক্রমে সাজানো।",
    ],
    tables: ["products", "categories", "customers", "orders"],
    deliverableProblemSlugs: [
      "sql-above-category-average",
      "sql-customers-without-orders",
    ],
  },
  {
    id: "SHOP-ORD-03",
    topicSlug: "business-metrics",
    moduleSlug: "advanced-sql",
    epicSlug: "order-desk",
    role: "Analytics Engineer",
    title: "Category share and monthly growth",
    titleBn: "ক্যাটাগরি শেয়ার ও মাসিক গ্রোথ",
    brief:
      "বোর্ড ডেকে ক্যাটাগরির রেভিনিউ শেয়ার আর গত মাসের তুলনায় গ্রোথ লাগবে। শেয়ারের হর পুরো প্ল্যাটফর্মের মোট রেভিনিউ—শুধু ওই ক্যাটাগরির নয়; আর প্রথম মাসে আগের তুলনা না-থাকলে NULL-ই থাকবে, শূন্য নয়।",
    acceptance: [
      "CTE-তে ক্যাটাগরি-রেভিনিউ আর আলাদা total, পরে শেয়ার।",
      "শেয়ার `100.0` গুণ করে এক দশমিকে রাউন্ড।",
      "প্রথম মাসে গ্রোথ NULL হিসেবে থাকে।",
    ],
    tables: ["orders", "order_items", "products", "categories"],
    deliverableProblemSlugs: ["sql-adv-category-share", "sql-adv-monthly-growth"],
  },
  {
    id: "SHOP-FUL-01",
    topicSlug: "order-lifecycle",
    moduleSlug: "basic-sql",
    epicSlug: "fulfillment",
    role: "Ops Analyst",
    title: "Unpaid orders and return rate by vendor",
    titleBn: "বকেয়া অর্ডার ও ভেন্ডরভিত্তিক রিটার্ন-হার",
    brief:
      "অপস টিম সকালে দেখে কোন অর্ডারের একটিও সফল পেমেন্ট নেই, আর কোন ভেন্ডরের রিটার্ন-হার বাড়ছে। এক অর্ডারে একাধিক payment রেকর্ড থাকতে পারে, তাই শুধু `status != 'paid'` দেখলে ভুল হবে।",
    acceptance: [
      "`NOT EXISTS` দিয়ে এমন অর্ডার যার একটিও `paid` পেমেন্ট নেই।",
      "রিটার্ন-হার দুই আলাদা CTE-র গণনা থেকে, আইটেম-সারিতে নয়।",
      "শতাংশে `100.0`, রিফান্ড-নেই ভেন্ডরে `COALESCE(..., 0)`।",
    ],
    tables: [
      "orders",
      "payments",
      "returns",
      "order_items",
      "products",
      "vendors",
      "customers",
    ],
    deliverableProblemSlugs: [
      "sql-orders-without-payment",
      "sql-return-rate-by-vendor",
    ],
  },
  {
    id: "SHOP-GRW-01",
    topicSlug: "set-operations",
    moduleSlug: "basic-sql",
    epicSlug: "growth",
    role: "Analytics Engineer",
    title: "Marketplace city coverage and silent buyers",
    titleBn: "শহর কভারেজ ও নীরব ক্রেতা",
    brief:
      "কুরিয়ার পার্টনার জানতে চায় সার্ভিস কোন কোন শহরে লাগবে—ভেন্ডর যেখান থেকে পাঠায় আর কাস্টমার যেখানে থাকে, দুই তালিকার ইউনিক মিল। ইনগেজমেন্ট টিম চায় যাদের অর্ডার আছে অথচ একটি রিভিউও নেই।",
    acceptance: [
      "`UNION`-এ দুই শহরের তালিকা, `ORDER BY` শুধু শেষে একবার।",
      "নীরব ক্রেতায় `EXISTS` আর `NOT EXISTS` জোড়া।",
      "ফলে ডুপ্লিকেট শহর নেই।",
    ],
    tables: ["vendors", "customers", "orders", "reviews"],
    deliverableProblemSlugs: ["sql-marketplace-cities", "sql-unreviewed-buyers"],
  },
  {
    id: "SHOP-PLT-01",
    topicSlug: "pagination",
    moduleSlug: "basic-sql",
    epicSlug: "platform-quality",
    role: "Backend Engineer",
    title: "Revenue report pagination",
    titleBn: "রেভিনিউ রিপোর্ট পেজিনেশন",
    brief:
      "ড্যাশবোর্ডে শীর্ষ প্রোডাক্টের তালিকা ৫টি করে পেজে দেখাতে হবে, আর সাপোর্ট ড্যাশবোর্ডে প্রতি কাস্টমারের সর্বশেষ কার্যকর অর্ডার। পেজের সীমানায় সমান রেভিনিউ হলে যেন সারি অদল-বদল না হয়।",
    acceptance: [
      "পেজ ২ মানে `LIMIT 5 OFFSET 5`, পেজ ১ নয়।",
      "`ORDER BY revenue_cents DESC, name` টাই-ব্রেকার সহ।",
      "সর্বশেষ অর্ডারে সমান তারিখে বড় `id` নির্বাচিত।",
    ],
    tables: ["orders", "order_items", "products", "customers"],
    deliverableProblemSlugs: [
      "sql-top-products-page",
      "sql-latest-order-per-customer",
    ],
  },
  {
    id: "SHOP-FUL-02",
    topicSlug: "text-dates-time",
    moduleSlug: "basic-sql",
    epicSlug: "fulfillment",
    role: "Ops Analyst",
    title: "SLA age of open orders",
    titleBn: "খোলা অর্ডারের SLA বয়স",
    brief:
      "সাপোর্ট এজেন্ট নাম-শহরে কাস্টমার খুঁজবে, আর ফুলফিলমেন্ট টিম প্রতিটি paid/shipped অর্ডারের বয়স দিনে দেখবে যাতে SLA মিস না হয়। তারিখ ISO টেক্সট, তাই তুলনা আর বয়সের হিসাব আলাদা করে ভাবতে হবে।",
    acceptance: [
      "`LIKE` + `lower()` দিয়ে নাম-শহর দুই কলামে সার্চ।",
      "`julianday` বিয়োগ করে `CAST ... AS INTEGER` পূর্ণ দিন।",
      "সর্বোচ্চ বয়স আগে, সমান হলে আইডি দিয়ে টাই-ব্রেক।",
    ],
    tables: ["customers", "orders"],
    deliverableProblemSlugs: ["sql-customer-search", "sql-order-age"],
  },
];
