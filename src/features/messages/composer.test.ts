import { describe, expect, it } from "vitest";
import {
  insertEmoji,
  insertReference,
  replaceSelection,
} from "./composer-insert";
import {
  formatFileSize,
  messageImageMime,
  validateMessageImage,
} from "./message-format";
import {
  categoryForAlias,
  detectSuggestionTrigger,
  filterSuggestionCategories,
  primaryAlias,
} from "./suggestion-trigger";

const TOKEN = "@[PAU Cup 2026](/contests/pau-cup-2026)";

describe("detectSuggestionTrigger", () => {
  it("opens the category chooser on a bare @", () => {
    expect(detectSuggestionTrigger("Write @", 7)).toEqual({
      mode: "categories",
      start: 6,
      end: 7,
      query: "",
    });
  });

  it("filters categories while letters are typed", () => {
    const text = "Write @con";
    expect(detectSuggestionTrigger(text, text.length)).toEqual({
      mode: "categories",
      start: 6,
      end: 10,
      query: "con",
    });
  });

  it("opens a list immediately for a full alias", () => {
    expect(detectSuggestionTrigger("@contest", 8)).toEqual({
      mode: "items",
      start: 0,
      end: 8,
      kind: "contest",
      query: "",
    });
    expect(detectSuggestionTrigger("@problems", 9)).toMatchObject({
      mode: "items",
      kind: "problem",
    });
    expect(detectSuggestionTrigger("@lesson", 7)).toMatchObject({
      mode: "items",
      kind: "learn",
    });
    expect(detectSuggestionTrigger("@module", 7)).toMatchObject({
      mode: "items",
      kind: "learn",
    });
    expect(detectSuggestionTrigger("@topic", 6)).toMatchObject({
      mode: "items",
      kind: "learn",
    });
  });

  it("treats text after a space as the item filter", () => {
    expect(detectSuggestionTrigger("@contest cup", 12)).toEqual({
      mode: "items",
      start: 0,
      end: 12,
      kind: "contest",
      query: "cup",
    });
    const text = "see @problem two sum";
    expect(detectSuggestionTrigger(text, text.length)).toMatchObject({
      mode: "items",
      start: text.indexOf("@"),
      kind: "problem",
      query: "two sum",
    });
  });

  it("uses the caret, not the end of the text", () => {
    const text = "@contest cup";
    expect(detectSuggestionTrigger(text, 8)).toMatchObject({
      mode: "items",
      kind: "contest",
      end: 8,
      query: "",
    });
    expect(detectSuggestionTrigger("@contest", 3)).toMatchObject({
      mode: "categories",
      query: "co",
    });
  });

  it("ignores emails, closed triggers and reference tokens", () => {
    const email = "mail@example.com";
    expect(detectSuggestionTrigger(email, email.length)).toBeNull();
    expect(detectSuggestionTrigger("hi @con ", 8)).toBeNull();
    expect(detectSuggestionTrigger("@unknown", 8)).toBeNull();
    const rendered = "Join @[PAU Cup](/contests/pau-cup) now";
    expect(detectSuggestionTrigger(rendered, rendered.length)).toBeNull();
  });

  it("accepts a trigger that starts after a newline", () => {
    expect(detectSuggestionTrigger("line one\n@pro", 13)).toMatchObject({
      mode: "categories",
      query: "pro",
    });
  });

  it("rejects absurdly long trigger words", () => {
    const text = `@${"a".repeat(200)}`;
    expect(detectSuggestionTrigger(text, text.length)).toBeNull();
  });
});

describe("suggestion categories", () => {
  it("maps aliases to a kind", () => {
    expect(categoryForAlias("contest")).toBe("contest");
    expect(categoryForAlias("CONTESTS")).toBe("contest");
    expect(categoryForAlias("topic")).toBe("learn");
    expect(categoryForAlias("topics")).toBe("learn");
    expect(categoryForAlias("nope")).toBeNull();
    expect(categoryForAlias("")).toBeNull();
  });

  it("filters categories by prefix", () => {
    expect(filterSuggestionCategories("").map((item) => item.kind)).toEqual([
      "contest",
      "problem",
      "learn",
    ]);
    expect(filterSuggestionCategories("c").map((item) => item.kind)).toEqual([
      "contest",
    ]);
    expect(filterSuggestionCategories("pro").map((item) => item.kind)).toEqual([
      "problem",
    ]);
    expect(filterSuggestionCategories("l").map((item) => item.kind)).toEqual([
      "learn",
    ]);
    expect(filterSuggestionCategories("to").map((item) => item.kind)).toEqual([
      "learn",
    ]);
    expect(filterSuggestionCategories("zzz")).toEqual([]);
  });

  it("knows the alias inserted for each kind", () => {
    expect(primaryAlias("contest")).toBe("contest");
    expect(primaryAlias("problem")).toBe("problem");
    expect(primaryAlias("learn")).toBe("learn");
  });
});

