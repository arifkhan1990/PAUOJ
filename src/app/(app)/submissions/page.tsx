import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Code2, Filter } from "lucide-react";
import { AutoRefresh } from "@/components/shared/auto-refresh";
import { EmptyState } from "@/components/shared/empty-state";
import { Pagination } from "@/components/shared/pagination";
import { PageHeader } from "@/components/shared/page-header";
import { SubmissionTable } from "@/components/submissions/submission-table";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { getCurrentUser } from "@/server/auth/session";
import { listSubmissions } from "@/server/services/submissions";
import { listProblemOptions } from "@/server/services/problem-options";
import { LANGUAGES } from "@/lib/languages";
import { VERDICT_META, isPendingVerdict } from "@/lib/verdicts";
import {
  firstValue,
  readPage,
  type SearchParams,
} from "@/lib/pagination";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Submissions",
  description: "Every submission sent to the PAU Online Judge.",
};

export const dynamic = "force-dynamic";

const statusOptions = Object.entries(VERDICT_META);

export default async function SubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const user = await getCurrentUser();
  const mine = firstValue(params.mine) === "true";
  if (mine && !user) {
    redirect(`/login?next=${encodeURIComponent("/submissions?mine=true")}`);
  }

  const page = readPage(params);
  const pageSize = DEFAULT_PAGE_SIZE;
  const rawStatus = firstValue(params.status);
  const status = rawStatus && rawStatus in VERDICT_META ? rawStatus : undefined;
  const rawLanguage = firstValue(params.language);
  const language = LANGUAGES.find((item) => item.id === rawLanguage)?.id;
  const problem = firstValue(params.problem)?.slice(0, 120) || undefined;
  const userFilter = firstValue(params.user)?.toLowerCase().slice(0, 64) || undefined;

  const [submissionPage, problemOptions] = await Promise.all([
    listSubmissions(
      {
        page,
        pageSize,
        mine: mine ? "true" : "false",
        status,
        language,
        problem,
        user: userFilter,
      },
      user,
    ),
    listProblemOptions(),
  ]);

  const totalPages = Math.max(1, Math.ceil(submissionPage.total / pageSize));
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
  const problemFilterOptions = [
    { value: "", label: "Any problem" },
    ...problemOptions.map((item) => ({ value: item.slug, label: item.title })),
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <AutoRefresh enabled={hasPending} intervalMs={5000} />
      <PageHeader
        eyebrow="Judge activity"
        title="Submissions"
        description={`${submissionPage.total} submission${
          submissionPage.total === 1 ? "" : "s"
        } in the judge. New verdicts appear live.`}
        actions={
          <Link href="/problems" className={buttonVariants()}>
            <Code2 className="size-4" /> Submit code
          </Link>
        }
      />

      <div className="mt-6 flex flex-wrap items-center gap-1.5">
        <Link
          href="/submissions"
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
              ? "/submissions?mine=true"
              : `/login?next=${encodeURIComponent("/submissions?mine=true")}`
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
        <form className="flex flex-wrap items-end gap-3" action="/submissions" method="get">
          {mine ? <input type="hidden" name="mine" value="true" /> : null}
          <div className="min-w-44 flex-1">
            <label htmlFor="status" className="mb-1 block text-xs font-medium text-muted-foreground">
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
            <label htmlFor="language" className="mb-1 block text-xs font-medium text-muted-foreground">
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
          <div className="min-w-48 flex-[1.4]">
            <label htmlFor="problem" className="mb-1 block text-xs font-medium text-muted-foreground">
              Problem
            </label>
            <SearchableSelect
              id="problem"
              name="problem"
              defaultValue={problem ?? ""}
              aria-label="Problem"
              className="h-9 text-xs"
              options={problemFilterOptions}
            />
          </div>
          <button type="submit" className={cn(buttonVariants({ size: "sm" }), "h-9")}>
            <Filter className="size-3.5" /> Filter
          </button>
          <Link
            href={mine ? "/submissions?mine=true" : "/submissions"}
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-9")}
          >
            Reset
          </Link>
        </form>
      </Card>

      <div className="mt-5">
        {submissionPage.items.length === 0 ? (
          <EmptyState
            title="No submissions match"
            description="Try clearing filters, or be the first to submit a solution."
            icon={Code2}
            action={
              <Link href="/problems" className={buttonVariants()}>
                Browse problems
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
        pathname="/submissions"
        searchParams={params}
        page={page}
        totalPages={totalPages}
      />
    </div>
  );
}
