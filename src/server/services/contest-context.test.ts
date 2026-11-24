import { describe, expect, it } from "vitest";
import {
  contestIntegrityWatermark,
  isActiveContestStaff,
} from "./contest-context";

describe("contestIntegrityWatermark", () => {
  const viewer = { username: "alice", displayName: "Alice Rahman" };
  const contest = { slug: "monthly-round-12", startAt: new Date("2026-12-20T04:00:00.000Z") };

  it("includes the viewer identity, contest slug and start date", () => {
    const value = contestIntegrityWatermark({ viewer, contest });
    expect(value).toContain("Alice Rahman");
    expect(value).toContain("@alice");
    expect(value).toContain("monthly-round-12");
    expect(value).toContain("2026-12-20");
  });

  it("never leaks email or IP address details", () => {
    const value = contestIntegrityWatermark({ viewer, contest });
    expect(value).not.toMatch(/[\w.+-]+@[\w-]+\.[a-z]{2,}/i);
    expect(value).not.toMatch(/\d+\.\d+\.\d+\.\d+/);
  });
});

describe("isActiveContestStaff", () => {
  it("blocks participation for invited and accepted crew", () => {
    expect(isActiveContestStaff("INVITED")).toBe(true);
    expect(isActiveContestStaff("ACCEPTED")).toBe(true);
  });

  it("does not block declined or removed crew", () => {
    expect(isActiveContestStaff("DECLINED")).toBe(false);
    expect(isActiveContestStaff("REMOVED")).toBe(false);
  });
});
