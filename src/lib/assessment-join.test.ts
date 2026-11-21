import { describe, expect, it } from "vitest";
import {
  type ClaimRefusalReason,
  claimRefusal,
  deriveClaimAssurance,
  isOwnClaim,
  participantClaimBlock,
  refHint,
} from "./assessment-invites";
import { participantExpiresAt } from "./assessments";
import { joinAssessmentSchema } from "./schemas/assessment";

describe("joinAssessmentSchema", () => {
  it("accepts a code-only body", () => {
    const parsed = joinAssessmentSchema.safeParse({ code: "  ABC123 " });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data).toEqual({ code: "ABC123" });
  });

  it("accepts a token body, with or without a candidate ref", () => {
    const bare = joinAssessmentSchema.safeParse({ token: "raw-token" });
    expect(bare.success).toBe(true);
    if (bare.success) expect(bare.data).toEqual({ token: "raw-token" });

    const withRef = joinAssessmentSchema.safeParse({
      token: "raw-token",
      candidateRef: " 2210145 ",
    });
    expect(withRef.success).toBe(true);
    if (withRef.success) {
      expect(withRef.data).toEqual({
        token: "raw-token",
        candidateRef: "2210145",
      });
    }
  });

  it("rejects a body that sends both a code and a token", () => {
    const parsed = joinAssessmentSchema.safeParse({
      code: "ABC123",
      token: "raw-token",
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0]?.message).toContain(
        "access code or an invite token",
      );
    }
  });

  it("rejects an empty body and a code with a candidate ref", () => {
    const empty = joinAssessmentSchema.safeParse({});
    expect(empty.success).toBe(false);
    if (!empty.success) {
      expect(empty.error.issues[0]?.message).toContain(
        "access code or an invite token",
      );
    }
    expect(
      joinAssessmentSchema.safeParse({ code: "", token: "" }).success,
    ).toBe(false);
    expect(
      joinAssessmentSchema.safeParse({ code: "ABC123", candidateRef: "2210145" })
        .success,
    ).toBe(false);
  });

  it("rejects an over-long token or ref", () => {
    expect(
      joinAssessmentSchema.safeParse({ token: "x".repeat(501) }).success,
    ).toBe(false);
    expect(
      joinAssessmentSchema.safeParse({
        token: "raw-token",
        candidateRef: "x".repeat(201),
      }).success,
    ).toBe(false);
  });
});

describe("claimRefusal", () => {
  const expected: Record<
    ClaimRefusalReason,
    { code: string; status: number }
  > = {
    ALREADY_CLAIMED: { code: "INVITE_CLAIMED", status: 409 },
    REVOKED: { code: "INVITE_REVOKED", status: 410 },
    EXPIRED: { code: "INVITE_EXPIRED", status: 410 },
    ENDED: { code: "ASSESSMENT_ENDED", status: 410 },
    EMAIL_MISMATCH: { code: "INVITE_EMAIL_MISMATCH", status: 403 },
    REF_MISMATCH: { code: "INVITE_REF_MISMATCH", status: 403 },
  };

  it("maps every refusal reason to its own code and status", () => {
    for (const reason of Object.keys(expected) as ClaimRefusalReason[]) {
      const refusal = claimRefusal(reason);
      expect(refusal.code).toBe(expected[reason].code);
      expect(refusal.status).toBe(expected[reason].status);
      expect(refusal.message.length).toBeGreaterThan(0);
    }
    const codes = new Set(
      (Object.keys(expected) as ClaimRefusalReason[]).map(
        (reason) => claimRefusal(reason).code,
      ),
    );
    expect(codes.size).toBe(Object.keys(expected).length);
  });

  it("never mentions an email address or a stored reference", () => {
    for (const reason of Object.keys(expected) as ClaimRefusalReason[]) {
      const { message } = claimRefusal(reason);
      expect(message).not.toMatch(/@/);
      expect(message).not.toMatch(/2210145|\b[A-Z]{2,}\d{4,}\b/);
    }
  });
});

