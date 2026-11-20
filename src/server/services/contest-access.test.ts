import { describe, expect, it } from "vitest";
import {
  canAnswerClarification,
  resolveContestContentAccess,
} from "./contest-access";

describe("resolveContestContentAccess", () => {
  const base = {
    status: "RUNNING" as const,
    isPublic: true,
    registered: false,
    isAdmin: false,
  };

  it("locks running contests to registered participants", () => {
    expect(resolveContestContentAccess(base)).toBe(false);
    expect(resolveContestContentAccess({ ...base, registered: true })).toBe(
      true,
    );
  });

  it("opens public ended contests to everyone", () => {
    expect(
      resolveContestContentAccess({ ...base, status: "ENDED" }),
    ).toBe(true);
  });

  it("keeps ended private contests locked unless registered or admin", () => {
    expect(
      resolveContestContentAccess({
        ...base,
        status: "ENDED",
        isPublic: false,
      }),
    ).toBe(false);
    expect(
      resolveContestContentAccess({
        ...base,
        status: "ENDED",
        isPublic: false,
        registered: true,
      }),
    ).toBe(true);
  });

  it("always allows admins", () => {
    expect(resolveContestContentAccess({ ...base, isAdmin: true })).toBe(true);
  });
});

describe("canAnswerClarification", () => {
  const base = {
    isAdmin: false,
    contestCreatedBy: "organiser",
    problemAuthorId: "author",
    viewerId: "someone",
  };

  it("allows admins, contest organisers and problem authors", () => {
    expect(canAnswerClarification({ ...base, isAdmin: true })).toBe(true);
    expect(
      canAnswerClarification({ ...base, viewerId: "organiser" }),
    ).toBe(true);
    expect(canAnswerClarification({ ...base, viewerId: "author" })).toBe(true);
  });

  it("rejects other participants and guests", () => {
    expect(canAnswerClarification(base)).toBe(false);
    expect(canAnswerClarification({ ...base, viewerId: null })).toBe(false);
  });
});
