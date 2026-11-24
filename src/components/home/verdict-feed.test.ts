import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { SubmissionListItem } from "@/lib/types";
import { VerdictFeed } from "./verdict-feed";

const item: SubmissionListItem = {
  id: "sub-1",
  status: "ACCEPTED",
  language: "cpp",
  createdAt: "2026-11-24T12:00:00.000Z",
  runtimeMs: 12,
  memoryKb: 1024,
  passedTests: 10,
  totalTests: 10,
  problem: { slug: "two-sum", title: "Two Sum" },
  user: { username: "nusrat", displayName: "Nusrat Jahan" },
  contestSlug: null,
  assessmentSlug: null,
};

function render(judgeOnline: boolean): string {
  return renderToStaticMarkup(
    createElement(VerdictFeed, {
      items: [item],
      activity: [],
      judgeOnline,
    }),
  );
}

describe("VerdictFeed judge status", () => {
  it("shows active when a worker heartbeat is present", () => {
    const markup = render(true);
    expect(markup).toContain("Judge active");
    expect(markup).not.toContain("Judge offline");
  });

  it("shows offline when no worker heartbeat is present", () => {
    const markup = render(false);
    expect(markup).toContain("Judge offline");
    expect(markup).not.toContain("Judge active");
  });

  it("does not promise exact failed tests in the feed copy", () => {
    const markup = render(true);
    expect(markup).not.toContain("the exact tests that failed");
    expect(markup).toContain("Open a submission for the exact failed tests");
  });
});
