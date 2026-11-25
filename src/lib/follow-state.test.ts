import { describe, expect, it } from "vitest";
import {
  followActionAriaLabel,
  followActionLabel,
  followMode,
  followStateForItem,
} from "./follow-state";

const none = {
  following: false,
  requested: false,
  incomingRequest: false,
  blocked: false,
};

describe("followMode", () => {
  it("maps each flag combination to one action", () => {
    expect(followMode(none)).toBe("none");
    expect(followMode({ ...none, following: true })).toBe("following");
    expect(followMode({ ...none, requested: true })).toBe("requested");
    expect(followMode({ ...none, incomingRequest: true })).toBe("incoming");
    expect(followMode({ ...none, blocked: true })).toBe("blocked");
  });

  it("prefers an incoming request and hides every action when blocked", () => {
    expect(
      followMode({ ...none, following: true, incomingRequest: true }),
    ).toBe("incoming");
    expect(
      followMode({
        following: true,
        requested: true,
        incomingRequest: true,
        blocked: true,
      }),
    ).toBe("blocked");
  });
});

describe("follow labels", () => {
  it("uses the label that matches the pending action", () => {
    expect(followActionLabel("none")).toBe("Follow");
    expect(followActionLabel("requested")).toBe("Requested");
    expect(followActionLabel("following")).toBe("Following");
    expect(followActionLabel("incoming")).toBe("Accept request");
  });

  it("describes the action for assistive tech", () => {
    expect(followActionAriaLabel("none", "ada")).toBe("Follow @ada");
    expect(followActionAriaLabel("requested", "ada")).toBe(
      "Cancel follow request to @ada",
    );
    expect(followActionAriaLabel("following", "ada")).toBe("Unfollow @ada");
    expect(followActionAriaLabel("incoming", "ada")).toBe(
      "Accept follow request from @ada",
    );
  });
});

describe("followStateForItem", () => {
  it("adapts a connection row to the follow button state", () => {
    expect(followStateForItem({ isFollowing: true })).toMatchObject({
      following: true,
      requested: false,
      incomingRequest: false,
      blocked: false,
    });
    expect(followStateForItem({ isFollowing: false }).following).toBe(false);
  });
});
