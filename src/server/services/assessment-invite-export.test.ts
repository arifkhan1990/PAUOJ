import { describe, expect, it } from "vitest";
import type {
  AssessmentInvite,
  AssessmentParticipant,
  SubmissionStatus,
} from "@/server/db/schema";
import {
  assessmentResultsCsv,
  buildAssessmentExportRows,
  type AssessmentExportRow,
  type AssessmentExportSubmission,
} from "./assessment-invite-export";

const NOW = new Date("2026-11-21T12:00:00.000Z");

let sequence = 0;

function makeInvite(overrides: Partial<AssessmentInvite> = {}): AssessmentInvite {
  sequence += 1;
  return {
    id: `invite-${sequence}`,
    assessmentId: "assessment-1",
    candidateRef: `REF-${sequence}`,
    email: null,
    groupLabel: null,
    candidateName: null,
    tokenHash: `hash-${sequence}`,
    status: "UNSENT",
    sentAt: null,
    lastSentAt: null,
    sendCount: 0,
    sendWindowStartedAt: null,
    sendWindowCount: 0,
    sendLockAt: null,
    failedClaimCount: 0,
    lastFailedClaimAt: null,
    claimFailWindowStartedAt: null,
    claimFailWindowCount: 0,
    claimedByUserId: null,
    claimedAt: null,
    claimedAssurance: null,
    createdBy: null,
    createdAt: new Date("2026-11-01T00:00:00.000Z"),
    updatedAt: new Date("2026-11-01T00:00:00.000Z"),
    ...overrides,
  };
}

function makeParticipant(
  overrides: Partial<AssessmentParticipant> = {},
): AssessmentParticipant {
  sequence += 1;
  return {
    assessmentId: "assessment-1",
    userId: `user-${sequence}`,
    inviteId: null,
    assurance: null,
    startedAt: new Date("2026-11-21T09:00:00.000Z"),
    expiresAt: new Date("2026-11-21T11:00:00.000Z"),
    finishedAt: null,
    createdAt: new Date("2026-11-21T09:00:00.000Z"),
    ...overrides,
  };
}

function makeSubmission(
  userId: string,
  problemId: string,
  status: SubmissionStatus,
  createdAt: string,
): AssessmentExportSubmission {
  return { userId, problemId, status, createdAt: new Date(createdAt) };
}

function byRef(rows: AssessmentExportRow[], ref: string): AssessmentExportRow {
  const row = rows.find((candidate) => candidate.candidateRef === ref);
  if (!row) throw new Error(`No export row for ref ${ref}`);
  return row;
}

