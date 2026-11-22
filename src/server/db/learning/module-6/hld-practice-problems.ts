import type { SeedProblem } from "../../seed-problems";
import { HLD_PRACTICE_ADVANCED } from "./hld-practice-advanced";
import { HLD_PRACTICE_BASIC } from "./hld-practice-basic";

export const HLD_PRACTICE_PROBLEMS: SeedProblem[] = [
  ...HLD_PRACTICE_BASIC,
  ...HLD_PRACTICE_ADVANCED,
];
