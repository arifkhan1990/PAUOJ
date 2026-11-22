import type { LearningModuleDefinition } from "@/lib/learning/types";
import { module4Checkpoint, module4Topics } from "../module-4";

export const module4: LearningModuleDefinition = {
  slug: "trees-graphs",
  order: 4,
  title: "Trees & Graphs",
  subtitle: "নন-লিনিয়ার ডাটা আর নেটওয়ার্ক",
  goal: "Traverse trees and graphs, find shortest paths, build MSTs and use DSU.",
  description: "বাইনারি ট্রি, BST, heap, graph traversal, Dijkstra, Bellman-Ford, Floyd-Warshall, MST আর DSU—এক মডিউলে।",
  estimatedHours: 24,
  status: "LIVE",
  topics: module4Topics,
  checkpoint: module4Checkpoint,
};
