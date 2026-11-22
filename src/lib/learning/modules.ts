import type {
  LearningModuleDefinition,
  LearningTopicDefinition,
} from "@/lib/learning/types";
import { module1 } from "./tracks/module-1";
import { module2 } from "./tracks/module-2";
import { module3 } from "./tracks/module-3";
import { module4 } from "./tracks/module-4";
import { module5 } from "./tracks/module-5";
import { module6 } from "./tracks/module-6";
import { module7 } from "./tracks/module-7";

export const LEARNING_MODULES: LearningModuleDefinition[] = [
  module1,
  module2,
  module3,
  module4,
  module5,
  module6,
  module7,
];

export function getLearningModule(
  slug: string,
): LearningModuleDefinition | null {
  return LEARNING_MODULES.find((module) => module.slug === slug) ?? null;
}

export function getLearningTopic(
  moduleSlug: string,
  topicSlug: string,
): {
  module: LearningModuleDefinition;
  topic: LearningTopicDefinition;
} | null {
  const definition = getLearningModule(moduleSlug);
  if (!definition) return null;
  const topic = definition.topics.find((item) => item.slug === topicSlug);
  return topic ? { module: definition, topic } : null;
}
