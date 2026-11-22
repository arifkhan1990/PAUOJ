import type { SeedProblem } from "../../seed-problems";
import { STACK_QUEUE_PROBLEMS as STACK_QUEUE_BASE } from "./stack-queue-problems";
import { STACK_QUEUE_PRACTICE_PROBLEMS } from "./stack-queue-practice-problems";
import { LINKED_LIST_PROBLEMS as LINKED_LIST_BASE } from "./linked-list-problems";
import { LINKED_LIST_PRACTICE_PROBLEMS } from "./linked-list-practice-problems";
import { HASHING_PROBLEMS as HASHING_BASE } from "./hashing-problems";
import { HASHING_PRACTICE_PROBLEMS } from "./hashing-practice-problems";
import { STL_COLLECTIONS_PROBLEMS as STL_COLLECTIONS_BASE } from "./stl-collections-problems";
import { STL_COLLECTIONS_PRACTICE_PROBLEMS } from "./stl-collections-practice-problems";

export const STACK_QUEUE_PROBLEMS: SeedProblem[] = [
  ...STACK_QUEUE_BASE,
  ...STACK_QUEUE_PRACTICE_PROBLEMS,
];

export const LINKED_LIST_PROBLEMS: SeedProblem[] = [
  ...LINKED_LIST_BASE,
  ...LINKED_LIST_PRACTICE_PROBLEMS,
];

export const HASHING_PROBLEMS: SeedProblem[] = [
  ...HASHING_BASE,
  ...HASHING_PRACTICE_PROBLEMS,
];

export const STL_COLLECTIONS_PROBLEMS: SeedProblem[] = [
  ...STL_COLLECTIONS_BASE,
  ...STL_COLLECTIONS_PRACTICE_PROBLEMS,
];
