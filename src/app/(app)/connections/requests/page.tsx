import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Inbox } from "lucide-react";
import { FollowRequestList } from "@/components/profile/follow-request-list";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Pagination } from "@/components/shared/pagination";
import { buttonVariants } from "@/components/ui/button";
import { requireUser } from "@/server/auth/guards";
import { listFollowRequests } from "@/server/services/profile-follows";
import { readPage, type SearchParams } from "@/lib/pagination";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Follow requests",
  description: "Approve or decline people who asked to follow you on PAU OJ.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const PATHNAME = "/connections/requests";

export default async function FollowRequestsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await requireUser(PATHNAME);
  const query = await searchParams;
  const page = readPage(query);
  const { items, total, page: currentPage, totalPages } = await listFollowRequests(
    user.id,
    page,
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <Link
        href={`/users/${user.username}/connections`}
        className="inline-flex min-h-11 items-center gap-1.5 rounded-md text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to your connections
      </Link>

      <PageHeader
        className="mt-5"
        eyebrow="Connections"
        title="Follow requests"
        description="People waiting to follow you. Accepting lets them see your activity and start a conversation."
      />

      {total > 0 ? (
        <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
          {total.toLocaleString("en-US")} pending
          {total === 1 ? " request" : " requests"}
        </p>
      ) : null}

      {items.length === 0 ? (
        total > 0 ? (
          <EmptyState
            className="mt-4"
            icon={Inbox}
            title="Nothing on this page"
            description="This page is past the end of the requests list."
            action={
              <Link
                href={PATHNAME}
                className={cn(buttonVariants({ variant: "outline" }), "h-11")}
              >
                Back to page 1
              </Link>
            }
          />
        ) : (
          <EmptyState
            className="mt-4"
            icon={Inbox}
            title="No pending requests"
            description="When someone asks to follow you, their request will appear here for review."
          />
        )
      ) : (
        <FollowRequestList items={items} />
      )}

      <Pagination
        pathname={PATHNAME}
        searchParams={{}}
        page={currentPage}
        totalPages={totalPages}
      />
    </div>
  );
}
