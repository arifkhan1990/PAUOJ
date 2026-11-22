import type { LearningModuleDefinition } from "@/lib/learning/types";
import { module2Checkpoint, module2Topics } from "../module-2";

export const module2: LearningModuleDefinition = {
  slug: "basic-data-structures",
  order: 2,
  title: "Basic Data Structures",
  subtitle: "মেমোরিতে ডাটা সাজানোর প্রথম কৌশল",
  goal: "Learn how stacks, queues, linked lists, hash maps and STL containers store data.",
  description: "স্ট্যাক, কিউ, লিংকড লিস্ট, হ্যাশিং আর STL—কোন সমস্যায় কোন ডাটা স্ট্রাকচার ব্যবহার করবেন, সেটা বুঝতে শিখবেন।",
  estimatedHours: 16,
  status: "LIVE",
  topics: module2Topics,
  checkpoint: module2Checkpoint,
};
