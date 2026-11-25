import { eq } from "drizzle-orm";
import { getDb } from "@/server/db";
import { users } from "@/server/db/schema";
import type { UnsubscribeScope } from "@/lib/notification-types";
import { logger } from "@/server/logger";

export async function getUnsubscribeTarget(
  token: string,
): Promise<{ displayName: string } | null> {
  const [row] = await getDb()
    .select({ displayName: users.displayName })
    .from(users)
    .where(eq(users.unsubscribeToken, token))
    .limit(1);
  return row ?? null;
}

export async function unsubscribeByToken(
  token: string,
  scope: UnsubscribeScope,
): Promise<boolean> {
  const [user] = await getDb()
    .select({ id: users.id })
    .from(users)
    .where(eq(users.unsubscribeToken, token))
    .limit(1);
  if (!user) return false;

  const values =
    scope === "all"
      ? {
          emailVerdicts: false,
          emailContests: false,
          emailClarifications: false,
          emailReviews: false,
          emailAccount: false,
          emailLearning: false,
          emailAchievements: false,
          emailAnnouncements: false,
          emailMarketing: false,
          emailDiscussions: false,
          emailMessages: false,
          emailFollows: false,
        }
      : scope === "account"
        ? { emailAccount: false }
        : scope === "verdicts"
          ? { emailVerdicts: false }
          : scope === "contests"
            ? { emailContests: false }
            : scope === "reviews"
              ? { emailReviews: false }
              : scope === "learning"
                ? { emailLearning: false }
                : scope === "achievements"
                  ? { emailAchievements: false }
                  : scope === "announcements"
                    ? { emailAnnouncements: false }
                    : scope === "marketing"
                      ? { emailMarketing: false }
                      : scope === "discussions"
                        ? { emailDiscussions: false }
                        : scope === "messages"
                          ? { emailMessages: false }
                          : scope === "follows"
                            ? { emailFollows: false }
                            : { emailClarifications: false };
  await getDb()
    .update(users)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(users.id, user.id));
  logger.info("Email notifications unsubscribed", {
    userId: user.id,
    scope,
  });
  return true;
}
