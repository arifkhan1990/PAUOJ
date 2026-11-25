import { and, eq, isNull, isNotNull, or, type SQL } from "drizzle-orm";
import type {
  SubmissionAnalysis,
  SubmissionBucket,
  SubmissionMetricAnalysis,
} from "@/lib/submission-types";
import { getDb } from "@/server/db";
import { contests, submissions } from "@/server/db/schema";

/** Fewer comparable runs than this and percentile comparisons are meaningless. */
export const MIN_SAMPLE_SIZE = 5;

/** Upper bound on the distribution buckets so the chart stays readable. */
export const MAX_BUCKETS = 24;

const NICE_STEPS = [1, 2, 5] as const;

export type SampleRow = {
  runtimeMs: number | null;
  memoryKb: number | null;
};

export type MetricKey = "runtimeMs" | "memoryKb";

export type MetricDistribution = {
  buckets: SubmissionBucket[];
  median: number | null;
  best: number | null;
};

export type SubmissionMetrics = {
  runtimeMs: number | null;
  memoryKb: number | null;
};

/**
 * Comparable sample for a problem: accepted runs only, no invigilated
 * assessments and no virtual contests. Contest submissions stay comparable.
 */
export function comparableSubmissionCondition(problemId: string): SQL {
  return and(
    eq(submissions.problemId, problemId),
    eq(submissions.status, "ACCEPTED"),
    isNull(submissions.assessmentId),
    isNull(submissions.virtualContestId),
    or(
      isNotNull(submissions.runtimeMs),
      isNotNull(submissions.memoryKb),
    ),
  )!;
}

