/**
 * The metric catalog every ShopSphere report is defined against.
 *
 * A definition that contradicts the judge problems is a bug: `formula` shows the
 * shape of the calculation, and `sql-project.test.ts` keeps every table name
 * real.
 */

import type { SqlProjectMetric } from "./sql-project";

export const SQL_PROJECT_METRICS: SqlProjectMetric[] = [
  {
    id: "gmv",
    name: "GMV",
    definition:
      "paid/shipped অর্ডারের order_items-এ লেখা quantity × unit_price_cents-এর যোগফল; কুপন-ছাড় বা রিফান্ড বাদ দেওয়ার আগের মোট বাণিজ্যিক মূল্য, সেন্টে।",
    formula:
      "SUM(order_items.quantity * order_items.unit_price_cents) WHERE orders.status IN ('paid','shipped')",
    tables: ["orders", "order_items"],
    owner: "Order Desk squad",
  },
  {
    id: "collected-revenue",
    name: "Collected revenue",
    definition:
      "যে টাকা সত্যিই এসেছে—শুধু status `paid` পেমেন্টের amount_cents যোগফল; refunded, failed আর pending বাদ, তাই এটি GMV-এর চেয়ে ছোট হতে পারে।",
    formula: "SUM(payments.amount_cents) WHERE payments.status = 'paid'",
    tables: ["payments"],
    owner: "Finance Analyst",
  },
  {
    id: "aov",
    name: "Average order value",
    definition:
      "paid/shipped অর্ডারপ্রতি গড় GMV; হর হলো আলাদা অর্ডারের সংখ্যা, আইটেম-সারির সংখ্যা নয়।",
    formula:
      "SUM(order_items.quantity * order_items.unit_price_cents) / COUNT(DISTINCT orders.id)",
    tables: ["orders", "order_items"],
    owner: "Order Desk squad",
  },
  {
    id: "discount-cost",
    name: "Discount cost",
    definition:
      "কুপন-রিডেম্পশনে দেওয়া মোট ছাড়, সেন্টে; এক redemption = এক সারি, তাই order_items-এর সাথে সরাসরি JOIN করলে মান ফুলে যাবে।",
    formula: "SUM(coupon_redemptions.discount_cents)",
    tables: ["coupon_redemptions", "coupons"],
    owner: "Growth squad",
  },
  {
    id: "refund-rate",
    name: "Refund rate",
    definition:
      "approved রিটার্নের refund_cents ÷ একই সময়ের paid/shipped GMV × ১০০; রিটার্নের মাস অর্ডারের তারিখ ধরে, requested_at নয়।",
    formula:
      "100.0 * SUM(returns.refund_cents) / SUM(order_items.quantity * order_items.unit_price_cents)",
    tables: ["returns", "order_items", "orders"],
    owner: "Ops Analyst",
  },
  {
    id: "repeat-rate",
    name: "Repeat rate",
    definition:
      "যাদের অন্তত একটি paid/shipped অর্ডার আছে, তাদের মধ্যে যাদের অন্তত দুটি আছে সেই কাস্টমারের শতাংশ।",
    formula:
      "100.0 * COUNT(customer with >= 2 paid/shipped orders) / COUNT(customer with >= 1)",
    tables: ["orders", "customers"],
    owner: "Growth squad",
  },
  {
    id: "cart-conversion",
    name: "Cart conversion",
    definition:
      "কার্ট তৈরির মাস ধরে converted কার্ট ÷ সব কার্ট × ১০০; হরে abandoned আর active কার্টও থাকে, আর মাস ঠিক হয় carts.created_at দিয়ে।",
    formula:
      "100.0 * SUM(CASE WHEN carts.status = 'converted' THEN 1 ELSE 0 END) / COUNT(*)",
    tables: ["carts"],
    owner: "Growth squad",
  },
  {
    id: "dead-stock",
    name: "Dead stock",
    definition:
      "যে প্রোডাক্টের নামে একটিও order_item নেই—স্টক থাকলেও একবারও বিক্রি হয়নি; সংখ্যাটাই dead stock-এর মাপ।",
    formula:
      "COUNT(products) WHERE NOT EXISTS (SELECT 1 FROM order_items WHERE order_items.product_id = products.id)",
    tables: ["products", "order_items"],
    owner: "Catalog Health squad",
  },
  {
    id: "payout-variance",
    name: "Payout variance",
    definition:
      "vendor_payouts-এ লেখা net আর source থেকে নতুন করে হিসাব করা expected net-এর পার্থক্য (payout_net − expected_net); ধনাত্মক মানে ভেন্ডর বেশি পেয়েছে।",
    formula:
      "vendor_payouts.net_cents - (expected_gross - 0.10 * expected_gross - approved_refunds)",
    tables: ["vendor_payouts", "orders", "order_items", "products", "returns"],
    owner: "Finance Analyst",
  },
  {
    id: "retention",
    name: "Cohort retention",
    definition:
      "সাইনআপ মাসের কোহর্টে মোট কাস্টমারের মধ্যে যাদের পরে অন্তত দুটি paid/shipped অর্ডার আছে তাদের শতাংশ; এটাই কোহর্টের repeat retention।",
    formula:
      "100.0 * COUNT(cohort customer with >= 2 paid/shipped orders) / COUNT(cohort customers)",
    tables: ["customers", "orders"],
    owner: "Head of Data",
  },
];
