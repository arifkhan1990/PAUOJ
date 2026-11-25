import "dotenv/config";
import { Worker, type Job } from "bullmq";
import { closeDb } from "@/server/db";
import { getEnv } from "@/server/env";
import { checkDocker, hasImage } from "@/server/judge/docker";
import { runJudge } from "@/server/judge/engine";
import {
  JUDGE_QUEUE,
  enqueueSubmission,
  type JudgeJobData,
  type RunJob,
  type SubmissionJob,
} from "@/server/judge/queue";
import {
  claimSubmission,
  completeSubmission,
  failSubmission,
  recoverStaleSubmissions,
} from "@/server/judge/submission-runner";
import type { JudgeOutcome } from "@/server/judge/types";
import { logger } from "@/server/logger";
import { closeRedis, getRedis } from "@/server/redis";
import { clearWorkerHeartbeat, recordWorkerHeartbeat } from "@/server/worker-heartbeat";
import { updateRun } from "@/server/services/runs";
import { ensureMonthlyContestSeries } from "@/server/services/contest-series";
import { notifyStartingContests } from "@/server/services/notifications";
import { finalizeDueContestRatings } from "@/server/services/rating-sweep";
import {
  acquireRatingSweepLock,
  ratingSweepLockValue,
  releaseRatingSweepLock,
} from "@/server/services/rating-sweep-lock";
import { sendReviewDigests } from "@/server/services/review-digest";
import { notifyOverdueReviews } from "@/server/services/review-sla";
import { sendWeeklyReviewReport } from "@/server/services/review-sla-report";
import {
  SOCIAL_REPORT_DIGEST_INTERVAL_MS,
  sendSocialReportDigest,
} from "@/server/services/social-report-digest";
import { runSocialRetention } from "@/server/services/social-retention";

