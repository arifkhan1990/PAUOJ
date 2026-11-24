import type {
  LearningModuleDefinition,
  LearningTopicDefinition,
} from "@/lib/learning/types";

import {
  capstoneConcept,
  hierarchyConcept,
  metricsConcept,
  missingConcept,
  moneyConcept,
  orientationConcept,
  subqueryConcept,
  windowConcept,
} from "./sql-concepts";
import { BASIC_SQL_EXTRA_TOPICS } from "./sql-basic-extra";
import { BASIC_SQL_EXTRA2_TOPICS } from "./sql-basic-extra2";
import { ADVANCED_SQL_ANALYTICS_TOPICS } from "./sql-advanced-analytics";
import { ADVANCED_SQL_DATA_TOPICS } from "./sql-advanced-data";
import { ADVANCED_SQL_WINDOW_TOPICS } from "./sql-advanced-windows";
import { ADVANCED_SQL_PERFORMANCE_TOPICS } from "./sql-advanced-performance";
import { ADVANCED_SQL_LAB_TOPICS } from "./sql-advanced-labs";
import { BASIC_SQL_PRACTICE } from "../sql-practice-basic";
import { BASIC_SQL_PRACTICE_MORE } from "../sql-practice-basic-more";
import { ADVANCED_SQL_PRACTICE_A } from "../sql-practice-advanced-a";
import { ADVANCED_SQL_PRACTICE_MORE } from "../sql-practice-advanced-more";
import { ADVANCED_SQL_PRACTICE_B } from "../sql-practice-advanced-b";
const PRACTICE_MAPS = [
  BASIC_SQL_PRACTICE,
  BASIC_SQL_PRACTICE_MORE,
  ADVANCED_SQL_PRACTICE_A,
  ADVANCED_SQL_PRACTICE_B,
  ADVANCED_SQL_PRACTICE_MORE,
];

function withPractice(
  topics: LearningTopicDefinition[],
): LearningTopicDefinition[] {
  return topics.map((topic) => {
    const practice = { easy: [] as string[], medium: [] as string[], hard: [] as string[] };
    for (const map of PRACTICE_MAPS) {
      const entry = map[topic.slug];
      if (!entry) continue;
      practice.easy.push(...entry.easy);
      practice.medium.push(...entry.medium);
      practice.hard.push(...entry.hard);
    }
    return practice.easy.length + practice.medium.length + practice.hard.length > 0
      ? { ...topic, practiceProblemSlugs: practice }
      : topic;
  });
}

const basicCheckpoint = {
  title: "Basic SQL checkpoint",
  titleBn: "বেসিক SQL চেকপয়েন্ট",
  description:
    "ShopSphere-এর বেসিক রিপোর্ট তিনটি—টপ কাস্টমার, মাসিক রেভিনিউ আর রেটিং লিডারবোর্ড। ৪৫ মিনিটে তিনটি query লিখে প্রমাণ করো যে SELECT, JOIN, GROUP BY আর HAVING তোমার আয়ত্তে।",
  durationMinutes: 45,
  problemSlugs: [
    "sql-check-basic-top-customers",
    "sql-check-basic-monthly",
    "sql-check-basic-ratings",
  ],
  badge: {
    slug: "basic-sql-badge",
    name: "ShopSphere Analyst",
    description: "Basic SQL চেকপয়েন্টের তিনটি রিপোর্ট query সম্পন্ন করেছ।",
  },
};

const advancedCheckpoint = {
  title: "Advanced SQL checkpoint",
  titleBn: "অ্যাডভান্সড SQL চেকপয়েন্ট",
  description:
    "ভেন্ডর-মাস রেভিনিউ, রিপিট বায়ার আর স্টক ভ্যালু—তিনটি অ্যাডভান্সড রিপোর্ট। ৪৫ মিনিটে GROUP BY, HAVING আর join-এর সমন্বয় দেখাও।",
  durationMinutes: 45,
  problemSlugs: [
    "sql-check-adv-vendor-month",
    "sql-check-adv-repeat",
    "sql-check-adv-value",
  ],
  badge: {
    slug: "advanced-sql-badge",
    name: "ShopSphere Architect",
    description: "Advanced SQL চেকপয়েন্টের তিনটি অ্যানালিটিক্স query সম্পন্ন করেছ।",
  },
};

