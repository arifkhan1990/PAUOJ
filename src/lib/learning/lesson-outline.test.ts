import { describe, expect, it } from "vitest";
import { extractMarkdownHeadings } from "@/lib/learning/lesson-outline";

describe("extractMarkdownHeadings", () => {
  it("reads level 2 and 3 headings in document order with line ids", () => {
    const markdown = [
      "Intro paragraph", // line 1
      "", // 2
      "## কেন দরকার", // 3
      "text", // 4
      "### মূল ধারণা", // 5
      "more", // 6
      "## Big-O", // 7
    ].join("\n");

    expect(extractMarkdownHeadings(markdown, "concept")).toEqual([
      { id: "concept-3", label: "কেন দরকার", level: 2 },
      { id: "concept-5", label: "মূল ধারণা", level: 3 },
      { id: "concept-7", label: "Big-O", level: 2 },
    ]);
  });

  it("ignores headings inside backtick and tilde fences", () => {
    const markdown = [
      "## Real", // 1
      "```py", // 2
      "## not a heading", // 3
      "```", // 4
      "~~~", // 5
      "### also not", // 6
      "~~~", // 7
      "### Again real", // 8
    ].join("\n");

    expect(extractMarkdownHeadings(markdown, "p").map((item) => item.id)).toEqual([
      "p-1",
      "p-8",
    ]);
  });

  it("ignores headings inside html comments", () => {
    const markdown = [
      "<!--", // 1
      "## hidden", // 2
      "-->", // 3
      "## visible", // 4
      "<!-- ## same line hidden -->", // 5
      "### still visible", // 6
    ].join("\n");

    expect(extractMarkdownHeadings(markdown, "p").map((item) => item.label)).toEqual(
      ["visible", "still visible"],
    );
  });

  it("strips inline markdown from labels", () => {
    const markdown = [
      "## **Bold** and `code`", // 1
      "## [Link](https://example.com) here", // 2
      "### _em_ and __strong__", // 3
      "## ![alt text](img.png) image", // 4
    ].join("\n");

    expect(extractMarkdownHeadings(markdown, "p").map((item) => item.label)).toEqual(
      ["Bold and code", "Link here", "em and strong", "alt text image"],
    );
  });

  it("drops trailing closing hashes", () => {
    const markdown = "## Closed heading ##";
    expect(extractMarkdownHeadings(markdown, "p")[0]?.label).toBe("Closed heading");
  });

  it("never treats level 1 headings as outline items", () => {
    const markdown = ["# Title", "## Section"].join("\n");
    expect(extractMarkdownHeadings(markdown, "p")).toEqual([
      { id: "p-2", label: "Section", level: 2 },
    ]);
  });

  it("keeps duplicate labels distinct through the line id", () => {
    const markdown = ["## Same", "text", "## Same"].join("\n");
    expect(extractMarkdownHeadings(markdown, "p").map((item) => item.id)).toEqual([
      "p-1",
      "p-3",
    ]);
  });

  it("skips indented code blocks and empty input", () => {
    expect(extractMarkdownHeadings("    ## code", "p")).toEqual([]);
    expect(extractMarkdownHeadings("", "p")).toEqual([]);
  });
});
