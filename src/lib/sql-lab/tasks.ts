export type SqlLabLevel = "basic" | "advanced";

export type SqlLabCell = string | number;

export type SqlLabTask = {
  id: string;
  level: SqlLabLevel;
  title: string;
  prompt: string;
  hint: string;
  columns: string[];
  expected: SqlLabCell[][];
  feature: string;
};

export const SQL_LAB_TASKS: SqlLabTask[] = [
  {
    id: "vendors-high-rating",
    level: "basic",
    title: "Trusted vendor directory",
    prompt:
      "মার্কেটপ্লেসের হোমপেজে শুধু ৪.৫ বা তার বেশি রেটিংয়ের ভেন্ডর দেখাতে চাই। `vendors` থেকে নাম ও শহর বের করো, নাম অনুযায়ী সাজাও।",
    hint: "SELECT name, city FROM vendors WHERE rating >= 4.5 ORDER BY name;",
    columns: ["name", "city"],
    expected: [
      ["HomeCraft", "Khulna"],
      ["StyleHub", "Dhaka"],
      ["TechNest", "Dhaka"],
    ],
    feature: "Storefront directory",
  },
  {
    id: "low-stock",
    level: "basic",
    title: "Low-stock shelf",
    prompt:
      "অ্যাডমিন প্যানেলের 'Low stock' উইজেটে ১০টির কম স্টক থাকা প্রোডাক্ট দরকার। নাম ও স্টক বের করো; কম স্টক আগে, একই স্টকে নাম অনুযায়ী।",
    hint: "SELECT name, stock FROM products WHERE stock < 10 ORDER BY stock, name;",
    columns: ["name", "stock"],
    expected: [
      ["Webcam", 2],
      ["Wireless Mouse", 3],
      ["27in Monitor", 5],
      ["Clay Dinner Set", 6],
      ["USB-C Hub", 8],
      ["SQL Handbook", 9],
    ],
    feature: "Inventory alerts",
  },
  {
    id: "paid-order-totals",
    level: "basic",
    title: "Paid order totals",
    prompt:
      "পেমেন্ট টিম প্রতি পেইড অর্ডারের মোট টাকা (সেন্টে) দেখতে চায়। `orders` ও `order_items` জোড়া লাগিয়ে শুধু `paid` অর্ডারের মোট টাকা বের করো; বড় অর্ডার আগে।",
    hint: "JOIN + GROUP BY o.id + SUM(quantity * unit_price_cents), ORDER BY total_cents DESC.",
    columns: ["order_id", "total_cents"],
    expected: [
      [4, 2000000],
      [1, 890000],
      [7, 670000],
      [6, 605000],
      [3, 600000],
      [9, 120000],
    ],
    feature: "Payments dashboard",
  },
  {
    id: "top-vendor-per-category",
    level: "advanced",
    title: "Top vendor per category",
    prompt:
      "প্রতিটি ক্যাটাগরির সবচেয়ে বেশি বিক্রি করা ভেন্ডর বের করো (`paid` ও `shipped` অর্ডার ধরে)। ক্যাটাগরি, ভেন্ডরের নাম আর রেভিনিউ (সেন্ট) দরকার; ক্যাটাগরি অনুযায়ী সাজাও।",
    hint: "RANK() OVER (PARTITION BY category ORDER BY revenue DESC) তারপর rn = 1.",
    columns: ["category", "vendor", "revenue_cents"],
    expected: [
      ["Accessories", "GadgetPoint", 150000],
      ["Books", "BookBazar", 465000],
      ["Electronics", "TechNest", 3190000],
      ["Fashion", "StyleHub", 720000],
      ["Home", "HomeCraft", 540000],
    ],
    feature: "Marketplace insights",
  },
  {
    id: "repeat-customers",
    level: "advanced",
    title: "Repeat customers",
    prompt:
      "লয়্যালটি টিম একাধিকবার কিনেছে এমন কাস্টমার চায়। `paid`/`shipped` অর্ডার গুনে যাদের একাধিক অর্ডার আছে তাদের নাম ও অর্ডার সংখ্যা বের করো; নাম অনুযায়ী সাজাও।",
    hint: "GROUP BY c.id HAVING COUNT(DISTINCT o.id) > 1.",
    columns: ["name", "order_count"],
    expected: [
      ["Nusrat", 2],
      ["Rahim", 3],
    ],
    feature: "Customer retention",
  },
  {
    id: "running-revenue",
    level: "advanced",
    title: "Cumulative revenue timeline",
    prompt:
      "ড্যাশবোর্ডে প্রতিদিনের রেভিনিউ আর সেই দিন পর্যন্ত মোট রেভিনিউ (running total) দেখাতে হবে। তারিখ, দৈনিক ও চলমান মোট (সেন্ট) বের করো; তারিখ অনুযায়ী সাজাও।",
    hint: "SUM(daily_cents) OVER (ORDER BY ordered_at) — window function।",
    columns: ["ordered_at", "daily_cents", "running_cents"],
    expected: [
      ["2026-10-01", 890000, 890000],
      ["2026-10-05", 600000, 1490000],
      ["2026-10-10", 2000000, 3490000],
      ["2026-10-20", 605000, 4095000],
      ["2026-10-22", 670000, 4765000],
      ["2026-10-25", 180000, 4945000],
      ["2026-10-28", 120000, 5065000],
    ],
    feature: "Revenue dashboard",
  },
];

export function isTaskUnlocked(
  task: SqlLabTask,
  advancedUnlocked: boolean,
): boolean {
  return task.level === "basic" || advancedUnlocked;
}

export function rowsMatch(
  actual: SqlLabCell[][],
  expected: SqlLabCell[][],
): boolean {
  return JSON.stringify(actual) === JSON.stringify(expected);
}
