import type { SeedProblem } from "../seed-problems";
import {
  BIT_PROBLEMS,
  CHECKPOINT_PROBLEMS,
  COMPLEXITY_PROBLEMS,
  IO_LOOPS_PROBLEMS,
  MATH_PROBLEMS,
  STRINGS_ARRAYS_PROBLEMS,
} from "./module-1";
import { MODULE2_CHECKPOINT_PROBLEMS } from "./module-2/checkpoint-problems";
import {
  HASHING_PROBLEMS,
  LINKED_LIST_PROBLEMS,
  STACK_QUEUE_PROBLEMS,
  STL_COLLECTIONS_PROBLEMS,
} from "./module-2";
import { MODULE3_CHECKPOINT_PROBLEMS } from "./module-3/checkpoint-problems";
import {
  GREEDY_PROBLEMS,
  PREFIX_SUM_DIFFERENCE_PROBLEMS,
  RECURSION_BACKTRACKING_PROBLEMS,
  SORTING_SEARCHING_PROBLEMS,
  TWO_POINTERS_SLIDING_WINDOW_PROBLEMS,
} from "./module-3";
import { MODULE4_CHECKPOINT_PROBLEMS } from "./module-4/checkpoint-problems";
import {
  BINARY_TREES_BST_PROBLEMS,
  GRAPH_TRAVERSAL_PROBLEMS,
  HEAPS_PRIORITY_QUEUES_PROBLEMS,
  MST_DSU_PROBLEMS,
  SHORTEST_PATHS_PROBLEMS,
  TREE_TRAVERSALS_PROBLEMS,
} from "./module-4";
import { MODULE5_CHECKPOINT_PROBLEMS } from "./module-5/checkpoint-problems";
import {
  DP_INTRODUCTION_PROBLEMS,
  GRID_DP_PROBLEMS,
  KNAPSACK_PROBLEMS,
  LCS_LIS_PROBLEMS,
  TREE_BITMASK_DP_PROBLEMS,
} from "./module-5";
import { MODULE6_CHECKPOINT_PROBLEMS } from "./module-6/checkpoint-problems";
import {
  FENWICK_TREE_PROBLEMS,
  HLD_PROBLEMS,
  SEGMENT_TREE_PROBLEMS,
  SPARSE_TABLE_LCA_PROBLEMS,
  TRIE_PROBLEMS,
} from "./module-6";
import { MODULE7_CHECKPOINT_PROBLEMS } from "./module-7/checkpoint-problems";
import {
  ADVANCED_NUMBER_THEORY_PROBLEMS,
  GAME_THEORY_PROBLEMS,
  NETWORK_FLOW_PROBLEMS,
  STRING_MATCHING_PROBLEMS,
} from "./module-7";

function curriculumProblems(
  problems: SeedProblem[],
  subcategory: string,
): SeedProblem[] {
  return problems.map((problem) => ({
    ...problem,
    category: "Learning track",
    subcategory,
  }));
}

