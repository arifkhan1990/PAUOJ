import type { SeedProblem } from "../../seed-problems";
import { DP_INTRODUCTION_PROBLEMS as DP_INTRODUCTION_BASE } from "./dp-introduction-problems";
import { DP_INTRODUCTION_PRACTICE_PROBLEMS } from "./dp-introduction-practice-problems";
import { GRID_DP_PROBLEMS as GRID_DP_BASE } from "./grid-dp-problems";
import { GRID_DP_PRACTICE_PROBLEMS } from "./grid-dp-practice-problems";
import { KNAPSACK_PROBLEMS as KNAPSACK_BASE } from "./knapsack-problems";
import { KNAPSACK_PRACTICE_PROBLEMS } from "./knapsack-practice-problems";
import { LCS_LIS_PROBLEMS as LCS_LIS_BASE } from "./lcs-lis-problems";
import { LCS_LIS_PRACTICE_PROBLEMS } from "./lcs-lis-practice-problems";
import { TREE_BITMASK_DP_PROBLEMS as TREE_BITMASK_DP_BASE } from "./tree-bitmask-dp-problems";
import { TREE_BITMASK_DP_PRACTICE_PROBLEMS } from "./tree-bitmask-dp-practice-problems";

export const DP_INTRODUCTION_PROBLEMS: SeedProblem[] = [
  ...DP_INTRODUCTION_BASE,
  ...DP_INTRODUCTION_PRACTICE_PROBLEMS,
];

export const GRID_DP_PROBLEMS: SeedProblem[] = [
  ...GRID_DP_BASE,
  ...GRID_DP_PRACTICE_PROBLEMS,
];

export const KNAPSACK_PROBLEMS: SeedProblem[] = [
  ...KNAPSACK_BASE,
  ...KNAPSACK_PRACTICE_PROBLEMS,
];

export const LCS_LIS_PROBLEMS: SeedProblem[] = [
  ...LCS_LIS_BASE,
  ...LCS_LIS_PRACTICE_PROBLEMS,
];

export const TREE_BITMASK_DP_PROBLEMS: SeedProblem[] = [
  ...TREE_BITMASK_DP_BASE,
  ...TREE_BITMASK_DP_PRACTICE_PROBLEMS,
];
