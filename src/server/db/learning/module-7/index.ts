import type { SeedProblem } from "../../seed-problems";
import { STRING_MATCHING_PROBLEMS as STRING_MATCHING_BASE } from "./string-matching-problems";
import { STRING_MATCHING_PRACTICE_PROBLEMS } from "./string-matching-practice-problems";
import { NETWORK_FLOW_PROBLEMS as NETWORK_FLOW_BASE } from "./network-flow-problems";
import { NETWORK_FLOW_PRACTICE_PROBLEMS } from "./network-flow-practice-problems";
import { ADVANCED_NUMBER_THEORY_PROBLEMS as ADVANCED_NUMBER_THEORY_BASE } from "./advanced-number-theory-problems";
import { ADVANCED_NUMBER_THEORY_PRACTICE_PROBLEMS } from "./advanced-number-theory-practice-problems";
import { GAME_THEORY_PROBLEMS as GAME_THEORY_BASE } from "./game-theory-problems";
import { GAME_THEORY_PRACTICE_PROBLEMS } from "./game-theory-practice-problems";

export const STRING_MATCHING_PROBLEMS: SeedProblem[] = [
  ...STRING_MATCHING_BASE,
  ...STRING_MATCHING_PRACTICE_PROBLEMS,
];

export const NETWORK_FLOW_PROBLEMS: SeedProblem[] = [
  ...NETWORK_FLOW_BASE,
  ...NETWORK_FLOW_PRACTICE_PROBLEMS,
];

export const ADVANCED_NUMBER_THEORY_PROBLEMS: SeedProblem[] = [
  ...ADVANCED_NUMBER_THEORY_BASE,
  ...ADVANCED_NUMBER_THEORY_PRACTICE_PROBLEMS,
];

export const GAME_THEORY_PROBLEMS: SeedProblem[] = [
  ...GAME_THEORY_BASE,
  ...GAME_THEORY_PRACTICE_PROBLEMS,
];
