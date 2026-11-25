import { sql } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";
import { userFollows } from "@/server/db/schema";
import {
  MAX_FOLLOW_PAGE,
  clampFollowPage,
  decideFollowAction,
  deriveFollowFlags,
  followAcceptedDedupeKey,
  followNoticeInput,
  followRequestDedupeKey,
  listedMemberWhere,
  shouldNotifyFollow,
  type FollowTarget,
  type FollowViewer,
} from "./profile-follow-shared";

const viewerId = "11111111-1111-1111-1111-111111111111";
const targetId = "22222222-2222-2222-2222-222222222222";

function flags(
  edges: { forward: "PENDING" | "ACCEPTED" | null; reverse: "PENDING" | "ACCEPTED" | null },
  options: { blocked?: boolean; blockedByViewer?: boolean; viewerId?: string | null } = {},
) {
  return deriveFollowFlags({
    viewerId: options.viewerId === undefined ? viewerId : options.viewerId,
    targetId,
    edges,
    blocked: options.blocked ?? false,
    blockedByViewer: options.blockedByViewer ?? false,
  });
}

describe("deriveFollowFlags", () => {
  it("treats an accepted forward edge as following and messageable", () => {
    const result = flags({ forward: "ACCEPTED", reverse: null });
    expect(result).toMatchObject({
      isFollowing: true,
      requested: false,
      incomingRequest: false,
      canFollow: true,
      canMessage: true,
    });
  });

  it("marks a pending forward edge as requested but not messageable", () => {
    const result = flags({ forward: "PENDING", reverse: null });
    expect(result).toMatchObject({
      isFollowing: false,
      requested: true,
      incomingRequest: false,
      canMessage: false,
    });
  });

  it("marks a pending reverse edge as an incoming request", () => {
    const result = flags({ forward: null, reverse: "PENDING" });
    expect(result).toMatchObject({
      isFollowing: false,
      requested: false,
      incomingRequest: true,
      canMessage: false,
    });
  });

  it("opens messages for an accepted reverse edge", () => {
    const result = flags({ forward: null, reverse: "ACCEPTED" });
    expect(result).toMatchObject({
      isFollowing: false,
      canMessage: true,
    });
  });

  it("disables every social action when a block exists", () => {
    const result = flags(
      { forward: "ACCEPTED", reverse: "ACCEPTED" },
      { blocked: true, blockedByViewer: true },
    );
    expect(result).toMatchObject({
      blocked: true,
      blockedByViewer: true,
      canFollow: false,
      canMessage: false,
    });
  });

  it("cannot follow or message yourself", () => {
    const result = flags(
      { forward: null, reverse: null },
      { viewerId: targetId },
    );
    expect(result.canFollow).toBe(false);
    expect(result.canMessage).toBe(false);
  });

  it("cannot follow anonymously", () => {
    const result = flags({ forward: null, reverse: null }, { viewerId: null });
    expect(result.canFollow).toBe(false);
    expect(result.canMessage).toBe(false);
  });
});

describe("decideFollowAction", () => {
  it("is idempotent when the forward edge is already accepted", () => {
    expect(
      decideFollowAction({ forward: "ACCEPTED", reverse: "PENDING" }),
    ).toBe("noop");
  });

  it("auto-accepts a mutual request", () => {
    expect(decideFollowAction({ forward: null, reverse: "PENDING" })).toBe(
      "accept",
    );
    expect(
      decideFollowAction({ forward: "PENDING", reverse: "PENDING" }),
    ).toBe("accept");
  });

  it("queues a request when no incoming request exists", () => {
    expect(decideFollowAction({ forward: null, reverse: null })).toBe(
      "request",
    );
    expect(
      decideFollowAction({ forward: "PENDING", reverse: null }),
    ).toBe("request");
    expect(
      decideFollowAction({ forward: null, reverse: "ACCEPTED" }),
    ).toBe("request");
  });
});