describe("isOwnClaim", () => {
  it("treats a claimed invite owned by this account as a retry", () => {
    expect(
      isOwnClaim({ status: "CLAIMED", claimedByUserId: "user-1" }, "user-1"),
    ).toBe(true);
  });

  it("refuses a claimed invite owned by another account", () => {
    expect(
      isOwnClaim({ status: "CLAIMED", claimedByUserId: "user-2" }, "user-1"),
    ).toBe(false);
  });

  it("does not treat an open invite as claimed", () => {
    expect(
      isOwnClaim({ status: "SENT", claimedByUserId: null }, "user-1"),
    ).toBe(false);
  });
});

describe("participantExpiresAt", () => {
  const now = new Date("2026-11-21T10:00:00.000Z");

  it("uses the assessment end when the duration is null or zero", () => {
    const endAt = "2026-11-21T12:00:00.000Z";
    expect(participantExpiresAt(now, null, endAt).toISOString()).toBe(endAt);
    expect(participantExpiresAt(now, 0, endAt).toISOString()).toBe(endAt);
  });

  it("uses now + duration when the duration is shorter than the window", () => {
    expect(
      participantExpiresAt(now, 30, "2026-11-21T12:00:00.000Z").toISOString(),
    ).toBe("2026-11-21T10:30:00.000Z");
  });

  it("clamps to the assessment end when the duration is longer", () => {
    expect(
      participantExpiresAt(now, 180, "2026-11-21T11:00:00.000Z").toISOString(),
    ).toBe("2026-11-21T11:00:00.000Z");
  });
});

describe("participantClaimBlock", () => {
  const now = new Date("2026-11-21T10:00:00.000Z");
  const active = {
    expiresAt: new Date("2026-11-21T11:00:00.000Z"),
    finishedAt: null,
    inviteId: null,
  };

  it("proceeds when there is no participant row", () => {
    expect(participantClaimBlock(null, "invite-1", now)).toEqual({
      kind: "NONE",
    });
  });

  it("proceeds when the participant is not bound to an invite", () => {
    expect(participantClaimBlock(active, "invite-1", now)).toEqual({
      kind: "NONE",
    });
  });

  it("refuses a finished participant even when bound to this invite", () => {
    expect(
      participantClaimBlock(
        {
          ...active,
          finishedAt: new Date("2026-11-21T10:30:00.000Z"),
          inviteId: "invite-1",
        },
        "invite-1",
        now,
      ),
    ).toEqual({ kind: "FINISHED" });
  });

  it("refuses an expired participant without a finish time", () => {
    expect(
      participantClaimBlock(
        { ...active, expiresAt: new Date("2026-11-21T09:59:00.000Z") },
        "invite-1",
        now,
      ),
    ).toEqual({ kind: "EXPIRED" });
  });

  it("refuses a participant bound to a different invite", () => {
    expect(
      participantClaimBlock(
        { ...active, inviteId: "invite-2" },
        "invite-1",
        now,
      ),
    ).toEqual({ kind: "BOUND_OTHER" });
  });

  it("resumes a participant bound to this invite, keeping its assurance", () => {
    expect(
      participantClaimBlock(
        { ...active, inviteId: "invite-1", assurance: "REF_MATCH" },
        "invite-1",
        now,
      ),
    ).toEqual({ kind: "RESUME", assurance: "REF_MATCH" });
    expect(
      participantClaimBlock(
        { ...active, inviteId: "invite-1", assurance: null },
        "invite-1",
        now,
      ),
    ).toEqual({ kind: "RESUME", assurance: null });
  });
});

describe("deriveClaimAssurance", () => {
  it("derives the assurance from the invite channel and verification state", () => {
    expect(deriveClaimAssurance({ email: "a@example.com" }, true)).toBe(
      "VERIFIED_EMAIL",
    );
    expect(deriveClaimAssurance({ email: "a@example.com" }, false)).toBe(
      "EMAIL_MATCH",
    );
    expect(deriveClaimAssurance({ email: null }, true)).toBe("REF_MATCH");
    expect(deriveClaimAssurance({ email: "   " }, true)).toBe("REF_MATCH");
  });
});

describe("refHint", () => {
  it("returns null for refs of 8 characters or fewer", () => {
    expect(refHint("2210")).toBeNull();
    expect(refHint("221014")).toBeNull();
    expect(refHint("22101456")).toBeNull();
  });

  it("returns only the last three characters of a longer ref", () => {
    expect(refHint("2210145001")).toBe("001");
    expect(refHint("  Md.  Rakib Hasan ")).toBe("san");
  });
});
