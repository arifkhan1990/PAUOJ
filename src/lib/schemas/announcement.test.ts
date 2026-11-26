import { describe, expect, it } from "vitest";
import { announcementSchema } from "./announcement";

const base = {
  title: "Scheduled maintenance",
  body: "The judge pauses for twenty minutes on Sunday night.",
};

function parseHref(href: string) {
  return announcementSchema.safeParse({ ...base, href });
}

describe("announcementSchema href", () => {
  it("accepts empty and same-site paths", () => {
    expect(parseHref("").success).toBe(true);
    expect(parseHref("/contests").success).toBe(true);
    expect(parseHref("/learn/dp?tab=notes#top").success).toBe(true);
  });

  it("rejects protocol-relative, absolute, backslash and control paths", () => {
    for (const href of [
      "//evil.example/path",
      "https://evil.example/path",
      "javascript:alert(1)",
      "\\evil",
      "/a\\b",
      "/a\nb",
    ]) {
      expect(parseHref(href).success, href).toBe(false);
    }
  });
});