describe("buildAssessmentExportRows", () => {
  it("returns one row per invite and marks unattempted candidates NOT_STARTED", () => {
    const attended = makeInvite({ candidateRef: "2210145", status: "CLAIMED" });
    const absent = makeInvite({ candidateRef: "2210146", status: "SENT" });
    const revoked = makeInvite({ candidateRef: "2210147", status: "REVOKED" });
    const participant = makeParticipant({
      inviteId: attended.id,
      finishedAt: new Date("2026-11-21T09:45:00.000Z"),
    });

    const rows = buildAssessmentExportRows({
      invites: [attended, absent, revoked],
      participants: [participant],
      submissions: [],
      problemPoints: new Map(),
      now: NOW,
    });

    expect(rows).toHaveLength(3);
    expect(byRef(rows, "2210145").status).toBe("FINISHED");
    expect(byRef(rows, "2210146").status).toBe("NOT_STARTED");
    expect(byRef(rows, "2210147").status).toBe("REVOKED");
  });

  it("exports OPEN_CODE participants with blank roster columns", () => {
    const alice = makeParticipant({
      userId: "user-alice",
      startedAt: new Date("2026-11-21T10:00:00.000Z"),
      expiresAt: new Date("2026-11-21T13:00:00.000Z"),
    });
    const bob = makeParticipant({
      userId: "user-bob",
      expiresAt: new Date("2026-11-21T09:00:00.000Z"),
    });

    const rows = buildAssessmentExportRows({
      invites: [],
      participants: [alice, bob],
      submissions: [],
      problemPoints: new Map(),
      now: NOW,
    });

    expect(rows).toHaveLength(2);
    const statuses = rows.map((row) => row.status).sort();
    expect(statuses).toEqual(["ACTIVE", "EXPIRED"]);
    for (const row of rows) {
      expect(row.candidateRef).toBe("");
      expect(row.candidateName).toBe("");
      expect(row.groupLabel).toBe("");
      expect(row.email).toBe("");
      expect(row.assurance).toBe("");
      expect(row.failedClaims).toBe(0);
    }
  });

  it("keeps a participant whose invite no longer exists as a participant-only row", () => {
    const orphan = makeParticipant({
      userId: "user-orphan",
      inviteId: "missing-invite",
      assurance: "REF_MATCH",
      finishedAt: new Date("2026-11-21T09:40:00.000Z"),
    });

    const rows = buildAssessmentExportRows({
      invites: [],
      participants: [orphan],
      submissions: [],
      problemPoints: new Map(),
      now: NOW,
    });

    expect(rows).toHaveLength(1);
    expect(rows[0].candidateRef).toBe("");
    expect(rows[0].status).toBe("FINISHED");
    expect(rows[0].assurance).toBe("REF_MATCH");
    expect(rows[0].failedClaims).toBe(0);
  });

  it("exports a FINISHED candidate with zero submissions as zeroes", () => {
    const invite = makeInvite({ candidateRef: "2210145" });
    const participant = makeParticipant({
      inviteId: invite.id,
      finishedAt: new Date("2026-11-21T10:30:00.000Z"),
    });

    const rows = buildAssessmentExportRows({
      invites: [invite],
      participants: [participant],
      submissions: [],
      problemPoints: new Map([["problem-1", 100]]),
      now: NOW,
    });

    const row = byRef(rows, "2210145");
    expect(row.status).toBe("FINISHED");
    expect(row.solved).toBe(0);
    expect(row.points).toBe(0);
    expect(row.submissions).toBe(0);
    expect(row.lastSubmissionAt).toBeNull();
  });

  it("prefers the participant's assurance snapshot and falls back to the invite", () => {
    const emailed = makeInvite({
      candidateRef: "A-1",
      email: "a1@example.edu",
      claimedAssurance: "EMAIL_MATCH",
      failedClaimCount: 2,
    });
    const reffed = makeInvite({
      candidateRef: "A-2",
      claimedAssurance: "REF_MATCH",
      failedClaimCount: 1,
    });

    const rows = buildAssessmentExportRows({
      invites: [emailed, reffed],
      participants: [
        makeParticipant({ inviteId: emailed.id, assurance: "VERIFIED_EMAIL" }),
        makeParticipant({ inviteId: reffed.id, assurance: null }),
      ],
      submissions: [],
      problemPoints: new Map(),
      now: NOW,
    });

    expect(byRef(rows, "A-1").assurance).toBe("VERIFIED_EMAIL");
    expect(byRef(rows, "A-1").email).toBe("a1@example.edu");
    expect(byRef(rows, "A-1").failedClaims).toBe(2);
    expect(byRef(rows, "A-2").assurance).toBe("REF_MATCH");
    expect(byRef(rows, "A-2").failedClaims).toBe(1);
  });

  it("counts distinct accepted problems and sums their points once", () => {
    const invite = makeInvite({ candidateRef: "R-1" });
    const participant = makeParticipant({
      inviteId: invite.id,
      userId: "user-1",
    });

    const rows = buildAssessmentExportRows({
      invites: [invite],
      participants: [participant],
      submissions: [
        makeSubmission("user-1", "problem-1", "ACCEPTED", "2026-11-21T09:10:00.000Z"),
        makeSubmission("user-1", "problem-1", "ACCEPTED", "2026-11-21T09:20:00.000Z"),
        makeSubmission("user-1", "problem-2", "WRONG_ANSWER", "2026-11-21T09:30:00.000Z"),
        makeSubmission("user-1", "problem-9", "ACCEPTED", "2026-11-21T09:45:00.000Z"),
      ],
      problemPoints: new Map([
        ["problem-1", 100],
        ["problem-2", 200],
      ]),
      now: NOW,
    });

    const row = byRef(rows, "R-1");
    expect(row.solved).toBe(1);
    expect(row.points).toBe(100);
    expect(row.submissions).toBe(4);
    expect(row.lastSubmissionAt?.toISOString()).toBe(
      "2026-11-21T09:45:00.000Z",
    );
  });

  it("orders by group, then points, then ref, with participant-only rows last", () => {
    const inviteB100 = makeInvite({ candidateRef: "R-2", groupLabel: "B" });
    const inviteB50 = makeInvite({ candidateRef: "R-1", groupLabel: "B" });
    const inviteB0 = makeInvite({ candidateRef: "R-4", groupLabel: "B" });
    const inviteNoGroup = makeInvite({ candidateRef: "R-3" });
    const openCode = makeParticipant({ userId: "user-open" });

    const rows = buildAssessmentExportRows({
      invites: [inviteB100, inviteB50, inviteB0, inviteNoGroup],
      participants: [
        makeParticipant({ inviteId: inviteB100.id, userId: "user-b100" }),
        makeParticipant({ inviteId: inviteB50.id, userId: "user-b50" }),
        openCode,
      ],
      submissions: [
        makeSubmission("user-b100", "p1", "ACCEPTED", "2026-11-21T09:10:00.000Z"),
        makeSubmission("user-b50", "p2", "ACCEPTED", "2026-11-21T09:10:00.000Z"),
        makeSubmission("user-open", "p1", "ACCEPTED", "2026-11-21T09:10:00.000Z"),
        makeSubmission("user-open", "p2", "ACCEPTED", "2026-11-21T09:10:00.000Z"),
      ],
      problemPoints: new Map([
        ["p1", 100],
        ["p2", 50],
      ]),
      now: NOW,
    });

    expect(rows.map((row) => row.candidateRef)).toEqual([
      "R-3",
      "",
      "R-2",
      "R-1",
      "R-4",
    ]);
  });
});

describe("assessmentResultsCsv", () => {
  it("writes the documented header and stringifies empty cells", () => {
    const invite = makeInvite({ candidateRef: "2210145" });
    const rows = buildAssessmentExportRows({
      invites: [invite],
      participants: [],
      submissions: [],
      problemPoints: new Map(),
      now: NOW,
    });

    const csv = assessmentResultsCsv(rows);
    const lines = csv.split("\r\n");
    expect(lines[0]).toBe(
      "\uFEFFcandidate_ref,candidate_name,group_label,email,status,assurance," +
        "failed_claims,started_at,finished_at,last_submission_at,solved,points,submissions",
    );
    expect(lines[1]).toBe("2210145,,,,NOT_STARTED,,0,,,,0,0,0");
    expect(lines[2]).toBe("");
  });

  it("still escapes a formula-looking candidate name through toCsv", () => {
    const invite = makeInvite({
      candidateRef: "=1+1",
      candidateName: "=cmd()",
    });
    const csv = assessmentResultsCsv(
      buildAssessmentExportRows({
        invites: [invite],
        participants: [],
        submissions: [],
        problemPoints: new Map(),
        now: NOW,
      }),
    );

    expect(csv).toContain(`"'=1+1"`);
    expect(csv).toContain(`"'=cmd()"`);
  });
});
