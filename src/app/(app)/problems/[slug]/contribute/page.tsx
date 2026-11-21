import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";
import { ContributionForm } from "@/features/problems/contribution-form";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button";
import { getCurrentUser } from "@/server/auth/session";
import { ApiError } from "@/server/api/errors";
import { getProblemBySlug } from "@/server/services/problems";
import { hasAcceptedSolution } from "@/server/services/problem-contributions";
import {
  PROBLEM_CONTRIBUTION_KINDS,
  type ProblemContributionKind,
} from "@/lib/contribution-types";
import { firstValue, type SearchParams } from "@/lib/pagination";

export const metadata: Metadata = {
  title: "Propose a contribution",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const COMMUNITY_KINDS: ProblemContributionKind[] = ["EDITORIAL"];

function readKind(value: string | undefined): ProblemContributionKind {
  return PROBLEM_CONTRIBUTION_KINDS.find((kind) => kind === value) ?? "EDITORIAL";
}

export default async function ContributePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const user = await getCurrentUser();
  const backLink = (
    <Link
      href={`/problems/${slug}`}
      className={buttonVariants({ variant: "ghost" })}
    >
      <ArrowLeft className="size-4" /> Back to problem
    </Link>
  );

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <EmptyState
          title="Sign in to propose a change"
          description="Problem setters can send statement, test and editorial changes. Solvers can propose a community editorial."
          icon={LockKeyhole}
          action={
            <Link
              href={`/login?next=${encodeURIComponent(`/problems/${slug}/contribute`)}`}
              className={buttonVariants()}
            >
              Sign in
            </Link>
          }
        />
      </div>
    );
  }

  let problem: Awaited<ReturnType<typeof getProblemBySlug>> = null;
  try {
    problem = await getProblemBySlug(
      slug,
      user.id,
      user.role === "ADMIN",
    );
  } catch (error) {
    if (error instanceof ApiError) {
      return (
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          <EmptyState
            title="This problem is locked"
            description="Problems inside a running contest or assessment accept proposals after it ends."
            icon={LockKeyhole}
            action={backLink}
          />
        </div>
      );
    }
    throw error;
  }
  if (!problem) notFound();

  const isStaff = user.role === "ADMIN" || user.role === "TEACHER";
  const isOwner = problem.authorId === user.id;
  const canEditDirectly =
    user.role === "ADMIN" || (user.role === "TEACHER" && isOwner);

  if (canEditDirectly) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <EmptyState
          title="You can edit this problem directly"
          description="As the problem author or an admin you publish changes immediately, so proposals are not needed."
          icon={ShieldCheck}
          action={
            <Link
              href={`${user.role === "ADMIN" ? "/admin" : "/teacher"}/problems/${problem.id}/edit`}
              className={buttonVariants()}
            >
              Open the problem editor
            </Link>
          }
        />
      </div>
    );
  }

  if (isOwner) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <EmptyState
          title="You author this problem"
          description="Changes to your problem come from setters, teachers and admins. Review them from your contributions queue."
          icon={ShieldCheck}
          action={
            <Link
              href={`/dashboard/contributions/${problem.id}`}
              className={buttonVariants()}
            >
              Review proposals
            </Link>
          }
        />
      </div>
    );
  }

  if (!isStaff) {
    const hasSolved =
      problem.solvedByMe &&
      (await hasAcceptedSolution(user.id, problem.id));
    if (!hasSolved) {
      return (
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          <EmptyState
            title="Solve the problem first"
            description="Community editorials come from solvers. Get an accepted submission, then share the approach that worked for you."
            icon={BookOpen}
            action={
              <Link
                href={`/problems/${problem.slug}#submit`}
                className={buttonVariants()}
              >
                Open the editor
              </Link>
            }
          />
        </div>
      );
    }
  }

  const allowedKinds = isStaff ? [...PROBLEM_CONTRIBUTION_KINDS] : COMMUNITY_KINDS;
  const initialKind = isStaff ? readKind(firstValue(query.kind)) : "EDITORIAL";
  const initialStatement = {
    statement: problem.statement,
    inputFormat: problem.inputFormat ?? "",
    outputFormat: problem.outputFormat ?? "",
    constraints: problem.constraints ?? "",
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow={isStaff ? "Problem setter workflow" : "Community editorial"}
        title={
          isStaff
            ? `Propose a change to "${problem.title}"`
            : `Propose an editorial for "${problem.title}"`
        }
        description="Your proposal stays private until the problem author approves it. Approved changes go live on the problem immediately."
        actions={backLink}
      />

      <div className="mt-6 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">
        You are contributing to a problem authored by{" "}
        <span className="font-semibold">
          {problem.author?.displayName ?? "another setter"}
        </span>
        .{" "}
        {isStaff
          ? "Every change needs their review, except changes made by admins."
          : "Your editorial stays private until they approve it."}
      </div>

      <div className="mt-6">
        <ContributionForm
          slug={problem.slug}
          initialKind={initialKind}
          allowedKinds={allowedKinds}
          initialStatement={initialStatement}
          initialEditorial={problem.editorial}
          redirectTo={
            isStaff ? "/teacher/contributions" : "/dashboard/contributions"
          }
        />
      </div>
    </div>
  );
}