async function handleSubmission(job: SubmissionJob): Promise<void> {
  const submission = await claimSubmission(job.submissionId);
  if (!submission) {
    logger.info("Submission already claimed or missing", {
      submissionId: job.submissionId,
    });
    return;
  }
  if (submission.tests.length === 0) {
    await failSubmission(
      submission,
      "This problem has no tests configured.",
    );
    return;
  }

  let outcome: JudgeOutcome;
  try {
    outcome = await runJudge({
      language: submission.language,
      source: submission.sourceCode,
      timeLimitMs: submission.timeLimitMs,
      memoryLimitMb: submission.memoryLimitMb,
      tests: submission.tests,
      checker: {
        type: submission.checkerType,
        source: submission.checkerSource,
        floatTolerance: submission.floatTolerance,
      },
      mode: "submission",
      sqlScript: submission.sqlScript,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown judge failure";
    logger.error("Submission judge failed", {
      submissionId: submission.id,
      error: message,
    });
    await failSubmission(submission, message);
    return;
  }

  await completeSubmission(submission, outcome);
  logger.info("Submission judged", {
    submissionId: submission.id,
    status: outcome.status,
    passed: outcome.passedTests,
    total: outcome.totalTests,
  });
}

async function handleRun(job: RunJob): Promise<void> {
  await updateRun(job.userId, job.runId, { status: "JUDGING" });
  try {
    const outcome = await runJudge({
      language: job.language,
      source: job.source,
      timeLimitMs: job.timeLimitMs,
      memoryLimitMb: job.memoryLimitMb,
      tests: [
        {
          id: "run",
          position: 1,
          input: job.stdin,
          expectedOutput: null,
          isSample: false,
        },
      ],
      checker: { type: "EXACT", source: null, floatTolerance: 0.000001 },
      mode: "run",
      sqlScript: job.sqlScript,
    });
    await updateRun(job.userId, job.runId, {
      status: outcome.status,
      stdout: outcome.runStdout,
      stderr: outcome.runStderr,
      compileOutput: outcome.compileOutput ?? "",
      runtimeMs: outcome.runtimeMs,
      memoryKb: outcome.memoryKb,
      finished: true,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Judge is unavailable.";
    logger.error("Run judge failed", { runId: job.runId, error: message });
    await updateRun(job.userId, job.runId, {
      status: "SYSTEM_ERROR",
      stderr: message,
      finished: true,
    });
  }
}

async function processJob(job: Job<JudgeJobData>): Promise<void> {
  if (job.data.kind === "submission") {
    await handleSubmission(job.data);
    return;
  }
  await handleRun(job.data);
}

async function main(): Promise<void> {
  const env = getEnv();
  const dockerVersion = await checkDocker();
  if (!(await hasImage(env.JUDGE_IMAGE))) {
    throw new Error(
      `Judge image "${env.JUDGE_IMAGE}" not found. Build it with: docker build -t ${env.JUDGE_IMAGE} judge`,
    );
  }
  if (!(await hasImage(env.JUDGE_SWIFT_IMAGE))) {
    logger.warn("Swift judge image is missing; Swift submissions will fail", {
      image: env.JUDGE_SWIFT_IMAGE,
    });
  }
  logger.info("Judge worker starting", {
    docker: dockerVersion,
    image: env.JUDGE_IMAGE,
    concurrency: env.JUDGE_CONCURRENCY,
  });

  const recovered = await recoverStaleSubmissions();
  for (const submissionId of recovered) {
    await enqueueSubmission(submissionId);
  }
  if (recovered.length > 0) {
    logger.warn("Requeued stale submissions", { count: recovered.length });
  }

  const worker = new Worker<JudgeJobData>(JUDGE_QUEUE, processJob, {
    connection: getRedis(),
    concurrency: env.JUDGE_CONCURRENCY,
  });

  await recordWorkerHeartbeat();
  const heartbeat = setInterval(() => {
    void recordWorkerHeartbeat().catch((error) => {
      logger.warn("Worker heartbeat failed", {
        error: error instanceof Error ? error.message : String(error),
      });
    });
  }, 30_000);

  let contestNotifyRunning = false;
  const notifyContests = () => {
    if (contestNotifyRunning) return;
    contestNotifyRunning = true;
    void notifyStartingContests()
      .then((count) => {
        if (count > 0) {
          logger.info("Contest start notifications sent", { count });
        }
      })
      .catch((error) => {
        logger.warn("Contest start notification check failed", {
          error: error instanceof Error ? error.message : String(error),
        });
      })
      .finally(() => {
        contestNotifyRunning = false;
      });
  };
  notifyContests();
  const contestNotifier = setInterval(notifyContests, 60_000);

  let ratingSweepRunning = false;
  const finalizeRatings = () => {
    if (ratingSweepRunning) return;
    ratingSweepRunning = true;
    void (async () => {
      const lockValue = ratingSweepLockValue();
      let acquired = false;
      try {
        acquired = await acquireRatingSweepLock(lockValue);
        if (!acquired) {
          logger.info(
            "Contest rating sweep skipped; lock held by another worker",
          );
          return;
        }
        const { finalized, failed } = await finalizeDueContestRatings();
        if (finalized > 0) {
          logger.info("Contest ratings finalized", { finalized });
        }
        if (failed > 0) {
          logger.warn("Contest rating finalization errors", { failed });
        }
      } catch (error) {
        logger.warn("Contest rating sweep failed", {
          error: error instanceof Error ? error.message : String(error),
        });
      } finally {
        if (acquired) {
          await releaseRatingSweepLock(lockValue).catch((error) => {
            logger.warn("Contest rating sweep lock release failed", {
              error: error instanceof Error ? error.message : String(error),
            });
          });
        }
        ratingSweepRunning = false;
      }
    })();
  };
  finalizeRatings();
  const ratingSweeper = setInterval(finalizeRatings, 60_000);

  let reviewDigestRunning = false;
  const reviewDigests = () => {
    if (reviewDigestRunning) return;
    reviewDigestRunning = true;
    void sendReviewDigests()
      .catch((error) => {
        logger.warn("Review digest sweep failed", {
          error: error instanceof Error ? error.message : String(error),
        });
      })
      .finally(() => {
        reviewDigestRunning = false;
      });
  };
  reviewDigests();
  const reviewDigestNotifier = setInterval(reviewDigests, 60_000);

  let reviewSlaRunning = false;
  const reviewSla = () => {
    if (reviewSlaRunning) return;
    reviewSlaRunning = true;
    void notifyOverdueReviews()
      .then((count) => {
        if (count > 0) {
          logger.info("Overdue review nudges sent", { count });
        }
      })
      .catch((error) => {
        logger.warn("Overdue review sweep failed", {
          error: error instanceof Error ? error.message : String(error),
        });
      })
      .finally(() => {
        reviewSlaRunning = false;
      });
  };
  reviewSla();
  const reviewSlaNotifier = setInterval(reviewSla, 15 * 60_000);

  let reviewReportRunning = false;
  const reviewReport = () => {
    if (reviewReportRunning) return;
    reviewReportRunning = true;
    void sendWeeklyReviewReport()
      .then((count) => {
        if (count > 0) {
          logger.info("Weekly review reports sent", { count });
        }
      })
      .catch((error) => {
        logger.warn("Weekly review report failed", {
          error: error instanceof Error ? error.message : String(error),
        });
      })
      .finally(() => {
        reviewReportRunning = false;
      });
  };
  reviewReport();
  const reviewReportNotifier = setInterval(reviewReport, 60 * 60_000);

  let socialDigestRunning = false;
  const socialDigest = () => {
    if (socialDigestRunning) return;
    socialDigestRunning = true;
    void sendSocialReportDigest()
      .then((sent) => {
        if (sent > 0) {
          logger.info("Social report digests sent", { sent });
        }
      })
      .catch((error) => {
        logger.warn("Social report digest sweep failed", {
          error: error instanceof Error ? error.message : String(error),
        });
      })
      .finally(() => {
        socialDigestRunning = false;
      });
  };
  socialDigest();
  const socialDigestNotifier = setInterval(socialDigest, SOCIAL_REPORT_DIGEST_INTERVAL_MS);

  let socialRetentionRunning = false;
  const socialRetention = () => {
    if (socialRetentionRunning) return;
    socialRetentionRunning = true;
    const apply = process.env.SOCIAL_RETENTION_AUTO_APPLY !== "false";
    void runSocialRetention({ apply })
      .then((counts) => {
        logger.info(
          apply ? "Social retention applied" : "Social retention dry run",
          { ...counts },
        );
      })
      .catch((error) => {
        logger.warn("Social retention sweep failed", {
          error: error instanceof Error ? error.message : String(error),
        });
      })
      .finally(() => {
        socialRetentionRunning = false;
      });
  };
  const socialRetentionTimer = setInterval(socialRetention, 24 * 60 * 60_000);

  let contestSeriesRunning = false;
  const ensureContestSeries = () => {
    if (contestSeriesRunning) return;
    contestSeriesRunning = true;
    void ensureMonthlyContestSeries()
      .then((result) => {
        if (result.created) {
          logger.info("Monthly official contest scheduled", {
            contestId: result.contestId,
            startAt: result.startAt,
          });
        }
      })
      .catch((error) => {
        logger.warn("Monthly contest series sweep failed", {
          error: error instanceof Error ? error.message : String(error),
        });
      })
      .finally(() => {
        contestSeriesRunning = false;
      });
  };
  ensureContestSeries();
  const contestSeriesSweeper = setInterval(ensureContestSeries, 60 * 60_000);

  worker.on("ready", () => logger.info("Judge worker ready"));
  worker.on("failed", (job, error) => {
    logger.error("Judge job failed", {
      jobId: job?.id,
      error: error.message,
    });
  });

  const shutdown = async (signal: string): Promise<void> => {
    logger.info("Judge worker shutting down", { signal });
    clearInterval(heartbeat);
    clearInterval(contestNotifier);
    clearInterval(ratingSweeper);
    clearInterval(reviewDigestNotifier);
    clearInterval(reviewSlaNotifier);
    clearInterval(reviewReportNotifier);
    clearInterval(socialDigestNotifier);
    clearInterval(socialRetentionTimer);
    clearInterval(contestSeriesSweeper);
    await clearWorkerHeartbeat().catch(() => undefined);
    await worker.close();
    await closeDb();
    await closeRedis();
    process.exit(0);
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("unhandledRejection", (error) => {
    logger.error("Unhandled worker rejection", {
      error: error instanceof Error ? error.message : String(error),
    });
  });
}

main().catch((error) => {
  logger.error("Judge worker exited", {
    error: error instanceof Error ? error.message : String(error),
  });
  process.exit(1);
});
