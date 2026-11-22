/**
 * Lightweight route index for the proxy. Keeping concept notes out of this file
 * avoids pulling the whole curriculum content into the request boundary.
 * `routes.test.ts` keeps it in sync with LEARNING_MODULES.
 */
export const LEARNING_ROUTE_SLUGS: Record<string, string[]> = {
  "basic-programming-math": [
    "io-loops-conditionals",
    "complexity",
    "basic-math",
    "bit-manipulation",
    "strings-arrays",
  ],
  "basic-data-structures": [
    "stack-queue",
    "linked-list",
    "hashing",
    "stl-collections",
  ],
  "basic-intermediate-algorithms": [
    "sorting-searching",
    "two-pointers-sliding-window",
    "prefix-sum-difference",
    "recursion-backtracking",
    "greedy",
  ],
  "trees-graphs": [
    "binary-trees-bst",
    "tree-traversals",
    "heaps-priority-queues",
    "graph-traversal",
    "shortest-paths",
    "mst-dsu",
  ],
  "dynamic-programming": [
    "dp-introduction",
    "grid-dp",
    "knapsack",
    "lcs-lis",
    "tree-bitmask-dp",
  ],
  "advanced-data-structures": [
    "trie",
    "segment-tree",
    "fenwick-tree",
    "sparse-table-lca",
    "hld",
  ],
  "advanced-algorithms": [
    "string-matching",
    "network-flow",
    "advanced-number-theory",
    "game-theory",
  ],
};

export function isLearningRoute(
  moduleSlug: string,
  topicSlug?: string,
): boolean {
  const topics = LEARNING_ROUTE_SLUGS[moduleSlug];
  if (!topics) return false;
  return topicSlug ? topics.includes(topicSlug) : true;
}
