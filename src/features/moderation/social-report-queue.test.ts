import { describe, expect, it } from "vitest";
import {
  SOCIAL_REPORT_KIND_LABELS,
  SOCIAL_REPORT_REASON_LABELS,
  SOCIAL_REPORT_STATUS_TABS,
  socialReportHref,
  socialReportKindLabel,
  socialReportReasonLabel,
  statusTabLabel,
} from "./social-report-queue";

const BASE = "/admin/social-reports";

describe("status tabs", () => {
  it("exposes the four moderation filters in order", () => {
    expect(SOCIAL_REPORT_STATUS_TABS.map((tab) => tab.value)).toEqual([
      "open",
      "resolved",
      "dismissed",
      "all",
    ]);
  });

  it("labels each filter", () => {
    expect(SOCIAL_REPORT_STATUS_TABS.map((tab) => tab.label)).toEqual([
      "Open",
      "Resolved",
      "Dismissed",
      "All",
    ]);
    expect(statusTabLabel("open")).toBe("Open");
    expect(statusTabLabel("resolved")).toBe("Resolved");
    expect(statusTabLabel("dismissed")).toBe("Dismissed");
    expect(statusTabLabel("all")).toBe("All");
  });
});

describe("kind labels", () => {
  it("labels every report kind", () => {
    expect(SOCIAL_REPORT_KIND_LABELS).toEqual({
      MESSAGE: "Message",
      CONVERSATION: "Conversation",
      FOLLOW_REQUEST: "Follow request",
      PROFILE: "Profile",
    });
  });

  it("resolves a label per kind", () => {
    expect(socialReportKindLabel("MESSAGE")).toBe("Message");
    expect(socialReportKindLabel("CONVERSATION")).toBe("Conversation");
    expect(socialReportKindLabel("FOLLOW_REQUEST")).toBe("Follow request");
    expect(socialReportKindLabel("PROFILE")).toBe("Profile");
  });
});

describe("reason labels", () => {
  it("labels every report reason", () => {
    expect(SOCIAL_REPORT_REASON_LABELS).toEqual({
      SPAM: "Spam",
      HARASSMENT: "Harassment",
      HATE: "Hate speech",
      SCAM: "Scam",
      IMPERSONATION: "Impersonation",
      OTHER: "Other",
    });
  });

  it("resolves a label per reason", () => {
    expect(socialReportReasonLabel("SPAM")).toBe("Spam");
    expect(socialReportReasonLabel("HARASSMENT")).toBe("Harassment");
    expect(socialReportReasonLabel("HATE")).toBe("Hate speech");
    expect(socialReportReasonLabel("SCAM")).toBe("Scam");
    expect(socialReportReasonLabel("IMPERSONATION")).toBe("Impersonation");
    expect(socialReportReasonLabel("OTHER")).toBe("Other");
  });
});

describe("socialReportHref", () => {
  it("links a status tab", () => {
    expect(socialReportHref(BASE, {}, "open")).toBe(`${BASE}?status=open`);
    expect(socialReportHref(BASE, {}, "all")).toBe(`${BASE}?status=all`);
  });

  it("drops the page offset when switching status", () => {
    expect(
      socialReportHref(BASE, { status: "resolved", page: "4" }, "dismissed"),
    ).toBe(`${BASE}?status=dismissed`);
  });

  it("keeps a requested page and unrelated params", () => {
    expect(socialReportHref(BASE, { q: "spam" }, "dismissed", 2)).toBe(
      `${BASE}?q=spam&status=dismissed&page=2`,
    );
    expect(
      socialReportHref(BASE, { status: "open", page: "3" }, "open", 1),
    ).toBe(`${BASE}?status=open&page=1`);
  });

  it("returns the bare path only when the query is empty", () => {
    expect(socialReportHref(BASE, { page: "2" }, "open")).toBe(
      `${BASE}?status=open`,
    );
  });
});
