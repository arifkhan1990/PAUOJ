import type { LearningTopicDefinition } from "@/lib/learning/types";

/** Extra topics for the Advanced SQL module: timelines, moving metrics, funnels and coupons. */
export const ADVANCED_SQL_ANALYTICS_TOPICS: LearningTopicDefinition[] = [
  {
    slug: "timelines",
    title: "Timelines & moving metrics",
    titleBn: "টাইমলাইন ও চলমান মেট্রিক",
    summary:
      "Window frame আর PARTITION BY দিয়ে দৈনিক রেভিনিউয়ের ৭-দিনের চলমান গড় এবং কাস্টমার-ভিত্তিক running total।",
    concept: `## কেন দরকার
দোকানের ডেটা সময় ধরে জমে, আর ব্যবসার সব গুরুত্বপূর্ণ প্রশ্ন এই সময়-রেখার উপর দাঁড়িয়ে থাকে। গ্রাফে একটা দিনের বিক্রি হঠাৎ ছাদে উঠলে সবাই খুশি, মেঝেতে নামলে সবাই আতঙ্কে পড়ে—অথচ দুটোই হয়তো একই আসল ধারার ভেতরের সাধারণ ওঠানামা মাত্র। একটা বড় অর্ডার বা একটা মন্দ দিন আসল প্রবণতা নয়। এজন্য অ্যানালিস্টদের দুটো হাতিয়ার সবচেয়ে বেশি কাজে লাগে: চলমান গড় (moving average), যা দৈনিক noise মসৃণ করে আসল ধারা দেখায়, আর running total, যা বলে দেয় একজন কাস্টমার বা একটা মাস এ পর্যন্ত মোট কত এগিয়েছে। দুটোরই সাধারণ বৈশিষ্ট্য—প্রতিটি সারির হিসাব তার আগের সারিগুলোর উপর নির্ভর করে, আর সেই কাজটাই window frame-এর জিম্মা।

## মূল ধারণা
Window function সারি কমায় না; প্রতিটি সারির পাশে একটা হিসাব বসিয়ে দেয়। হিসাবটা ঠিক কোন সারিগুলো ধরে হবে, সেটা frame ঠিক করে। \`ROWS BETWEEN 6 PRECEDING AND CURRENT ROW\` মানে বর্তমান সারিসহ ঠিক ৬টি আগের সারি—দিন ধরে গুনলে এটাই ৭-দিনের moving average। আর \`PARTITION BY customer ORDER BY ordered_at\` মানে প্রতিটি কাস্টমারের ভেতরে তারিখের ক্রমে টাকা জমা—এটাই running total। দুটো ক্ষেত্রেই একটাই নিয়ম: আগে aggregate বা CTE দিয়ে ঠিক দানার সারি বানাও (এক দিন = এক সারি, এক অর্ডার = এক সারি), তারপর উপরে window চালাও। না হলে order_items-এর বাড়তি সারি হিসাব নষ্ট করে দেয়। শুরুর সারিগুলোতে ৬টি আগের সারি পাওয়া যায় না, তখন যত সারি আছে তাদেরই গড় হয়—এটাই প্রত্যাশিত আচরণ, ভুল নয়। আর প্রতিটি কাস্টমারের জমা ধারাবাহিকভাবে বাড়ে, শেষ সারিতে গিয়ে তার মোট খরচে পৌঁছায়—তাই শেষ মানটাই loyalty tier বা credit limit-এর সিদ্ধান্তের ভিত্তি।

| প্রয়োজন | ফ্রেম |
| --- | --- |
| ৭-দিনের চলমান গড় | \`AVG(x) OVER (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)\` |
| কাস্টমারের চলমান মোট | \`SUM(x) OVER (PARTITION BY customer ORDER BY ordered_at, order_id)\` |

## ধাপে ধাপে
১. কোন দানায় হিসাব হবে ঠিক করো—দিন, নাকি অর্ডার।
২. CTE-তে সেই দানায় GROUP BY করে ভিত্তি সারি বানাও; paid/shipped ফিল্টার এখানেই দাও।
৩. বাইরের SELECT-এ window চালাও: frame বা partition+order যথাযথ দাও, টাই-ব্রেক ভুলো না।
৪. ROUND করে নির্দিষ্ট ORDER BY দিয়ে সাজাও—ক্রম যেন প্রতিবার একই আসে।

## কোডে দেখি
\`\`\`sql
WITH daily AS (
  SELECT substr(o.ordered_at, 1, 10) AS day,
         SUM(oi.quantity * oi.unit_price_cents) AS daily_cents
  FROM orders o
  JOIN order_items oi ON oi.order_id = o.id
  WHERE o.status IN ('paid', 'shipped')
  GROUP BY day
)
SELECT day, daily_cents,
       ROUND(AVG(daily_cents) OVER (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW), 2) AS moving_avg
FROM daily
ORDER BY day;
\`\`\`

## সাধারণ ভুল
সারি না বানিয়ে সরাসরি order_items-এর উপর window চালানো—এক অর্ডারের অনেক সারি জমা হয়ে যায়; \`ROWS\`-এর বদলে \`RANGE\` লেখা; PARTITION BY বাদ দিয়ে সব কাস্টমারের টাকা এক পাত্রে জমানো; window-এর ORDER BY-তে টাই-ব্রেক (order_id) না দিলে একই তারিখে ফল অনির্দিষ্ট হওয়া; আর শেষে ORDER BY না দিলে পুরো আউটপুটের ক্রমই অনির্দিষ্ট হয়ে যাওয়া।`,
    guidedProblemSlugs: ["sql-adv-moving-average", "sql-adv-customer-running"],
    practiceProblemSlugs: { easy: [], medium: [], hard: [] },
    extraProblemSlugs: [],
  },
  {
    slug: "funnels-coupons",
    title: "Funnels & coupons",
    titleBn: "ফানেল ও কুপন",
    summary:
      "Conditional aggregation দিয়ে মাসিক কার্ট-কনভার্সন, আর CTE দিয়ে কুপনভিত্তিক রেভিনিউ—order_items-এর double-count এড়িয়ে।",
    concept: `## কেন দরকার
মার্কেটিং টিমের টাকা ঢালার আগে দুটো প্রশ্নের উত্তর জরুরি: কার্টে রাখা পণ্য কতটুকু আসলে কেনা হয়, আর কুপনের ছাড় কি নতুন আয় এনেছে নাকি শুধু লোকসান দিয়েছে। প্রথমটা ফানেলের প্রশ্ন—কাস্টমার কোথায় থেমে যাচ্ছে; মাস ধরে দেখলে বোঝা যায় কোন ক্যাম্পেইনে মানুষ কার্ট ভরে কিন্তু পকেট খোলে না। দ্বিতীয়টা attribution-এর প্রশ্ন—কোন কুপন কত টাকার অর্ডার এনেছে, তার বিপরীতে ছাড়ে কত খরচ হলো। দুটোই একই কৌশলে হয়: একটা ঘটনা গোনো (কার্ট তৈরি, কুপন redeem), তার সাথে ফলাফল জুড়ে অনুপাত বা মোট বের করো।

## মূল ধারণা
ফানেলের মূল হাতিয়ার conditional aggregation: একই GROUP BY-র ভেতরে \`SUM(CASE WHEN status='converted' THEN 1 ELSE 0 END)\` দিয়ে শুধু রূপান্তরিত সারি গোনো, আর \`COUNT(*)\` দিয়ে সব সারি—মাসের কনভার্সন শতাংশ তখন একটাই query-তে বেরিয়ে আসে। শতাংশে \`100.0\` দিয়ে গুণ করো, নাহলে integer division ভগ্নাংশ কেটে শূন্য দেখায়। কুপনের হিসাবে সাবধানতা লাগে: coupons → redemptions → orders → order_items এক লাইনে JOIN করলে প্রতিটি order_item সারিতে redemption পুনরাবৃত্তি হয়, ফলে ছাড়ের যোগফল ফুলে যায়। আগে CTE-তে order_id ধরে অর্ডারের মোট বের করো—এক অর্ডার = এক সারি—তারপর redemption-এর সাথে জোড়া লাগাও। ফানেলের হিসাবে abandoned আর active কার্টও গোনা লাগে, কারণ ভাগের হর হলো মোট কার্ট—সেটা ভুললে শতাংশ অর্থহীন হয়ে যায়; আর কার্টের মাস মানে কার্টটা কখন তৈরি হয়েছে, অর্ডারের মাস নয়।

| প্রশ্ন | কৌশল |
| --- | --- |
| কার্টের কত শতাংশ কেনা হয়েছে | CASE-ভিত্তিক শতাংশ, মাস ধরে GROUP BY |
| কুপন কত আয় এনেছে | CTE-তে অর্ডার-মোট, তারপর কুপন ধরে GROUP BY |

## ধাপে ধাপে
১. কোন ঘটনা গোনা হবে সেটার টেবিল আর সময়-কলাম ঠিক করো (carts-এর created_at, coupon_redemptions)।
২. মাস বা কুপন ধরে GROUP BY-র কলাম বাছো।
৩. ফানেল হলে CASE দিয়ে রূপান্তর গোনো; কুপন হলে আগে অর্ডার-মোটের CTE বানাও।
৪. শতাংশ বা গড় round করে নির্দিষ্ট ORDER BY দিয়ে সাজাও—টাইতে টাই-ব্রেক দাও।

## কোডে দেখি
\`\`\`sql
SELECT substr(created_at, 1, 7) AS month,
       COUNT(*) AS carts,
       SUM(CASE WHEN status = 'converted' THEN 1 ELSE 0 END) AS converted,
       ROUND(100.0 * SUM(CASE WHEN status = 'converted' THEN 1 ELSE 0 END) / COUNT(*), 1) AS conversion_pct
FROM carts
GROUP BY month
ORDER BY month;
\`\`\`

## সাধারণ ভুল
\`100.0\`-এর বদলে \`100\` লিখে integer division-এ শতাংশ শূন্য করে ফেলা; \`WHERE status='converted'\` দিয়ে আগেই ফিল্টার করে ফেলা—তখন conversion সবসময় ১০০% দেখায় আর আসল লিক লুকিয়ে থাকে; কুপনের হিসাবে order_items সরাসরি JOIN করে ছাড় বা রেভিনিউ বারবার গোনা; \`AVG\`-কে আইটেম-সারিতে চালিয়ে গড় অর্ডারের বদলে গড় আইটেম বের করা; আর কার্টের মাস ঠিক করতে \`updated_at\` ধরে গ্রুপ করা—কার্ট কোন মাসে তৈরি হয়েছে সেটা \`created_at\`-ই বলে দেয়।`,
    guidedProblemSlugs: ["sql-adv-cart-conversion", "sql-adv-coupon-performance"],
    practiceProblemSlugs: { easy: [], medium: [], hard: [] },
    extraProblemSlugs: [],
  },
];
