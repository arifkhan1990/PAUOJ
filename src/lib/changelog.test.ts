import { describe, expect, it } from "vitest";
import { parseChangelog } from "./changelog";

const markdown = `# Changelog

Intro text.

## [Unreleased]

### Added
- A first thing with \`code\`.
- A second thing that
  wraps onto another line.

### Fixed
- A fix.

## [0.5.0] - 2026-11-17

### Added
- Released feature.

### Fixed
- Released fix.
`;

describe("parseChangelog", () => {
  it("parses releases, statuses, dates and grouped items", () => {
    const releases = parseChangelog(markdown, "0.5.0");

    expect(releases).toHaveLength(2);
    expect(releases[0]).toMatchObject({
      version: "Unreleased",
      displayVersion: "Unreleased",
      slug: "next",
      status: "next",
      date: null,
    });
    expect(releases[0]?.groups).toHaveLength(2);
    expect(releases[0]?.groups[0]?.items).toEqual([
      "A first thing with `code`.",
      "A second thing that wraps onto another line.",
    ]);
    expect(releases[1]).toMatchObject({
      version: "0.5.0",
      displayVersion: "v0.5.0",
      slug: "v0-5-0",
      status: "current",
      date: "2026-11-17",
    });
  });

  it("marks older releases as previous", () => {
    const releases = parseChangelog(markdown, "0.6.0");
    expect(releases.map((release) => release.status)).toEqual([
      "next",
      "previous",
    ]);
  });

  it("merges repeated section headings within a release", () => {
    const releases = parseChangelog(
      `## [Unreleased]

### Fixed
- First fix.

### Changed
- First change.

### Fixed
- Second fix.

### fixed
- Third fix.
`,
      "0.6.0",
    );

    expect(releases[0]?.groups).toEqual([
      { title: "Fixed", items: ["First fix.", "Second fix.", "Third fix."] },
      { title: "Changed", items: ["First change."] },
    ]);
  });
});
