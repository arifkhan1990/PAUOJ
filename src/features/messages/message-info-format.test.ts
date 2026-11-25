import { describe, expect, it } from "vitest";
import type {
  ConversationSharedDocument,
  ConversationSharedLink,
  ConversationSharedMedia,
} from "@/lib/message-types";
import {
  sharedDocumentTotal,
  sharedLinkLabel,
  sharedMediaThumbnails,
  splitSharedLinks,
} from "./message-info-format";

function link(overrides: Partial<ConversationSharedLink> = {}): ConversationSharedLink {
  return {
    url: "https://example.com/docs/guide.pdf",
    host: "example.com",
    label: "example.com/docs/guide.pdf",
    kind: "DOCUMENT",
    createdAt: "2026-11-25T10:00:00.000Z",
    mine: false,
    ...overrides,
  };
}

function media(id: string): ConversationSharedMedia {
  return {
    id,
    url: `/api/v1/messages/attachments/${id}`,
    mime: "image/png",
    width: 800,
    height: 600,
    createdAt: "2026-11-25T10:00:00.000Z",
  };
}

function file(id: string): ConversationSharedDocument {
  return {
    id,
    url: `/api/v1/messages/attachments/${id}`,
    fileName: `${id}.pdf`,
    mime: "application/pdf",
    sizeBytes: 2048,
    createdAt: "2026-11-25T10:00:00.000Z",
    mine: false,
  };
}

describe("sharedDocumentTotal", () => {
  it("counts uploaded files and document links together", () => {
    expect(sharedDocumentTotal([], [])).toBe(0);
    expect(sharedDocumentTotal([file("a")], [])).toBe(1);
    expect(sharedDocumentTotal([file("a"), file("b")], [link()])).toBe(3);
  });
});

describe("splitSharedLinks", () => {
  it("routes documents and plain links into separate sections", () => {
    const document = link();
    const external = link({
      url: "https://paucode.dev/contests",
      host: "paucode.dev",
      label: "paucode.dev/contests",
      kind: "LINK",
    });
    expect(splitSharedLinks([document, external])).toEqual({
      documents: [document],
      links: [external],
    });
  });

  it("handles an empty payload", () => {
    expect(splitSharedLinks([])).toEqual({ documents: [], links: [] });
  });
});

describe("sharedLinkLabel", () => {
  it("prefers the server label, then the host, then the URL", () => {
    expect(sharedLinkLabel(link())).toBe("example.com/docs/guide.pdf");
    expect(sharedLinkLabel(link({ label: "  " }))).toBe("example.com");
    expect(sharedLinkLabel(link({ label: "", host: "" }))).toBe(
      "https://example.com/docs/guide.pdf",
    );
  });
});

describe("sharedMediaThumbnails", () => {
  it("caps the grid without mutating the payload", () => {
    const items = [media("1"), media("2"), media("3")];
    expect(sharedMediaThumbnails(items, 2).map((item) => item.id)).toEqual([
      "1",
      "2",
    ]);
    expect(items).toHaveLength(3);
  });
});
