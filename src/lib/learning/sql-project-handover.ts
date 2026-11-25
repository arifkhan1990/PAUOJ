/**
 * The final handover: what the learner must be able to prove before the
 * ShopSphere project is signed off.
 *
 * Every topic and problem reference is checked against the curriculum and the
 * judge problem catalog by `sql-project.test.ts`.
 */

import type { SqlProjectHandoverItem } from "./sql-project";

export const SQL_PROJECT_HANDOVER: SqlProjectHandoverItem[] = [
  {
    id: "HO-01",
    title: "Schema map",
    titleBn: "স্কিমা ম্যাপ",
    proof:
      "১৯টি টেবিল, তাদের কী আর কোন টেবিল কোন টেবিলের সাথে যুক্ত—এক পাতাে এঁকে ব্যাখ্যা করা; কোন প্রশ্নে কোন টেবিল লাগবে সেটা JOIN লিখতে না গিয়েই বলা।",
    topicSlugs: ["orientation", "joins-in-depth", "order-lifecycle"],
    problemSlugs: [
      "sql-vendor-directory",
      "sql-same-category-pairs",
      "sql-orders-without-payment",
    ],
  },
  {
    id: "HO-02",
    title: "Money and grain",
    titleBn: "টাকা ও grain",
    proof:
      "কেন রেভিনিউ `order_items.unit_price_cents` থেকে আসে, `products.price_cents` থেকে নয়; আর অর্ডার-ধরে বনাম আইটেম-ধরে গুনলে সংখ্যা কীভাবে বদলায়—উদাহরণ দিয়ে দেখানো।",
    topicSlugs: ["money-and-orders", "business-metrics", "pivot-grouping"],
    problemSlugs: [
      "sql-order-receipts",
      "sql-adv-category-share",
      "sql-adv-vendor-month-pivot",
    ],
  },
  {
    id: "HO-03",
    title: "Joins and fan-out",
    titleBn: "জয়েন ও fan-out",
    proof:
      "একাধিক one-to-many JOIN-এ সারি ফুলে যাওয়া নিজে ধরে, `COUNT(DISTINCT ...)` বা pre-aggregated CTE দিয়ে ঠিক করা; self-join-এ `id <` শর্তের কারণ ব্যাখ্যা করা।",
    topicSlugs: ["joins-in-depth", "funnels-coupons"],
    problemSlugs: ["sql-vendor-city-peers", "sql-adv-coupon-performance"],
  },
  {
    id: "HO-04",
    title: "Missing rows",
    titleBn: "যেখানে সারি নেই",
    proof:
      "`LEFT JOIN`-এর শর্ত ON-এ না WHERE-এ বসলে কী হয় দেখানো; `NOT EXISTS` বনাম `NOT IN`-এর NULL-ফাঁদ, আর dead stock/customers-without-orders রিপোর্ট ব্যাখ্যা করা।",
    topicSlugs: ["missing-rows", "subqueries"],
    problemSlugs: ["sql-unsold-products", "sql-customers-without-orders"],
  },
  {
    id: "HO-05",
    title: "Windows",
    titleBn: "উইন্ডো",
    proof:
      "rank, running total, moving average আর LAG/LEAD—কোন প্রশ্নে কোনটা, frame কীভাবে বদলায়, আর window-এর ORDER BY-তে টাই-ব্রেক না দিলে ফল কেন অনির্দিষ্ট হয়।",
    topicSlugs: ["window-thinking", "advanced-windows", "timelines"],
    problemSlugs: [
      "sql-adv-top-product",
      "sql-adv-customer-lag",
      "sql-adv-moving-average",
    ],
  },
  {
    id: "HO-06",
    title: "CTEs and recursion",
    titleBn: "CTE ও রিকার্সন",
    proof:
      "এক জটিল রিপোর্টকে ধাপে ধাপে CTE-তে ভাগ করা, আর recursive CTE দিয়ে ক্যাটাগরি path ও রেফারেল depth বের করা—থামার শর্ত কোথায়, সেটাসহ।",
    topicSlugs: ["hierarchies", "business-metrics"],
    problemSlugs: ["sql-adv-category-tree", "sql-adv-referral-depth"],
  },
  {
    id: "HO-07",
    title: "Funnel and coupons",
    titleBn: "ফানেল ও কুপন",
    proof:
      "মাসিক কার্ট-কনভার্সন conditional aggregation-এ বের করা, আর কুপন attribution-এ order-level grain রেখে ছাড়/রেভিনিউ দুইবার গোনা এড়ানো।",
    topicSlugs: ["funnels-coupons", "set-operations"],
    problemSlugs: [
      "sql-adv-cart-conversion",
      "sql-adv-coupon-performance",
      "sql-marketplace-cities",
    ],
  },
  {
    id: "HO-08",
    title: "JSON and inventory",
    titleBn: "JSON ও ইনভেন্টরি",
    proof:
      "`json_extract` দিয়ে ব্র্যান্ড/ওয়ারেন্টি পড়া, আর movement লেজারের signed যোগফল `products.stock`-এর সাথে মিলিয়ে অমিলের তালিকা বের করা।",
    topicSlugs: ["json-inventory"],
    problemSlugs: ["sql-adv-brand-warranty", "sql-adv-stock-reconciliation"],
  },
  {
    id: "HO-09",
    title: "Payout reconciliation",
    titleBn: "পেআউট reconciliation",
    proof:
      "payout টেবিল বিশ্বাস না করে gross, ১০% কমিশন আর approved রিফান্ড থেকে expected net আবার গুনে difference বের করা; চিহ্ন দেখে overpaid/underpaid বলা।",
    topicSlugs: ["finance-reconciliation"],
    problemSlugs: [
      "sql-adv-payout-reconciliation",
      "sql-adv-refund-impact",
    ],
  },
  {
    id: "HO-10",
    title: "Performance",
    titleBn: "পারফরম্যান্স",
    proof:
      "`EXPLAIN QUERY PLAN` পড়ে SCAN থেকে SEARCH-এ যাওয়া; sargable predicate, composite index আর গভীর পেজে keyset কার্সর—আগের ফলের সাথে হুবহু মিলিয়ে দেখানো।",
    topicSlugs: ["query-performance", "pagination"],
    problemSlugs: [
      "sql-adv-keyset-pagination",
      "sql-adv-sargable-date",
      "sql-top-products-page",
    ],
  },
  {
    id: "HO-11",
    title: "Safe DDL, DML and transactions",
    titleBn: "নিরাপদ DDL, DML ও ট্রানজেকশন",
    proof:
      "index/view তৈরি করে `sqlite_master`-এ যাচাই; `WHERE`-সহ UPDATE/DELETE; `BEGIN`/`ROLLBACK` দিয়ে প্রমাণ করা যে ব্যর্থ ধাপের পরও ডেটা আগের মতো।",
    topicSlugs: ["ddl-and-indexes", "dml-and-transactions"],
    problemSlugs: [
      "sql-lab-create-index",
      "sql-lab-create-view",
      "sql-lab-transaction",
    ],
  },
  {
    id: "HO-12",
    title: "Capstone: vendor and retention",
    titleBn: "ক্যাপস্টোন: ভেন্ডর ও রিটেনশন",
    proof:
      "এক query-তে একাধিক CTE, conditional aggregation আর rank মিলিয়ে ভেন্ডর scorecard, আর সাইনআপ-কোহর্টের repeat retention—দুটোই নিজে লিখে ব্যাখ্যা করা।",
    topicSlugs: ["capstone"],
    problemSlugs: [
      "sql-adv-vendor-scorecard",
      "sql-adv-cohort-retention",
    ],
  },
];
