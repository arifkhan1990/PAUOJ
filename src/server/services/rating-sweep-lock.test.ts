import { describe, expect, it } from "vitest";
import {
  RATING_SWEEP_LOCK_KEY,
  RATING_SWEEP_LOCK_TTL_MS,
  RATING_SWEEP_RELEASE_SCRIPT,
  ratingSweepLockValue,
} from "./rating-sweep-lock";

describe("rating sweep lock", () => {
  it("uses a dedicated key and a TTL longer than the worker tick", () => {
    expect(RATING_SWEEP_LOCK_KEY).toBe("pauoj:rating-sweep:lock");
    expect(RATING_SWEEP_LOCK_TTL_MS).toBe(300_000);
    expect(RATING_SWEEP_LOCK_TTL_MS).toBeGreaterThan(60_000);
  });

  it("generates a fresh owner token for every sweep", () => {
    const first = ratingSweepLockValue();
    const second = ratingSweepLockValue();
    expect(first).not.toBe(second);
    expect(first).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("releases only a lock owned by the same token", () => {
    expect(RATING_SWEEP_RELEASE_SCRIPT).toContain(
      'redis.call("get", KEYS[1]) == ARGV[1]',
    );
    expect(RATING_SWEEP_RELEASE_SCRIPT).toContain(
      'redis.call("del", KEYS[1])',
    );
  });
});
