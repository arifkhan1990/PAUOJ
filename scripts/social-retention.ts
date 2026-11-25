import "dotenv/config";
import { closeDb } from "@/server/db";
import {
  DEFAULT_MESSAGE_RETENTION_DAYS,
  DEFAULT_PRESENCE_RETENTION_DAYS,
  DEFAULT_REPORT_RETENTION_DAYS,
  runSocialRetention,
} from "@/server/services/social-retention";
import { parseRetentionDays } from "@/server/services/social-reports";

async function main(): Promise<void> {
  const apply = process.argv.includes("--apply");
  const now = new Date();

  const messageDays = parseRetentionDays(
    process.env.SOCIAL_MESSAGE_RETENTION_DAYS,
    DEFAULT_MESSAGE_RETENTION_DAYS,
  );
  const reportDays = parseRetentionDays(
    process.env.SOCIAL_REPORT_RETENTION_DAYS,
    DEFAULT_REPORT_RETENTION_DAYS,
  );
  const presenceDays = parseRetentionDays(
    process.env.SOCIAL_PRESENCE_RETENTION_DAYS,
    DEFAULT_PRESENCE_RETENTION_DAYS,
  );

  const counts = await runSocialRetention({
    apply,
    now,
    messageDays,
    reportDays,
    presenceDays,
  });

  process.stdout.write(
    `Social retention ${apply ? "APPLY" : "DRY RUN"} at ${now.toISOString()} ` +
      `(messages ${messageDays}d, reports ${reportDays}d, presence ${presenceDays}d)\n`,
  );

  if (!apply) {
    process.stdout.write(
      [
        `  messages older than ${messageDays}d: ${counts.messages}`,
        `  conversations left with no messages older than ${messageDays}d: ${counts.conversations}`,
        `  resolved/dismissed reports older than ${reportDays}d: ${counts.reports}`,
        `  users with last activity older than ${presenceDays}d: ${counts.presence}`,
      ].join("\n") + "\n",
    );
    process.stdout.write("Re-run with --apply to delete or clear these rows.\n");
    return;
  }

  process.stdout.write(
    [
      `  deleted messages older than ${messageDays}d: ${counts.messages}`,
      `  deleted empty conversations older than ${messageDays}d: ${counts.conversations}`,
      `  deleted resolved/dismissed reports older than ${reportDays}d: ${counts.reports}`,
      `  cleared last activity older than ${presenceDays}d: ${counts.presence}`,
    ].join("\n") + "\n",
  );
}

main()
  .catch((error) => {
    console.error("Social retention failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDb();
  });
