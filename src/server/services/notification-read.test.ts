import { beforeEach, describe, expect, it, vi } from "vitest";

const { getDb } = vi.hoisted(() => ({ getDb: vi.fn() }));

vi.mock("@/server/db", () => ({ getDb }));

const {
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} = await import("./notification-read");

type UpdateRow = { id?: string; readAt?: Date | null };

function fakeDb(options: { unread?: number; updated?: UpdateRow[] } = {}) {
  return {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => Promise.resolve([{ value: options.unread ?? 0 }])),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn(() => Promise.resolve(options.updated ?? [])),
        })),
      })),
    })),
  };
}

describe("notification read helpers", () => {
  beforeEach(() => {
    getDb.mockReset();
  });

  it("reads the unread count", async () => {
    getDb.mockReturnValue(fakeDb({ unread: 7 }) as never);
    await expect(getUnreadNotificationCount("user-1")).resolves.toBe(7);
  });

  it("reports how many rows were marked read", async () => {
    getDb.mockReturnValue(
      fakeDb({ updated: [{ id: "a" }, { id: "b" }] }) as never,
    );
    await expect(markAllNotificationsRead("user-1")).resolves.toBe(2);
  });

  it("marks one notification and returns the row timestamp", async () => {
    const readAt = new Date("2026-01-02T03:04:05.000Z");
    getDb.mockReturnValue(fakeDb({ unread: 4, updated: [{ readAt }] }) as never);

    await expect(markNotificationRead("user-1", "note-1")).resolves.toEqual({
      readAt: "2026-01-02T03:04:05.000Z",
      unread: 4,
    });
  });

  it("keeps the original timestamp for an already-read row", async () => {
    const readAt = new Date("2025-12-01T00:00:00.000Z");
    getDb.mockReturnValue(fakeDb({ unread: 0, updated: [{ readAt }] }) as never);

    await expect(markNotificationRead("user-1", "note-1")).resolves.toEqual({
      readAt: "2025-12-01T00:00:00.000Z",
      unread: 0,
    });
  });

  it("throws 404 when the row does not belong to the viewer", async () => {
    getDb.mockReturnValue(fakeDb({ updated: [] }) as never);

    await expect(
      markNotificationRead("user-1", "foreign"),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
      status: 404,
      message: "That notification could not be found.",
    });
  });
});
