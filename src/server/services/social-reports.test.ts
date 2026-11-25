import { describe, expect, it } from "vitest";
import {
  createSocialReportSchema,
  socialReportListQuerySchema,
  socialReportResolutionSchema,
} from "@/lib/schemas/social-report";
import {
  SOCIAL_REPORT_DELETED_EXCERPT,
  SOCIAL_REPORT_DUPLICATE_WINDOW_MS,
  SOCIAL_REPORT_EXCERPT_LENGTH,
  buildMessageExcerpt,
  canReportMessage,
  isDuplicateWithinWindow,
  parseRetentionDays,
  retentionCutoff,
  socialReportDuplicateLockKey,
  truncateSocialExcerpt,
  isTargetAuthoredMessage,
} from "./social-reports";
import {
  buildSocialReportDigestBody,
  formatOpenReportAge,
  socialReportDigestDedupeKey,
} from "./social-report-digest";

const REPORTER = "6f8a1f34-3d4b-4f7e-9a51-2d3c4b5a6e70";
const PEER = "0b1c2d3e-4f5a-4b6c-8d7e-9f0a1b2c3d4e";
const THIRD = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
const CONVERSATION = "11111111-2222-4333-8444-555555555555";
const MESSAGE = "99999999-8888-4777-8666-555555555555";
const DAY_MS = 24 * 60 * 60 * 1000;

function parseReport(overrides: Record<string, unknown> = {}) {
  return createSocialReportSchema.safeParse({
    kind: "PROFILE",
    username: "peer",
    reason: "SPAM",
    ...overrides,
  });
}

describe("createSocialReportSchema", () => {
  it("accepts a profile report without ids and drops empty details", () => {
    const parsed = parseReport({ details: "   " });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.kind).toBe("PROFILE");
      expect(parsed.data.details).toBeUndefined();
    }
  });

  it("trims username and details", () => {
    const parsed = parseReport({
      username: "  peer  ",
      details: "  rude message  ",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.username).toBe("peer");
      expect(parsed.data.details).toBe("rude message");
    }
  });

  it("requires messageId for a MESSAGE report", () => {
    const parsed = parseReport({ kind: "MESSAGE" });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0]?.path).toEqual(["messageId"]);
    }
  });

  it("accepts a MESSAGE report with a uuid messageId", () => {
    const parsed = parseReport({ kind: "MESSAGE", messageId: MESSAGE });
    expect(parsed.success).toBe(true);
  });

  it("requires conversationId for a CONVERSATION report", () => {
    const parsed = parseReport({ kind: "CONVERSATION" });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0]?.path).toEqual(["conversationId"]);
    }
  });

  it("rejects ids on FOLLOW_REQUEST and PROFILE reports", () => {
    expect(
      parseReport({ kind: "FOLLOW_REQUEST", conversationId: CONVERSATION })
        .success,
    ).toBe(false);
    expect(parseReport({ kind: "PROFILE", messageId: MESSAGE }).success).toBe(
      false,
    );
  });

  it("rejects empty, oversized or non-uuid values", () => {
    expect(parseReport({ username: "   " }).success).toBe(false);
    expect(parseReport({ username: "u".repeat(65) }).success).toBe(false);
    expect(parseReport({ details: "d".repeat(501) }).success).toBe(false);
    expect(parseReport({ kind: "MESSAGE", messageId: "nope" }).success).toBe(
      false,
    );
    expect(parseReport({ kind: "CONVERSATION", conversationId: "nope" }).success)
      .toBe(false);
    expect(parseReport({ kind: "NOPE" }).success).toBe(false);
    expect(parseReport({ reason: "NOPE" }).success).toBe(false);
  });

  it("accepts exactly 500 characters of details", () => {
    expect(parseReport({ details: "d".repeat(500) }).success).toBe(true);
  });
});

