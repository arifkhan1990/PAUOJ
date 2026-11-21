import { describe, expect, it } from "vitest";
import {
  CLAIM_FAIL_LIMIT,
  CLAIM_FAIL_WINDOW_MS,
  SEND_WINDOW_LIMIT,
  SEND_WINDOW_MS,
  advanceWindow,
  decideClaim,
  effectiveInviteStatus,
  generateInviteToken,
  hashInviteToken,
  isClaimThrottled,
  isWindowFull,
  normaliseEmail,
  normaliseRef,
  refsMatch,
} from "./assessment-invites";

const now = new Date("2026-11-21T10:00:00.000Z");
const runningAssessment = {
  endAt: new Date("2026-11-21T12:00:00.000Z"),
};

describe("normaliseRef", () => {
  it("trims and collapses internal whitespace", () => {
    expect(normaliseRef("  2210145  ")).toBe("2210145");
    expect(normaliseRef("Md.  Rakib\t Hasan")).toBe("Md. Rakib Hasan");
  });

  it("matches refs case and whitespace insensitively", () => {
    expect(refsMatch(" 2210145 ", "2210145")).toBe(true);
    expect(refsMatch("Md. Rakib  Hasan", "md. rakib hasan")).toBe(true);
    expect(refsMatch("2210145", "2210146")).toBe(false);
  });
});

describe("normaliseEmail", () => {
  it("trims and lowercases, treating blank as absent", () => {
    expect(normaliseEmail("  Rakib@Example.COM ")).toBe("rakib@example.com");
    expect(normaliseEmail("")).toBeNull();
    expect(normaliseEmail("   ")).toBeNull();
    expect(normaliseEmail(null)).toBeNull();
    expect(normaliseEmail(undefined)).toBeNull();
  });
});

describe("invite tokens", () => {
  it("hashes the raw token to a stable value that differs from it", () => {
    const token = generateInviteToken();
    expect(token.length).toBeGreaterThanOrEqual(40);
    expect(hashInviteToken(token)).toMatch(/^[0-9a-f]{64}$/);
    expect(hashInviteToken(token)).toBe(hashInviteToken(token));
    expect(hashInviteToken(token)).not.toBe(token);
    expect(generateInviteToken()).not.toBe(token);
  });
});

describe("effectiveInviteStatus", () => {
  it("keeps terminal states", () => {
    for (const status of ["REVOKED", "CLAIMED", "EXPIRED"] as const) {
      expect(
        effectiveInviteStatus({ status }, runningAssessment, now),
      ).toBe(status);
    }
  });

  it("expires open invites once the assessment has ended", () => {
    expect(
      effectiveInviteStatus({ status: "SENT" }, runningAssessment, now),
    ).toBe("SENT");
    expect(
      effectiveInviteStatus(
        { status: "UNSENT" },
        { endAt: "2026-11-21T09:00:00.000Z" },
        now,
      ),
    ).toBe("EXPIRED");
  });
});