describe("composer insertion", () => {
  it("inserts an emoji at the caret", () => {
    expect(
      insertEmoji(
        { value: "hello", selectionStart: 5, selectionEnd: 5 },
        "😀",
      ),
    ).toEqual({ value: "hello😀", caret: 7 });
  });

  it("replaces the current selection", () => {
    expect(
      insertEmoji(
        { value: "hi there", selectionStart: 0, selectionEnd: 2 },
        "😀",
      ),
    ).toEqual({ value: "😀 there", caret: 2 });
    expect(
      replaceSelection(
        { value: "abcdef", selectionStart: 1, selectionEnd: 4 },
        "X",
      ),
    ).toEqual({ value: "aXef", caret: 2 });
  });

  it("refuses edits past the character cap", () => {
    expect(
      insertEmoji(
        { value: "a".repeat(3), selectionStart: 3, selectionEnd: 3 },
        "😀",
        3,
      ),
    ).toBeNull();
    expect(insertEmoji({ value: "abc", selectionStart: 3, selectionEnd: 3 }, "")).toBeNull();
  });

  it("replaces the trigger and adds one trailing space at the end", () => {
    const result = insertReference(
      { value: "@contest cup", selectionStart: 0, selectionEnd: 12 },
      TOKEN,
    );
    expect(result).toEqual({ value: `${TOKEN} `, caret: TOKEN.length + 1 });
  });

  it("keeps trailing text and never doubles an existing space", () => {
    expect(
      insertReference(
        { value: "@con rest", selectionStart: 0, selectionEnd: 4 },
        TOKEN,
      ),
    ).toEqual({ value: `${TOKEN} rest`, caret: TOKEN.length });
    expect(
      insertReference(
        { value: "hey @con!", selectionStart: 4, selectionEnd: 8 },
        TOKEN,
      ),
    ).toEqual({ value: `hey ${TOKEN} !`, caret: TOKEN.length + 5 });
  });

  it("is a no-op for an empty token or an overflowing draft", () => {
    expect(
      insertReference(
        { value: "@con", selectionStart: 0, selectionEnd: 4 },
        "",
      ),
    ).toBeNull();
    expect(
      insertReference(
        { value: "@con", selectionStart: 0, selectionEnd: 4 },
        TOKEN,
        10,
      ),
    ).toBeNull();
  });
});

describe("image validation", () => {
  it("accepts allow-listed types under the size cap", () => {
    expect(validateMessageImage({ type: "image/png", size: 4096 })).toBeNull();
    expect(validateMessageImage({ type: "image/jpeg", size: 4096 })).toBeNull();
    expect(validateMessageImage({ type: "image/webp", size: 4096 })).toBeNull();
  });

  it("rejects other types with a clear message", () => {
    expect(validateMessageImage({ type: "image/gif", size: 4096 })).toBe(
      "Choose a PNG, JPEG, or WebP image.",
    );
  });

  it("rejects empty and oversized files", () => {
    expect(validateMessageImage({ type: "image/png", size: 0 })).toBe(
      "That image looks empty. Choose another file.",
    );
    expect(
      validateMessageImage({ type: "image/png", size: 5 * 1024 * 1024 + 1 }),
    ).toBe("Images must be 5 MB or smaller.");
  });

  it("normalises the MIME lookup", () => {
    expect(messageImageMime("IMAGE/JPEG")).toBe("image/jpeg");
    expect(messageImageMime("image/svg+xml")).toBeNull();
  });

  it("formats sizes for the preview chip", () => {
    expect(formatFileSize(0)).toBe("0 KB");
    expect(formatFileSize(900)).toBe("1 KB");
    expect(formatFileSize(2048)).toBe("2 KB");
    expect(formatFileSize(5 * 1024 * 1024)).toBe("5.0 MB");
  });
});