describe("socialReportResolutionSchema", () => {
  it("accepts RESOLVED and DISMISSED with an optional trimmed note", () => {
    const resolved = socialReportResolutionSchema.safeParse({
      status: "RESOLVED",
      note: "  handled  ",
    });
    expect(resolved.success).toBe(true);
    if (resolved.success) expect(resolved.data.note).toBe("handled");

    const dismissed = socialReportResolutionSchema.safeParse({
      status: "DISMISSED",
      note: "",
    });
    expect(dismissed.success).toBe(true);
    if (dismissed.success) expect(dismissed.data.note).toBeUndefined();
  });

  it("rejects OPEN and notes over 500 characters", () => {
    expect(socialReportResolutionSchema.safeParse({ status: "OPEN" }).success)
      .toBe(false);
    expect(
      socialReportResolutionSchema.safeParse({
        status: "RESOLVED",
        note: "n".repeat(501),
      }).success,
    ).toBe(false);
  });
});

describe("socialReportListQuerySchema", () => {
  it("defaults to open and page 1", () => {
    const parsed = socialReportListQuerySchema.parse({});
    expect(parsed).toEqual({ status: "open", page: 1 });
  });

  it("accepts every status filter and rejects unknown ones", () => {
    for (const status of ["open", "resolved", "dismissed", "all"]) {
      expect(socialReportListQuerySchema.safeParse({ status }).success).toBe(
        true,
      );
    }
    expect(socialReportListQuerySchema.safeParse({ status: "pending" }).success)
      .toBe(false);
  });
});

describe("excerpt helpers", () => {
  it("normalizes whitespace and keeps short messages intact", () => {
    expect(truncateSocialExcerpt("  hello\n\n  there  ")).toBe("hello there");
  });

  it("truncates to the 300 character bound", () => {
    const excerpt = truncateSocialExcerpt("a".repeat(500));
    expect(excerpt).toHaveLength(SOCIAL_REPORT_EXCERPT_LENGTH);
  });

  it("never leaks a soft-deleted body", () => {
    expect(buildMessageExcerpt({ body: "secret", deletedAt: new Date() })).toBe(
      SOCIAL_REPORT_DELETED_EXCERPT,
    );
    expect(buildMessageExcerpt({ body: "secret", deletedAt: null })).toBe(
      "secret",
    );
  });
});

describe("isDuplicateWithinWindow", () => {
  const now = new Date("2026-11-25T12:00:00.000Z");

  it("treats anything inside 24 hours as duplicate, including the boundary", () => {
    expect(
      isDuplicateWithinWindow(
        new Date(now.getTime() - SOCIAL_REPORT_DUPLICATE_WINDOW_MS),
        now,
      ),
    ).toBe(true);
    expect(
      isDuplicateWithinWindow(new Date(now.getTime() - 60 * 60 * 1000), now),
    ).toBe(true);
  });

  it("allows a fresh report after the window", () => {
    expect(
      isDuplicateWithinWindow(
        new Date(now.getTime() - SOCIAL_REPORT_DUPLICATE_WINDOW_MS - 1),
        now,
      ),
    ).toBe(false);
  });
});

describe("canReportMessage", () => {
  const conversation = { userAId: PEER, userBId: REPORTER };

  it("allows the reporter to report the other participant", () => {
    expect(canReportMessage(conversation, REPORTER, PEER)).toBe(true);
    expect(canReportMessage(conversation, PEER, REPORTER)).toBe(true);
  });

  it("rejects non-participants and unrelated targets", () => {
    expect(canReportMessage(conversation, THIRD, PEER)).toBe(false);
    expect(canReportMessage(conversation, REPORTER, THIRD)).toBe(false);
    expect(canReportMessage(conversation, REPORTER, REPORTER)).toBe(false);
  });
});

describe("retention helpers", () => {
  const now = new Date("2026-11-25T00:00:00.000Z");

  it("measures cutoffs in exact days", () => {
    expect(retentionCutoff(now, 365).getTime()).toBe(
      now.getTime() - 365 * DAY_MS,
    );
    expect(retentionCutoff(now, 0).getTime()).toBe(now.getTime());
  });

  it("uses the fallback for missing or invalid values", () => {
    expect(parseRetentionDays(undefined, 365)).toBe(365);
    expect(parseRetentionDays("", 365)).toBe(365);
    expect(parseRetentionDays("abc", 365)).toBe(365);
    expect(parseRetentionDays("0", 365)).toBe(365);
    expect(parseRetentionDays("-5", 365)).toBe(365);
    expect(parseRetentionDays("1.5", 365)).toBe(365);
  });

  it("parses valid values and caps absurd retention", () => {
    expect(parseRetentionDays("730", 365)).toBe(730);
    expect(parseRetentionDays(" 30 ", 365)).toBe(30);
    expect(parseRetentionDays("999999", 365)).toBe(36500);
  });
});

