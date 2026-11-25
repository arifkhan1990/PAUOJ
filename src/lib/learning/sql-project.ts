/**
 * ShopSphere industry-project layer for the two SQL tracks.
 *
 * The lessons already teach the SQL. This file describes the project those
 * lessons belong to: the company, the squads, the feature epics, the work
 * tickets attached to every topic, the metrics, and the final handover.
 *
 * `sql-project-schema.ts` owns the 19-table data dictionary. A data-integrity
 * test keeps both files aligned with the judge fixture and the curriculum.
 */

import { SQL_PROJECT_EPICS } from "./sql-project-epics";
import { SQL_PROJECT_HANDOVER } from "./sql-project-handover";
import { SQL_PROJECT_METRICS } from "./sql-project-metrics";
import { SQL_PROJECT_TICKETS } from "./sql-project-tickets";

export type SqlProjectTrack = "basic-sql" | "advanced-sql";

export type SqlProjectRole =
  | "Analytics Engineer"
  | "Backend Engineer"
  | "Data Engineer"
  | "Ops Analyst"
  | "Finance Analyst"
  | "Staff Engineer";

export type SqlProjectEpic = {
  slug: string;
  /** Human-readable ticket prefix, e.g. `SHOP-CAT`. */
  ticketPrefix: string;
  title: string;
  titleBn: string;
  squad: string;
  /** One-line business mission in Bangla. */
  mission: string;
  /** The stakeholder story behind the epic, in Bangla. */
  story: string;
  tracks: SqlProjectTrack[];
  topicSlugs: string[];
  tables: string[];
  metricIds: string[];
  /** What the squad accepts as done, in Bangla. */
  acceptance: string[];
};

export type SqlProjectTicket = {
  id: string;
  topicSlug: string;
  moduleSlug: SqlProjectTrack;
  epicSlug: string;
  role: SqlProjectRole;
  title: string;
  titleBn: string;
  /** The industry-style request, in Bangla. */
  brief: string;
  acceptance: string[];
  tables: string[];
  /** Judge-backed problems that prove the ticket. */
  deliverableProblemSlugs: string[];
};

export type SqlProjectMetric = {
  id: string;
  name: string;
  /** Plain-language definition in Bangla. */
  definition: string;
  /** The shape of the calculation, not a full query. */
  formula: string;
  tables: string[];
  owner: string;
};

export type SqlProjectHandoverItem = {
  id: string;
  title: string;
  titleBn: string;
  /** What the learner must be able to explain or produce, in Bangla. */
  proof: string;
  topicSlugs: string[];
  problemSlugs: string[];
};

export type SqlProjectBrief = {
  company: string;
  tagline: string;
  /** Company and project context in Bangla. */
  brief: string;
  role: string;
  team: { name: string; responsibility: string }[];
  stack: string[];
  workingAgreement: string[];
  stats: { label: string; value: string }[];
  definitionOfDone: string[];
  /** Questions a staff engineer would ask in the handover review. */
  defenseQuestions: string[];
};

export type SqlProjectColumn = {
  name: string;
  type: string;
  note: string;
};

export type SqlProjectTable = {
  name: string;
  group: string;
  /** Why the table exists, in Bangla. */
  purpose: string;
  rowCount: number;
  primaryKey: string;
  foreignKeys: string[];
  columns: SqlProjectColumn[];
  usedByEpicSlugs: string[];
};