export const LEARNING_PROBLEMS: SeedProblem[] = [
  ...curriculumProblems(BIT_PROBLEMS, "Module 1 · Bit Manipulation"),
  ...curriculumProblems(CHECKPOINT_PROBLEMS, "Module 1 · Checkpoint"),
  ...curriculumProblems(COMPLEXITY_PROBLEMS, "Module 1 · Complexity"),
  ...curriculumProblems(IO_LOOPS_PROBLEMS, "Module 1 · Input, Loops & Conditionals"),
  ...curriculumProblems(MATH_PROBLEMS, "Module 1 · Basic Math"),
  ...curriculumProblems(STRINGS_ARRAYS_PROBLEMS, "Module 1 · Strings & Arrays"),
  ...curriculumProblems(STACK_QUEUE_PROBLEMS, "Module 2 · Stack & Queue"),
  ...curriculumProblems(LINKED_LIST_PROBLEMS, "Module 2 · Linked List"),
  ...curriculumProblems(HASHING_PROBLEMS, "Module 2 · Hashing & Hash Maps"),
  ...curriculumProblems(STL_COLLECTIONS_PROBLEMS, "Module 2 · STL / Collections Framework"),
  ...curriculumProblems(MODULE2_CHECKPOINT_PROBLEMS, "Module 2 · Checkpoint"),
  ...curriculumProblems(SORTING_SEARCHING_PROBLEMS, "Module 3 · Sorting & Searching"),
  ...curriculumProblems(TWO_POINTERS_SLIDING_WINDOW_PROBLEMS, "Module 3 · Two Pointers & Sliding Window"),
  ...curriculumProblems(PREFIX_SUM_DIFFERENCE_PROBLEMS, "Module 3 · Prefix Sum & Difference Array"),
  ...curriculumProblems(RECURSION_BACKTRACKING_PROBLEMS, "Module 3 · Recursion & Backtracking"),
  ...curriculumProblems(GREEDY_PROBLEMS, "Module 3 · Greedy Algorithms"),
  ...curriculumProblems(MODULE3_CHECKPOINT_PROBLEMS, "Module 3 · Checkpoint"),
  ...curriculumProblems(BINARY_TREES_BST_PROBLEMS, "Module 4 · Binary Trees & BST"),
  ...curriculumProblems(TREE_TRAVERSALS_PROBLEMS, "Module 4 · Tree Traversals"),
  ...curriculumProblems(HEAPS_PRIORITY_QUEUES_PROBLEMS, "Module 4 · Heaps & Priority Queues"),
  ...curriculumProblems(GRAPH_TRAVERSAL_PROBLEMS, "Module 4 · Graph Representation & Traversal"),
  ...curriculumProblems(SHORTEST_PATHS_PROBLEMS, "Module 4 · Shortest Path Algorithms"),
  ...curriculumProblems(MST_DSU_PROBLEMS, "Module 4 · MST & Disjoint Set Union"),
  ...curriculumProblems(MODULE4_CHECKPOINT_PROBLEMS, "Module 4 · Checkpoint"),
  ...curriculumProblems(DP_INTRODUCTION_PROBLEMS, "Module 5 · Introduction to DP"),
  ...curriculumProblems(GRID_DP_PROBLEMS, "Module 5 · 1D & 2D Grid DP"),
  ...curriculumProblems(KNAPSACK_PROBLEMS, "Module 5 · Knapsack Patterns"),
  ...curriculumProblems(LCS_LIS_PROBLEMS, "Module 5 · LCS & LIS"),
  ...curriculumProblems(TREE_BITMASK_DP_PROBLEMS, "Module 5 · DP on Trees & Bitmask DP"),
  ...curriculumProblems(MODULE5_CHECKPOINT_PROBLEMS, "Module 5 · Checkpoint"),
  ...curriculumProblems(TRIE_PROBLEMS, "Module 6 · Trie"),
  ...curriculumProblems(SEGMENT_TREE_PROBLEMS, "Module 6 · Segment Tree & Lazy Propagation"),
  ...curriculumProblems(FENWICK_TREE_PROBLEMS, "Module 6 · Fenwick Tree"),
  ...curriculumProblems(SPARSE_TABLE_LCA_PROBLEMS, "Module 6 · Sparse Table & LCA"),
  ...curriculumProblems(HLD_PROBLEMS, "Module 6 · Heavy-Light Decomposition"),
  ...curriculumProblems(MODULE6_CHECKPOINT_PROBLEMS, "Module 6 · Checkpoint"),
  ...curriculumProblems(STRING_MATCHING_PROBLEMS, "Module 7 · String Matching"),
  ...curriculumProblems(NETWORK_FLOW_PROBLEMS, "Module 7 · Network Flow & Bipartite Matching"),
  ...curriculumProblems(ADVANCED_NUMBER_THEORY_PROBLEMS, "Module 7 · Advanced Number Theory"),
  ...curriculumProblems(GAME_THEORY_PROBLEMS, "Module 7 · Game Theory"),
  ...curriculumProblems(MODULE7_CHECKPOINT_PROBLEMS, "Module 7 · Checkpoint"),
];
