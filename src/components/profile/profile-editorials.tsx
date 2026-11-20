import Link from "next/link";
import { FilePenLine } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatRelative } from "@/lib/utils";
import type { ProfileStats } from "@/lib/types";

export function ProfileEditorials({
  count,
  editorials,
}: {
  count: ProfileStats["approvedEditorialCount"];
  editorials: ProfileStats["approvedEditorials"];
}) {
  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-md bg-primary/10 text-primary">
            <FilePenLine className="size-4" />
          </span>
          <div>
            <h2 className="text-sm font-semibold">Community editorials</h2>
            <p className="text-[11px] text-muted-foreground">
              Approved editorial contributions on other setters&apos; problems.
            </p>
          </div>
        </div>
        <Badge variant="success">
          {count} approved editorial{count === 1 ? "" : "s"}
        </Badge>
      </div>

      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {editorials.map((editorial) => (
          <li
            key={editorial.problemSlug}
            className="flex items-center justify-between gap-2 rounded-md border border-border bg-background px-3 py-2"
          >
            <Link
              href={`/problems/${editorial.problemSlug}?tab=editorial`}
              className="min-w-0 truncate text-xs font-medium hover:text-primary"
            >
              {editorial.problemTitle}
            </Link>
            <span className="shrink-0 text-[10px] text-muted-foreground">
              {formatRelative(editorial.approvedAt)}
            </span>
          </li>
        ))}
      </ul>

      {count > editorials.length ? (
        <p className="mt-3 text-[11px] text-muted-foreground">
          Showing the latest {editorials.length} of {count}.
        </p>
      ) : null}
    </Card>
  );
}
