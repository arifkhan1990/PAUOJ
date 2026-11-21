import { describe, expect, it } from "vitest";
import { applyMarkdownAction } from "./markdown-editing";

describe("applyMarkdownAction inline formatting", () => {
  it("wraps the selection in bold markers and keeps it selected", () => {
    expect(applyMarkdownAction("make this strong", 5, 9, "bold")).toEqual({
      value: "make **this** strong",
      selectionStart: 7,
      selectionEnd: 11,
    });
  });

  it("inserts and selects a bold placeholder when nothing is selected", () => {
    expect(applyMarkdownAction("hello", 5, 5, "bold")).toEqual({
      value: "hello**bold text**",
      selectionStart: 7,
      selectionEnd: 16,
    });
  });

  it("wraps the selection in italic markers", () => {
    expect(applyMarkdownAction("very sure", 5, 9, "italic")).toEqual({
      value: "very _sure_",
      selectionStart: 6,
      selectionEnd: 10,
    });
  });

  it("wraps the selection in backticks", () => {
    expect(applyMarkdownAction("run npm test", 4, 12, "inline-code")).toEqual({
      value: "run `npm test`",
      selectionStart: 5,
      selectionEnd: 13,
    });
  });

  it("inserts a selectable code placeholder for an empty selection", () => {
    expect(applyMarkdownAction("", 0, 0, "inline-code")).toEqual({
      value: "`code`",
      selectionStart: 1,
      selectionEnd: 5,
    });
  });
});

describe("applyMarkdownAction links and images", () => {
  it("selects the example URL so the author can paste over it", () => {
    expect(applyMarkdownAction("", 0, 0, "link")).toEqual({
      value: "[link text](https://example.com)",
      selectionStart: 12,
      selectionEnd: 31,
    });
  });

  it("uses the selection as link text", () => {
    expect(applyMarkdownAction("see docs", 4, 8, "link")).toEqual({
      value: "see [docs](https://example.com)",
      selectionStart: 11,
      selectionEnd: 30,
    });
  });

  it("uses the selection as image alt text", () => {
    expect(applyMarkdownAction("screenshot", 0, 10, "image")).toEqual({
      value: "![screenshot](https://example.com/image.png)",
      selectionStart: 14,
      selectionEnd: 43,
    });
  });

  it("inserts default alt text and selects the image URL", () => {
    expect(applyMarkdownAction("x", 1, 1, "image")).toEqual({
      value: "x![alt text](https://example.com/image.png)",
      selectionStart: 13,
      selectionEnd: 42,
    });
  });
});

describe("applyMarkdownAction list and quote prefixes", () => {
  it("prefixes every selected line with a bullet", () => {
    expect(applyMarkdownAction("one\ntwo", 0, 7, "bullet-list")).toEqual({
      value: "- one\n- two",
      selectionStart: 2,
      selectionEnd: 11,
    });
  });

  it("removes bullets when every selected line already has one", () => {
    expect(applyMarkdownAction("- one\n- two", 0, 11, "bullet-list")).toEqual({
      value: "one\ntwo",
      selectionStart: 0,
      selectionEnd: 7,
    });
  });

  it("only prefixes the lines that are missing the marker", () => {
    expect(applyMarkdownAction("- one\ntwo", 0, 9, "bullet-list")).toEqual({
      value: "- one\n- two",
      selectionStart: 0,
      selectionEnd: 11,
    });
  });

  it("skips blank lines when prefixing a selection", () => {
    expect(applyMarkdownAction("one\n\ntwo", 0, 8, "bullet-list")).toEqual({
      value: "- one\n\n- two",
      selectionStart: 2,
      selectionEnd: 12,
    });
  });

  it("uses numbered markers consistently", () => {
    expect(applyMarkdownAction("a\nb", 0, 3, "ordered-list")).toEqual({
      value: "1. a\n1. b",
      selectionStart: 3,
      selectionEnd: 9,
    });
  });

  it("prefixes the current line with a quote marker", () => {
    expect(applyMarkdownAction("hello", 0, 0, "quote")).toEqual({
      value: "> hello",
      selectionStart: 2,
      selectionEnd: 2,
    });
  });

  it("toggles a quote off", () => {
    expect(applyMarkdownAction("> hello", 2, 2, "quote")).toEqual({
      value: "hello",
      selectionStart: 0,
      selectionEnd: 0,
    });
  });
});

