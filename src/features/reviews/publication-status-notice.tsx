import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import type { AdminProblemDetail } from "@/lib/types";
import { formatDate } from "@/lib/utils";

type NoticeTone = "neutral" | "warning" | "danger" | "success";

const TONE_CLASS: Record<NoticeTone, string> = {
  neutral:
    "border-border bg-muted/30 text-foreground",
  warning:
    "border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-50",
  danger:
    "border-rose-300 bg-rose-50 text-rose-950 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-50",
  success:
    "border-emerald-300 bg-emerald-50 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-50",
};

function Notice({
  tone,
  icon: Icon,
  title,
  children,
  href,
  linkLabel,
}: {
  tone: NoticeTone;
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
  href: string;
  linkLabel: string;
}) {
  return (
    <div
      className={`flex flex-col gap-3 rounded-lg border px-4 py-3.5 text-xs leading-relaxed sm:flex-row sm:items-start ${TONE_CLASS[tone]}`}
    >
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-black/5 dark:bg-white/10">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{title}</p>
        <div className="mt-0.5 opacity-80">{children}</div>
      </div>
      <Link
        href={href}
        className="shrink-0 self-start rounded-md px-1 py-1.5 font-medium underline-offset-2 hover:underline"
      >
        {linkLabel}
      </Link>
    </div>
  );
}

export function NewProblemReviewNotice() {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3.5 text-xs leading-relaxed text-muted-foreground">
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
        <ShieldCheck className="size-4" aria-hidden="true" />
      </span>
      <div>
        <p className="text-sm font-semibold text-foreground">
          New problems go to publication review
        </p>
        <p className="mt-0.5">
          Saving sends this problem straight to publication review, so it is
          never public on its own. Two other setters must approve it with a
          working reference solution, and it needs an editorial plus at least
          one reviewer-added test before it can go public.
        </p>
      </div>
    </div>
  );
}

export function PublicationStatusNotice({
  problem,
  reviewBasePath,
}: {
  problem: AdminProblemDetail;
  reviewBasePath: string;
}) {
  const href = `${reviewBasePath}/${problem.id}`;

  if (problem.publicationStatus === "PUBLISHED") {
    return (
      <Notice
        tone="success"
        icon={CheckCircle2}
        title="Published"
        href={`/problems/${problem.slug}`}
        linkLabel="View problem"
      >
        This problem is live in the public problem list
        {problem.publishedAt
          ? ` since ${formatDate(problem.publishedAt)}`
          : ""}
        . Content is locked; start a re-review from the review workspace to
        change the statement or tests.
      </Notice>
    );
  }

  if (problem.publicationStatus === "CHANGES_REQUESTED") {
    return (
      <Notice
        tone="danger"
        icon={AlertTriangle}
        title="Changes requested"
        href={href}
        linkLabel="Open review"
      >
        Approvals are locked until every hold is resolved. Review cycle{" "}
        {problem.reviewCycle}.
      </Notice>
    );
  }

  if (problem.publicationStatus === "IN_REVIEW") {
    return (
      <Notice
        tone="warning"
        icon={ShieldCheck}
        title="In publication review"
        href={href}
        linkLabel="Open review"
      >
        Cycle {problem.reviewCycle}. Two setters must approve this problem
        before it can be published.
      </Notice>
    );
  }

  return (
    <Notice
      tone="neutral"
      icon={ShieldCheck}
      title="Draft"
      href={href}
      linkLabel="Open review"
    >
      This problem is private. Submit it for review when the statement and
      tests are ready.
    </Notice>
  );
}