describe("decideClaim", () => {
  const emailInvite = {
    status: "SENT" as const,
    email: "Rakib@Example.com",
    candidateRef: "2210145",
  };
  const linkOnlyInvite = {
    status: "SENT" as const,
    email: null,
    candidateRef: "Md. Rakib  Hasan",
  };

  it("grants VERIFIED_EMAIL for a matching verified account", () => {
    expect(
      decideClaim({
        invite: emailInvite,
        assessment: runningAssessment,
        accountEmail: " rakib@example.COM",
        emailVerified: true,
        now,
      }),
    ).toEqual({ ok: true, assurance: "VERIFIED_EMAIL" });
  });

  it("grants EMAIL_MATCH for a matching unverified account", () => {
    expect(
      decideClaim({
        invite: emailInvite,
        assessment: runningAssessment,
        accountEmail: "rakib@example.com",
        emailVerified: false,
        now,
      }),
    ).toEqual({ ok: true, assurance: "EMAIL_MATCH" });
  });

  it("rejects a non-matching account even with the correct ref", () => {
    expect(
      decideClaim({
        invite: emailInvite,
        assessment: runningAssessment,
        accountEmail: "someone-else@example.com",
        emailVerified: true,
        submittedRef: "2210145",
        now,
      }),
    ).toEqual({ ok: false, reason: "EMAIL_MISMATCH" });
    expect(
      decideClaim({
        invite: emailInvite,
        assessment: runningAssessment,
        accountEmail: null,
        emailVerified: false,
        submittedRef: "2210145",
        now,
      }),
    ).toEqual({ ok: false, reason: "EMAIL_MISMATCH" });
  });

  it("claims a link-only invite by matching ref", () => {
    expect(
      decideClaim({
        invite: linkOnlyInvite,
        assessment: runningAssessment,
        accountEmail: "anyone@example.com",
        emailVerified: false,
        submittedRef: " md.  rakib hasan ",
        now,
      }),
    ).toEqual({ ok: true, assurance: "REF_MATCH" });
  });

  it("rejects a missing or wrong ref on a link-only invite", () => {
    expect(
      decideClaim({
        invite: linkOnlyInvite,
        assessment: runningAssessment,
        accountEmail: "anyone@example.com",
        emailVerified: true,
        submittedRef: "2210146",
        now,
      }),
    ).toEqual({ ok: false, reason: "REF_MISMATCH" });
    expect(
      decideClaim({
        invite: linkOnlyInvite,
        assessment: runningAssessment,
        accountEmail: "anyone@example.com",
        emailVerified: true,
        now,
      }),
    ).toEqual({ ok: false, reason: "REF_MISMATCH" });
  });

  it("refuses claimed, revoked, expired and ended invites", () => {
    const base = {
      invite: emailInvite,
      assessment: runningAssessment,
      accountEmail: "rakib@example.com",
      emailVerified: true,
      now,
    };
    expect(
      decideClaim({ ...base, invite: { ...emailInvite, status: "CLAIMED" } }),
    ).toEqual({ ok: false, reason: "ALREADY_CLAIMED" });
    expect(
      decideClaim({ ...base, invite: { ...emailInvite, status: "REVOKED" } }),
    ).toEqual({ ok: false, reason: "REVOKED" });
    expect(
      decideClaim({ ...base, invite: { ...emailInvite, status: "EXPIRED" } }),
    ).toEqual({ ok: false, reason: "EXPIRED" });
    expect(
      decideClaim({
        ...base,
        assessment: { endAt: "2026-11-21T09:00:00.000Z" },
      }),
    ).toEqual({ ok: false, reason: "ENDED" });
  });
});

describe("send window math", () => {
  it("counts up to the limit inside the window and resets afterwards", () => {
    const t0 = new Date("2026-11-21T10:00:00.000Z");
    const state = { startedAt: t0, count: SEND_WINDOW_LIMIT };
    expect(isWindowFull(state, t0, SEND_WINDOW_MS, SEND_WINDOW_LIMIT)).toBe(
      true,
    );
    const nextHour = new Date(t0.getTime() + SEND_WINDOW_MS);
    expect(
      isWindowFull(state, nextHour, SEND_WINDOW_MS, SEND_WINDOW_LIMIT),
    ).toBe(false);
    expect(advanceWindow(state, nextHour, SEND_WINDOW_MS)).toEqual({
      startedAt: nextHour,
      count: 1,
    });
    expect(
      advanceWindow(
        { startedAt: t0, count: 2 },
        new Date(t0.getTime() + 1000),
        SEND_WINDOW_MS,
      ),
    ).toEqual({ startedAt: t0, count: 3 });
  });
});

describe("failed-claim throttle math", () => {
  it("allows five failures per 15 minutes, then throttles", () => {
    const t0 = new Date("2026-11-21T10:00:00.000Z");
    let state = { startedAt: null as Date | null, count: 0 };
    for (let attempt = 1; attempt <= CLAIM_FAIL_LIMIT; attempt += 1) {
      const next = advanceWindow(
        state,
        new Date(t0.getTime() + attempt * 1000),
        CLAIM_FAIL_WINDOW_MS,
      );
      expect(next.count).toBe(attempt);
      expect(isClaimThrottled(next.count)).toBe(false);
      state = next;
    }

    const sixth = advanceWindow(
      state,
      new Date(t0.getTime() + 6000),
      CLAIM_FAIL_WINDOW_MS,
    );
    expect(sixth.count).toBe(CLAIM_FAIL_LIMIT + 1);
    expect(isClaimThrottled(sixth.count)).toBe(true);

    const reopened = advanceWindow(
      sixth,
      new Date(t0.getTime() + CLAIM_FAIL_WINDOW_MS + 1000),
      CLAIM_FAIL_WINDOW_MS,
    );
    expect(reopened.count).toBe(1);
    expect(isClaimThrottled(reopened.count)).toBe(false);
  });
});
