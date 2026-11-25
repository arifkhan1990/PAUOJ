import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  redisSet: vi.fn(),
  dbSet: vi.fn(),
  warn: vi.fn(),
}));

vi.mock("@/server/redis", () => ({
  getRedis: () => ({ set: mocks.redisSet }),
}));
vi.mock("@/server/logger", () => ({
  logger: { warn: mocks.warn },
}));
vi.mock("@/server/db", () => ({
  getDb: () => ({
    update: () => ({
      set: (values: Record<string, unknown>) => {
        mocks.dbSet(values);
        return { where: async () => undefined };
      },
    }),
  }),
}));

import type { PresenceInfo } from "@/lib/follow-types";
import {
  NO_ACTIVITY_PRESENCE,
  PRESENCE_ONLINE_WINDOW_MS,
  presenceByUsername,
  presenceForTarget,
  presenceLabel,
  touchPresence,
} from "./presence";

const now = new Date("2026-11-25T12:00:00Z");
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

function ago(ms: number): Date {
  return new Date(now.getTime() - ms);
}

describe("presenceLabel", () => {
  it("marks the five-minute window as online", () => {
    expect(presenceLabel(ago(0), now)).toEqual({
      state: "ONLINE",
      label: "Online now",
    });
    expect(presenceLabel(ago(PRESENCE_ONLINE_WINDOW_MS), now)).toEqual({
      state: "ONLINE",
      label: "Online now",
    });
    // Clock skew: a future timestamp still reads as just-now, not a negative age.
    expect(presenceLabel(new Date(now.getTime() + MINUTE), now)).toEqual({
      state: "ONLINE",
      label: "Online now",
    });
  });

  it("formats minutes, hours, days, weeks, months and years", () => {
    expect(presenceLabel(ago(7 * MINUTE), now).label).toBe(
      "Last active 7m ago",
    );
    expect(presenceLabel(ago(59 * MINUTE), now).label).toBe(
      "Last active 59m ago",
    );
    expect(presenceLabel(ago(3 * HOUR), now).label).toBe("Last active 3h ago");
    expect(presenceLabel(ago(2 * DAY), now).label).toBe("Last active 2d ago");
    expect(presenceLabel(ago(21 * DAY), now).label).toBe("Last active 3w ago");
    expect(presenceLabel(ago(120 * DAY), now).label).toBe(
      "Last active 4mo ago",
    );
    expect(presenceLabel(ago(400 * DAY), now).label).toBe("Last active 1y ago");
  });

  it("floors each bucket instead of rounding up", () => {
    expect(presenceLabel(ago(59 * MINUTE + 59_000), now).label).toBe(
      "Last active 59m ago",
    );
    expect(presenceLabel(ago(2 * HOUR - 1), now).label).toBe(
      "Last active 1h ago",
    );
    expect(presenceLabel(ago(6 * DAY + 23 * HOUR), now).label).toBe(
      "Last active 6d ago",
    );
    expect(presenceLabel(ago(34 * DAY), now).label).toBe(
      "Last active 4w ago",
    );
    expect(presenceLabel(ago(35 * DAY), now).label).toBe(
      "Last active 1mo ago",
    );
  });

  it("never returns an exact timestamp, a bare 'Active' or 'Offline'", () => {
    for (const elapsed of [7 * MINUTE, 5 * DAY, 5 * 30 * DAY, 3 * 365 * DAY]) {
      const { state, label } = presenceLabel(ago(elapsed), now);
      expect(state).toBe("RECENT");
      expect(label).toMatch(/^Last active \d+(?:m|h|d|w|mo|y) ago$/);
      expect(label).not.toContain(ago(elapsed).toISOString());
    }
  });

  it("reports users with no recorded activity", () => {
    expect(presenceLabel(null, now)).toEqual(NO_ACTIVITY_PRESENCE);
    expect(presenceLabel(null, now)).toEqual({
      state: "OFFLINE",
      label: "No recent activity",
    });
  });
});

