import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type {
  SubmissionAnalysis,
  SubmissionMetricAnalysis,
} from "@/lib/submission-types";
import { SubmissionAnalysisBlock } from "./submission-analysis";

const runtime: SubmissionMetricAnalysis = {
  value: 40,
  beats: 62.4,
  sampleSize: 182,
  scope: "language",
  median: 55,
  best: 12,
  buckets: [
    { min: 0, max: 20, count: 24, share: 13.2, current: false },
    { min: 20, max: 40, count: 61, share: 33.5, current: false },
    { min: 40, max: 60, count: 72, share: 39.6, current: true },
    { min: 60, max: null, count: 25, share: 13.7, current: false },
  ],
};

const memory: SubmissionMetricAnalysis = {
  value: 15_360,
  beats: 91,
  sampleSize: 182,
  scope: "all",
  median: 18_432,
  best: 8_192,
  buckets: [
    { min: 0, max: 16_384, count: 98, share: 53.8, current: true },
    { min: 16_384, max: null, count: 84, share: 46.2, current: false },
  ],
};

const analysis: SubmissionAnalysis = { runtime, memory };

function render(value: SubmissionAnalysis) {
  return renderToStaticMarkup(
    createElement(SubmissionAnalysisBlock, {
      analysis: value,
      languageLabel: "Python 3.11",
    }),
  );
}

function text(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

describe("SubmissionAnalysisBlock", () => {
  it("shows runtime and memory with their beats percentages", () => {
    const plain = text(render(analysis));

    expect(plain).toContain("Runtime");
    expect(plain).toContain("40 ms");
    expect(plain).toContain("Beats 62.4%");
    expect(plain).toContain("Memory");
    expect(plain).toContain("15.0 MB");
    expect(plain).toContain("Beats 91.0%");
  });

  it("names the comparison scope for each metric", () => {
    const plain = text(render(analysis));

    expect(plain).toContain("vs accepted Python 3.11 runs on this problem");
    expect(plain).toContain("vs accepted runs in all languages");
  });

  it("falls back to an honest sample note when beats are unavailable", () => {
    const plain = text(
      render({
        runtime: { ...runtime, beats: null },
        memory: { ...memory, beats: null },
      }),
    );

    expect(plain).toContain("Not enough data yet");
    expect(plain).not.toContain("Beats");
  });

  it("summarizes fastest, median and sample size", () => {
    const plain = text(render(analysis));

    expect(plain).toContain("Fastest");
    expect(plain).toContain("12 ms");
    expect(plain).toContain("Median");
    expect(plain).toContain("55 ms");
    expect(plain).toContain("Accepted runs");
    expect(plain).toContain("182");
  });

  it("renders an empty distribution state without fake buckets", () => {
    const html = render({
      runtime: {
        ...runtime,
        beats: null,
        value: null,
        buckets: [],
        sampleSize: 0,
        median: null,
        best: null,
      },
      memory: { ...memory, beats: null },
    });
    const plain = text(html);

    expect(plain).toContain("Runtime distribution");
    expect(plain).toContain(
      "We compare only accepted runs on this problem.",
    );
    expect(plain).not.toContain("Fastest");
    expect(html).not.toContain("recharts-responsive-container");
  });
});