describe("clampFollowPage", () => {
  it("keeps pages in range", () => {
    expect(clampFollowPage(0)).toBe(1);
    expect(clampFollowPage(-3)).toBe(1);
    expect(clampFollowPage(3.9)).toBe(3);
    expect(clampFollowPage(Number.NaN)).toBe(1);
    expect(clampFollowPage(Number.MAX_SAFE_INTEGER)).toBe(MAX_FOLLOW_PAGE);
  });
});

describe("notification dedupe keys", () => {
  it("scopes request and acceptance keys by actor", () => {
    expect(followRequestDedupeKey(viewerId)).toBe(`follow-request:${viewerId}`);
    expect(followAcceptedDedupeKey(viewerId)).toBe(
      `follow-accepted:${viewerId}`,
    );
  });
});

const target: FollowTarget = {
  id: targetId,
  lastActiveAt: null,
  presenceVisibility: "EVERYONE",
  notifyFollows: true,
  emailFollows: true,
};

const viewer: FollowViewer = {
  id: viewerId,
  username: "viewer",
  displayName: "Viewer",
};

describe("shouldNotifyFollow", () => {
  it("notifies when at least one follow channel is on", () => {
    const cases: [boolean, boolean, boolean][] = [
      [true, true, true],
      [true, false, true],
      [false, true, true],
      [false, false, false],
    ];
    for (const [notifyFollows, emailFollows, expected] of cases) {
      expect(
        shouldNotifyFollow({ notifyFollows, emailFollows }),
        `notify=${notifyFollows} email=${emailFollows}`,
      ).toBe(expected);
    }
  });
});

describe("followNoticeInput", () => {
  it("mirrors notifyFollows into the in-app switch", () => {
    const inAppOn = followNoticeInput({
      target: { ...target, notifyFollows: true },
      viewer,
      accepted: true,
    });
    const inAppOff = followNoticeInput({
      target: { ...target, notifyFollows: false },
      viewer,
      accepted: true,
    });
    expect(inAppOn.inApp).toBe(true);
    expect(inAppOff.inApp).toBe(false);
  });

  it("scopes the accepted notice by actor", () => {
    const notice = followNoticeInput({ target, viewer, accepted: true });
    expect(notice).toMatchObject({
      userId: targetId,
      type: "FOLLOW_ACCEPTED",
      title: "Follow request accepted",
      href: "/users/viewer",
      dedupeKey: followAcceptedDedupeKey(viewerId),
    });
  });

  it("scopes the request notice by actor", () => {
    const notice = followNoticeInput({ target, viewer, accepted: false });
    expect(notice).toMatchObject({
      userId: targetId,
      type: "FOLLOW_REQUEST",
      title: "New follow request",
      dedupeKey: followRequestDedupeKey(viewerId),
    });
  });
});

describe("listedMemberWhere", () => {
  const dialect = new PgDialect();

  function compile(viewer: string | null) {
    const where = listedMemberWhere({
      ownerId: targetId,
      ownerColumn: userFollows.followingId,
      memberColumn: userFollows.followerId,
      viewerId: viewer,
      status: "ACCEPTED",
    });
    return dialect.sqlToQuery(
      sql`select 1 from ${userFollows} where ${where}`,
    );
  }

  it("renders accepted-only, non-banned and not-exists filters", () => {
    const query = compile(viewerId);
    expect(query.sql).toContain('"user_follows"."status" =');
    expect(query.sql).toContain('"users"."is_banned" =');
    expect(query.sql).toContain("not exists");
    expect(query.sql).toContain('"user_blocks"."blocker_id"');
    expect(query.params).toContain("ACCEPTED");
    expect(query.params).toContain(false);
  });

  it("adds a second block guard for the viewer, but not for the owner", () => {
    const ownList = compile(targetId);
    const viewerList = compile(viewerId);
    const count = (value: string) =>
      value.match(/not exists/g)?.length ?? 0;
    expect(count(ownList.sql)).toBe(1);
    expect(count(viewerList.sql)).toBe(2);
  });
});
