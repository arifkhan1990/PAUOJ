import { describe, expect, it } from "vitest";
import { PgDialect } from "drizzle-orm/pg-core";
import {
  bucketIndexOf,
  buildDistribution,
  buildSubmissionAnalysis,
  canAnalyzeSubmission,
  comparableSubmissionCondition,
  computeBeats,
  countBuckets,
  medianOfSorted,
  selectBucketWidth,
  type SampleRow,
} from "./submission-analysis";

const dialect = new PgDialect();

function row(runtimeMs: number | null, memoryKb: number | null): SampleRow {
  return { runtimeMs, memoryKb };
}

describe("selectBucketWidth", () => {
  it("picks the smallest 1/2/5 step covering the domain", () => {
    expect(selectBucketWidth(0)).toBe(1);
    expect(selectBucketWidth(24)).toBe(1);
    expect(selectBucketWidth(100)).toBe(5);
    expect(selectBucketWidth(241)).toBe(20);
    expect(selectBucketWidth(500)).toBe(50);
    expect(selectBucketWidth(1000)).toBe(50);
  });
});

describe("countBuckets", () => {
  it("covers the max value and caps at 24 buckets", () => {
    expect(countBuckets(0, 1)).toBe(1);
    expect(countBuckets(50, 5)).toBe(11);
    expect(countBuckets(240, 10)).toBe(24);
  });
});

describe("bucketIndexOf", () => {
  it("maps values to their bucket and clamps into the last bucket", () => {
    expect(bucketIndexOf(0, 5, 11)).toBe(0);
    expect(bucketIndexOf(30, 5, 11)).toBe(6);
    expect(bucketIndexOf(49, 5, 11)).toBe(9);
    expect(bucketIndexOf(999, 5, 11)).toBe(10);
  });
});

describe("medianOfSorted", () => {
  it("returns the middle value or rounds the average of two middles", () => {
    expect(medianOfSorted([])).toBeNull();
    expect(medianOfSorted([10, 20, 30])).toBe(20);
    expect(medianOfSorted([10, 20, 30, 40])).toBe(25);
    expect(medianOfSorted([10, 21, 30, 40])).toBe(26);
  });
});

describe("buildDistribution", () => {
  it("builds buckets, shares, the current bucket and summary stats", () => {
    const { buckets, median, best } = buildDistribution(
      [10, 20, 30, 40, 50],
      30,
    );

    expect(buckets).toHaveLength(11);
    expect(buckets[0]).toMatchObject({ min: 0, max: 5, count: 0 });
    expect(buckets[2]).toMatchObject({ min: 10, max: 15, count: 1 });
    expect(buckets[10]).toMatchObject({ min: 50, max: null, count: 1 });
    expect(buckets.filter((bucket) => bucket.current)).toHaveLength(1);
    expect(buckets[6]).toMatchObject({ min: 30, max: 35, current: true });
    expect(
      buckets.reduce((sum, bucket) => sum + bucket.share, 0),
    ).toBeCloseTo(100, 5);
    expect(median).toBe(30);
    expect(best).toBe(10);
  });

  it("returns empty buckets and null stats for an empty sample", () => {
    expect(buildDistribution([], null)).toEqual({
      buckets: [],
      median: null,
      best: null,
    });
  });

  it("maps a value above the sample maximum into the open last bucket", () => {
    const { buckets } = buildDistribution([10, 20, 30, 40, 50], 999);
    const current = buckets.filter((bucket) => bucket.current);

    expect(current).toHaveLength(1);
    expect(current[0]?.max).toBeNull();
  });
});

describe("computeBeats", () => {
  it("counts only strictly slower runs", () => {
    expect(computeBeats(30, [10, 20, 30, 40, 50])).toBe(40);
    expect(computeBeats(20, [20, 20, 20, 20, 20])).toBe(0);
  });

  it("rounds the percentage to two decimals", () => {
    expect(computeBeats(0, [0, 0, 0, 0, 0, 0, 1])).toBe(14.29);
  });

  it("returns null for a small sample or a missing value", () => {
    expect(computeBeats(10, [10, 20, 30, 40])).toBeNull();
    expect(computeBeats(null, [10, 20, 30, 40, 50])).toBeNull();
  });
});