describe("applyMarkdownAction code blocks", () => {
  it("inserts an empty cpp fence and puts the caret on the body line", () => {
    expect(applyMarkdownAction("", 0, 0, "code-block")).toEqual({
      value: "```cpp\n\n```",
      selectionStart: 7,
      selectionEnd: 7,
    });
  });

  it("honours a custom language", () => {
    expect(
      applyMarkdownAction("", 0, 0, "code-block", { language: "python" }),
    ).toEqual({
      value: "```python\n\n```",
      selectionStart: 10,
      selectionEnd: 10,
    });
  });

  it("wraps the selection inside the fence", () => {
    expect(applyMarkdownAction("code", 0, 4, "code-block")).toEqual({
      value: "```cpp\ncode\n```",
      selectionStart: 7,
      selectionEnd: 11,
    });
  });

  it("breaks onto its own line when inserted mid-line", () => {
    expect(applyMarkdownAction("run code here", 4, 8, "code-block")).toEqual({
      value: "run \n```cpp\ncode\n```\n here",
      selectionStart: 12,
      selectionEnd: 16,
    });
  });

  it("strips unsupported language characters", () => {
    const result = applyMarkdownAction("", 0, 0, "code-block", {
      language: " c++ ",
    });
    expect(result.value).toBe("```c++\n\n```");
  });
});

describe("applyMarkdownAction headings", () => {
  it("prefixes the current line and is idempotent", () => {
    expect(applyMarkdownAction("Title", 0, 0, "heading2")).toEqual({
      value: "## Title",
      selectionStart: 3,
      selectionEnd: 3,
    });
    expect(applyMarkdownAction("## Title", 3, 3, "heading2")).toEqual({
      value: "## Title",
      selectionStart: 3,
      selectionEnd: 3,
    });
  });

  it("prefixes every selected line with the heading marker", () => {
    expect(applyMarkdownAction("a\nb", 0, 3, "heading3")).toEqual({
      value: "### a\n### b",
      selectionStart: 4,
      selectionEnd: 11,
    });
  });

  it("normalises an existing heading level instead of stacking markers", () => {
    expect(applyMarkdownAction("### Title", 5, 5, "heading2")).toEqual({
      value: "## Title",
      selectionStart: 4,
      selectionEnd: 4,
    });
  });

  it("adds a heading marker to an empty current line", () => {
    expect(applyMarkdownAction("", 0, 0, "heading2")).toEqual({
      value: "## ",
      selectionStart: 3,
      selectionEnd: 3,
    });
  });
});

describe("applyMarkdownAction tables and dividers", () => {
  const table = [
    "| Column 1 | Column 2 | Column 3 |",
    "| --- | --- | --- |",
    "| Cell 1 | Cell 2 | Cell 3 |",
  ].join("\n");

  it("inserts a three column table and selects the first header cell", () => {
    expect(applyMarkdownAction("", 0, 0, "table")).toEqual({
      value: table,
      selectionStart: 2,
      selectionEnd: 10,
    });
  });

  it("starts the table on a new line when the caret sits mid-line", () => {
    expect(applyMarkdownAction("intro", 5, 5, "table")).toEqual({
      value: `intro\n${table}`,
      selectionStart: 8,
      selectionEnd: 16,
    });
  });

  it("keeps selected text and appends the table after it", () => {
    expect(applyMarkdownAction("keep me", 0, 7, "table")).toEqual({
      value: `keep me\n${table}`,
      selectionStart: 10,
      selectionEnd: 18,
    });
  });

  it("inserts a divider on its own line", () => {
    expect(applyMarkdownAction("hello", 5, 5, "divider")).toEqual({
      value: "hello\n---",
      selectionStart: 9,
      selectionEnd: 9,
    });
    expect(applyMarkdownAction("a b", 1, 1, "divider")).toEqual({
      value: "a\n---\n b",
      selectionStart: 5,
      selectionEnd: 5,
    });
  });
});

describe("applyMarkdownAction offset handling", () => {
  it("clamps out-of-range offsets instead of throwing", () => {
    expect(applyMarkdownAction("abc", -10, 99, "bold")).toEqual({
      value: "**abc**",
      selectionStart: 2,
      selectionEnd: 5,
    });
    expect(applyMarkdownAction("", -1, -1, "bold")).toEqual({
      value: "**bold text**",
      selectionStart: 2,
      selectionEnd: 11,
    });
  });

  it("normalises reversed and fractional offsets", () => {
    expect(applyMarkdownAction("abc", 3, 1.7, "italic")).toEqual({
      value: "a_bc_",
      selectionStart: 2,
      selectionEnd: 4,
    });
  });

  it("treats non-finite offsets as the start of the document", () => {
    expect(applyMarkdownAction("abc", Number.NaN, Number.POSITIVE_INFINITY, "bold")).toEqual({
      value: "**abc**",
      selectionStart: 2,
      selectionEnd: 5,
    });
  });
});
