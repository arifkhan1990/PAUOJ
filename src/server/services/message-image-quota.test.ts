import type { SQL } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";
import {
  imageQuotaViolation,
  lockImageQuota,
  MESSAGE_IMAGE_DAILY_LIMIT,
  MESSAGE_IMAGE_DAILY_WINDOW_MS,
  MESSAGE_IMAGE_STORAGE_LIMIT_BYTES,
} from "./message-image-quota";

const VIEWER = "6f8a1f34-3d4b-4f7e-9a51-2d3c4b5a6e70";
const MIB = 1024 * 1024;

type LockTransaction = Parameters<typeof lockImageQuota>[0];

describe("image quota constants", () => {
  it("caps 50 images per rolling day and 250 MiB stored", () => {
    expect(MESSAGE_IMAGE_DAILY_LIMIT).toBe(50);
    expect(MESSAGE_IMAGE_DAILY_WINDOW_MS).toBe(24 * 60 * 60 * 1000);
    expect(MESSAGE_IMAGE_STORAGE_LIMIT_BYTES).toBe(250 * 1024 * 1024);
  });
});

describe("imageQuotaViolation", () => {
  const storage = {
    storedBytes: 0,
    incomingBytes: MIB,
  };

  it("allows an upload with room under both caps", () => {
    expect(
      imageQuotaViolation({ dailyCount: 0, ...storage }),
    ).toBeNull();
  });

  it("allows the 50th image of the window but rejects the 51st", () => {
    expect(
      imageQuotaViolation({ dailyCount: 49, ...storage }),
    ).toBeNull();
    expect(
      imageQuotaViolation({ dailyCount: 50, ...storage }),
    ).toBe("DAILY");
    expect(
      imageQuotaViolation({ dailyCount: 51, ...storage }),
    ).toBe("DAILY");
  });

  it("allows exactly 250 MiB and rejects the next byte", () => {
    expect(
      imageQuotaViolation({
        dailyCount: 0,
        storedBytes: MESSAGE_IMAGE_STORAGE_LIMIT_BYTES - MIB,
        incomingBytes: MIB,
      }),
    ).toBeNull();
    expect(
      imageQuotaViolation({
        dailyCount: 0,
        storedBytes: MESSAGE_IMAGE_STORAGE_LIMIT_BYTES - MIB,
        incomingBytes: MIB + 1,
      }),
    ).toBe("STORAGE");
  });

  it("rejects when incoming bytes alone cross the storage cap", () => {
    expect(
      imageQuotaViolation({
        dailyCount: 0,
        storedBytes: 0,
        incomingBytes: MESSAGE_IMAGE_STORAGE_LIMIT_BYTES + 1,
      }),
    ).toBe("STORAGE");
  });

  it("reports the daily cap first when both limits are exceeded", () => {
    expect(
      imageQuotaViolation({
        dailyCount: MESSAGE_IMAGE_DAILY_LIMIT,
        storedBytes: MESSAGE_IMAGE_STORAGE_LIMIT_BYTES,
        incomingBytes: MIB,
      }),
    ).toBe("DAILY");
  });
});

describe("lockImageQuota", () => {
  it("does not collide with the pair lock when the sender id is reused", async () => {
    const captured: SQL[] = [];
    const tx = {
      execute: async (query: SQL) => {
        captured.push(query);
        return [];
      },
    } as unknown as LockTransaction;

    await lockImageQuota(tx, VIEWER);

    expect(captured).toHaveLength(1);
    const query = new PgDialect().sqlToQuery(captured[0] as SQL);
    expect(query.sql).toContain("pg_advisory_xact_lock");
    expect(query.sql).not.toContain(VIEWER);
    expect(query.params).toContain(`message-image-quota:${VIEWER}`);
  });
});
