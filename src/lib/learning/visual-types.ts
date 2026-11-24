/**
 * Data contract for the lesson visual explainers.
 *
 * A topic points at one config through `src/lib/learning/visuals`; the config
 * only carries labels and small teaching data, never JSX. This keeps the
 * curriculum metadata server-safe and lets every visual use the same
 * accessible frame and reduced-motion rules.
 */
export type LessonVisualKind =
  | "flow"
  | "complexity"
  | "bits"
  | "array"
  | "stack"
  | "linked"
  | "hash"
  | "sort"
  | "tree"
  | "graph"
  | "dp"
  | "string"
  | "sql"
  | "git"
  | "docker"
  | "pipeline";

export type LessonVisualStep = {
  /** Short imperative idea, e.g. "শর্ত চেক" or "mid খুঁজে বের করো". */
  label: string;
  /** Optional one-line clarification. */
  note?: string;
};

export type LessonVisualData = {
  /** Small integer sequence for arrays, stacks, DP rows or bar charts. */
  values?: number[];
  /** Short text labels: node names, table names, layer names, job names. */
  labels?: string[];
  /** Graph/tree edges as indexes into `labels`. */
  edges?: Array<[number, number]>;
  /**
   * Optional semantic mode for a primitive, e.g. "window", "prefix",
   * "bfs", "dfs", "knapsack", "lcs", "kmp", "join", "window".
   */
  variant?: string;
};

export type LessonVisualConfig = {
  kind: LessonVisualKind;
  /** Bangla headline shown inside the visual card. */
  title: string;
  /** One-sentence Bangla takeaway. */
  caption: string;
  /** Three to six ordered ideas; also rendered as a screen-reader list. */
  steps: LessonVisualStep[];
  data?: LessonVisualData;
};