describe("report evidence authorship", () => {
  it("only accepts messages authored by the reported target", () => {
    expect(isTargetAuthoredMessage("target", "target")).toBe(true);
    expect(isTargetAuthoredMessage("reporter", "target")).toBe(false);
  });
});

describe("socialReportDuplicateLockKey", () => {
  it("keys a message report by the reported message", () => {
    expect(
      socialReportDuplicateLockKey({
        reporterId: REPORTER,
        kind: "MESSAGE",
        targetUserId: PEER,
        messageId: MESSAGE,
        conversationId: CONVERSATION,
      }),
    ).toBe(`social-report:${REPORTER}:MESSAGE:${PEER}:${MESSAGE}`);
  });

  it("falls back to the conversation, then the target user", () => {
    expect(
      socialReportDuplicateLockKey({
        reporterId: REPORTER,
        kind: "CONVERSATION",
        targetUserId: PEER,
        conversationId: CONVERSATION,
      }),
    ).toBe(`social-report:${REPORTER}:CONVERSATION:${PEER}:${CONVERSATION}`);

    expect(
      socialReportDuplicateLockKey({
        reporterId: REPORTER,
        kind: "PROFILE",
        targetUserId: PEER,
      }),
    ).toBe(`social-report:${REPORTER}:PROFILE:${PEER}:${PEER}`);

    expect(
      socialReportDuplicateLockKey({
        reporterId: REPORTER,
        kind: "FOLLOW_REQUEST",
        targetUserId: PEER,
        conversationId: null,
        messageId: null,
      }),
    ).toBe(`social-report:${REPORTER}:FOLLOW_REQUEST:${PEER}:${PEER}`);
  });

  it("separates reporters and targets that share a scope", () => {
    const base = {
      kind: "PROFILE" as const,
      targetUserId: PEER,
    };
    expect(
      socialReportDuplicateLockKey({ ...base, reporterId: REPORTER }),
    ).not.toBe(socialReportDuplicateLockKey({ ...base, reporterId: THIRD }));
  });
});

describe("social report digest helpers", () => {
  const now = new Date("2026-11-25T12:34:56.000Z");
  const ago = (ms: number) => new Date(now.getTime() - ms);

  it("buckets the dedupe key to the UTC ISO hour", () => {
    expect(socialReportDigestDedupeKey(now)).toBe(
      "social-report-digest:2026-11-25T12",
    );
    expect(
      socialReportDigestDedupeKey(new Date("2026-11-25T12:59:59.000Z")),
    ).toBe("social-report-digest:2026-11-25T12");
    expect(
      socialReportDigestDedupeKey(new Date("2026-11-25T13:00:00.000Z")),
    ).toBe("social-report-digest:2026-11-25T13");
  });

  it("formats the oldest open report age", () => {
    expect(formatOpenReportAge(ago(45 * 60_000), now)).toBe("45m");
    expect(formatOpenReportAge(ago(3 * 60 * 60_000), now)).toBe("3h");
    expect(formatOpenReportAge(ago(48 * 60 * 60_000), now)).toBe("2d");
    expect(
      formatOpenReportAge(ago(52 * 60 * 60_000), now),
    ).toBe("2d 4h");
    expect(formatOpenReportAge(ago(-60_000), now)).toBe("0m");
  });

  it("builds a body with the open count and oldest age", () => {
    expect(buildSocialReportDigestBody(1, ago(30 * 60_000), now)).toBe(
      "1 open social report; oldest is 30m old.",
    );
    expect(buildSocialReportDigestBody(5, ago(26 * 60 * 60_000), now)).toBe(
      "5 open social reports; oldest is 1d 2h old.",
    );
  });
});
