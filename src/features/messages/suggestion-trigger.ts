import type { MessageSuggestionKind } from "@/lib/message-types";

/**
 * The `@contest` / `@problem` / `@learn` composer trigger. Parsing lives here
 * (not in the component) so aliases, category filtering and caret math stay
 * testable without a DOM.
 *
 * Grammar:
 *   @[letters]              -> category chooser, filtered by the letters
 *   @[alias]                -> that category's list, empty query
 *   @[alias] [filters]      -> that category's list, filtered by filters
 */

export type SuggestionCategoryOption = {
  kind: MessageSuggestionKind;
  label: string;
  hint: string;
  aliases: readonly string[];
};

export const SUGGESTION_CATEGORIES: readonly SuggestionCategoryOption[] = [
  {
    kind: "contest",
    label: "Contests",
    hint: "Public contests you can share",
    aliases: ["contest", "contests"],
  },
  {
    kind: "problem",
    label: "Problems",
    hint: "Practice problems from the archive",
    aliases: ["problem", "problems"],
  },
  {
    kind: "learn",
    label: "Learn",
    hint: "Learning modules and topics",
    aliases: ["learn", "lesson", "lessons", "module", "modules", "topic", "topics"],
  },
];

/** The alias inserted into the draft when a category is chosen. */
const PRIMARY_ALIAS: Record<MessageSuggestionKind, string> = {
  contest: "contest",
  problem: "problem",
  learn: "learn",
};

const ALIAS_WORD = /^[A-Za-z]*$/;
const MAX_TRIGGER_LENGTH = 96;

export type SuggestionTrigger =
  | {
      mode: "categories";
      /** Index of the `@` in the draft. */
      start: number;
      /** Caret index, exclusive. */
      end: number;
      query: string;
    }
  | {
      mode: "items";
      start: number;
      end: number;
      kind: MessageSuggestionKind;
      query: string;
    };

export function primaryAlias(kind: MessageSuggestionKind): string {
  return PRIMARY_ALIAS[kind];
}

/** Title case noun used in drawer headings and empty states. */
export function suggestionKindLabel(kind: MessageSuggestionKind): string {
  if (kind === "contest") return "contest";
  if (kind === "problem") return "problem";
  return "learning resource";
}

/** Plural noun used in drawer empty states and live announcements. */
export function suggestionKindPlural(kind: MessageSuggestionKind): string {
  if (kind === "contest") return "contests";
  if (kind === "problem") return "problems";
  return "learning resources";
}

/** Exact alias lookup (`contest`, `contests`, `lesson`, …). */
export function categoryForAlias(word: string): MessageSuggestionKind | null {
  const normalized = word.trim().toLowerCase();
  if (!normalized) return null;
  const category = SUGGESTION_CATEGORIES.find((option) =>
    option.aliases.includes(normalized),
  );
  return category?.kind ?? null;
}

/** Categories whose label or aliases start with the typed letters. */
export function filterSuggestionCategories(
  query: string,
): SuggestionCategoryOption[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [...SUGGESTION_CATEGORIES];
  return SUGGESTION_CATEGORIES.filter(
    (option) =>
      option.label.toLowerCase().startsWith(normalized) ||
      option.aliases.some((alias) => alias.startsWith(normalized)),
  );
}

/**
 * Finds the trigger that contains the caret. Returns null when the caret is
 * not inside a valid trigger (plain text, an email address, or a `@[...]`
 * reference token).
 */
export function detectSuggestionTrigger(
  text: string,
  caret: number,
): SuggestionTrigger | null {
  if (!Number.isFinite(caret)) return null;
  const index = Math.min(Math.max(0, Math.trunc(caret)), text.length);
  const before = text.slice(0, index);
  const at = before.lastIndexOf("@");
  if (at < 0) return null;
  if (at > 0 && !/\s/.test(before.charAt(at - 1))) return null;

  const rest = before.slice(at + 1);
  if (rest.length === 0) {
    return { mode: "categories", start: at, end: index, query: "" };
  }
  if (rest.length > MAX_TRIGGER_LENGTH) return null;
  if (/[\r\n]/.test(rest)) return null;

  const spaceIndex = rest.indexOf(" ");
  if (spaceIndex === -1) {
    if (!ALIAS_WORD.test(rest)) return null;
    const word = rest.toLowerCase();
    const kind = categoryForAlias(word);
    if (kind) {
      return { mode: "items", start: at, end: index, kind, query: "" };
    }
    if (filterSuggestionCategories(word).length === 0) return null;
    return { mode: "categories", start: at, end: index, query: word };
  }

  const kind = categoryForAlias(rest.slice(0, spaceIndex));
  if (!kind) return null;
  const query = rest.slice(spaceIndex + 1);
  if (query.includes("@")) return null;
  return { mode: "items", start: at, end: index, kind, query: query.trim() };
}
