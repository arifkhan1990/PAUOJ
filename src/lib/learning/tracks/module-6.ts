import type { LearningModuleDefinition } from "@/lib/learning/types";
import { module6Checkpoint, module6Topics } from "../module-6";

export const module6: LearningModuleDefinition = {
  slug: "advanced-data-structures",
  order: 6,
  title: "Advanced Data Structures",
  subtitle: "রেঞ্জ কুয়েরি আর দ্রুত স্ট্রিং সার্চ",
  goal: "Answer range and prefix queries with tries, segment trees, Fenwick trees and sparse tables.",
  description: "Trie, segment tree, lazy propagation, Fenwick tree, sparse table, LCA আর HLD—জটিল কুয়েরির জন্য specialised টুল।",
  estimatedHours: 24,
  status: "LIVE",
  topics: module6Topics,
  checkpoint: module6Checkpoint,
};
