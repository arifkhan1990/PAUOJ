export type ChangelogGroup = {
  title: string;
  items: string[];
};

export type ChangelogReleaseStatus = "next" | "current" | "previous";

export type ChangelogRelease = {
  version: string;
  displayVersion: string;
  slug: string;
  title: string;
  summary: string;
  date: string | null;
  status: ChangelogReleaseStatus;
  groups: ChangelogGroup[];
};

const RELEASE_META: Record<string, { title: string; summary: string }> = {
  "0.7.0": {
    title: "Two-Setter Publication Review",
    summary:
      "New problems need two setter approvals, a reference solution, an editorial and a reviewer test before they enter the public list, with holds, review cycles and contributor credit.",
  },
  "0.6.5": {
    title: "Reviewer Leaderboard & Markdown Editor",
    summary:
      "A public reviewer leaderboard plus a toolbar Markdown editor for problems and editorials.",
  },
  "0.6.4": {
    title: "Email Brand Finish",
    summary:
      "The real PAU OJ mark and social links in every transactional email.",
  },
  "0.6.3": {
    title: "Email Client Hardening",
    summary:
      "Safer subjects, a 599px breakpoint and a tuned dark mode for every transactional email.",
  },
  "0.6.2": {
    title: "Transactional Email Refresh",
    summary:
      "A cleaner, responsive email shell across every PAU OJ transactional message.",
  },
  "0.6.1": {
    title: "Per-problem Results Columns",
    summary:
      "The roster results CSV now carries solved/attempt columns for every assessment problem, in position order.",
  },
  "0.6.0": {
    title: "Assessment Invites & Roster Delivery",
    summary:
      "Per-candidate invite links, roster import, manual email send/revoke and roster-complete results, with practice-only rank and profile statistics.",
  },
  "0.5.0": {
    title: "Judge Polish & Profile Experience",
    summary:
      "First-blood standings, interactive judge charts, complete topic filters, cleaner problem tabs and reliable version reporting.",
  },
  "0.4.0": {
    title: "Account Recovery",
    summary:
      "Email verification, password reset, Mailpit for local development and production SMTP configuration.",
  },
  "0.3.0": {
    title: "Production Hardening",
    summary:
      "Caddy HTTPS, deploy rollback, backups, health checks and a complete deployment runbook.",
  },
  "0.2.0": {
    title: "Coding Assessments",
    summary:
      "Private timed assessments with access codes, per-candidate timers and an admin results table.",
  },
  "0.1.0": {
    title: "Launch Baseline",
    summary:
      "The first working release: sandboxed judging, problems, contests, profiles and the admin control room.",
  },
};

function releaseMeta(version: string): { title: string; summary: string } {
  return (
    RELEASE_META[version.toLowerCase()] ?? {
      title: "Platform update",
      summary: "Release notes for this version.",
    }
  );
}

function toSlug(version: string): string {
  if (version.toLowerCase() === "unreleased") return "next";
  return `v${version.replace(/\./g, "-")}`;
}

export function parseChangelog(
  markdown: string,
  currentVersion: string,
): ChangelogRelease[] {
  const releases: ChangelogRelease[] = [];
  let release: ChangelogRelease | null = null;
  let group: ChangelogGroup | null = null;
  let itemLines: string[] = [];

  const flushItem = () => {
    if (group && itemLines.length > 0) {
      const text = itemLines.join(" ").trim();
      if (text) group.items.push(text);
    }
    itemLines = [];
  };

  const pushRelease = () => {
    flushItem();
    if (release) {
      release.groups = release.groups.filter((entry) => entry.items.length > 0);
      if (release.groups.length > 0) releases.push(release);
    }
    release = null;
    group = null;
  };

  for (const rawLine of markdown.split(/\r?\n/)) {
    const line = rawLine.trimEnd();
    const releaseMatch = /^##\s+\[?([^\]]+)\]?(?:\s+-\s+(\d{4}-\d{2}-\d{2}))?/.exec(
      line,
    );
    if (releaseMatch) {
      pushRelease();
      const version = releaseMatch[1].trim();
      const isUnreleased = version.toLowerCase() === "unreleased";
      const meta = releaseMeta(version);
      release = {
        version,
        displayVersion: isUnreleased ? "Unreleased" : `v${version}`,
        slug: toSlug(version),
        title: meta.title,
        summary: meta.summary,
        date: releaseMatch[2] ?? null,
        status: isUnreleased
          ? "next"
          : version === currentVersion
            ? "current"
            : "previous",
        groups: [],
      };
      continue;
    }

    if (!release) continue;

    const groupMatch = /^###\s+(.+)$/.exec(line);
    if (groupMatch) {
      flushItem();
      group = { title: groupMatch[1].trim(), items: [] };
      release.groups.push(group);
      continue;
    }

    if (!group) continue;

    if (line.startsWith("- ")) {
      flushItem();
      itemLines = [line.slice(2).trim()];
      continue;
    }

    if (line.trim() === "") {
      flushItem();
      continue;
    }

    if (itemLines.length > 0) {
      itemLines.push(line.trim());
    }
  }

  pushRelease();
  return releases;
}
