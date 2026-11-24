import type { LessonVisualConfig } from "@/lib/learning/visual-types";
import { ADVANCED_VISUALS } from "./advanced";
import { FOUNDATION_VISUALS } from "./foundation";

/**
 * One lookup for every live topic. The map is intentionally static so the
 * lesson page can server-render the visual without a DB query or client fetch.
 */
export const LESSON_VISUALS: Record<string, LessonVisualConfig> = {
  ...FOUNDATION_VISUALS,
  ...ADVANCED_VISUALS,
};

export function getLessonVisual(
  moduleSlug: string,
  topicSlug: string,
): LessonVisualConfig | null {
  return LESSON_VISUALS[`${moduleSlug}/${topicSlug}`] ?? null;
}
