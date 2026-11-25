import { and, eq, ilike, or, sql } from "drizzle-orm";
import { getDb } from "@/server/db";
import { contests } from "@/server/db/schema";
import type {
  MessageSuggestion,
  MessageSuggestionKind,
} from "@/lib/message-types";
import { LEARNING_MODULES } from "@/lib/learning/modules";
import { listProblems } from "./problems";

export const MESSAGE_SUGGESTION_LIMIT = 8;

const DATE_FORMAT = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const DIFFICULTY_LABEL: Record<string, string> = {
  EASY: "Easy",
  MEDIUM: "Medium",
  HARD: "Hard",
  EXPERT: "Expert",
};

const TRACK_LABEL: Record<string, string> = {
  core: "Core",
  sql: "SQL",
  tools: "Tools",
};

/** "Live now", "Starts 25 Nov 2026", or "Ended 20 Nov 2026". */
export function contestSuggestionMeta(
  startAt: Date,
  endAt: Date,
  now: Date,
): string {
  if (endAt.getTime() <= now.getTime()) {
    return `Ended ${DATE_FORMAT.format(endAt)}`;
  }
  if (startAt.getTime() <= now.getTime()) return "Live now";
  return `Starts ${DATE_FORMAT.format(startAt)}`;
}

export function problemSuggestion(row: {
  id: string;
  slug: string;
  title: string;
  difficulty: string;
  points: number;
}): MessageSuggestion {
  return {
    kind: "problem",
    id: row.id,
    label: row.title,
    meta: `${DIFFICULTY_LABEL[row.difficulty] ?? row.difficulty} · ${row.points} pts`,
    href: `/problems/${row.slug}`,
  };
}

export type LearningSuggestionTopic = {
  slug: string;
  title: string;
  titleBn: string;
};

export type LearningSuggestionModule = {
  slug: string;
  title: string;
  /** Module-level Bangla label when the curriculum supplies one. */
  titleBn?: string;
  /** Existing modules carry their Bangla label in `subtitle`. */
  subtitle?: string;
  track?: string;
  topics: readonly LearningSuggestionTopic[];
};

function matchesQuery(haystack: string, needle: string): boolean {
  return haystack.toLowerCase().includes(needle);
}

function matchesModule(
  learningModule: LearningSuggestionModule,
  needle: string,
): boolean {
  return [
    learningModule.title,
    learningModule.titleBn,
    learningModule.subtitle,
    learningModule.slug,
  ].some((value) => value !== undefined && matchesQuery(value, needle));
}

function moduleSuggestion(
  learningModule: LearningSuggestionModule,
): MessageSuggestion {
  const track = learningModule.track ?? "core";
  return {
    kind: "learn",
    id: learningModule.slug,
    label: learningModule.title,
    meta: `${learningModule.topics.length} topics · ${TRACK_LABEL[track] ?? track}`,
    href: `/learn/${learningModule.slug}`,
  };
}

function topicSuggestion(
  learningModule: LearningSuggestionModule,
  topic: LearningSuggestionModule["topics"][number],
): MessageSuggestion {
  return {
    kind: "learn",
    id: `${learningModule.slug}/${topic.slug}`,
    label: topic.title,
    meta: learningModule.title,
    href: `/learn/${learningModule.slug}/${topic.slug}`,
  };
}

/**
 * Pure ranking for the learn drawer: with no query the first modules are
 * listed; with a query matching modules come first, then matching topics.
 */
export function learningSuggestions(
  modules: readonly LearningSuggestionModule[],
  query: string | undefined,
  limit = MESSAGE_SUGGESTION_LIMIT,
): MessageSuggestion[] {
  const needle = query?.trim().toLowerCase() ?? "";
  if (!needle) {
    return modules.slice(0, limit).map(moduleSuggestion);
  }

  const moduleMatches = modules
    .filter((entry) => matchesModule(entry, needle))
    .map(moduleSuggestion);
  if (moduleMatches.length >= limit) {
    return moduleMatches.slice(0, limit);
  }

  const topicMatches: MessageSuggestion[] = [];
  for (const learningModule of modules) {
    for (const topic of learningModule.topics) {
      if (
        [topic.title, topic.titleBn, topic.slug].some((value) =>
          matchesQuery(value, needle),
        )
      ) {
        topicMatches.push(topicSuggestion(learningModule, topic));
        if (moduleMatches.length + topicMatches.length >= limit) {
          break;
        }
      }
    }
    if (moduleMatches.length + topicMatches.length >= limit) break;
  }

  return [...moduleMatches, ...topicMatches].slice(0, limit);
}

async function listContestSuggestions(
  query: string | undefined,
): Promise<MessageSuggestion[]> {
  const term = query?.trim();
  const conditions = [eq(contests.isPublic, true)];
  if (term) {
    const search = or(
      ilike(contests.title, `%${term}%`),
      ilike(contests.slug, `%${term}%`),
    );
    if (search) conditions.push(search);
  }
  const rows = await getDb()
    .select({
      id: contests.id,
      slug: contests.slug,
      title: contests.title,
      startAt: contests.startAt,
      endAt: contests.endAt,
    })
    .from(contests)
    .where(and(...conditions))
    .orderBy(
      sql`case when ${contests.endAt} > now() then 0 else 1 end`,
      sql`case when ${contests.endAt} > now() then ${contests.startAt} end asc nulls last`,
      sql`case when ${contests.endAt} <= now() then ${contests.startAt} end desc nulls last`,
    )
    .limit(MESSAGE_SUGGESTION_LIMIT);
  const now = new Date();
  return rows.map((row) => ({
    kind: "contest",
    id: row.id,
    label: row.title,
    meta: contestSuggestionMeta(row.startAt, row.endAt, now),
    href: `/contests/${row.slug}`,
  }));
}

async function listProblemSuggestions(input: {
  query: string | undefined;
  userId: string | null;
  isAdmin: boolean;
}): Promise<MessageSuggestion[]> {
  const { items } = await listProblems({
    page: { page: 1, pageSize: MESSAGE_SUGGESTION_LIMIT },
    q: input.query?.trim() || undefined,
    userId: input.userId,
    isAdmin: input.isAdmin,
  });
  return items
    .slice(0, MESSAGE_SUGGESTION_LIMIT)
    .map((item) => problemSuggestion(item));
}

const LIVE_MODULES = LEARNING_MODULES.filter(
  (entry) => entry.status === "LIVE",
);

/** Suggestions always respect the 8-item cap and internal href allow-list. */
export async function listMessageSuggestions(input: {
  kind: MessageSuggestionKind;
  query?: string;
  userId: string | null;
  isAdmin: boolean;
}): Promise<MessageSuggestion[]> {
  if (input.kind === "contest") {
    return listContestSuggestions(input.query);
  }
  if (input.kind === "problem") {
    return listProblemSuggestions({
      query: input.query,
      userId: input.userId,
      isAdmin: input.isAdmin,
    });
  }
  return learningSuggestions(LIVE_MODULES, input.query);
}
