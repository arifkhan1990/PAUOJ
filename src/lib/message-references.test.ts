import { describe, expect, it } from "vitest";
import {
  formatMessageReference,
  hasMessageReference,
  messageReferenceKind,
  messageReferencePreview,
  normalizeReferenceLabel,
  parseMessageReferences,
} from "./message-references";

describe("messageReferenceKind", () => {
  it("accepts the three internal sections", () => {
    expect(messageReferenceKind("/contests/pau-cup-2026")).toBe("contest");
    expect(messageReferenceKind("/problems/two-sum")).toBe("problem");
    expect(messageReferenceKind("/learn/basic-sql/orientation")).toBe("learn");
    expect(messageReferenceKind("/learn/sql/project")).toBe("learn");
  });

  it("rejects external, traversal and malformed paths", () => {
    expect(messageReferenceKind("https://evil.example/contests/x")).toBeNull();
    expect(messageReferenceKind("/contests/../admin")).toBeNull();
    expect(messageReferenceKind("/contests//x")).toBeNull();
    expect(messageReferenceKind("/contests/x?y=1")).toBeNull();
    expect(messageReferenceKind("/contests/x#frag")).toBeNull();
    expect(messageReferenceKind("/dashboard/messages")).toBeNull();
    expect(messageReferenceKind("/learn/a/b/c")).toBeNull();
  });
});

describe("normalizeReferenceLabel", () => {
  it("flattens brackets, parens and newlines", () => {
    expect(normalizeReferenceLabel("  Two\n[sum] (easy)  ")).toBe(
      "Two sum easy",
    );
  });

  it("caps very long labels", () => {
    expect(normalizeReferenceLabel("a".repeat(200))).toHaveLength(120);
  });
});

describe("formatMessageReference", () => {
  it("builds a token with a sanitised label", () => {
    expect(
      formatMessageReference({
        label: "PAU ]Cup[ (2026)",
        href: "/contests/pau-cup-2026",
      }),
    ).toBe("@[PAU Cup 2026](/contests/pau-cup-2026)");
  });

  it("refuses off-site or empty references", () => {
    expect(
      formatMessageReference({ label: "Evil", href: "https://evil.example" }),
    ).toBeNull();
    expect(
      formatMessageReference({ label: "  ", href: "/problems/two-sum" }),
    ).toBeNull();
  });
});

describe("parseMessageReferences", () => {
  it("returns literal text when there is no token", () => {
    expect(parseMessageReferences("hello there")).toEqual([
      { type: "text", text: "hello there" },
    ]);
  });

  it("splits text around valid references", () => {
    const segments = parseMessageReferences(
      "Try this @[Two Sum](/problems/two-sum) tonight",
    );
    expect(segments).toEqual([
      { type: "text", text: "Try this " },
      {
        type: "reference",
        reference: {
          kind: "problem",
          label: "Two Sum",
          href: "/problems/two-sum",
        },
      },
      { type: "text", text: " tonight" },
    ]);
  });

  it("keeps invalid links as text", () => {
    const body = "@[Evil](https://evil.example) and @[Broken](/admin)";
    expect(parseMessageReferences(body)).toEqual([{ type: "text", text: body }]);
    expect(hasMessageReference(body)).toBe(false);
  });

  it("handles back-to-back references", () => {
    const segments = parseMessageReferences(
      "@[Cup](/contests/cup)@[Learn](/learn/sql/orientation)",
    );
    expect(
      segments.filter((segment) => segment.type === "reference"),
    ).toHaveLength(2);
  });
});

describe("messageReferencePreview", () => {
  it("turns tokens into @labels for previews", () => {
    expect(
      messageReferencePreview(
        "Join @[PAU Cup](/contests/pau-cup) with @[Two Sum](/problems/two-sum)",
      ),
    ).toBe("Join @PAU Cup with @Two Sum");
  });

  it("leaves plain text untouched", () => {
    expect(messageReferencePreview("just chat")).toBe("just chat");
  });
});
