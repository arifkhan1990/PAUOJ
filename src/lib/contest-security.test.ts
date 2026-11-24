import { describe, expect, it } from "vitest";
import type { ContestStaffRole } from "./contest-ops";
import {
  buildContestWatermark,
  CONTEST_CREW_BLOCKED_ROLES,
  contestCrewProblemAccess,
  contestIntegrityEventEndpoint,
  INTEGRITY_EVENT_THROTTLE_MS,
  INTEGRITY_LIFECYCLE_EVENT_THROTTLE_MS,
  integrityEventThrottleMs,
  isContestCrewBlocked,
  isContestCrewRoleBlocked,
  isContestEditorialLocked,
  isIntegrityEventType,
  shouldSendIntegrityEvent,
} from "./contest-security";

const ALL_ROLES: ContestStaffRole[] = [
  "DIRECTOR",
  "SETTER",
  "EDITORIAL",
  "TESTER",
  "OBSERVER",
];

describe("contest crew access policy", () => {
  it("blocks crew statements only while the contest is running", () => {
    expect(isContestCrewBlocked("RUNNING")).toBe(true);
    expect(isContestCrewBlocked("UPCOMING")).toBe(false);
    expect(isContestCrewBlocked("ENDED")).toBe(false);
  });

  it("blocks every crew role except DIRECTOR", () => {
    expect(CONTEST_CREW_BLOCKED_ROLES).not.toContain("DIRECTOR");
    for (const role of ALL_ROLES) {
      expect(isContestCrewRoleBlocked(role)).toBe(role !== "DIRECTOR");
    }
  });

  it("lets DIRECTOR preview running problems and opens the round for no one else", () => {
    for (const role of ALL_ROLES) {
      const decision = contestCrewProblemAccess({
        status: "RUNNING",
        role,
      });
      if (role === "DIRECTOR") {
        expect(decision).toEqual({
          allowed: true,
          reason: "DIRECTOR_PREVIEW",
        });
      } else {
        expect(decision).toEqual({ allowed: false, reason: "CREW_BLOCKED" });
      }
    }
  });

  it("allows all crew roles once the round is not running", () => {
    for (const status of ["UPCOMING", "ENDED"] as const) {
      for (const role of ALL_ROLES) {
        expect(
          contestCrewProblemAccess({ status, role }),
        ).toEqual({ allowed: true, reason: "ALLOWED" });
      }
    }
  });
});

describe("buildContestWatermark", () => {
  const input = {
    displayName: "Arif Khan",
    username: "arifk",
    contestSlug: "monthly-nov-2026",
    startAt: "2026-11-15T04:00:00.000Z",
  };

  it("embeds name, @username, slug and start date", () => {
    const watermark = buildContestWatermark(input);
    expect(watermark).toContain("Arif Khan");
    expect(watermark).toContain("(@arifk)");
    expect(watermark).toContain("monthly-nov-2026");
    expect(watermark).toContain("2026-11-15");
  });

  it("is stable and never empty", () => {
    expect(buildContestWatermark(input)).toEqual(buildContestWatermark(input));
    expect(buildContestWatermark(input).length).toBeGreaterThan(0);
  });

  it("falls back safely when identity fields are missing", () => {
    const anonymous = buildContestWatermark({
      displayName: null,
      username: null,
      contestSlug: "monthly-nov-2026",
      startAt: new Date("2026-11-15T04:00:00.000Z"),
    });
    expect(anonymous).toContain("contest viewer");
    expect(anonymous).toContain("monthly-nov-2026");
    expect(anonymous.length).toBeGreaterThan(0);
  });

  it("survives invalid dates without throwing", () => {
    const watermark = buildContestWatermark({
      displayName: "A",
      username: "a",
      contestSlug: "s",
      startAt: "not-a-date",
    });
    expect(watermark.length).toBeGreaterThan(0);
  });
});

describe("isContestEditorialLocked", () => {
  it("locks the editorial only for a running contest context", () => {
    expect(
      isContestEditorialLocked({ status: "RUNNING", hasContestContext: true }),
    ).toBe(true);
    expect(
      isContestEditorialLocked({ status: "ENDED", hasContestContext: true }),
    ).toBe(false);
    expect(
      isContestEditorialLocked({
        status: "RUNNING",
        hasContestContext: false,
      }),
    ).toBe(false);
  });
});

describe("integrity event policy", () => {
  it("accepts only known event types", () => {
    expect(isIntegrityEventType("COPY")).toBe(true);
    expect(isIntegrityEventType("TAB_HIDDEN")).toBe(true);
    expect(isIntegrityEventType("copy")).toBe(false);
    expect(isIntegrityEventType("KEYSTROKE")).toBe(false);
    expect(isIntegrityEventType(null)).toBe(false);
  });

  it("builds the contest-scoped endpoint with an encoded slug", () => {
    expect(contestIntegrityEventEndpoint("monthly-nov")).toBe(
      "/api/v1/contests/monthly-nov/integrity-events",
    );
    expect(contestIntegrityEventEndpoint("a b")).toBe(
      "/api/v1/contests/a%20b/integrity-events",
    );
  });

  it("sends the first event, drops duplicates, recovers after the window", () => {
    const first = shouldSendIntegrityEvent({}, "COPY", 1_000);
    expect(first.send).toBe(true);
    expect(first.next.COPY).toBe(1_000);

    expect(shouldSendIntegrityEvent(first.next, "COPY", 5_000).send).toBe(
      false,
    );
    expect(
      shouldSendIntegrityEvent(
        first.next,
        "COPY",
        1_000 + INTEGRITY_EVENT_THROTTLE_MS,
      ).send,
    ).toBe(true);
  });

  it("uses a shorter window for lifecycle events", () => {
    expect(integrityEventThrottleMs("TAB_HIDDEN")).toBe(
      INTEGRITY_LIFECYCLE_EVENT_THROTTLE_MS,
    );
    expect(integrityEventThrottleMs("FULLSCREEN_EXIT")).toBe(
      INTEGRITY_LIFECYCLE_EVENT_THROTTLE_MS,
    );
    expect(integrityEventThrottleMs("COPY")).toBe(INTEGRITY_EVENT_THROTTLE_MS);
    const state = shouldSendIntegrityEvent({}, "TAB_HIDDEN", 1_000).next;
    expect(shouldSendIntegrityEvent(state, "TAB_HIDDEN", 3_500).send).toBe(
      false,
    );
    expect(shouldSendIntegrityEvent(state, "TAB_HIDDEN", 5_000).send).toBe(
      true,
    );
  });
});
