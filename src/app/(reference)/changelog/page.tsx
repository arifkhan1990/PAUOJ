import type { Metadata } from "next";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { ChangelogView } from "@/components/changelog/changelog-view";
import { parseChangelog } from "@/lib/changelog";
import { APP_VERSION } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Changelog",
  description:
    "Release notes, version history and platform updates for PAU OJ.",
};

export const dynamic = "force-dynamic";

async function readChangelog(): Promise<string> {
  try {
    return await readFile(path.join(process.cwd(), "CHANGELOG.md"), "utf8");
  } catch {
    return "# Changelog\n\nRelease notes are not available in this deployment.";
  }
}

export default async function ChangelogPage() {
  const changelog = await readChangelog();
  const releases = parseChangelog(changelog, APP_VERSION);

  return <ChangelogView releases={releases} currentVersion={APP_VERSION} />;
}
