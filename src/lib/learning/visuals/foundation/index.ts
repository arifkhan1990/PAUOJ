import type { LessonVisualConfig } from "@/lib/learning/visual-types";

import { module1Visuals } from "./module-1";
import { module2Visuals } from "./module-2";
import { module3Visuals } from "./module-3";
import { module4Visuals } from "./module-4";
import { toolsVisuals } from "./tools";

/**
 * Visual explainer configs for the foundation half of the curriculum:
 * core modules 1-4 plus the two free career-toolkit tracks.
 * Keys are `${moduleSlug}/${topicSlug}`; the merged index in
 * `src/lib/learning/visuals` decides which topics actually render one.
 */
export const FOUNDATION_VISUALS: Record<string, LessonVisualConfig> = {
  ...module1Visuals,
  ...module2Visuals,
  ...module3Visuals,
  ...module4Visuals,
  ...toolsVisuals,
};
