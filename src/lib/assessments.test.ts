import { describe, expect, it } from "vitest";
import {
  assessmentPhase,
  participantRemainingMs,
  participantStatus,
} from "./assessments";

const now = new Date("2026-01-10T12:00:00.000Z");

describe("assessmentPhase", () => {
  it("detects upcoming, running and ended windows", () => {
    expect(
      assessmentPhase("2026-01-10T13:00:00Z", "2026-01-10T14:00:00Z", now),
    ).toBe("UPCOMING");
    expect(
      assessmentPhase("2026-01-10T11:00:00Z", "2026-01-10T13:00:00Z", now),
    ).toBe("RUNNING");
    expect(
      assessmentPhase("2026-01-10T09:00:00Z", "2026-01-10T10:00:00Z", now),
    ).toBe("ENDED");
  });
});

describe("participantStatus", () => {
  it("tracks active, finished and expired sessions", () => {
    expect(
      participantStatus(
        { expiresAt: "2026-01-10T12:30:00Z", finishedAt: null },
        now,
      ),
    ).toBe("ACTIVE");
    expect(
      participantStatus(
        { expiresAt: "2026-01-10T12:30:00Z", finishedAt: now },
        now,
      ),
    ).toBe("FINISHED");
    expect(
      participantStatus(
        { expiresAt: "2026-01-10T11:59:00Z", finishedAt: null },
        now,
      ),
    ).toBe("EXPIRED");
  });
});

describe("participantRemainingMs", () => {
  it("uses the earlier of session expiry and assessment end", () => {
    expect(
      participantRemainingMs(
        "2026-01-10T18:00:00Z",
        { expiresAt: "2026-01-10T12:10:00Z", finishedAt: null },
        now,
      ),
    ).toBe(10 * 60_000);
    expect(
      participantRemainingMs(
        "2026-01-10T12:05:00Z",
        { expiresAt: "2026-01-10T12:30:00Z", finishedAt: null },
        now,
      ),
    ).toBe(5 * 60_000);
  });

  it("returns zero when finished", () => {
    expect(
      participantRemainingMs(
        "2026-01-10T18:00:00Z",
        { expiresAt: "2026-01-10T12:10:00Z", finishedAt: now },
        now,
      ),
    ).toBe(0);
  });
});
