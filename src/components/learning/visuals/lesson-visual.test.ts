import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type {
  LessonVisualConfig,
  LessonVisualKind,
} from "@/lib/learning/visual-types";
import { LessonVisual } from "./lesson-visual";

const STEPS = [
  { label: "প্রথম ধাপ", note: "একটা ছোট ব্যাখ্যা" },
  { label: "দ্বিতীয় ধাপ" },
  { label: "তৃতীয় ধাপ" },
];

const samples: Record<LessonVisualKind, LessonVisualConfig> = {
  flow: {
    kind: "flow",
    title: "ফ্লো",
    caption: "ধাপে ধাপে এগোয়।",
    steps: STEPS,
    data: { labels: ["শুরু", "শর্ত", "শেষ"] },
  },
  complexity: {
    kind: "complexity",
    title: "কমপ্লেক্সিটি",
    caption: "বৃদ্ধির হার।",
    steps: STEPS,
    data: { labels: ["O(1)", "O(n)", "O(n²)"] },
  },
  bits: {
    kind: "bits",
    title: "বিট",
    caption: "বিটের সারি।",
    steps: STEPS,
    data: { values: [13, 7], labels: ["1101", "0111"] },
  },
  array: {
    kind: "array",
    title: "অ্যারে",
    caption: "ঘরে ঘরে মান।",
    steps: STEPS,
    data: { values: [3, 8, 1, 6, 4], variant: "window" },
  },
  stack: {
    kind: "stack",
    title: "স্ট্যাক",
    caption: "শেষে ঢুকলে আগে বেরোয়।",
    steps: STEPS,
    data: { values: [3, 7] },
  },
  linked: {
    kind: "linked",
    title: "লিংকড",
    caption: "পয়েন্টারের শৃঙ্খল।",
    steps: STEPS,
    data: { values: [10, 20, 30] },
  },
  hash: {
    kind: "hash",
    title: "হ্যাশ",
    caption: "মান থেকে ঘর।",
    steps: STEPS,
    data: { values: [12, 25, 37], labels: ["0", "1", "2", "3"] },
  },
  sort: {
    kind: "sort",
    title: "সাজানো",
    caption: "ছোট থেকে বড়।",
    steps: STEPS,
    data: { values: [5, 2, 9, 1] },
  },
  tree: {
    kind: "tree",
    title: "ট্রি",
    caption: "শিকড় থেকে পাতা।",
    steps: STEPS,
    data: { labels: ["8", "4", "12", "2", "6"], edges: [[0, 1], [0, 2], [1, 3], [1, 4]] },
  },
  graph: {
    kind: "graph",
    title: "গ্রাফ",
    caption: "নোড আর এজ।",
    steps: STEPS,
    data: {
      labels: ["A", "B", "C", "D"],
      edges: [[0, 1], [1, 2], [2, 3], [0, 3]],
      variant: "bfs",
    },
  },
  dp: {
    kind: "dp",
    title: "ডিপি",
    caption: "ছোট উত্তর থেকে বড় উত্তর।",
    steps: STEPS,
    data: { values: [1, 1, 2, 3, 5, 8], variant: "grid" },
  },
  string: {
    kind: "string",
    title: "স্ট্রিং",
    caption: "প্যাটার্ন মেলানো।",
    steps: STEPS,
    data: { labels: ["ABABDABACD", "ABABC"], variant: "kmp" },
  },
  sql: {
    kind: "sql",
    title: "SQL",
    caption: "টেবিল থেকে ফল।",
    steps: STEPS,
    data: { labels: ["orders", "users"], variant: "join" },
  },
  git: {
    kind: "git",
    title: "গিট",
    caption: "কমিটের ইতিহাস।",
    steps: STEPS,
    data: { labels: ["docs", "fix", "feature"], variant: "merge" },
  },
  docker: {
    kind: "docker",
    title: "ডকার",
    caption: "লেয়ারের স্তূপ।",
    steps: STEPS,
    data: { labels: ["FROM", "COPY", "RUN", "CMD"], variant: "cache", values: [2] },
  },
  pipeline: {
    kind: "pipeline",
    title: "পাইপলাইন",
    caption: "জব থেকে ডিপ্লয়।",
    steps: STEPS,
    data: { labels: ["lint", "test", "build", "deploy"], variant: "gate" },
  },
};

describe("lesson visual registry", () => {
  for (const kind of Object.keys(samples) as LessonVisualKind[]) {
    it(`renders the ${kind} visual with accessible steps`, () => {
      const html = renderToStaticMarkup(
        createElement(LessonVisual, { config: samples[kind] }),
      );
      expect(html).toContain(`data-visual-kind="${kind}"`);
      expect(html).toContain("Concept visual");
      expect(html).toContain(STEPS[0].label);
      expect(html).toContain("গতি কমালে স্থির");
      expect(html).toMatch(/lv-(pop|sweep|blink|draw|rise|glow)|animate-/);
    });
  }

  it("returns null for an unknown kind", () => {
    const html = renderToStaticMarkup(
      createElement(LessonVisual, {
        config: { ...samples.flow, kind: "unknown" as LessonVisualKind },
      }),
    );
    expect(html).toBe("");
  });
});