export const SQL_PROJECT: SqlProjectBrief = {
  company: "ShopSphere",
  tagline: "A multi-vendor marketplace in Bangladesh",
  brief:
    "ShopSphere একটি মাল্টি-ভেন্ডর অনলাইন মার্কেটপ্লেস। ছয়টি ভেন্ডর, চৌদ্দটি প্রোডাক্ট আর দশটি অর্ডার দিয়ে শুরু হলেও ডেটাবেসে ক্যাটালগ, কার্ট, চেকআউট, পেমেন্ট, শিপমেন্ট, রিটার্ন, কুপন, ইনভেন্টরি, রিভিউ আর ভেন্ডর পেআউট—পুরো ব্যবসার জীবনচক্র আছে। তুমি ডেটা প্ল্যাটফর্ম টিমের নতুন অ্যানালিটিক্স ইঞ্জিনিয়ার; প্রতিটি টপিক একটি বাস্তব টিকিট, আর কোর্সের শেষে পুরো ডেটাবেস ও রিপোর্টিং সিস্টেমের দায়িত্ব তোমার হাতে।",
  role: "Analytics Engineer, Data Platform",
  team: [
    { name: "Head of Data", responsibility: "মেট্রিকের সংজ্ঞা আর অগ্রাধিকার ঠিক করেন" },
    { name: "Staff Engineer", responsibility: "query review, পারফরম্যান্স আর handover approve করেন" },
    { name: "Backend Engineer", responsibility: "অর্ডার, পেমেন্ট আর ইনভেন্টরির লেখা-পড়ার সেবা রাখেন" },
    { name: "Ops Analyst", responsibility: "স্টক, শিপমেন্ট আর রিটার্নের দৈনিক কাজ চালান" },
    { name: "Finance Analyst", responsibility: "পেআউট, রিফান্ড আর reconciliation মেলান" },
  ],
  stack: [
    "PostgreSQL 17 (production reporting replica)",
    "SQLite 3 / MariaDB 10.11 / PostgreSQL 15 in the judge",
    "Read-only reporting role; no direct writes from dashboards",
    "Nightly CSV exports + weekly finance reconciliation",
  ],
  workingAgreement: [
    "টাকা সবসময় সেন্টে; রিপোর্টে ১০০ দিয়ে ভাগ করে টাকা দেখাও।",
    "তারিখ ISO (`YYYY-MM-DD`) বা UTC timestamp; লোকাল টাইম রিপোর্টে মিশিও না।",
    "প্রতিটি query deterministic—ORDER BY-তে টাই-ব্রেকার দাও।",
    "SELECT * নয়; দরকারি কলামই নাও, বিশেষ করে JOIN-এর আগে grain ঠিক করো।",
    "ধীর query শিপ করার আগে EXPLAIN দেখাও; পুরো টেবিল স্ক্যান হলেই ব্যাখ্যা দাও।",
  ],
  stats: [
    { label: "Tables", value: "19" },
    { label: "Feature squads", value: "7" },
    { label: "Work tickets", value: "23" },
    { label: "Seed rows", value: "190" },
  ],
  definitionOfDone: [
    "প্রশ্নটা ব্যবসার ভাষায় লেখা আছে, আর কোন মেট্রিক সেটা স্পষ্ট।",
    "সঠিক grain-এ JOIN হয়েছে; fan-out বা ডুপ্লিকেট সারি নেই।",
    "NULL, খালি গ্রুপ আর cancelled/refunded অবস্থা আলাদা করে ভাবা হয়েছে।",
    "ফল deterministic, টাকার একক আর শতাংশের রাউন্ডিং পরিষ্কার।",
    "প্ল্যান মাপা হয়েছে; প্রয়োজন হলে index বা keyset পেজিং ব্যবহার হয়েছে।",
  ],
  defenseQuestions: [
    "`order_items.unit_price_cents` কেন `products.price_cents` নয়?",
    "একই অর্ডারে একাধিক payment থাকতে পারে—তাহলে “paid” কীভাবে ঠিক করবে?",
    "LEFT JOIN-এর শর্ত WHERE-এ গেলে কোন সারিগুলো হারায়?",
    "`COUNT(*)` আর `COUNT(DISTINCT ...)` কোন প্রশ্নে কোনটা, কেন?",
    "কোন রিপোর্টে window function lag/lead লাগবে, আর কেন self-join নয়?",
    "বড় orders টেবিলে `LIMIT/OFFSET` কেন বিপদ, keyset কীভাবে বাঁচায়?",
  ],
};

// The data lives in sibling files to keep each file readable; this module stays
// the single import point so the UI never depends on the file split.

export {
  SQL_PROJECT_EPICS,
  SQL_PROJECT_HANDOVER,
  SQL_PROJECT_METRICS,
  SQL_PROJECT_TICKETS,
};

export function getSqlProjectEpic(slug: string): SqlProjectEpic | null {
  return SQL_PROJECT_EPICS.find((epic) => epic.slug === slug) ?? null;
}

export function getSqlProjectTicket(
  topicSlug: string,
): SqlProjectTicket | null {
  return SQL_PROJECT_TICKETS[topicSlug] ?? null;
}

export function getSqlProjectTicketsForEpic(
  epicSlug: string,
): SqlProjectTicket[] {
  return Object.values(SQL_PROJECT_TICKETS).filter(
    (ticket) => ticket.epicSlug === epicSlug,
  );
}
