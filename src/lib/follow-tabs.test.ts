import { describe, expect, it } from "vitest";
import { followTabLabel, readFollowTab } from "./follow-tabs";

describe("readFollowTab", () => {
  it("defaults to followers", () => {
    expect(readFollowTab(undefined)).toBe("followers");
  });

  it("falls back to followers for unknown tabs", () => {
    expect(readFollowTab("followers")).toBe("followers");
    expect(readFollowTab("following")).toBe("following");
    expect(readFollowTab("")).toBe("followers");
    expect(readFollowTab("likes")).toBe("followers");
  });

  it("reads the first value from repeated query params", () => {
    expect(readFollowTab(["following", "followers"])).toBe("following");
    expect(readFollowTab(["nope", "following"])).toBe("followers");
  });

  it("labels both lists for headings and metadata", () => {
    expect(followTabLabel("followers")).toBe("Followers");
    expect(followTabLabel("following")).toBe("Following");
  });
});
