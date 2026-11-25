import { describe, expect, it } from "vitest";
import type { ConversationUserRow } from "./message-queries";
import {
  buildSharedLinks,
  extractSharedUrls,
  normalizeSharedUrl,
  sharedLinkKind,
  sharedLinkLabel,
  toParticipantProfile,
  SHARED_LINK_LABEL_MAX,
  SHARED_LINK_LIMIT,
  type SharedLinkSourceRow,
} from "./message-shared";

const VIEWER = "6f8a1f34-3d4b-4f7e-9a51-2d3c4b5a6e70";
const PEER = "0b1c2d3e-4f5a-4b6c-8d7e-9f0a1b2c3d4e";

function linkRow(
  body: string,
  overrides: Partial<SharedLinkSourceRow> = {},
): SharedLinkSourceRow {
  return {
    body,
    senderId: VIEWER,
    createdAt: new Date("2026-02-01T10:00:00.000Z"),
    ...overrides,
  };
}

function participant(
  overrides: Partial<ConversationUserRow> = {},
): ConversationUserRow {
  return {
    id: PEER,
    username: "ayesha",
    displayName: "Ayesha",
    lastActiveAt: null,
    presenceVisibility: "EVERYONE",
    notifyMessages: true,
    avatarPreset: null,
    avatarImageUpdatedAt: null,
    isBanned: false,
    bio: null,
    institution: null,
    country: null,
    currentStatus: null,
    companyName: null,
    jobTitle: null,
    skills: null,
    rating: 1500,
    role: "USER",
    createdAt: new Date("2025-03-04T05:06:07.000Z"),
    website: null,
    github: null,
    linkedin: null,
    ...overrides,
  };
}

describe("extractSharedUrls", () => {
  it("finds http and https URLs in order", () => {
    expect(
      extractSharedUrls(
        "Try https://example.com/a then http://example.com/b?x=1#top",
      ),
    ).toEqual(["https://example.com/a", "http://example.com/b?x=1"]);
  });

  it("ignores non-http protocols, relative paths and reference tokens", () => {
    expect(
      extractSharedUrls(
        "ftp://example.com/x javascript:alert(1) data:text/html,hi mailto:a@b.c",
      ),
    ).toEqual([]);
    expect(
      extractSharedUrls(
        "@[PAU Cup 2026](/contests/pau-cup-2026) and @[Learn](/learn/arrays)",
      ),
    ).toEqual([]);
  });

  it("strips sentence and bracket punctuation after a pasted URL", () => {
    expect(
      extractSharedUrls(
        "See https://example.com/page. Then (https://example.com/two), also https://example.com/three! \"https://example.com/four\"",
      ),
    ).toEqual([
      "https://example.com/page",
      "https://example.com/two",
      "https://example.com/three",
      "https://example.com/four",
    ]);
  });

  it("keeps balanced paths and query strings intact", () => {
    expect(
      extractSharedUrls("https://example.com/search?q=hello+world&page=2"),
    ).toEqual(["https://example.com/search?q=hello+world&page=2"]);
    expect(
      extractSharedUrls(
        "https://en.wikipedia.org/wiki/Set_(mathematics) and https://example.com/a_(b)",
      ),
    ).toEqual([
      "https://en.wikipedia.org/wiki/Set_(mathematics)",
      "https://example.com/a_(b)",
    ]);
  });

  it("normalizes the scheme and host case", () => {
    expect(extractSharedUrls("HTTPS://Example.COM/Path")).toEqual([
      "https://example.com/Path",
    ]);
  });
});

describe("normalizeSharedUrl", () => {
  it("drops fragments and the trailing slash on a bare origin", () => {
    expect(normalizeSharedUrl("https://example.com/")).toBe(
      "https://example.com",
    );
    expect(normalizeSharedUrl("https://example.com/a#section")).toBe(
      "https://example.com/a",
    );
  });

  it("rejects malformed and non-http values", () => {
    expect(normalizeSharedUrl("https://")).toBeNull();
    expect(normalizeSharedUrl("/contests/pau-cup")).toBeNull();
    expect(normalizeSharedUrl("javascript:alert(1)")).toBeNull();
    expect(normalizeSharedUrl("")).toBeNull();
  });
});

