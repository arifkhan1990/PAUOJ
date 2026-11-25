import { afterEach, describe, expect, it } from "vitest";
import type { NotificationType } from "@/lib/notification-types";
import { PUSH_TYPES, buildPushPayload, isPushConfigured } from "./web-push";

const NOTIFICATION = {
  type: "CONTEST_REMINDER" as NotificationType,
  title: "Contest starts soon",
  body: "Round 3 starts in 15 minutes.",
  href: "/contests/weekly-round-3",
};

describe("buildPushPayload", () => {
  it("keeps the title, body and in-app path for ordinary notifications", () => {
    expect(buildPushPayload(NOTIFICATION)).toEqual({
      title: "Contest starts soon",
      body: "Round 3 starts in 15 minutes.",
      url: "/contests/weekly-round-3",
      tag: "pauoj:CONTEST_REMINDER",
    });
  });

  it("never leaks private message or discussion text", () => {
    const secret = "Meet me at the library at 9, bring the keys.";
    for (const type of ["MESSAGE", "DISCUSSION"] as NotificationType[]) {
      const payload = buildPushPayload({
        type,
        title: "New message",
        body: secret,
        href: "/messages/abc",
      });
      expect(payload.body).toBe("Open PAU OJ to read it.");
      expect(JSON.stringify(payload)).not.toContain("library");
    }
  });

  it("tags messages per conversation and everything else per type", () => {
    expect(
      buildPushPayload({
        type: "MESSAGE",
        title: "New message",
        body: "x",
        href: "/messages/abc",
      }).tag,
    ).toBe("message:/messages/abc");
    expect(
      buildPushPayload({
        type: "ANNOUNCEMENT",
        title: "Announcement",
        body: "x",
      }).tag,
    ).toBe("pauoj:ANNOUNCEMENT");
  });

  it("truncates long bodies to 140 characters", () => {
    const payload = buildPushPayload({
      ...NOTIFICATION,
      body: "A".repeat(400),
    });
    expect(payload.body).toHaveLength(140);
  });

  it("falls back to the notification inbox when the href is missing", () => {
    expect(buildPushPayload({ ...NOTIFICATION, href: null }).url).toBe(
      "/dashboard/notifications",
    );
    expect(buildPushPayload({ ...NOTIFICATION, href: undefined }).url).toBe(
      "/dashboard/notifications",
    );
  });

  it("neutralizes absolute and protocol-relative URLs", () => {
    const hostile = [
      "https://evil.example/phish",
      "http://evil.example",
      "//evil.example/path",
      "/\\evil.example",
      "javascript:alert(1)",
      "data:text/html,<script>alert(1)</script>",
      "/ok\nLocation: https://evil.example",
    ];
    for (const href of hostile) {
      expect(buildPushPayload({ ...NOTIFICATION, href }).url).toBe(
        "/dashboard/notifications",
      );
    }
  });

  it("keeps a safe in-app path with a query string", () => {
    expect(
      buildPushPayload({ ...NOTIFICATION, href: "/messages/abc?tab=info" }).url,
    ).toBe("/messages/abc?tab=info");
  });
});

describe("PUSH_TYPES", () => {
  it("includes the interactive notification classes", () => {
    const included: NotificationType[] = [
      "MESSAGE",
      "FOLLOW_REQUEST",
      "FOLLOW_ACCEPTED",
      "CONTEST_REGISTRATION",
      "CONTEST_REMINDER",
      "CONTEST_RESULT",
      "ACHIEVEMENT",
      "MILESTONE",
      "ANNOUNCEMENT",
      "LEARNING_REMINDER",
      "LEARNING_PAYMENT",
      "DISCUSSION",
    ];
    expect([...PUSH_TYPES].sort()).toEqual([...included].sort());
  });

  it("excludes marketing, verdicts, system and review noise", () => {
    const excluded: NotificationType[] = [
      "WELCOME",
      "MARKETING",
      "VERDICT",
      "SYSTEM",
      "CONTRIBUTION",
      "CONTEST_APPROVAL",
      "CLARIFICATION",
    ];
    for (const type of excluded) {
      expect(PUSH_TYPES).not.toContain(type);
    }
  });
});

describe("isPushConfigured", () => {
  const saved = {
    publicKey: process.env.WEB_PUSH_PUBLIC_KEY,
    privateKey: process.env.WEB_PUSH_PRIVATE_KEY,
  };

  afterEach(() => {
    restore("WEB_PUSH_PUBLIC_KEY", saved.publicKey);
    restore("WEB_PUSH_PRIVATE_KEY", saved.privateKey);
  });

  function restore(key: string, value: string | undefined): void {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }

  it("does not throw when the VAPID keys are empty", () => {
    process.env.WEB_PUSH_PUBLIC_KEY = "";
    process.env.WEB_PUSH_PRIVATE_KEY = "";
    expect(() => isPushConfigured()).not.toThrow();
    expect(isPushConfigured()).toBe(false);
  });

  it("requires both halves of the keypair", () => {
    process.env.WEB_PUSH_PUBLIC_KEY = "public";
    process.env.WEB_PUSH_PRIVATE_KEY = "";
    expect(isPushConfigured()).toBe(false);

    process.env.WEB_PUSH_PUBLIC_KEY = "";
    process.env.WEB_PUSH_PRIVATE_KEY = "private";
    expect(isPushConfigured()).toBe(false);

    process.env.WEB_PUSH_PUBLIC_KEY = "public";
    process.env.WEB_PUSH_PRIVATE_KEY = "private";
    expect(isPushConfigured()).toBe(true);
  });
});
