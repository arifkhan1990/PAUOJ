"use client";

import { useMemo } from "react";
import type { ChangelogRelease } from "@/lib/changelog";
import { useActiveSection } from "@/lib/use-active-section";
import { cn } from "@/lib/utils";

export function ReleaseNav({ releases }: { releases: ChangelogRelease[] }) {
  const ids = useMemo(
    () => releases.map((release) => release.slug),
    [releases],
  );
  const active = useActiveSection(ids, "reference-scroll");

  return (
    <>
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        Releases
      </p>
      <nav className="mt-4 space-y-1" aria-label="Releases">
        {releases.map((release) => {
          const activeRelease = active === release.slug;
          return (
            <a
              key={release.slug}
              href={`#${release.slug}`}
              aria-current={activeRelease ? "location" : undefined}
              className={cn(
                "group flex items-start gap-2 rounded-lg px-2 py-2 transition-colors",
                activeRelease ? "bg-muted/50" : "hover:bg-muted/40",
              )}
            >
              <span
                className={cn(
                  "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full",
                  release.status === "current"
                    ? "bg-emerald-400"
                    : release.status === "next"
                      ? "bg-primary"
                      : "bg-muted-foreground/30",
                  activeRelease && "ring-2 ring-primary/20",
                )}
                aria-hidden="true"
              />
              <span className="min-w-0">
                <span
                  className={cn(
                    "block font-mono text-[10px] font-medium",
                    activeRelease
                      ? "text-primary"
                      : release.status === "current"
                        ? "text-primary"
                        : "text-muted-foreground",
                  )}
                >
                  {release.displayVersion}
                </span>
                <span
                  className={cn(
                    "mt-0.5 block truncate text-[10px] transition-colors",
                    activeRelease
                      ? "text-foreground"
                      : "text-muted-foreground/70 group-hover:text-foreground/80",
                  )}
                >
                  {release.title}
                </span>
              </span>
            </a>
          );
        })}
      </nav>
    </>
  );
}
