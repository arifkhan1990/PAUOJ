import type { SeedProblem } from "../../seed-problems";
import { BIT_PROBLEMS as BIT_BASE } from "./bit-problems";
import { BIT_EXTRA_PROBLEMS } from "./bit-extra-problems";
import { CHECKPOINT_PROBLEMS as CHECKPOINT_BASE } from "./checkpoint-problems";
import { COMPLEXITY_PROBLEMS as COMPLEXITY_BASE } from "./complexity-problems";
import { COMPLEXITY_EXTRA_PROBLEMS } from "./complexity-extra-problems";
import { IO_LOOPS_PROBLEMS as IO_LOOPS_BASE } from "./io-loops-problems";
import { IO_LOOPS_EXTRA_PROBLEMS } from "./io-loops-extra-problems";
import { MATH_PROBLEMS as MATH_BASE } from "./math-problems";
import { MATH_EXTRA_PROBLEMS } from "./math-extra-problems";
import { STRINGS_ARRAYS_PROBLEMS as STRINGS_ARRAYS_BASE } from "./strings-arrays-problems";
import { STRINGS_ARRAYS_EXTRA_PROBLEMS } from "./strings-arrays-extra-problems";

export const BIT_PROBLEMS: SeedProblem[] = [
  ...BIT_BASE,
  ...BIT_EXTRA_PROBLEMS,
];
export const CHECKPOINT_PROBLEMS: SeedProblem[] = CHECKPOINT_BASE;
export const COMPLEXITY_PROBLEMS: SeedProblem[] = [
  ...COMPLEXITY_BASE,
  ...COMPLEXITY_EXTRA_PROBLEMS,
];
export const IO_LOOPS_PROBLEMS: SeedProblem[] = [
  ...IO_LOOPS_BASE,
  ...IO_LOOPS_EXTRA_PROBLEMS,
];
export const MATH_PROBLEMS: SeedProblem[] = [
  ...MATH_BASE,
  ...MATH_EXTRA_PROBLEMS,
];
export const STRINGS_ARRAYS_PROBLEMS: SeedProblem[] = [
  ...STRINGS_ARRAYS_BASE,
  ...STRINGS_ARRAYS_EXTRA_PROBLEMS,
];

export { CHECKPOINT_PROBLEMS as MODULE1_CHECKPOINT_PROBLEMS };
