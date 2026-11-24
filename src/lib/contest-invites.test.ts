import { describe, expect, it } from "vitest";
import {
  CONTEST_INVITE_CODE_LENGTH,
  encodeContestInviteCode,
  isValidContestInviteCode,
  normalizeContestInviteCode,
} from "./contest-invites";

describe("contest invite codes", () => {
  it("encodes eight unambiguous characters from random bytes", () => {
    const code = encodeContestInviteCode(new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7]));
    expect(code).toHaveLength(CONTEST_INVITE_CODE_LENGTH);
    expect(code).toBe("ABCDEFGH");
    expect(code).not.toMatch(/[IO01]/);
  });

  it("wraps around short byte buffers instead of leaving holes", () => {
    const code = encodeContestInviteCode(new Uint8Array([31]), 8);
    expect(code).toBe("99999999");
    expect(isValidContestInviteCode(code)).toBe(true);
  });

  it("normalizes typed codes", () => {
    expect(normalizeContestInviteCode("  abcd2345 ")).toBe("ABCD2345");
    expect(isValidContestInviteCode(" abcd2345 ")).toBe(true);
  });

  it("rejects wrong lengths and ambiguous characters", () => {
    expect(isValidContestInviteCode("ABC")).toBe(false);
    expect(isValidContestInviteCode("ABCDEFGHJ")).toBe(false);
    expect(isValidContestInviteCode("ABCDEFG0")).toBe(false);
    expect(isValidContestInviteCode("ABCDEFGI")).toBe(false);
  });

  it("rejects empty byte buffers", () => {
    expect(() => encodeContestInviteCode(new Uint8Array([]))).toThrow();
  });
});
