import type { SeedProblem } from "../../seed-problems";
import { SORTING_SEARCHING_PROBLEMS as SORTING_SEARCHING_BASE } from "./sorting-searching-problems";
import { SORTING_SEARCHING_PRACTICE_PROBLEMS } from "./sorting-searching-practice-problems";
import { TWO_POINTERS_SLIDING_WINDOW_PROBLEMS as TWO_POINTERS_SLIDING_WINDOW_BASE } from "./two-pointers-sliding-window-problems";
import { TWO_POINTERS_SLIDING_WINDOW_PRACTICE_PROBLEMS } from "./two-pointers-sliding-window-practice-problems";
import { PREFIX_SUM_DIFFERENCE_PROBLEMS as PREFIX_SUM_DIFFERENCE_BASE } from "./prefix-sum-difference-problems";
import { PREFIX_SUM_DIFFERENCE_PRACTICE_PROBLEMS } from "./prefix-sum-difference-practice-problems";
import { RECURSION_BACKTRACKING_PROBLEMS as RECURSION_BACKTRACKING_BASE } from "./recursion-backtracking-problems";
import { RECURSION_BACKTRACKING_PRACTICE_PROBLEMS } from "./recursion-backtracking-practice-problems";
import { GREEDY_PROBLEMS as GREEDY_BASE } from "./greedy-problems";
import { GREEDY_PRACTICE_PROBLEMS } from "./greedy-practice-problems";

export const SORTING_SEARCHING_PROBLEMS: SeedProblem[] = [
  ...SORTING_SEARCHING_BASE,
  ...SORTING_SEARCHING_PRACTICE_PROBLEMS,
];

export const TWO_POINTERS_SLIDING_WINDOW_PROBLEMS: SeedProblem[] = [
  ...TWO_POINTERS_SLIDING_WINDOW_BASE,
  ...TWO_POINTERS_SLIDING_WINDOW_PRACTICE_PROBLEMS,
];

export const PREFIX_SUM_DIFFERENCE_PROBLEMS: SeedProblem[] = [
  ...PREFIX_SUM_DIFFERENCE_BASE,
  ...PREFIX_SUM_DIFFERENCE_PRACTICE_PROBLEMS,
];

export const RECURSION_BACKTRACKING_PROBLEMS: SeedProblem[] = [
  ...RECURSION_BACKTRACKING_BASE,
  ...RECURSION_BACKTRACKING_PRACTICE_PROBLEMS,
];

export const GREEDY_PROBLEMS: SeedProblem[] = [
  ...GREEDY_BASE,
  ...GREEDY_PRACTICE_PROBLEMS,
];
