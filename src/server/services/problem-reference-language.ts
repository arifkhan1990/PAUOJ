import type { JudgeLanguage } from "@/server/judge/types";

const JUDGE_LANGUAGES: ReadonlySet<JudgeLanguage> = new Set<JudgeLanguage>([
  "c",
  "cpp",
  "python",
  "javascript",
  "java",
  "csharp",
  "go",
  "php",
  "kotlin",
  "swift",
  "sql",
  "sqlite",
  "mysql",
  "postgresql",
]);

/**
 * Review approvals store a free-text language. Only judge-supported values may
 * become a stored reference; anything else is ignored.
 */
export function normalizeReferenceLanguage(
  value: string | null | undefined,
): JudgeLanguage | null {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) return null;
  return JUDGE_LANGUAGES.has(normalized as JudgeLanguage)
    ? (normalized as JudgeLanguage)
    : null;
}
