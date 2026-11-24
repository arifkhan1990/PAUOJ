/** Static copy for the SQL course overview. */

/** The capabilities the two ShopSphere tracks promise, beyond topic titles. */
export const SQL_OUTCOMES: { title: string; detail?: string }[] = [
  { title: "JOIN দিয়ে ভেন্ডর, প্রোডাক্ট ও অর্ডার জোড়া লাগানো" },
  { title: "GROUP BY/HAVING দিয়ে রেভিনিউ ও রিপোর্ট বানানো" },
  { title: "Window function দিয়ে র্যাংকিং ও চলমান মেট্রিক" },
  { title: "CTE ও recursive CTE দিয়ে ফানেল, পিভট, ট্রি" },
  { title: "EXPLAIN পড়ে index দিয়ে query দ্রুত করা" },
  { title: "NULL, তারিখ-সময় আর dialect-পার্থক্য সামলানো" },
];

export const SQL_DATASET_GROUPS = [
  {
    label: "অর্ডার ও পেমেন্ট",
    tables: "customers · orders · order_items · payments · coupons · coupon_redemptions",
  },
  {
    label: "শিপমেন্ট ও রিটার্ন",
    tables: "shipments · returns · carts · cart_items",
  },
  {
    label: "ক্যাটালগ ও স্টক",
    tables:
      "categories · products · product_attributes · product_variants · inventory_movements · reviews",
  },
  {
    label: "ভেন্ডর ও ফিন্যান্স",
    tables: "vendors · vendor_payouts · referrals",
  },
] as const;

export const SQL_EXAMPLE_ORDERS = [
  { vendor: "TechNest", city: "ঢাকা", order: "#1", date: "2026-10-01", status: "paid", total: "৳8,900" },
  { vendor: "BookBazar", city: "চট্টগ্রাম", order: "#2", date: "2026-10-03", status: "pending", total: "৳1,800" },
  { vendor: "StyleHub", city: "ঢাকা", order: "#3", date: "2026-10-05", status: "paid", total: "৳6,000" },
] as const;
