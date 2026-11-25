import { describe, expect, it } from "vitest";
import {
  REPORT_DETAILS_MAX,
  REPORT_REASONS,
  buildReportPayload,
  reportReasonLabel,
} from "./report-reasons";

describe("reportReasonLabel", () => {
  it("labels every API reason", () => {
    expect(reportReasonLabel("SPAM")).toBe("Spam or advertising");
    expect(reportReasonLabel("HARASSMENT")).toBe("Harassment or bullying");
    expect(reportReasonLabel("HATE")).toBe("Hate speech");
    expect(reportReasonLabel("SCAM")).toBe("Scam or fraud");
    expect(reportReasonLabel("IMPERSONATION")).toBe("Impersonation");
    expect(reportReasonLabel("OTHER")).toBe("Something else");
  });

  it("has a unique label and value for each option", () => {
    expect(new Set(REPORT_REASONS.map((option) => option.value)).size).toBe(
      REPORT_REASONS.length,
    );
    expect(new Set(REPORT_REASONS.map((option) => option.label)).size).toBe(
      REPORT_REASONS.length,
    );
  });
});

describe("buildReportPayload", () => {
  it("builds a conversation report without optional fields", () => {
    expect(
      buildReportPayload({
        kind: "CONVERSATION",
        username: "coder",
        reason: "HARASSMENT",
        conversationId: "conv-1",
      }),
    ).toEqual({
      kind: "CONVERSATION",
      username: "coder",
      reason: "HARASSMENT",
      conversationId: "conv-1",
    });
  });

  it("keeps the message id for a message report", () => {
    const payload = buildReportPayload({
      kind: "MESSAGE",
      username: "coder",
      reason: "SPAM",
      conversationId: "conv-1",
      messageId: "msg-9",
    });
    expect(payload.messageId).toBe("msg-9");
    expect(payload.conversationId).toBe("conv-1");
  });

  it("omits empty ids and blank details", () => {
    const payload = buildReportPayload({
      kind: "FOLLOW_REQUEST",
      username: "coder",
      reason: "OTHER",
      conversationId: null,
      messageId: "",
      details: "   ",
    });
    expect(payload).not.toHaveProperty("conversationId");
    expect(payload).not.toHaveProperty("messageId");
    expect(payload).not.toHaveProperty("details");
  });

  it("trims details and caps them at the server limit", () => {
    expect(
      buildReportPayload({
        kind: "PROFILE",
        username: "coder",
        reason: "IMPERSONATION",
        details: "  Pretending to be me  ",
      }).details,
    ).toBe("Pretending to be me");

    const long = "x".repeat(REPORT_DETAILS_MAX + 50);
    expect(
      buildReportPayload({
        kind: "PROFILE",
        username: "coder",
        reason: "OTHER",
        details: long,
      }).details,
    ).toHaveLength(REPORT_DETAILS_MAX);
  });
});
