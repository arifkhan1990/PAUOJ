import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  LockKeyhole,
  MessagesSquare,
} from "lucide-react";
import { AnswerClarificationForm } from "@/features/contests/answer-clarification-form";
import { AskClarificationForm } from "@/features/contests/ask-clarification-form";
import { ContestRegisterButton } from "@/features/contests/contest-register-button";
import { ContestTabs } from "@/components/contests/contest-tabs";
import { EmptyState } from "@/components/shared/empty-state";
import { Markdown } from "@/components/shared/markdown";
import { PageHeader } from "@/components/shared/page-header";
import { Pagination } from "@/components/shared/pagination";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getCurrentUser } from "@/server/auth/session";
import { ApiError } from "@/server/api/errors";
import { getContestAccess } from "@/server/services/contest-access";
import {
  CLARIFICATIONS_PAGE_SIZE,
  listContestClarifications,
} from "@/server/services/contest-clarifications";
import { readPage, type SearchParams } from "@/lib/pagination";
import { formatDateTime, formatRelative } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return { title: `Clarifications · ${slug}` };
}

export default async function ClarificationsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const user = await getCurrentUser();

  let access: Awaited<ReturnType<typeof getContestAccess>>;
  try {
    access = await getContestAccess(slug, user);
  } catch (error) {
    if (error instanceof ApiError && error.code === "NOT_FOUND") notFound();
    throw error;
  }

  const page = readPage(query);
  const data = access.canViewContent
    ? await listContestClarifications(slug, user, page)
    : null;
  const totalPages = data
    ? Math.max(1, Math.ceil(data.total / CLARIFICATIONS_PAGE_SIZE))
    : 1;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Contest Q&A"
        title={access.contest.title}
        description="Official answers from the contest organiser and problem authors."
        actions={
          <Link
            href={`/contests/${access.contest.slug}`}
            className={buttonVariants({ variant: "outline" })}
          >
            Contest page
          </Link>
        }
      />

      <ContestTabs
        slug={access.contest.slug}
        active="clarifications"
        className="mt-5"
      />

      {!access.canViewContent ? (
        <EmptyState
          className="mt-6"
          title="Clarifications are locked"
          description={
            access.status === "ENDED"
              ? "This contest is private. Only registered participants and admins can read its clarifications."
              : "Register for the contest to read questions and ask your own."
          }
          icon={LockKeyhole}
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <ContestRegisterButton
                slug={access.contest.slug}
                registered={access.registered}
                canRegister={access.status !== "ENDED"}
                isAuthenticated={Boolean(user)}
                ended={access.status === "ENDED"}
              />
              {!user ? (
                <Link
                  href={`/login?next=${encodeURIComponent(
                    `/contests/${access.contest.slug}/clarifications`,
                  )}`}
                  className={buttonVariants({ variant: "outline" })}
                >
                  Sign in first
                </Link>
              ) : null}
            </div>
          }
        />
      ) : (
        <>
          {access.canAsk ? (
            <div className="mt-5">
              <AskClarificationForm
                slug={access.contest.slug}
                problems={access.problems}
              />
            </div>
          ) : (
            <div className="mt-5 flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
              <LockKeyhole className="size-4" />
              {access.status === "ENDED"
                ? "This contest has ended. Clarifications are read-only."
                : "Register for the contest to ask a question."}
            </div>
          )}

          {!data || data.items.length === 0 ? (
            <EmptyState
              className="mt-5"
              title="No clarifications yet"
              description="Ask about a statement, constraints or sample. Official answers appear here for everyone."
              icon={MessagesSquare}
            />
          ) : (
            <div className="mt-5 space-y-3">
              {data.items.map((item) => (
                <Card key={item.id} className="p-4 sm:p-5">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    {item.problem ? (
                      <Badge variant="outline" className="font-mono">
                        {item.problem.label}
                      </Badge>
                    ) : (
                      <Badge variant="muted">General</Badge>
                    )}
                    {item.problem ? (
                      <span className="max-w-64 truncate font-medium text-foreground">
                        {item.problem.title}
                      </span>
                    ) : null}
                    <span>asked by</span>
                    <Link
                      href={`/users/${item.asker.username}`}
                      className="font-medium text-foreground hover:text-primary"
                    >
                      @{item.asker.username}
                    </Link>
                    <time
                      dateTime={item.createdAt}
                      title={formatDateTime(item.createdAt)}
                    >
                      {formatRelative(item.createdAt)}
                    </time>
                  </div>

                  <div className="mt-3 flex gap-2 text-sm leading-relaxed">
                    <span className="font-mono text-xs font-semibold text-primary">
                      Q.
                    </span>
                    <Markdown className="min-w-0 flex-1">{item.question}</Markdown>
                  </div>

                  {item.answer ? (
                    <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50/60 p-3 dark:border-emerald-900 dark:bg-emerald-950/30">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="success">Answered</Badge>
                        {item.answerer ? (
                          <>
                            <span>by</span>
                            <Link
                              href={`/users/${item.answerer.username}`}
                              className="font-medium text-foreground hover:text-primary"
                            >
                              @{item.answerer.username}
                            </Link>
                          </>
                        ) : null}
                        {item.answeredAt ? (
                          <time
                            dateTime={item.answeredAt}
                            title={formatDateTime(item.answeredAt)}
                          >
                            {formatRelative(item.answeredAt)}
                          </time>
                        ) : null}
                      </div>
                      <div className="mt-2 flex gap-2 text-sm leading-relaxed">
                        <span className="font-mono text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                          A.
                        </span>
                        <Markdown className="min-w-0 flex-1">
                          {item.answer}
                        </Markdown>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Badge variant="warning">Awaiting answer</Badge>
                      {item.canAnswer ? (
                        <span className="text-xs text-muted-foreground">
                          You can answer this question.
                        </span>
                      ) : null}
                    </div>
                  )}

                  {!item.answer && item.canAnswer ? (
                    <AnswerClarificationForm
                      slug={access.contest.slug}
                      clarificationId={item.id}
                    />
                  ) : null}
                </Card>
              ))}
            </div>
          )}

          <Pagination
            pathname={`/contests/${access.contest.slug}/clarifications`}
            searchParams={query}
            page={page}
            totalPages={totalPages}
          />
        </>
      )}
    </div>
  );
}