describe("sharedLinkKind", () => {
  it("classifies common document extensions case-insensitively", () => {
    expect(sharedLinkKind("https://files.example.com/report.PDF")).toBe(
      "DOCUMENT",
    );
    expect(sharedLinkKind("https://files.example.com/sheet.xlsx?dl=1")).toBe(
      "DOCUMENT",
    );
    expect(sharedLinkKind("https://files.example.com/archive.7z")).toBe(
      "DOCUMENT",
    );
  });

  it("keeps pages and look-alike paths as links", () => {
    expect(sharedLinkKind("https://example.com/problems/two-sum")).toBe("LINK");
    expect(sharedLinkKind("https://example.com/report.pdf.html")).toBe("LINK");
    expect(sharedLinkKind("https://example.com/")).toBe("LINK");
  });
});

describe("sharedLinkLabel", () => {
  it("shows host plus path without the query", () => {
    expect(
      sharedLinkLabel("https://files.example.com/a/b?token=secret"),
    ).toEqual({
      host: "files.example.com",
      label: "files.example.com/a/b",
    });
  });

  it("caps long labels for the panel layout", () => {
    const label = sharedLinkLabel(
      `https://example.com/${"a".repeat(200)}`,
    )?.label;
    expect(label).toHaveLength(SHARED_LINK_LABEL_MAX);
    expect(label?.endsWith("…")).toBe(true);
  });
});

describe("buildSharedLinks", () => {
  it("dedupes by normalized URL and keeps the newest mention", () => {
    const links = buildSharedLinks(
      [
        linkRow("https://example.com/a#one", {
          senderId: PEER,
          createdAt: new Date("2026-02-03T00:00:00.000Z"),
        }),
        linkRow("https://example.com/a https://example.com/b", {
          createdAt: new Date("2026-02-02T00:00:00.000Z"),
        }),
      ],
      VIEWER,
    );

    expect(links).toEqual([
      {
        url: "https://example.com/a",
        host: "example.com",
        label: "example.com/a",
        kind: "LINK",
        createdAt: "2026-02-03T00:00:00.000Z",
        mine: false,
      },
      {
        url: "https://example.com/b",
        host: "example.com",
        label: "example.com/b",
        kind: "LINK",
        createdAt: "2026-02-02T00:00:00.000Z",
        mine: true,
      },
    ]);
  });

  it("marks links the viewer sent", () => {
    const [link] = buildSharedLinks(
      [linkRow("https://example.com/doc.pdf")],
      VIEWER,
    );
    expect(link).toMatchObject({
      kind: "DOCUMENT",
      mine: true,
    });
  });

  it("caps the list at 40 links", () => {
    const body = Array.from(
      { length: 45 },
      (_, index) => `https://example.com/doc-${index}`,
    ).join(" ");
    const links = buildSharedLinks([linkRow(body)], VIEWER);
    expect(links).toHaveLength(SHARED_LINK_LIMIT);
    expect(links.at(-1)?.url).toBe("https://example.com/doc-39");
  });

  it("returns nothing for bodies without absolute URLs", () => {
    expect(
      buildSharedLinks([linkRow("@[Problem](/problems/two-sum)")], VIEWER),
    ).toEqual([]);
  });
});

describe("toParticipantProfile", () => {
  it("maps only the public profile fields", () => {
    const profile = toParticipantProfile(
      participant({
        bio: "Competitive programmer",
        institution: "PrimeAsia University",
        country: "Bangladesh",
        currentStatus: "STUDENT",
        companyName: "PAUOJ",
        jobTitle: "Problem setter",
        skills: ["C++", "Graphs"],
        rating: 1725,
        role: "TEACHER",
        website: "https://ayesha.example.com",
        github: "https://github.com/ayesha",
        linkedin: "https://linkedin.com/in/ayesha",
      }),
    );

    expect(profile).toStrictEqual({
      bio: "Competitive programmer",
      institution: "PrimeAsia University",
      country: "Bangladesh",
      currentStatus: "STUDENT",
      companyName: "PAUOJ",
      jobTitle: "Problem setter",
      skills: ["C++", "Graphs"],
      rating: 1725,
      role: "TEACHER",
      memberSince: "2025-03-04T05:06:07.000Z",
      website: "https://ayesha.example.com",
      github: "https://github.com/ayesha",
      linkedin: "https://linkedin.com/in/ayesha",
    });
  });

  it("coalesces a null skills column to an empty array", () => {
    expect(toParticipantProfile(participant()).skills).toEqual([]);
  });
});
