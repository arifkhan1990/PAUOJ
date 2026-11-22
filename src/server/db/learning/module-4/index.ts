import type { SeedProblem } from "../../seed-problems";
import { BINARY_TREES_BST_PROBLEMS as BINARY_TREES_BST_BASE } from "./binary-trees-bst-problems";
import { BINARY_TREES_BST_PRACTICE_PROBLEMS } from "./binary-trees-bst-practice-problems";
import { TREE_TRAVERSALS_PROBLEMS as TREE_TRAVERSALS_BASE } from "./tree-traversals-problems";
import { TREE_TRAVERSALS_PRACTICE_PROBLEMS } from "./tree-traversals-practice-problems";
import { HEAPS_PRIORITY_QUEUES_PROBLEMS as HEAPS_PRIORITY_QUEUES_BASE } from "./heaps-priority-queues-problems";
import { HEAPS_PRIORITY_QUEUES_PRACTICE_PROBLEMS } from "./heaps-priority-queues-practice-problems";
import { GRAPH_TRAVERSAL_PROBLEMS as GRAPH_TRAVERSAL_BASE } from "./graph-traversal-problems";
import { GRAPH_TRAVERSAL_PRACTICE_PROBLEMS } from "./graph-traversal-practice-problems";
import { SHORTEST_PATHS_PROBLEMS as SHORTEST_PATHS_BASE } from "./shortest-paths-problems";
import { SHORTEST_PATHS_PRACTICE_PROBLEMS } from "./shortest-paths-practice-problems";
import { MST_DSU_PROBLEMS as MST_DSU_BASE } from "./mst-dsu-problems";
import { MST_DSU_PRACTICE_PROBLEMS } from "./mst-dsu-practice-problems";

export const BINARY_TREES_BST_PROBLEMS: SeedProblem[] = [
  ...BINARY_TREES_BST_BASE,
  ...BINARY_TREES_BST_PRACTICE_PROBLEMS,
];

export const TREE_TRAVERSALS_PROBLEMS: SeedProblem[] = [
  ...TREE_TRAVERSALS_BASE,
  ...TREE_TRAVERSALS_PRACTICE_PROBLEMS,
];

export const HEAPS_PRIORITY_QUEUES_PROBLEMS: SeedProblem[] = [
  ...HEAPS_PRIORITY_QUEUES_BASE,
  ...HEAPS_PRIORITY_QUEUES_PRACTICE_PROBLEMS,
];

export const GRAPH_TRAVERSAL_PROBLEMS: SeedProblem[] = [
  ...GRAPH_TRAVERSAL_BASE,
  ...GRAPH_TRAVERSAL_PRACTICE_PROBLEMS,
];

export const SHORTEST_PATHS_PROBLEMS: SeedProblem[] = [
  ...SHORTEST_PATHS_BASE,
  ...SHORTEST_PATHS_PRACTICE_PROBLEMS,
];

export const MST_DSU_PROBLEMS: SeedProblem[] = [
  ...MST_DSU_BASE,
  ...MST_DSU_PRACTICE_PROBLEMS,
];
