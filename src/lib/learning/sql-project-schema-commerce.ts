/**
 * ShopSphere data dictionary, part 2: money, fulfillment, cart, inventory and payouts.
 *
 * Column names, base types and order follow `judge/shopsphere.sql`; the
 * integrity test parses the fixture and fails on any drift.
 */

import type { SqlProjectTable } from "./sql-project";

export const SQL_PROJECT_TABLES_COMMERCE: SqlProjectTable[] = [
  {
    name: "payments",
    group: "Orders & payments",
    purpose:
      "অর্ডারপ্রতি এক বা একাধিক পেমেন্ট চেষ্টা; `status` দিয়েই সফল পেমেন্ট ঠিক হয়।",
    rowCount: 11,
    primaryKey: "id",
    foreignKeys: ["order_id -> orders.id"],
    columns: [
      { name: "id", type: "INTEGER", note: "প্রাথমিক কী" },
      { name: "order_id", type: "INTEGER", note: "কোন অর্ডারের পেমেন্ট" },
      { name: "method", type: "TEXT", note: "bkash / card / cod" },
      {
        name: "amount_cents",
        type: "INTEGER",
        note: "পেমেন্টের অঙ্ক, সেন্টে",
      },
      {
        name: "status",
        type: "TEXT",
        note: "paid / pending / failed / refunded",
      },
      {
        name: "paid_at",
        type: "TEXT",
        note: "সফল পেমেন্টের সময়; pending/failed-এ NULL",
      },
      {
        name: "transaction_ref",
        type: "TEXT",
        note: "গেটওয়ে রেফারেন্স; NULL হতে পারে",
      },
    ],
    usedByEpicSlugs: ["fulfillment"],
  },
  {
    name: "shipments",
    group: "Fulfillment",
    purpose:
      "কুরিয়ার, ট্র্যাকিং ও ডেলিভারি সময়—ফুলফিলমেন্টের SLA এখান থেকেই মাপা হয়।",
    rowCount: 8,
    primaryKey: "id",
    foreignKeys: ["order_id -> orders.id"],
    columns: [
      { name: "id", type: "INTEGER", note: "প্রাথমিক কী" },
      { name: "order_id", type: "INTEGER", note: "কোন অর্ডারের শিপমেন্ট" },
      { name: "carrier", type: "TEXT", note: "কুরিয়ার পার্টনার" },
      { name: "tracking_no", type: "TEXT", note: "ট্র্যাকিং নম্বর" },
      {
        name: "status",
        type: "TEXT",
        note: "pending / shipped / delivered",
      },
      {
        name: "shipped_at",
        type: "TEXT",
        note: "শিপের তারিখ; এখনো না হলে NULL",
      },
      {
        name: "delivered_at",
        type: "TEXT",
        note: "ডেলিভারির তারিখ; না হলে NULL",
      },
    ],
    usedByEpicSlugs: ["fulfillment"],
  },
  {
    name: "returns",
    group: "Fulfillment",
    purpose:
      "আইটেম-ভিত্তিক রিটার্ন ও রিফান্ড; শুধু approved রিটার্নই রিফান্ড-হারে ঢোকে।",
    rowCount: 4,
    primaryKey: "id",
    foreignKeys: ["order_item_id -> order_items.id"],
    columns: [
      { name: "id", type: "INTEGER", note: "প্রাথমিক কী" },
      {
        name: "order_item_id",
        type: "INTEGER",
        note: "কোন লাইন-আইটেম ফেরত",
      },
      { name: "quantity", type: "INTEGER", note: "কত পিস ফেরত" },
      { name: "reason", type: "TEXT", note: "ফেরতের কারণ" },
      {
        name: "refund_cents",
        type: "INTEGER",
        note: "রিফান্ডের অঙ্ক, সেন্টে",
      },
      {
        name: "status",
        type: "TEXT",
        note: "approved / rejected / pending",
      },
      {
        name: "requested_at",
        type: "TEXT",
        note: "অনুরোধের তারিখ; হিসাব হয় অর্ডারের তারিখ ধরে",
      },
    ],
    usedByEpicSlugs: ["fulfillment", "vendor-finance"],
  },
  {
    name: "coupons",
    group: "Cart & checkout",
    purpose:
      "কুপন ক্যাম্পেইনের নিয়ম—percent/fixed, ন্যূনতম অর্ডার আর বৈধ সময়।",
    rowCount: 4,
    primaryKey: "id",
    foreignKeys: [],
    columns: [
      { name: "id", type: "INTEGER", note: "প্রাথমিক কী" },
      { name: "code", type: "TEXT", note: "ইউনিক কুপন কোড" },
      { name: "kind", type: "TEXT", note: "percent / fixed" },
      {
        name: "value",
        type: "INTEGER",
        note: "percent হলে শতাংশ, fixed হলে সেন্ট",
      },
      {
        name: "min_order_cents",
        type: "INTEGER",
        note: "কুপন লাগানোর ন্যূনতম অর্ডার",
      },
      { name: "starts_at", type: "TEXT", note: "বৈধতার শুরু, ISO তারিখ" },
      { name: "ends_at", type: "TEXT", note: "বৈধতার শেষ, ISO তারিখ" },
      {
        name: "max_uses",
        type: "INTEGER",
        note: "সর্বোচ্চ redemption; NULL মানে সীমা নেই",
      },
    ],
    usedByEpicSlugs: ["growth"],
  },
  {
    name: "coupon_redemptions",
    group: "Cart & checkout",
    purpose:
      "কোন অর্ডারে কোন কুপন কত ছাড় দিয়েছে; ছাড়ের একক grain এখানে এক সারি।",
    rowCount: 6,
    primaryKey: "id",
    foreignKeys: [
      "coupon_id -> coupons.id",
      "order_id -> orders.id",
      "customer_id -> customers.id",
    ],
    columns: [
      { name: "id", type: "INTEGER", note: "প্রাথমিক কী" },
      { name: "coupon_id", type: "INTEGER", note: "কোন কুপন" },
      { name: "order_id", type: "INTEGER", note: "কোন অর্ডারে লাগানো" },
      { name: "customer_id", type: "INTEGER", note: "কে ব্যবহার করেছে" },
      {
        name: "discount_cents",
        type: "INTEGER",
        note: "দেওয়া ছাড়, সেন্টে",
      },
      { name: "redeemed_at", type: "TEXT", note: "ব্যবহারের তারিখ" },
    ],
    usedByEpicSlugs: ["growth"],
  },
  {
    name: "carts",
    group: "Cart & checkout",
    purpose:
      "চেকআউট-ফানেলের শুরু—কার্ট কখন তৈরি হলো আর শেষে converted/abandoned হলো।",
    rowCount: 8,
    primaryKey: "id",
    foreignKeys: ["customer_id -> customers.id"],
    columns: [
      { name: "id", type: "INTEGER", note: "প্রাথমিক কী" },
      { name: "customer_id", type: "INTEGER", note: "কার কার্ট" },
      {
        name: "status",
        type: "TEXT",
        note: "converted / abandoned / active",
      },
      {
        name: "created_at",
        type: "TEXT",
        note: "কার্ট তৈরির সময়; মাস ফানেলের ভিত্তি",
      },
      { name: "updated_at", type: "TEXT", note: "শেষ বদলের সময়" },
    ],
    usedByEpicSlugs: ["growth"],
  },
  {
    name: "cart_items",
    group: "Cart & checkout",
    purpose:
      "কার্টে রাখা প্রোডাক্ট ও quantity; কার্টের সম্ভাব্য মূল্য এখান থেকে আসে।",
    rowCount: 15,
    primaryKey: "id",
    foreignKeys: ["cart_id -> carts.id", "product_id -> products.id"],
    columns: [
      { name: "id", type: "INTEGER", note: "প্রাথমিক কী" },
      { name: "cart_id", type: "INTEGER", note: "কোন কার্টের লাইন" },
      { name: "product_id", type: "INTEGER", note: "কোন প্রোডাক্ট" },
      { name: "quantity", type: "INTEGER", note: "কত পিস" },
      {
        name: "unit_price_cents",
        type: "INTEGER",
        note: "কার্টে যোগের সময়ের দাম",
      },
      { name: "added_at", type: "TEXT", note: "যোগ করার সময়" },
    ],
    usedByEpicSlugs: ["growth"],
  },
  {
    name: "inventory_movements",
    group: "Inventory",
    purpose:
      "স্টকের signed লেজার—purchase, sale, return, adjustment; `products.stock`-এর সাথে মেলানো হয়।",
    rowCount: 33,
    primaryKey: "id",
    foreignKeys: ["product_id -> products.id"],
    columns: [
      { name: "id", type: "INTEGER", note: "প্রাথমিক কী" },
      { name: "product_id", type: "INTEGER", note: "কোন প্রোডাক্ট" },
      {
        name: "kind",
        type: "TEXT",
        note: "purchase / sale / return / adjustment",
      },
      {
        name: "quantity",
        type: "INTEGER",
        note: "signed মান; sale ঋণাত্মক",
      },
      {
        name: "reference",
        type: "TEXT",
        note: "PO/ORD/RET/CYCLE রেফারেন্স; NULL হতে পারে",
      },
      { name: "created_at", type: "TEXT", note: "movement-এর তারিখ" },
    ],
    usedByEpicSlugs: ["catalog-health", "platform-quality"],
  },
  {
    name: "vendor_payouts",
    group: "Vendors & finance",
    purpose:
      "মাসিক payout দাবি—gross, commission, refund আর net এক সারিতে; reconciliation এখানেই শুরু।",
    rowCount: 5,
    primaryKey: "id",
    foreignKeys: ["vendor_id -> vendors.id"],
    columns: [
      { name: "id", type: "INTEGER", note: "প্রাথমিক কী" },
      { name: "vendor_id", type: "INTEGER", note: "কার payout" },
      { name: "period_start", type: "TEXT", note: "পিরিয়ডের শুরু" },
      { name: "period_end", type: "TEXT", note: "পিরিয়ডের শেষ" },
      {
        name: "gross_cents",
        type: "INTEGER",
        note: "দাবি করা gross, সেন্টে",
      },
      {
        name: "commission_cents",
        type: "INTEGER",
        note: "প্ল্যাটফর্ম কমিশন, gross-এর ১০%",
      },
      {
        name: "refund_cents",
        type: "INTEGER",
        note: "বাদ দেওয়া approved রিফান্ড",
      },
      {
        name: "net_cents",
        type: "INTEGER",
        note: "gross − কমিশন − রিফান্ড",
      },
      { name: "status", type: "TEXT", note: "paid / pending" },
      { name: "paid_at", type: "TEXT", note: "পরিশোধের তারিখ; না হলে NULL" },
    ],
    usedByEpicSlugs: ["vendor-finance"],
  },
];