describe("presenceForTarget", () => {
  const active = {
    id: "target",
    lastActiveAt: ago(MINUTE),
    presenceVisibility: "EVERYONE" as const,
  };

  it("always shows the viewer's own activity", () => {
    expect(
      presenceForTarget(
        { ...active, id: "me" },
        { viewerId: "me", viewerFollowsTarget: false, blocked: false, now },
      ).state,
    ).toBe("ONLINE");
  });

  it("hides blocked profiles", () => {
    expect(
      presenceForTarget(active, {
        viewerId: "me",
        viewerFollowsTarget: true,
        blocked: true,
        now,
      }),
    ).toEqual({ state: "HIDDEN", label: null });
  });

  it("enforces follower-only visibility", () => {
    const followersOnly = {
      ...active,
      presenceVisibility: "FOLLOWERS" as const,
    };
    expect(
      presenceForTarget(followersOnly, {
        viewerId: "me",
        viewerFollowsTarget: false,
        blocked: false,
        now,
      }).state,
    ).toBe("HIDDEN");
    expect(
      presenceForTarget(followersOnly, {
        viewerId: "me",
        viewerFollowsTarget: true,
        blocked: false,
        now,
      }).state,
    ).toBe("ONLINE");
  });

  it("hides nobody-visible activity from everyone else", () => {
    expect(
      presenceForTarget(
        { ...active, presenceVisibility: "NOBODY" },
        {
          viewerId: "me",
          viewerFollowsTarget: true,
          blocked: false,
          now,
        },
      ).state,
    ).toBe("HIDDEN");
  });
});

describe("presenceByUsername", () => {
  it("re-keys resolved presence for rank rows and falls back when missing", () => {
    const rows = [
      { id: "u1", username: "ada" },
      { id: "u2", username: "grace" },
    ];
    const presence = new Map<string, PresenceInfo>([
      ["u1", { state: "ONLINE", label: "Online now" }],
    ]);

    const byUsername = presenceByUsername(rows, presence);

    expect(byUsername.get("ada")).toEqual({
      state: "ONLINE",
      label: "Online now",
    });
    expect(byUsername.get("grace")).toEqual({
      state: "OFFLINE",
      label: "No recent activity",
    });
  });
});

describe("touchPresence", () => {
  beforeEach(() => {
    mocks.redisSet.mockReset();
    mocks.dbSet.mockReset();
    mocks.warn.mockReset();
  });

  it("writes at most once a minute per user when Redis throws", async () => {
    mocks.redisSet.mockRejectedValue(new Error("redis down"));
    const userId = `fallback-${crypto.randomUUID()}`;

    await touchPresence(userId);
    await touchPresence(userId);
    await touchPresence(userId);

    expect(mocks.dbSet).toHaveBeenCalledTimes(1);
    // Every Redis failure is still logged; only the write is throttled.
    expect(mocks.warn).toHaveBeenCalledTimes(3);
    expect(mocks.warn).toHaveBeenCalledWith(
      "Presence throttle unavailable",
      expect.objectContaining({ userId, error: "redis down" }),
    );
  });

  it("keeps the fallback throttle per user", async () => {
    mocks.redisSet.mockRejectedValue(new Error("redis down"));
    const first = `fallback-${crypto.randomUUID()}`;
    const second = `fallback-${crypto.randomUUID()}`;

    await touchPresence(first);
    await touchPresence(second);

    expect(mocks.dbSet).toHaveBeenCalledTimes(2);
  });

  it("writes when Redis acquires the throttle key", async () => {
    mocks.redisSet.mockResolvedValue("OK");

    await touchPresence(`redis-${crypto.randomUUID()}`);

    expect(mocks.redisSet).toHaveBeenCalledWith(
      expect.stringMatching(/^presence:touch:/),
      "1",
      "EX",
      60,
      "NX",
    );
    expect(mocks.dbSet).toHaveBeenCalledTimes(1);
    expect(mocks.warn).not.toHaveBeenCalled();
  });

  it("skips the write when Redis already holds the throttle key", async () => {
    mocks.redisSet.mockResolvedValue(null);

    await touchPresence(`reset-${crypto.randomUUID()}`);

    expect(mocks.dbSet).not.toHaveBeenCalled();
  });
});