function roundTo(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

/**
 * Smallest 1/2/5 × 10^n width that yields at most `MAX_BUCKETS` buckets over
 * the largest sample value (domain starts at 0).
 */
export function selectBucketWidth(maxValue: number): number {
  const target = Math.max(1, Math.ceil(maxValue / MAX_BUCKETS));
  let magnitude = 1;
  for (;;) {
    for (const step of NICE_STEPS) {
      const width = step * magnitude;
      if (width >= target) return width;
    }
    magnitude *= 10;
  }
}

/** Number of buckets needed to cover `maxValue`, capped at `MAX_BUCKETS`. */
export function countBuckets(maxValue: number, width: number): number {
  return Math.min(
    MAX_BUCKETS,
    Math.max(1, Math.ceil((maxValue + 1) / width)),
  );
}

/** Bucket that holds a value; the last bucket is open ended. */
export function bucketIndexOf(
  value: number,
  width: number,
  bucketCount: number,
): number {
  return Math.min(
    Math.max(0, Math.floor(value / width)),
    bucketCount - 1,
  );
}

/** Middle value; even counts average the two middles and round to an integer. */
export function medianOfSorted(sorted: number[]): number | null {
  if (sorted.length === 0) return null;
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[middle] ?? null;
  const low = sorted[middle - 1];
  const high = sorted[middle];
  if (low === undefined || high === undefined) return null;
  return Math.round((low + high) / 2);
}

/**
 * Build the per-metric histogram and summary stats. `currentValue` marks the
 * bucket holding the analysed run; it may be absent from the sample (for
 * example an assessment run) but still maps into the sample domain.
 */
export function buildDistribution(
  sample: number[],
  currentValue: number | null,
): MetricDistribution {
  if (sample.length === 0) {
    return { buckets: [], median: null, best: null };
  }

  const maxValue = sample.reduce((max, value) => Math.max(max, value), 0);
  const width = selectBucketWidth(maxValue);
  const bucketCount = countBuckets(maxValue, width);
  const counts = new Array<number>(bucketCount).fill(0);
  for (const value of sample) {
    const index = bucketIndexOf(value, width, bucketCount);
    counts[index] = (counts[index] ?? 0) + 1;
  }

  const currentIndex =
    currentValue === null
      ? -1
      : bucketIndexOf(currentValue, width, bucketCount);

  const buckets: SubmissionBucket[] = counts.map((count, index) => ({
    min: index * width,
    max: index === bucketCount - 1 ? null : (index + 1) * width,
    count,
    share: roundTo((count / sample.length) * 100, 1),
    current: index === currentIndex,
  }));

  const sorted = [...sample].sort((a, b) => a - b);
  return {
    buckets,
    median: medianOfSorted(sorted),
    best: sorted[0] ?? null,
  };
}

/**
 * Percentage of the sample the run beats. Lower is better for both metrics,
 * so ties are not counted as beaten.
 */
export function computeBeats(
  value: number | null,
  sample: number[],
): number | null {
  if (value === null || sample.length < MIN_SAMPLE_SIZE) return null;
  const beaten = sample.reduce(
    (total, candidate) => total + (candidate > value ? 1 : 0),
    0,
  );
  return roundTo((beaten / sample.length) * 100, 2);
}

export function metricValues(
  rows: SampleRow[],
  metric: MetricKey,
): number[] {
  return rows
    .map((row) => row[metric])
    .filter((value): value is number => value !== null);
}

function analyzeMetric(
  metric: MetricKey,
  submission: SubmissionMetrics,
  languageRows: SampleRow[],
  fallbackRows: SampleRow[] | null,
): SubmissionMetricAnalysis {
  const value = submission[metric];
  const languageSample = metricValues(languageRows, metric);
  const useLanguage = languageSample.length >= MIN_SAMPLE_SIZE;
  const sample = useLanguage
    ? languageSample
    : metricValues(fallbackRows ?? [], metric);
  const distribution = buildDistribution(sample, value);

  return {
    value,
    beats: computeBeats(value, sample),
    sampleSize: sample.length,
    scope: useLanguage ? "language" : "all",
    buckets: distribution.buckets,
    median: distribution.median,
    best: distribution.best,
  };
}

/**
 * Pure assembly of the analysis payload. `fallbackRows` is only consulted for
 * a metric whose language sample is too small, which mirrors the service's
 * single fallback query.
 */
export function buildSubmissionAnalysis(
  submission: SubmissionMetrics,
  languageRows: SampleRow[],
  fallbackRows: SampleRow[] | null,
): SubmissionAnalysis {
  return {
    runtime: analyzeMetric("runtimeMs", submission, languageRows, fallbackRows),
    memory: analyzeMetric("memoryKb", submission, languageRows, fallbackRows),
  };
}

async function loadSample(
  problemId: string,
  language?: (typeof submissions.$inferSelect)["language"],
): Promise<SampleRow[]> {
  const condition = comparableSubmissionCondition(problemId);
  const where =
    language === undefined
      ? condition
      : and(condition, eq(submissions.language, language));

  return getDb()
    .select({
      runtimeMs: submissions.runtimeMs,
      memoryKb: submissions.memoryKb,
    })
    .from(submissions)
    .where(where);
}

/** Analysis is only meaningful for settled, non-invigilated accepted runs. */
export function canAnalyzeSubmission(
  row: {
    status: string;
    runtimeMs: number | null;
    memoryKb: number | null;
    assessmentId: string | null;
    contestEndAt: Date | null;
  },
  now = Date.now(),
): boolean {
  if (row.status !== "ACCEPTED") return false;
  if (row.assessmentId !== null) return false;
  if (row.runtimeMs === null && row.memoryKb === null) return false;
  return !(row.contestEndAt && row.contestEndAt.getTime() > now);
}

/**
 * Runtime and memory distribution for one accepted submission. Returns null
 * when the submission is missing, not accepted, has no metrics, belongs to an
 * assessment, or sits in a contest that is still running — analysis is only
 * shown for practice and settled rounds, never during a live competition.
 */
export async function getSubmissionAnalysis(
  submissionId: string,
): Promise<SubmissionAnalysis | null> {
  const [row] = await getDb()
    .select({
      problemId: submissions.problemId,
      status: submissions.status,
      language: submissions.language,
      runtimeMs: submissions.runtimeMs,
      memoryKb: submissions.memoryKb,
      assessmentId: submissions.assessmentId,
      contestEndAt: contests.endAt,
    })
    .from(submissions)
    .leftJoin(contests, eq(contests.id, submissions.contestId))
    .where(eq(submissions.id, submissionId))
    .limit(1);

  if (!row || !canAnalyzeSubmission(row)) return null;

  const languageRows = await loadSample(row.problemId, row.language);
  const needsFallback =
    metricValues(languageRows, "runtimeMs").length < MIN_SAMPLE_SIZE ||
    metricValues(languageRows, "memoryKb").length < MIN_SAMPLE_SIZE;
  const fallbackRows = needsFallback
    ? await loadSample(row.problemId)
    : null;

  return buildSubmissionAnalysis(
    { runtimeMs: row.runtimeMs, memoryKb: row.memoryKb },
    languageRows,
    fallbackRows,
  );
}
