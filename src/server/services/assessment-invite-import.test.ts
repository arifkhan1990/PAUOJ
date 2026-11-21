import { describe, expect, it } from "vitest";
import { ApiError } from "@/server/api/errors";
import {
  EMAIL_DUPLICATE_FIX,
  classifyInviteError,
  inviteImportStatus,
} from "./assessment-invite-import";

describe("inviteImportStatus", () => {
  it("maps createInvite flags to the report status", () => {
    expect(inviteImportStatus({ created: true, updated: false })).toBe(
      "created",
    );
    expect(inviteImportStatus({ created: false, updated: true })).toBe(
      "updated",
    );
    expect(inviteImportStatus({ created: false, updated: false })).toBe(
      "unchanged",
    );
  });
});

describe("classifyInviteError", () => {
  it("reports a taken email as duplicate with the link-only fix", () => {
    const failure = classifyInviteError(
      new ApiError("INVITE_EMAIL_TAKEN", "Email already used.", 409),
    );
    expect(failure).toEqual({
      status: "duplicate",
      reason: "Email already used.",
      fix: EMAIL_DUPLICATE_FIX,
    });
  });

  it("reports other validation errors as invalid", () => {
    expect(
      classifyInviteError(new ApiError("VALIDATION_ERROR", "Bad row.", 422)),
    ).toEqual({ status: "invalid", reason: "Bad row." });
  });

  it("treats ownership and server errors as fatal", () => {
    expect(
      classifyInviteError(new ApiError("NOT_FOUND", "Missing.", 404)),
    ).toBe("fatal");
    expect(
      classifyInviteError(new ApiError("FORBIDDEN", "Nope.", 403)),
    ).toBe("fatal");
    expect(
      classifyInviteError(new ApiError("INTERNAL_ERROR", "Boom.", 500)),
    ).toBe("fatal");
    expect(classifyInviteError(new Error("unexpected"))).toBe("fatal");
  });
});
