import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Megaphone } from "lucide-react";
import { AnnouncementComposer } from "@/features/admin/announcement-composer";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { requireAdmin } from "@/server/auth/guards";
import { listBroadcasts } from "@/server/services/broadcasts";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Announcements",
  description:
    "Send an in-app notice to every coder and review recent announcements and marketing broadcasts.",
};

export const dynamic = "force-dynamic";

const BROADCAST_LIMIT = 30;

export default async function AdminAnnouncementsPage() {
  await requireAdmin();
  const broadcasts = await listBroadcasts(BROADCAST_LIMIT);

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader
        eyebrow="Broadcasts"
        title="Announcements"
        description="Send an in-app notice to every coder and review the latest announcements and marketing broadcasts. Contest and module releases are added automatically."
      />

      <AnnouncementComposer />

      <section aria-labelledby="recent-broadcasts" className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 id="recent-broadcasts" className="text-base font-semibold">
              Recent broadcasts
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              The last {BROADCAST_LIMIT} notices, newest first.
            </p>
          </div>
          <p className="font-mono text-[11px] tabular-nums text-muted-foreground">
            {broadcasts.length} {broadcasts.length === 1 ? "notice" : "notices"}
          </p>
        </div>

        {broadcasts.length === 0 ? (
          <EmptyState
            title="No broadcasts yet"
            description="Send the first announcement above. Contest and module marketing notices appear here automatically."
            icon={Megaphone}
          />
        ) : (
          <Card className="overflow-hidden p-1">
            <ul className="divide-y divide-border">
              {broadcasts.map((broadcast) => (
                <li key={broadcast.id} className="px-3 py-4 sm:px-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant={
                        broadcast.kind === "ANNOUNCEMENT"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {broadcast.kind === "ANNOUNCEMENT"
                        ? "Announcement"
                        : "Marketing"}
                    </Badge>
                    <Badge
                      variant={
                        !broadcast.completedAt
                          ? "warning"
                          : broadcast.recipients > 0
                            ? "success"
                            : "secondary"
                      }
                    >
                      {!broadcast.completedAt
                        ? "Pending"
                        : broadcast.recipients > 0
                          ? `Sent to ${broadcast.recipients}`
                          : "Baseline"}
                    </Badge>
                    <time
                      dateTime={broadcast.createdAt}
                      className="text-[11px] text-muted-foreground"
                    >
                      {formatDateTime(broadcast.createdAt)}
                    </time>
                  </div>

                  <h3 className="mt-2 break-words text-sm font-medium">
                    {broadcast.title}
                  </h3>
                  <p className="mt-1 max-w-prose whitespace-pre-line break-words text-xs leading-relaxed text-muted-foreground">
                    {broadcast.body}
                  </p>

                  {broadcast.href ? (
                    <Link
                      href={broadcast.href}
                      className="mt-2 inline-flex min-h-11 items-center gap-1 break-all text-xs font-medium text-primary hover:underline"
                    >
                      <ArrowUpRight className="size-3.5 shrink-0" />
                      {broadcast.href}
                    </Link>
                  ) : null}
                </li>
              ))}
            </ul>
          </Card>
        )}
      </section>
    </div>
  );
}
