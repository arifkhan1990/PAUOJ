import { logger } from "@/server/logger";
import { notifyStartingContests } from "@/server/services/notifications";
import { notifyContestReminders30 } from "@/server/services/contest-notifications";
import {
  resumePendingBroadcasts,
  runBroadcastSweeps,
} from "@/server/services/broadcasts";
import { processEmailOutbox } from "@/server/services/email-outbox";
import { runLearningInactivityReminders } from "@/server/services/learning-reminders";
import { sendReviewDigests } from "@/server/services/review-digest";
import { notifyOverdueReviews } from "@/server/services/review-sla";
import { sendWeeklyReviewReport } from "@/server/services/review-sla-report";
import {
  SOCIAL_REPORT_DIGEST_INTERVAL_MS,
  sendSocialReportDigest,
} from "@/server/services/social-report-digest";
import { runSocialRetention } from "@/server/services/social-retention";

type Sweep = {
  name: string;
  every: number;
  run: () => Promise<number | null>;
};

function logCount(name: string, count: number | null): void {
  if (count && count > 0) logger.info(`${name} processed`, { count });
}

const SWEEPS: Sweep[] = [
  {
    name: "Contest start notifications",
    every: 60_000,
    run: notifyStartingContests,
  },
  {
    name: "Contest 30-minute reminders",
    every: 60_000,
    run: notifyContestReminders30,
  },
  {
    name: "Notification email outbox",
    every: 30_000,
    run: async () => {
      const result = await processEmailOutbox();
      return result.sent;
    },
  },
  {
    name: "Pending broadcasts",
    every: 30_000,
    run: resumePendingBroadcasts,
  },
  {
    name: "Review digests",
    every: 60_000,
    run: sendReviewDigests,
  },
  {
    name: "Overdue review nudges",
    every: 15 * 60_000,
    run: notifyOverdueReviews,
  },
  {
    name: "Weekly review reports",
    every: 60 * 60_000,
    run: sendWeeklyReviewReport,
  },
  {
    name: "Social report digests",
    every: SOCIAL_REPORT_DIGEST_INTERVAL_MS,
    run: sendSocialReportDigest,
  },
  {
    name: "Marketing broadcasts",
    every: 60 * 60_000,
    run: async () => {
      const result = await runBroadcastSweeps();
      return result.contests + result.modules;
    },
  },
  {
    name: "Learning inactivity reminders",
    every: 24 * 60 * 60_000,
    run: runLearningInactivityReminders,
  },
];

/**
 * Starts the notification-only worker loops. Rating finalization and the
 * monthly series stay in the worker entry point because they own locks and
 * judge recovery, not delivery. Each sweep is single-flight so a slow query
 * cannot pile up behind the interval.
 */
export function startNotificationSweeps(): () => void {
  const timers: ReturnType<typeof setInterval>[] = [];

  for (const sweep of SWEEPS) {
    let running = false;
    const tick = () => {
      if (running) return;
      running = true;
      void sweep
        .run()
        .then((count) => logCount(sweep.name, count))
        .catch((error) => {
          logger.warn(`${sweep.name} sweep failed`, {
            error: error instanceof Error ? error.message : String(error),
          });
        })
        .finally(() => {
          running = false;
        });
    };
    tick();
    timers.push(setInterval(tick, sweep.every));
  }

  let retentionRunning = false;
  const retention = () => {
    if (retentionRunning) return;
    retentionRunning = true;
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
        retentionRunning = false;
      });
  };
  retention();
  timers.push(setInterval(retention, 24 * 60 * 60_000));

  return () => {
    for (const timer of timers) clearInterval(timer);
  };
}
