import { sql } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";
import type { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { conversations } from "@/server/db/schema";
import { ApiError } from "@/server/api/errors";
import { MAX_JSON_BODY_BYTES, parseJson } from "@/server/api/validation";
import { isMuted } from "./conversation-mutes";
import {
  clampPage,
  conversationHref,
  isParticipant,
  isUuid,
  maskDeletedBody,
  messageDedupeKey,
  messageNotificationTitle,
  normalizeMessageBody,
  normalizePair,
  otherParticipantId,
  shouldNotifyMessage,
  toLastMessagePreview,
  toMessageItem,
  truncatePreview,
} from "./message-helpers";
import {
  notBannedCounterpart,
  notBlockedWithViewer,
  notMutedForViewer,
} from "./message-queries";
import {
  invalidateUnreadCacheFor,
  parseCachedUnreadCount,
  unreadCacheKey,
  UNREAD_CACHE_TTL_SECONDS,
} from "./message-unread-cache";
import {
  MESSAGES_LIST_RATE_LIMIT,
  MESSAGES_PAGE_RATE_WINDOW_SECONDS,
  MESSAGES_THREAD_RATE_LIMIT,
} from "./messages";

const VIEWER = "6f8a1f34-3d4b-4f7e-9a51-2d3c4b5a6e70";
const PEER = "0b1c2d3e-4f5a-4b6c-8d7e-9f0a1b2c3d4e";

function messageRow(overrides: Partial<{ deletedAt: Date | null }> = {}) {
  return {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    body: "  hello there  ",
    senderId: VIEWER,
    createdAt: new Date("2026-01-02T03:04:05.000Z"),
    readAt: null,
    deletedAt: overrides.deletedAt ?? null,
  };
}

describe("normalizePair", () => {
  it("puts the lexicographically smaller UUID in userAId", () => {
    expect(normalizePair(VIEWER, PEER)).toEqual({
      userAId: PEER,
      userBId: VIEWER,
    });
    expect(normalizePair(PEER, VIEWER)).toEqual({
      userAId: PEER,
      userBId: VIEWER,
    });
  });

  it("is stable regardless of argument order", () => {
    expect(normalizePair(VIEWER, PEER)).toEqual(normalizePair(PEER, VIEWER));
  });
});

describe("participant helpers", () => {
  const conversation = normalizePair(VIEWER, PEER);

  it("recognises both participants only", () => {
    expect(isParticipant(conversation, VIEWER)).toBe(true);
    expect(isParticipant(conversation, PEER)).toBe(true);
    expect(isParticipant(conversation, "unknown")).toBe(false);
  });

  it("resolves the other participant for a viewer", () => {
    expect(otherParticipantId(conversation, VIEWER)).toBe(PEER);
    expect(otherParticipantId(conversation, PEER)).toBe(VIEWER);
    expect(otherParticipantId(conversation, "unknown")).toBeNull();
  });
});

describe("normalizeMessageBody", () => {
  it("trims surrounding whitespace", () => {
    expect(normalizeMessageBody("  hi \n")).toBe("hi");
  });

  it("rejects blank bodies", () => {
    expect(() => normalizeMessageBody("   ")).toThrowError(ApiError);
    try {
      normalizeMessageBody("");
    } catch (error) {
      expect((error as ApiError).status).toBe(422);
    }
  });

  it("accepts 2000 characters and rejects 2001", () => {
    expect(normalizeMessageBody("a".repeat(2000))).toHaveLength(2000);
    expect(() => normalizeMessageBody("a".repeat(2001))).toThrowError(ApiError);
  });
});

describe("truncatePreview", () => {
  it("keeps notification previews at or below 120 characters", () => {
    expect(truncatePreview("short")).toBe("short");
    expect(truncatePreview("a".repeat(121))).toBe("a".repeat(120));
  });
});

describe("clampPage", () => {
  it("keeps pages inside the query bounds", () => {
    expect(clampPage(0)).toBe(1);
    expect(clampPage(-5)).toBe(1);
    expect(clampPage(Number.NaN)).toBe(1);
    expect(clampPage(2.9)).toBe(2);
    expect(clampPage(99_999)).toBe(10_000);
  });
});

describe("notification helpers", () => {
  it("builds a unique dedupe key per message", () => {
    expect(messageDedupeKey("abc")).toBe("message:abc");
  });

  it("links notifications to the conversation thread", () => {
    expect(conversationHref("conv-1")).toBe("/dashboard/messages/conv-1");
    expect(messageNotificationTitle("Ayesha")).toContain("Ayesha");
  });
});

describe("isUuid", () => {
  it("accepts canonical UUIDs and rejects malformed ids", () => {
    expect(isUuid(VIEWER)).toBe(true);
    expect(isUuid("not-a-uuid")).toBe(false);
    expect(isUuid(`${VIEWER}0`)).toBe(false);
  });

  it("treats a malformed conversation id as unmuted without a query", async () => {
    await expect(isMuted(VIEWER, "not-a-uuid")).resolves.toBe(false);
  });
});

describe("message notification gating", () => {
  const base = {
    recipientNotifyMessages: true,
    recipientMuted: false,
    hasUnreadFromSender: false,
  };

  it("notifies the first message of a burst", () => {
    expect(shouldNotifyMessage(base)).toBe(true);
  });

  it("stays quiet while the recipient already has an unread message", () => {
    expect(shouldNotifyMessage({ ...base, hasUnreadFromSender: true })).toBe(
      false,
    );
  });

  it("respects the recipient's message preference", () => {
    expect(
      shouldNotifyMessage({ ...base, recipientNotifyMessages: false }),
    ).toBe(false);
  });

  it("respects the recipient's conversation mute", () => {
    expect(shouldNotifyMessage({ ...base, recipientMuted: true })).toBe(false);
  });
});

describe("inbox visibility SQL", () => {
  const dialect = new PgDialect();
  const compile = (viewer: string) =>
    dialect.sqlToQuery(
      sql`select 1 from ${conversations} where ${notBlockedWithViewer(viewer)}`,
    );

  it("hides conversations blocked in either direction", () => {
    const query = compile(VIEWER);
    expect(query.sql).toContain("not exists");
    expect(query.sql).toContain('"user_blocks"."blocker_id" =');
    expect(query.sql).toContain('"user_blocks"."blocked_id" =');
    expect(query.sql).toContain('"conversations"."user_a_id"');
    expect(query.sql).toContain('"conversations"."user_b_id"');
    // The viewer id is a bound parameter, never interpolated into the SQL.
    expect(query.sql).not.toContain(VIEWER);
    expect(query.params).toContain(VIEWER);
  });

  it("excludes muted conversations from unread counts", () => {
    const query = dialect.sqlToQuery(
      sql`select 1 from ${conversations} where ${notMutedForViewer(VIEWER)}`,
    );
    expect(query.sql).toContain("not exists");
    expect(query.sql).toContain('"conversation_mutes"."conversation_id"');
    expect(query.sql).toContain('"conversations"."id"');
    expect(query.params).toContain(VIEWER);
  });

  it("hides conversations whose counterpart is banned", () => {
    const query = dialect.sqlToQuery(
      sql`select 1 from ${conversations} where ${notBannedCounterpart(VIEWER)}`,
    );
    expect(query.sql).toContain("not exists");
    expect(query.sql).toContain('"users"."is_banned"');
    expect(query.sql).toContain('"users"."id" in');
    expect(query.sql).toContain('"conversations"."user_a_id"');
    expect(query.sql).toContain('"conversations"."user_b_id"');
    expect(query.sql).toContain('"users"."id" <>');
    // Only the viewer id is bound; the banned flag is a column, not a value.
    expect(query.sql).not.toContain(VIEWER);
    expect(query.params).toContain(VIEWER);
  });
});

describe("deleted message masking", () => {
  it("keeps the body of a live message", () => {
    expect(maskDeletedBody({ body: "hi", deletedAt: null })).toEqual({
      body: "hi",
      deleted: false,
    });
  });

  it("drops the body of a deleted message", () => {
    expect(
      maskDeletedBody({ body: "secret", deletedAt: new Date() }),
    ).toEqual({ body: "", deleted: true });
  });

  it("masks deleted rows in message items and previews", () => {
    expect(toMessageItem(messageRow(), VIEWER)).toMatchObject({
      body: "  hello there  ",
      mine: true,
      deleted: false,
      readAt: null,
    });
    expect(toMessageItem(messageRow({ deletedAt: new Date() }), VIEWER)).toMatchObject({
      body: "",
      deleted: true,
    });
    expect(
      toLastMessagePreview(messageRow({ deletedAt: new Date() }), PEER),
    ).toEqual({
      body: "",
      mine: false,
      createdAt: "2026-01-02T03:04:05.000Z",
      deleted: true,
    });
  });

  it("returns null when a conversation has no messages", () => {
    expect(toLastMessagePreview(null, VIEWER)).toBeNull();
  });
});

function jsonRequest(
  body: string,
  headers: Record<string, string> = {},
): NextRequest {
  return {
    headers: new Headers(headers),
    text: async () => body,
  } as unknown as NextRequest;
}

async function rejected(promise: Promise<unknown>): Promise<ApiError> {
  try {
    await promise;
  } catch (error) {
    expect(error).toBeInstanceOf(ApiError);
    return error as ApiError;
  }
  throw new Error("expected the call to throw an ApiError");
}

describe("parseJson body cap", () => {
  const schema = z.object({ name: z.string() });

  it("parses a valid body under the cap", async () => {
    await expect(
      parseJson(jsonRequest('{"name":"ada"}'), schema),
    ).resolves.toEqual({ name: "ada" });
  });

  it("rejects a declared content-length above 1 MiB", async () => {
    const error = await rejected(
      parseJson(
        jsonRequest("{}", {
          "content-length": String(MAX_JSON_BODY_BYTES + 1),
        }),
        schema,
      ),
    );
    expect(error.status).toBe(413);
    expect(error.code).toBe("PAYLOAD_TOO_LARGE");
  });

  it("rejects an oversized chunked body without content-length", async () => {
    const body = `{"name":"${"a".repeat(MAX_JSON_BODY_BYTES)}"}`;
    const error = await rejected(parseJson(jsonRequest(body), schema));
    expect(error.status).toBe(413);
    expect(error.code).toBe("PAYLOAD_TOO_LARGE");
  });

  it("lets a body exactly at the cap reach the JSON parser", async () => {
    const body = "x".repeat(MAX_JSON_BODY_BYTES);
    const error = await rejected(parseJson(jsonRequest(body), schema));
    expect(error.status).toBe(400);
    expect(error.code).toBe("INVALID_JSON");
  });

  it("keeps the 400 INVALID_JSON behaviour for malformed bodies", async () => {
    const error = await rejected(parseJson(jsonRequest("{"), schema));
    expect(error.status).toBe(400);
    expect(error.code).toBe("INVALID_JSON");
  });

  it("keeps the 422 VALIDATION_ERROR behaviour for schema failures", async () => {
    const error = await rejected(parseJson(jsonRequest("{}"), schema));
    expect(error.status).toBe(422);
    expect(error.code).toBe("VALIDATION_ERROR");
    expect(error.details).toEqual([
      { path: "name", message: expect.any(String) },
    ]);
  });
});

describe("unread message cache", () => {
  it("namespaces the badge count per viewer", () => {
    expect(unreadCacheKey(VIEWER)).toBe(`messages:unread:${VIEWER}`);
    expect(unreadCacheKey(PEER)).not.toBe(unreadCacheKey(VIEWER));
  });

  it("keeps the stale window at 15 seconds", () => {
    expect(UNREAD_CACHE_TTL_SECONDS).toBe(15);
  });

  it("accepts only unsigned integer counts", () => {
    expect(parseCachedUnreadCount("0")).toBe(0);
    expect(parseCachedUnreadCount("42")).toBe(42);
    expect(parseCachedUnreadCount("1.9")).toBe(1);
    expect(parseCachedUnreadCount(null)).toBeNull();
    expect(parseCachedUnreadCount("  ")).toBeNull();
    expect(parseCachedUnreadCount("-1")).toBeNull();
    expect(parseCachedUnreadCount("abc")).toBeNull();
  });

  it("skips Redis entirely for an empty invalidation set", async () => {
    await expect(invalidateUnreadCacheFor([])).resolves.toBeUndefined();
  });
});

describe("messages page rate limits", () => {
  it("allows 120 list views and 240 thread views per minute", () => {
    expect(MESSAGES_LIST_RATE_LIMIT).toBe(120);
    expect(MESSAGES_THREAD_RATE_LIMIT).toBe(240);
    expect(MESSAGES_PAGE_RATE_WINDOW_SECONDS).toBe(60);
  });
});
