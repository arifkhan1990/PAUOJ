import type { SQL } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";
import {
  attachmentQuotaViolation,
  lockAttachmentQuota,
  MESSAGE_ATTACHMENT_DAILY_LIMIT,
  MESSAGE_ATTACHMENT_DAILY_WINDOW_MS,
  MESSAGE_ATTACHMENT_STORAGE_LIMIT_BYTES,
} from "./message-attachment-quota";

const VIEWER = "6f8a1f34-3d4b-4f7e-9a51-2d3c4b5a6e70";
const MIB = 1024 * 1024;

type LockTransaction = Parameters<typeof lockAttachmentQuota>[0];

describe("attachment quota constants", () => {
  it("caps 50 files per rolling day and 250 MiB stored", () => {
    expect(MESSAGE_ATTACHMENT_DAILY_LIMIT).toBe(50);
    expect(MESSAGE_ATTACHMENT_DAILY_WINDOW_MS).toBe(24 * 60 * 60 * 1000);
    expect(MESSAGE_ATTACHMENT_STORAGE_LIMIT_BYTES).toBe(250 * 1024 * 1024);
  });
});

describe("attachmentQuotaViolation", () => {
  const storage = {
    storedBytes: 0,
    incomingBytes: MIB,
  };

  it("allows an upload with room under both caps", () => {
    expect(
      attachmentQuotaViolation({ dailyCount: 0, ...storage }),
    ).toBeNull();
  });

  it("allows the 50th file of the window but rejects the 51st", () => {
    expect(
      attachmentQuotaViolation({ dailyCount: 49, ...storage }),
    ).toBeNull();
    expect(
      attachmentQuotaViolation({ dailyCount: 50, ...storage }),
    ).toBe("DAILY");
    expect(
      attachmentQuotaViolation({ dailyCount: 51, ...storage }),
    ).toBe("DAILY");
  });

  it("allows exactly 250 MiB and rejects the next byte", () => {
    expect(
      attachmentQuotaViolation({
        dailyCount: 0,
        storedBytes: MESSAGE_ATTACHMENT_STORAGE_LIMIT_BYTES - MIB,
        incomingBytes: MIB,
      }),
    ).toBeNull();
    expect(
      attachmentQuotaViolation({
        dailyCount: 0,
        storedBytes: MESSAGE_ATTACHMENT_STORAGE_LIMIT_BYTES - MIB,
        incomingBytes: MIB + 1,
      }),
    ).toBe("STORAGE");
  });

  it("rejects when incoming bytes alone cross the storage cap", () => {
    expect(
      attachmentQuotaViolation({
        dailyCount: 0,
        storedBytes: 0,
        incomingBytes: MESSAGE_ATTACHMENT_STORAGE_LIMIT_BYTES + 1,
      }),
    ).toBe("STORAGE");
  });

  it("reports the daily cap first when both limits are exceeded", () => {
    expect(
      attachmentQuotaViolation({
        dailyCount: MESSAGE_ATTACHMENT_DAILY_LIMIT,
        storedBytes: MESSAGE_ATTACHMENT_STORAGE_LIMIT_BYTES,
        incomingBytes: MIB,
      }),
    ).toBe("DAILY");
  });

  it("applies the same counters to a 5 MiB document", () => {
    const documentBytes = 5 * MIB;
    expect(
      attachmentQuotaViolation({
        dailyCount: 49,
        storedBytes: MESSAGE_ATTACHMENT_STORAGE_LIMIT_BYTES - documentBytes,
        incomingBytes: documentBytes,
      }),
    ).toBeNull();
    expect(
      attachmentQuotaViolation({
        dailyCount: 49,
        storedBytes: MESSAGE_ATTACHMENT_STORAGE_LIMIT_BYTES - documentBytes + 1,
        incomingBytes: documentBytes,
      }),
    ).toBe("STORAGE");
  });
});

describe("lockAttachmentQuota", () => {
  it("does not collide with the pair lock when the sender id is reused", async () => {
    const captured: SQL[] = [];
    const tx = {
      execute: async (query: SQL) => {
        captured.push(query);
        return [];
      },
    } as unknown as LockTransaction;

    await lockAttachmentQuota(tx, VIEWER);

    expect(captured).toHaveLength(1);
    const query = new PgDialect().sqlToQuery(captured[0] as SQL);
    expect(query.sql).toContain("pg_advisory_xact_lock");
    expect(query.sql).not.toContain(VIEWER);
    expect(query.params).toContain(`message-attachment-quota:${VIEWER}`);
  });
});
