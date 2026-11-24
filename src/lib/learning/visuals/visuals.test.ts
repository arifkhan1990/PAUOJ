import { describe, expect, it } from "vitest";
import type {
  LessonVisualConfig,
  LessonVisualKind,
} from "@/lib/learning/visual-types";
import { LEARNING_MODULES } from "@/lib/learning/modules";
import { LESSON_VISUALS, getLessonVisual } from "./index";

const KINDS = new Set<LessonVisualKind>([
  "flow",
  "complexity",
  "bits",
  "array",
  "stack",
  "linked",
  "hash",
  "sort",
  "tree",
  "graph",
  "dp",
  "string",
  "sql",
  "git",
  "docker",
  "pipeline",
]);

const FORBIDDEN_COPY = [
  "আপনি",
  "আপনার",
  "আপনাকে",
  "তুই",
  "তোর",
  "তোকে",
  "লেখা হচ্ছে",
  "placeholder",
  "TODO",
];

const HONORIFIC_IMPERATIVE =
  /(^|[\s।,;:!?])(করুন|নিন|বলুন|দেখুন|রাখুন|লিখুন|পড়ুন|বুঝুন|শুনুন|ভাবুন|ছাড়ুন|তুলুন|ফেলুন|বসান|ঢোকান|বাড়ান|মেলান|পাঠান|নামুন|মানুন|চলুন|ধরুন|গুনুন|খুঁজুন|উত্তর দিন)(?=$|[\s।,;:!?])/;

function expectCopy(text: string, key: string) {
  for (const phrase of FORBIDDEN_COPY) {
    expect(text, `${key}: forbidden "${phrase}"`).not.toContain(phrase);
  }
  expect(text, `${key}: honorific imperative`).not.toMatch(
    HONORIFIC_IMPERATIVE,
  );
  expect(text, `${key}: double space`).not.toMatch(/ {2,}/);
  expect(text, `${key}: space before punctuation`).not.toMatch(
    /[ \t]+[।,;:]/,
  );
}

function liveTopics() {
  return LEARNING_MODULES.filter((module) => module.status === "LIVE").flatMap(
    (module) =>
      module.topics.map((topic) => ({
        key: `${module.slug}/${topic.slug}`,
        topic,
      })),
  );
}

function expectValidConfig(key: string, config: LessonVisualConfig) {
  expect(KINDS.has(config.kind), `${key}: unknown kind ${config.kind}`).toBe(true);
  expect(config.title.trim(), `${key}: title`).not.toBe("");
  expect(config.caption.trim(), `${key}: caption`).not.toBe("");
  expect(config.steps.length, `${key}: step count`).toBeGreaterThanOrEqual(3);
  expect(config.steps.length, `${key}: step count`).toBeLessThanOrEqual(6);
  expectCopy(config.title, `${key}: title`);
  expectCopy(config.caption, `${key}: caption`);
  for (const step of config.steps) {
    expect(step.label.trim(), `${key}: empty step`).not.toBe("");
    expectCopy(step.label, `${key}: step`);
    if (step.note) expectCopy(step.note, `${key}: step note`);
  }

  if (config.kind === "tree" || config.kind === "graph") {
    const labels = config.data?.labels ?? [];
    const edges = config.data?.edges ?? [];
    expect(labels.length, `${key}: node labels`).toBeGreaterThanOrEqual(3);
    for (const [from, to] of edges) {
      expect(from, `${key}: edge source`).toBeGreaterThanOrEqual(0);
      expect(to, `${key}: edge target`).toBeGreaterThanOrEqual(0);
      expect(from, `${key}: edge source bound`).toBeLessThan(labels.length);
      expect(to, `${key}: edge target bound`).toBeLessThan(labels.length);
      expect(from, `${key}: self edge`).not.toBe(to);
    }
  }

  if (config.kind === "array" || config.kind === "stack" || config.kind === "sort") {
    expect(
      (config.data?.values ?? []).length,
      `${key}: values`,
    ).toBeGreaterThanOrEqual(2);
  }
}

describe("lesson visual coverage", () => {
  it("maps every live topic and nothing else", () => {
    const expected = new Set(liveTopics().map((entry) => entry.key));
    expect(new Set(Object.keys(LESSON_VISUALS))).toEqual(expected);
  });

  it("ships a valid config for every live topic", () => {
    for (const entry of liveTopics()) {
      const config = getLessonVisual(
        entry.key.split("/")[0] ?? "",
        entry.key.split("/")[1] ?? "",
      );
      expect(config, `${entry.key}: missing visual`).not.toBeNull();
      if (config) expectValidConfig(entry.key, config);
    }
  });

  it("returns null for an unknown topic", () => {
    expect(getLessonVisual("not-a-module", "not-a-topic")).toBeNull();
  });
});