export const basicSqlModule: LearningModuleDefinition = {
  slug: "basic-sql",
  order: 8,
  title: "Basic SQL · ShopSphere",
  subtitle: "দোকানের ডেটা থেকে অর্ডার লাইফসাইকল",
  goal: "Go from filtered lists and joins to sets, text/date search, payments, shipments and returns — the queries a marketplace runs every day.",
  description:
    "ShopSphere মাল্টি-ভেন্ডর দোকানের ডেটা দিয়ে SQL শেখা শুরু। ভেন্ডর-প্রোডাক্ট খোঁজা, অর্ডার ও আইটেম জোড়া লাগিয়ে রেভিনিউ, dead stock, subquery, set operations, টেক্সট/তারিখ সার্চ, পেমেন্ট-শিপমেন্ট-রিটার্ন—প্রতিটি টপিক বাস্তব প্রশ্ন দিয়ে শুরু, তারপর সেই প্রশ্নের query।",
  estimatedHours: 40,
  diagram: {
    src: "/learning/basic-sql.svg",
    alt: "Basic SQL learning map: ShopSphere dataset, SELECT/WHERE, joins and aggregates, NULL and set operations, text/dates, order lifecycle, checkpoint",
  },
  status: "LIVE",
  track: "sql",
  practiceTier: "COMPACT",
  topics: withPractice([
    {
      slug: "orientation",
      title: "Meet the marketplace",
      titleBn: "দোকান চেনা",
      summary:
        "ভেন্ডর, প্রোডাক্ট আর স্টকের টেবিল চিনে SELECT/WHERE/ORDER BY দিয়ে প্রথম রিপোর্ট।",
      concept: orientationConcept,
      guidedProblemSlugs: ["sql-vendor-directory", "sql-low-stock"],
      practiceProblemSlugs: { easy: [], medium: [], hard: [] },
      extraProblemSlugs: [],
    },
    {
      slug: "money-and-orders",
      title: "Money & orders",
      titleBn: "টাকার হিসাব",
      summary:
        "JOIN, GROUP BY আর HAVING দিয়ে ভেন্ডরের রেভিনিউ ও প্রতিটি অর্ডারের মোট টাকা।",
      concept: moneyConcept,
      guidedProblemSlugs: ["sql-vendor-revenue", "sql-order-receipts"],
      practiceProblemSlugs: { easy: [], medium: [], hard: [] },
      extraProblemSlugs: [],
    },
    {
      slug: "missing-rows",
      title: "Missing pieces",
      titleBn: "যেখানে সারি নেই",
      summary:
        "LEFT JOIN, NOT EXISTS আর CASE দিয়ে dead stock, নিষ্ক্রিয় কাস্টমার আর স্টক bucket বের করা।",
      concept: missingConcept,
      guidedProblemSlugs: ["sql-unsold-products", "sql-stock-health"],
      practiceProblemSlugs: { easy: [], medium: [], hard: [] },
      extraProblemSlugs: [],
    },
    {
      slug: "subqueries",
      title: "Questions inside questions",
      titleBn: "প্রশ্নের ভিতরে প্রশ্ন",
      summary:
        "Correlated subquery আর EXISTS দিয়ে ক্যাটাগরির গড়ের চেয়ে দামি প্রোডাক্ট ও অর্ডারহীন কাস্টমার।",
      concept: subqueryConcept,
      guidedProblemSlugs: [
        "sql-above-category-average",
        "sql-customers-without-orders",
      ],
      practiceProblemSlugs: { easy: [], medium: [], hard: [] },
      extraProblemSlugs: [],
    },
    ...BASIC_SQL_EXTRA_TOPICS,
    ...BASIC_SQL_EXTRA2_TOPICS,
  ]),
  checkpoint: basicCheckpoint,
};

