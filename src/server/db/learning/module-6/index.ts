import type { SeedProblem } from "../../seed-problems";
import { TRIE_PROBLEMS as TRIE_BASE } from "./trie-problems";
import { TRIE_PRACTICE_PROBLEMS } from "./trie-practice-problems";
import { SEGMENT_TREE_PROBLEMS as SEGMENT_TREE_BASE } from "./segment-tree-problems";
import { SEGMENT_TREE_PRACTICE_PROBLEMS } from "./segment-tree-practice-problems";
import { FENWICK_TREE_PROBLEMS as FENWICK_TREE_BASE } from "./fenwick-tree-problems";
import { FENWICK_TREE_PRACTICE_PROBLEMS } from "./fenwick-tree-practice-problems";
import { SPARSE_TABLE_LCA_PROBLEMS as SPARSE_TABLE_LCA_BASE } from "./sparse-table-lca-problems";
import { SPARSE_TABLE_LCA_PRACTICE_PROBLEMS } from "./sparse-table-lca-practice-problems";
import { HLD_PROBLEMS as HLD_BASE } from "./hld-problems-final";
import { HLD_PRACTICE_PROBLEMS } from "./hld-practice-problems";

export const TRIE_PROBLEMS: SeedProblem[] = [
  ...TRIE_BASE,
  ...TRIE_PRACTICE_PROBLEMS,
];

export const SEGMENT_TREE_PROBLEMS: SeedProblem[] = [
  ...SEGMENT_TREE_BASE,
  ...SEGMENT_TREE_PRACTICE_PROBLEMS,
];

export const FENWICK_TREE_PROBLEMS: SeedProblem[] = [
  ...FENWICK_TREE_BASE,
  ...FENWICK_TREE_PRACTICE_PROBLEMS,
];

export const SPARSE_TABLE_LCA_PROBLEMS: SeedProblem[] = [
  ...SPARSE_TABLE_LCA_BASE,
  ...SPARSE_TABLE_LCA_PRACTICE_PROBLEMS,
];

export const HLD_PROBLEMS: SeedProblem[] = [
  ...HLD_BASE,
  ...HLD_PRACTICE_PROBLEMS,
];
