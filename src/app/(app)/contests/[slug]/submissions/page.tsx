import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Code2, Filter, LockKeyhole } from "lucide-react";
import { ContestRegisterButton } from "@/features/contests/contest-register-button";
import { ContestTabs } from "@/components/contests/contest-tabs";
import { AutoRefresh } from "@/components/shared/auto-refresh";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Pagination } from "@/components/shared/pagination";
import { SubmissionTable } from "@/components/submissions/submission-table";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { getCurrentUser } from "@/server/auth/session";
import { ApiError } from "@/server/api/errors";
import { getContestAccess } from "@/server/services/contest-access";
import { listSubmissions } from "@/server/services/submissions";
import { LANGUAGES } from "@/lib/languages";
import { VERDICT_META, isPendingVerdict } from "@/lib/verdicts";
import { firstValue, readPage, type SearchParams } from "@/lib/pagination";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const statusOptions = Object.entries(VERDICT_META);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return { title: `Submissions · ${slug}` };
}

export default async function ContestSubmissionsPage({
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

  if (!access.canViewContent) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <PageHeader
          eyebrow="Contest judge"
          title={access.contest.title}
          description="Contest submissions are visible to participants and admins."
        />
        <ContestTabs slug={slug} active="submissions" className="mt-5" />
        <EmptyState
          className="mt-6"
          title="Submissions are locked"
          description={
            access.status === "ENDED"
              ? "This contest is private. Only registered participants and admins can read its submissions."
              : "Register for the contest to see the submission feed."
          }
          icon={LockKeyhole}
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <ContestRegisterButton
                slug={slug}
                registered={access.registered}
                canRegister={access.status !== "ENDED"}
                isAuthenticated={Boolean(user)}
                ended={access.status === "ENDED"}
              />
              {!user ? (
                <Link
                  href={`/login?next=${encodeURIComponent(
                    `/contests/${slug}/submissions`,
                  )}`}
                  className={buttonVariants({ variant: "outline" })}
                >
                  Sign in first
                </Link>
              ) : null}
            </div>
          }
        />
      </div>
    );
  }

  const mine = firstValue(query.mine) === "true";
  if (mine && !user) {
    redirect(
      `/login?next=${encodeURIComponent(
        `/contests/${slug}/submissions?mine=true`,
      )}`,
    );
  }
  const page = readPage(query);
  const pageSize = DEFAULT_PAGE_SIZE;
  const rawStatus = firstValue(query.status);
  const status = rawStatus && rawStatus in VERDICT_META ? rawStatus : undefined;
  const rawLanguage = firstValue(query.language);
  const language = LANGUAGES.find((item) => item.id === rawLanguage)?.id;

  const submissionPage = await listSubmissions(
    {
      page,
      pageSize,
      contest: slug,
      mine: mine ? "true" : "false",
      status,
      language,
    },
    user,
  );
  const totalPages = Math.max(
    1,
    Math.ceil(submissionPage.total / pageSize),
  );
  const hasPending = submissionPage.items.some((item) =>
    isPendingVerdict(item.status),
  );

  const statusFilterOptions = [
    { value: "", label: "Any verdict" },
    ...statusOptions.map(([value, meta]) => ({ value, label: meta.label })),
  ];
  const languageFilterOptions = [
    { value: "", label: "Any language" },
    ...LANGUAGES.map((item) => ({ value: item.id, label: item.label })),
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <AutoRefresh enabled={hasPending} intervalMs={15000} />
      <PageHeader
        eyebrow="Contest judge"
        title={access.contest.title}
        description={`${submissionPage.total} contest submission${
          submissionPage.total === 1 ? "" : "s"
        }. Source visibility follows the normal rules.`}
        actions={
          <Link
            href={`/contests/${slug}`}
            className={buttonVariants({ variant: "outline" })}
          >
            Contest page
          </Link>
        }
      />

      <ContestTabs slug={slug} active="submissions" className="mt-5" />

      <div className="mt-5 flex flex-wrap items-center gap-1.5">
        <Link
          href={`/contests/${slug}/submissions`}
          className={cn(
            buttonVariants({
              variant: mine ? "outline" : "default",
              size: "sm",
            }),
          )}
        >
          All submissions
        </Link>
        <Link
          href={
            user
              ? `/contests/${slug}/submissions?mine=true`
              : `/login?next=${encodeURIComponent(
                  `/contests/${slug}/submissions?mine=true`,
                )}`
          }
          className={cn(
            buttonVariants({
              variant: mine ? "default" : "outline",
              size: "sm",
            }),
          )}
        >
          My submissions
        </Link>
      </div>

      <Card className="mt-4 p-4">
        <form
          className="flex flex-wrap items-end gap-3"
          action={`/contests/${slug}/submissions`}
          method="get"
        >
          {mine ? <input type="hidden" name="mine" value="true" /> : null}
          <div className="min-w-44 flex-1">
            <label
              htmlFor="status"
              className="mb-1 block text-xs font-medium text-muted-foreground"
            >
              Verdict
            </label>
            <SearchableSelect
              id="status"
              name="status"
              defaultValue={status ?? ""}
              aria-label="Verdict"
              className="h-9 text-xs"
              options={statusFilterOptions}
            />
          </div>
          <div className="min-w-40 flex-1">
            <label
              htmlFor="language"
              className="mb-1 block text-xs font-medium text-muted-foreground"
            >
              Language
            </label>
            <SearchableSelect
              id="language"
              name="language"
              defaultValue={language ?? ""}
              aria-label="Language"
              className="h-9 text-xs"
              options={languageFilterOptions}
            />
          </div>
          <button
            type="submit"
            className={cn(buttonVariants({ size: "sm" }), "h-9")}
          >
            <Filter className="size-3.5" /> Filter
          </button>
          <Link
            href={
              mine
                ? `/contests/${slug}/submissions?mine=true`
                : `/contests/${slug}/submissions`
            }
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "h-9",
            )}
          >
            Reset
          </Link>
        </form>
      </Card>

      <div className="mt-5">
        {submissionPage.items.length === 0 ? (
          <EmptyState
            title={
              access.status === "UPCOMING"
                ? "The contest has not started"
                : "No contest submissions match"
            }
            description={
              access.status === "UPCOMING"
                ? "Submissions will appear here when the round begins."
                : "Try clearing the filters, or be the first to submit a solution."
            }
            icon={Code2}
            action={
              <Link
                href={`/contests/${slug}`}
                className={buttonVariants({ variant: "outline" })}
              >
                Back to contest
              </Link>
            }
          />
        ) : (
          <Card className="overflow-hidden p-1">
            <SubmissionTable items={submissionPage.items} />
          </Card>
        )}
      </div>

      <Pagination
        pathname={`/contests/${slug}/submissions`}
        searchParams={query}
        page={page}
        totalPages={totalPages}
      />
    </div>
  );
}
