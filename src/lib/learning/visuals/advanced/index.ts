/**
 * Visual explainer configs for the advanced half of the curriculum:
 * core modules 5-7 and every SQL topic (basic + advanced).
 *
 * Keys are "<module-slug>/<topic-slug>" so the merged index in
 * `src/lib/learning/visuals` can look any topic up in one map read.
 * Modules 1-4 and the Git/Docker toolkits live in the sibling
 * `core` folder owned by the other config agent.
 */

import type { LessonVisualConfig } from "@/lib/learning/visual-types";
import { MODULE_5_VISUALS } from "./module-5";
import { MODULE_6_VISUALS } from "./module-6";
import { MODULE_7_VISUALS } from "./module-7";
import { BASIC_SQL_VISUALS } from "./sql-basic";
import { ADVANCED_SQL_VISUALS } from "./sql-advanced";

export const ADVANCED_VISUALS: Record<string, LessonVisualConfig> = {
  ...MODULE_5_VISUALS,
  ...MODULE_6_VISUALS,
  ...MODULE_7_VISUALS,
  ...BASIC_SQL_VISUALS,
  ...ADVANCED_SQL_VISUALS,
};