export const advancedSqlModule: LearningModuleDefinition = {
  slug: "advanced-sql",
  order: 9,
  title: "Advanced SQL · ShopSphere",
  subtitle: "টাইমলাইন, ফানেল, JSON ও ফিন্যান্স",
  goal: "Turn marketplace data into analytics: rankings, moving windows, funnels, coupons, JSON inventory, payout reconciliation and retention.",
  description:
    "এবার ShopSphere-এর অ্যানালিটিক্স টিমে কাজ। Window function দিয়ে র্যাংকিং, চলমান রেভিনিউ ও moving average; recursive CTE দিয়ে ক্যাটাগরি ও রেফারেল; CTE দিয়ে ফানেল, কুপন attribution, JSON/ইনভেন্টরি reconciliation, ভেন্ডর payout ও retention—সব বাস্তব project প্রশ্ন ধরে ধরে।",
  estimatedHours: 56,
  diagram: {
    src: "/learning/advanced-sql.svg",
    alt: "Advanced SQL learning map: rankings and windows, CTEs and recursion, funnels and pivots, JSON and inventory, finance, performance, writable SQL labs, capstone",
  },
  status: "LIVE",
  track: "sql",
  practiceTier: "COMPACT",
  topics: withPractice([
    {
      slug: "window-thinking",
      title: "Rankings & timelines",
      titleBn: "র‍্যাংক ও টাইমলাইন",
      summary:
        "RANK আর SUM() OVER দিয়ে প্রতি ক্যাটাগরির সেরা প্রোডাক্ট ও চলমান রেভিনিউ।",
      concept: windowConcept,
      guidedProblemSlugs: [
        "sql-adv-top-product",
        "sql-adv-running-revenue",
      ],
      practiceProblemSlugs: { easy: [], medium: [], hard: [] },
      extraProblemSlugs: [],
    },
    {
      slug: "hierarchies",
      title: "Trees & referrals",
      titleBn: "সম্পর্কের গভীরে",
      summary:
        "Recursive CTE দিয়ে ক্যাটাগরি path আর রেফারেল চেইনের depth।",
      concept: hierarchyConcept,
      guidedProblemSlugs: [
        "sql-adv-category-tree",
        "sql-adv-referral-depth",
      ],
      practiceProblemSlugs: { easy: [], medium: [], hard: [] },
      extraProblemSlugs: [],
    },
    {
      slug: "business-metrics",
      title: "Shares & growth",
      titleBn: "শেয়ার ও প্রবৃদ্ধি",
      summary:
        "CTE আর window function দিয়ে ক্যাটাগরির রেভিনিউ শতাংশ ও মাসভিত্তিক growth।",
      concept: metricsConcept,
      guidedProblemSlugs: [
        "sql-adv-category-share",
        "sql-adv-monthly-growth",
      ],
      practiceProblemSlugs: { easy: [], medium: [], hard: [] },
      extraProblemSlugs: [],
    },
    ...ADVANCED_SQL_ANALYTICS_TOPICS,
    ...ADVANCED_SQL_DATA_TOPICS,
    ...ADVANCED_SQL_WINDOW_TOPICS,
    ...ADVANCED_SQL_PERFORMANCE_TOPICS,
    ...ADVANCED_SQL_LAB_TOPICS,
    {
      slug: "capstone",
      title: "Capstone: vendor & retention",
      titleBn: "ক্যাপস্টোন",
      summary:
        "ভেন্ডর scorecard আর signup-cohort retention—একাধিক CTE, conditional aggregation ও rank একসাথে।",
      concept: capstoneConcept,
      guidedProblemSlugs: [
        "sql-adv-vendor-scorecard",
        "sql-adv-cohort-retention",
      ],
      practiceProblemSlugs: { easy: [], medium: [], hard: [] },
      extraProblemSlugs: [],
    },
  ]),
  checkpoint: advancedCheckpoint,
};