describe("buildSubmissionAnalysis", () => {
  it("uses the language sample when both metrics have enough runs", () => {
    const languageRows = [
      row(10, 100),
      row(20, 200),
      row(30, 300),
      row(40, 400),
      row(50, 500),
    ];

    const analysis = buildSubmissionAnalysis(
      { runtimeMs: 30, memoryKb: 300 },
      languageRows,
      null,
    );

    expect(analysis.runtime.scope).toBe("language");
    expect(analysis.runtime.sampleSize).toBe(5);
    expect(analysis.runtime.beats).toBe(40);
    expect(analysis.memory.scope).toBe("language");
    expect(analysis.memory.sampleSize).toBe(5);
    expect(analysis.memory.beats).toBe(40);
  });

  it("falls back to all languages per metric when the sample is small", () => {
    const languageRows = [row(10, null), row(20, null), row(30, null)];
    const fallbackRows = [
      row(10, 100),
      row(20, 200),
      row(30, 300),
      row(40, 400),
      row(50, 500),
      row(60, 600),
    ];

    const analysis = buildSubmissionAnalysis(
      { runtimeMs: 30, memoryKb: 300 },
      languageRows,
      fallbackRows,
    );

    expect(analysis.runtime.scope).toBe("all");
    expect(analysis.runtime.sampleSize).toBe(6);
    expect(analysis.memory.scope).toBe("all");
    expect(analysis.memory.sampleSize).toBe(6);
  });

  it("keeps language scope for a metric that has enough runs", () => {
    const languageRows = [
      row(10, null),
      row(20, null),
      row(30, null),
      row(40, null),
      row(50, null),
    ];
    const fallbackRows = [
      row(10, 100),
      row(20, 200),
      row(30, 300),
      row(40, 400),
      row(50, 500),
    ];

    const analysis = buildSubmissionAnalysis(
      { runtimeMs: 30, memoryKb: 300 },
      languageRows,
      fallbackRows,
    );

    expect(analysis.runtime.scope).toBe("language");
    expect(analysis.memory.scope).toBe("all");
    expect(analysis.memory.sampleSize).toBe(5);
  });

  it("keeps sample stats but drops beats for a missing metric", () => {
    const languageRows = [
      row(10, 100),
      row(20, 200),
      row(30, 300),
      row(40, 400),
      row(50, 500),
    ];

    const analysis = buildSubmissionAnalysis(
      { runtimeMs: null, memoryKb: 300 },
      languageRows,
      null,
    );

    expect(analysis.runtime.value).toBeNull();
    expect(analysis.runtime.beats).toBeNull();
    expect(analysis.runtime.sampleSize).toBe(5);
    expect(analysis.runtime.median).toBe(30);
  });
});

describe("comparableSubmissionCondition", () => {
  it("excludes assessments and virtual contests from the sample", () => {
    const rendered = dialect.sqlToQuery(
      comparableSubmissionCondition("p-1"),
    ).sql;

    expect(rendered).toContain('"submissions"."problem_id" = $1');
    expect(rendered).toContain('"submissions"."status" = $2');
    expect(rendered).toContain('"submissions"."assessment_id" is null');
    expect(rendered).toContain('"submissions"."virtual_contest_id" is null');
  });
});

describe("canAnalyzeSubmission", () => {
  const base = {
    status: "ACCEPTED",
    runtimeMs: 12,
    memoryKb: 19_000,
    assessmentId: null,
    contestEndAt: null,
  };

  it("accepts a settled practice run with metrics", () => {
    expect(canAnalyzeSubmission(base)).toBe(true);
  });

  it("rejects non-accepted, assessment and metric-less runs", () => {
    expect(canAnalyzeSubmission({ ...base, status: "WRONG_ANSWER" })).toBe(false);
    expect(canAnalyzeSubmission({ ...base, assessmentId: "a-1" })).toBe(false);
    expect(
      canAnalyzeSubmission({ ...base, runtimeMs: null, memoryKb: null }),
    ).toBe(false);
  });

  it("hides analysis while its contest is still running", () => {
    const now = Date.parse("2026-11-24T12:00:00Z");
    expect(
      canAnalyzeSubmission(
        { ...base, contestEndAt: new Date("2026-11-24T12:00:01Z") },
        now,
      ),
    ).toBe(false);
    expect(
      canAnalyzeSubmission(
        { ...base, contestEndAt: new Date("2026-11-24T11:59:59Z") },
        now,
      ),
    ).toBe(true);
  });
});
