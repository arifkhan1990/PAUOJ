/**
 * ShopSphere data dictionary, part 1: catalog, people, orders and product detail.
 *
 * Column names, base types and order follow `judge/shopsphere.sql`; the
 * integrity test parses the fixture and fails on any drift.
 */

import type { SqlProjectTable } from "./sql-project";

export const SQL_PROJECT_TABLES_CORE: SqlProjectTable[] = [
  {
    name: "categories",
    group: "Catalog",
    purpose:
      "ক্যাটাগরি-ট্রি; `parent_id` self-reference দিয়ে সাব-ক্যাটাগরি বোঝায়, আর NULL মানে root।",
    rowCount: 8,
    primaryKey: "id",
    foreignKeys: ["parent_id -> categories.id"],
    columns: [
      { name: "id", type: "INTEGER", note: "প্রাথমিক কী" },
      { name: "name", type: "TEXT", note: "ক্যাটাগরির নাম" },
      {
        name: "parent_id",
        type: "INTEGER",
        note: "প্যারেন্ট ক্যাটাগরি; NULL মানে root",
      },
    ],
    usedByEpicSlugs: [
      "catalog-health",
      "order-desk",
      "growth",
      "analytics-platform",
    ],
  },
  {
    name: "vendors",
    group: "Vendors & finance",
    purpose:
      "ভেন্ডর ডিরেক্টরি—প্রতিটি প্রোডাক্ট কার ভেন্ডরের, আর ভেন্ডর কোথা থেকে পাঠায়।",
    rowCount: 6,
    primaryKey: "id",
    foreignKeys: [],
    columns: [
      { name: "id", type: "INTEGER", note: "প্রাথমিক কী" },
      { name: "name", type: "TEXT", note: "ভেন্ডরের নাম" },
      { name: "city", type: "TEXT", note: "ভেন্ডরের শহর" },
      { name: "rating", type: "REAL", note: "ভেন্ডর রেটিং, ১–৫" },
    ],
    usedByEpicSlugs: [
      "catalog-health",
      "order-desk",
      "fulfillment",
      "vendor-finance",
      "growth",
      "analytics-platform",
      "platform-quality",
    ],
  },
  {
    name: "customers",
    group: "Customers & growth",
    purpose:
      "ক্রেতার প্রোফাইল ও সাইনআপ তারিখ—কোহর্ট, রিটেনশন আর ফানেলের ভিত্তি।",
    rowCount: 6,
    primaryKey: "id",
    foreignKeys: [],
    columns: [
      { name: "id", type: "INTEGER", note: "প্রাথমিক কী" },
      { name: "name", type: "TEXT", note: "ক্রেতার নাম" },
      { name: "city", type: "TEXT", note: "ক্রেতার শহর" },
      {
        name: "signup_date",
        type: "TEXT",
        note: "অ্যাকাউন্ট খোলার তারিখ, ISO `YYYY-MM-DD`",
      },
    ],
    usedByEpicSlugs: [
      "catalog-health",
      "order-desk",
      "fulfillment",
      "vendor-finance",
      "growth",
      "analytics-platform",
      "platform-quality",
    ],
  },
  {
    name: "products",
    group: "Catalog",
    purpose:
      "প্রোডাক্টের বর্তমান দাম ও স্টক; প্রতিটি বিক্রির দাম আসে `order_items.unit_price_cents` থেকে।",
    rowCount: 14,
    primaryKey: "id",
    foreignKeys: ["vendor_id -> vendors.id", "category_id -> categories.id"],
    columns: [
      { name: "id", type: "INTEGER", note: "প্রাথমিক কী" },
      { name: "vendor_id", type: "INTEGER", note: "কোন ভেন্ডর বিক্রি করে" },
      { name: "category_id", type: "INTEGER", note: "কোন ক্যাটাগরিতে পড়ে" },
      { name: "name", type: "TEXT", note: "প্রোডাক্টের নাম" },
      { name: "price_cents", type: "INTEGER", note: "তালিকা-দাম, সেন্টে" },
      { name: "stock", type: "INTEGER", note: "বর্তমান স্টক" },
      { name: "rating", type: "REAL", note: "গড় রেটিং, ১–৫" },
    ],
    usedByEpicSlugs: [
      "catalog-health",
      "order-desk",
      "fulfillment",
      "vendor-finance",
      "growth",
      "analytics-platform",
      "platform-quality",
    ],
  },
  {
    name: "orders",
    group: "Orders & payments",
    purpose:
      "এক অর্ডার = এক সারি; `status` বলে অর্ডারটি paid, pending, shipped নাকি cancelled।",
    rowCount: 10,
    primaryKey: "id",
    foreignKeys: ["customer_id -> customers.id"],
    columns: [
      { name: "id", type: "INTEGER", note: "প্রাথমিক কী" },
      { name: "customer_id", type: "INTEGER", note: "কার অর্ডার" },
      {
        name: "ordered_at",
        type: "TEXT",
        note: "অর্ডারের তারিখ, ISO `YYYY-MM-DD`",
      },
      {
        name: "status",
        type: "TEXT",
        note: "paid / pending / shipped / cancelled",
      },
    ],
    usedByEpicSlugs: [
      "catalog-health",
      "order-desk",
      "fulfillment",
      "vendor-finance",
      "growth",
      "analytics-platform",
      "platform-quality",
    ],
  },
  {
    name: "order_items",
    group: "Orders & payments",
    purpose:
      "অর্ডারের লাইন-আইটেম; রেভিনিউর আসল grain এখানেই—`quantity × unit_price_cents`।",
    rowCount: 15,
    primaryKey: "id",
    foreignKeys: [
      "order_id -> orders.id",
      "product_id -> products.id",
    ],
    columns: [
      { name: "id", type: "INTEGER", note: "প্রাথমিক কী" },
      { name: "order_id", type: "INTEGER", note: "কোন অর্ডারের লাইন" },
      { name: "product_id", type: "INTEGER", note: "কোন প্রোডাক্ট" },
      { name: "quantity", type: "INTEGER", note: "কত পিস" },
      {
        name: "unit_price_cents",
        type: "INTEGER",
        note: "বিক্রির সময়ের একক দাম, সেন্টে",
      },
    ],
    usedByEpicSlugs: [
      "catalog-health",
      "order-desk",
      "fulfillment",
      "vendor-finance",
      "growth",
      "analytics-platform",
      "platform-quality",
    ],
  },
  {
    name: "reviews",
    group: "Catalog",
    purpose:
      "প্রোডাক্ট-রিভিউ; কে কিনেছে অথচ রিভিউ লেখেনি সেটা orders-এর সাথে মিলিয়ে বের করা হয়।",
    rowCount: 6,
    primaryKey: "id",
    foreignKeys: [
      "product_id -> products.id",
      "customer_id -> customers.id",
    ],
    columns: [
      { name: "id", type: "INTEGER", note: "প্রাথমিক কী" },
      { name: "product_id", type: "INTEGER", note: "কোন প্রোডাক্টের রিভিউ" },
      { name: "customer_id", type: "INTEGER", note: "কে লিখেছে" },
      { name: "rating", type: "INTEGER", note: "১–৫ স্টার" },
      {
        name: "created_at",
        type: "TEXT",
        note: "রিভিউয়ের তারিখ, ISO",
      },
    ],
    usedByEpicSlugs: ["catalog-health", "growth"],
  },
  {
    name: "referrals",
    group: "Customers & growth",
    purpose:
      "কাস্টমার-থেকে-কাস্টমার রেফারেল চেইন; `referred_by` NULL মানে কাউকে আনেনি।",
    rowCount: 5,
    primaryKey: "customer_id",
    foreignKeys: [
      "customer_id -> customers.id",
      "referred_by -> customers.id",
    ],
    columns: [
      { name: "customer_id", type: "INTEGER", note: "যে রেফার হয়েছে" },
      { name: "referred_by", type: "INTEGER", note: "কে রেফার করেছে; NULL হতে পারে" },
    ],
    usedByEpicSlugs: ["analytics-platform"],
  },
  {
    name: "product_attributes",
    group: "Catalog",
    purpose:
      "প্রোডাক্টের নমনীয় বৈশিষ্ট্য—ব্র্যান্ড, ওয়ারেন্টি আর JSON `attributes` এক সারিতে।",
    rowCount: 14,
    primaryKey: "product_id",
    foreignKeys: ["product_id -> products.id"],
    columns: [
      { name: "product_id", type: "INTEGER", note: "প্রোডাক্টের কী, এক-থেকে-এক" },
      { name: "brand", type: "TEXT", note: "ব্র্যান্ডের নাম" },
      { name: "color", type: "TEXT", note: "রং; NULL হতে পারে" },
      {
        name: "warranty_months",
        type: "INTEGER",
        note: "ওয়ারেন্টি মাস; ০ মানে নেই",
      },
      {
        name: "attributes",
        type: "TEXT",
        note: "JSON object—`json_extract` দিয়ে পড়তে হয়",
      },
    ],
    usedByEpicSlugs: ["catalog-health"],
  },
  {
    name: "product_variants",
    group: "Catalog",
    purpose:
      "একই প্রোডাক্টের size/color ভ্যারিয়েন্ট, আলাদা SKU ও নিজস্ব স্টকসহ।",
    rowCount: 12,
    primaryKey: "id",
    foreignKeys: ["product_id -> products.id"],
    columns: [
      { name: "id", type: "INTEGER", note: "প্রাথমিক কী" },
      { name: "product_id", type: "INTEGER", note: "কোন প্রোডাক্টের ভ্যারিয়েন্ট" },
      { name: "sku", type: "TEXT", note: "ইউনিক স্টক-কিপিং কোড" },
      { name: "size", type: "TEXT", note: "সাইজ; NULL হতে পারে" },
      { name: "color", type: "TEXT", note: "রং; NULL হতে পারে" },
      { name: "price_cents", type: "INTEGER", note: "ভ্যারিয়েন্টের দাম, সেন্টে" },
      { name: "stock", type: "INTEGER", note: "ভ্যারিয়েন্টের স্টক" },
    ],
    usedByEpicSlugs: ["catalog-health"],
  },
];
