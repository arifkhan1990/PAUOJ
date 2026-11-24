"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ExternalLink,
  Loader2,
  Save,
  Settings2,
} from "lucide-react";
import { useToast } from "@/components/providers/toast-provider";
import { PageHeader } from "@/components/shared/page-header";
import {
  ContestBasicsSection,
  ContestFormatSection,
} from "@/components/admin/contest-form-sections";
import {
  ContestDetailsSection,
  ContestFeeSection,
  ParticipantFormatHint,
} from "@/components/admin/contest-form-details-sections";
import {
  contestInputFromValues,
  defaultContestFormValues,
  type ContestFormValues,
} from "@/components/admin/contest-form-values";
import { ProblemPicker } from "@/components/admin/problem-picker";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ApiClientError, apiPost, apiPut } from "@/lib/api-client";
import { contestInputSchema } from "@/lib/schemas/contest";
import type { AdminContestDetail, ProblemOption } from "@/lib/types";
import { adminContestOperationsPath } from "@/lib/contest-ops";

function formatIssues(
  issues: { path: PropertyKey[]; message: string }[],
): string {
  return issues
    .map((issue) => {
      const path = issue.path.join(".");
      return `${path || "form"}: ${issue.message}`;
    })
    .join(" · ");
}

export function ContestForm({
  initial,
  options,
  basePath = "/admin/contests",
}: {
  initial: AdminContestDetail | null;
  options: ProblemOption[];
  basePath?: string;
}) {
  const [values, setValues] = useState<ContestFormValues>(() =>
    defaultContestFormValues(initial),
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();
  const pendingApprovals =
    initial?.problemApprovals.filter(
      (approval) => approval.status !== "APPROVED",
    ) ?? [];
  const operationsHref =
    initial && basePath === "/admin/contests"
      ? adminContestOperationsPath(initial.id)
      : undefined;

  useEffect(() => {
    if (!dirty) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const update = <K extends keyof ContestFormValues,>(
    key: K,
    value: ContestFormValues[K],
  ) => {
    setValues((current) => ({ ...current, [key]: value }));
    setDirty(true);
  };

  const guardLeave =
    (href: string) => (event: React.MouseEvent<HTMLAnchorElement>) => {
      if (!dirty) return;
      event.preventDefault();
      setPendingHref(href);
    };

  const leaveNow = () => {
    if (!pendingHref) return;
    const href = pendingHref;
    setPendingHref(null);
    setDirty(false);
    router.push(href);
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const start = new Date(values.startAt);
    const end = new Date(values.endAt);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      setError("Choose valid start and end times.");
      return;
    }
    if (values.format === "GROUP") {
      const size = Number(values.teamSize);
      if (!Number.isInteger(size) || size < 2 || size > 6) {
        setError("A team contest needs 2 to 6 coders per team.");
        return;
      }
    }
    const parsed = contestInputSchema.safeParse({
      ...contestInputFromValues(values),
      startAt: start.toISOString(),
      endAt: end.toISOString(),
    });
    if (!parsed.success) {
      setError(formatIssues(parsed.error.issues));
      return;
    }

    setLoading(true);
    try {
      if (initial) {
        await apiPut(`/api/v1/admin/contests/${initial.id}`, parsed.data);
      } else {
        await apiPost("/api/v1/admin/contests", parsed.data);
      }
      setDirty(false);
      toast({
        title: initial ? "Contest updated" : "Contest created",
        description: parsed.data.requiresFreshProblems
          ? "Fresh-problem debuts reserved for the selected set."
          : "Fresh-problem policy is off for this contest.",
        variant: "success",
      });
      router.push(basePath);
      router.refresh();
    } catch (submitError) {
      const message =
        submitError instanceof ApiClientError
          ? submitError.message
          : "Could not save the contest.";
      setError(message);
      toast({ title: "Save failed", description: message, variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Contest director"
        title={initial ? "Edit contest" : "New contest"}
        description="Set the window, choose solo or team play, lock the fresh-problem policy and pick the problem set. Labels follow the selected order."
        actions={
          <>
            {initial ? (
              <Link
                href={`/contests/${initial.slug}`}
                className={buttonVariants({ variant: "outline" })}
                onClick={guardLeave(`/contests/${initial.slug}`)}
              >
                <ExternalLink className="size-4" /> View
              </Link>
            ) : null}
            {operationsHref ? (
              <Link
                href={operationsHref}
                className={buttonVariants({ variant: "outline" })}
                onClick={guardLeave(operationsHref)}
              >
                <Settings2 className="size-4" /> Operations
              </Link>
            ) : null}
            <Link
              href={basePath}
              className={buttonVariants({ variant: "ghost" })}
              onClick={guardLeave(basePath)}
            >
              <ArrowLeft className="size-4" /> Back
            </Link>
          </>
        }
      />

      {pendingApprovals.length > 0 ? (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-xs leading-relaxed text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">
          <p className="font-semibold">
            {pendingApprovals.length} problem
            {pendingApprovals.length === 1 ? "" : "s"} need author approval
          </p>
          <p className="mt-1">
            This contest stays a private draft until every listed problem is
            approved. Authors can approve or decline from their contributions
            page.
          </p>
          <ul className="mt-2 space-y-1">
            {pendingApprovals.map((approval) => (
              <li key={approval.problemId}>
                <span className="font-medium">{approval.problemTitle}</span>
                {" — "}
                {approval.status === "REJECTED"
                  ? "declined"
                  : "waiting for the author"}
                {approval.reviewNote ? ` (${approval.reviewNote})` : ""}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {error ? (
        <div
          role="alert"
          className="rounded-md border border-rose-300 bg-rose-50 p-3 text-xs leading-relaxed text-rose-900 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-100"
        >
          {error}
        </div>
      ) : null}

      <form onSubmit={(event) => void submit(event)} className="space-y-5">
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="space-y-5">
            <ContestBasicsSection values={values} update={update} />
            <ContestFeeSection values={values} update={update} />
          </div>
          <div className="space-y-5">
            <ContestFormatSection
              values={values}
              update={update}
              operationsHref={operationsHref}
              showOfficial={basePath === "/admin/contests"}
            />
            <Card className="p-5">
              <h2 className="text-sm font-semibold">Before you save</h2>
              <ul className="mt-2 space-y-2 text-xs leading-relaxed text-muted-foreground">
                <li>
                  <span className="font-medium text-foreground">
                    Fresh policy:
                  </span>{" "}
                  a fresh problem is an unpublished draft that has never been
                  used in another contest. Saving reserves its first-use debut.
                </li>
                <li>
                  <span className="font-medium text-foreground">
                    Approval:
                  </span>{" "}
                  a public contest cannot go live until every author approves
                  its problem. Save a private draft if approvals are pending.
                </li>
                <li>
                  <span className="font-medium text-foreground">
                    Teams:
                  </span>{" "}
                  team rounds are unrated and have no virtual replay.
                </li>
                <li>
                  <span className="font-medium text-foreground">
                    Public page order:
                  </span>{" "}
                  banner → About → format and eligibility → Rules & policy →
                  Prizes. Blank blocks are skipped.
                </li>
              </ul>
              <div className="mt-3">
                <ParticipantFormatHint format={values.format} />
              </div>
            </Card>
          </div>
        </div>

        <Card className="p-5">
          <h2 className="text-sm font-semibold">Problem set</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Select problems and put them in order. The first problem becomes A,
            the second B, and so on.
            {values.requiresFreshProblems
              ? " Fresh policy is on: use draft problems that never appeared in another contest."
              : " Fresh policy is off: careful with already-public problems."}
          </p>
          <div className="mt-4">
            <ProblemPicker
              options={options}
              selected={values.problemIds}
              onChange={(ids) => update("problemIds", ids)}
            />
          </div>
        </Card>

        <ContestDetailsSection values={values} update={update} />

        <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-background/95 p-3 shadow-lg backdrop-blur">
          <p className="text-xs text-muted-foreground">
            {dirty ? "Unsaved changes" : "No unsaved changes"}
          </p>
          <div className="flex gap-2">
            <Link
              href={basePath}
              className={buttonVariants({ variant: "ghost" })}
              onClick={guardLeave(basePath)}
            >
              Cancel
            </Link>
            <Button type="submit" disabled={loading} className="min-h-11">
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              {loading ? "Saving…" : "Save contest"}
            </Button>
          </div>
        </div>
      </form>

      <ConfirmDialog
        open={pendingHref !== null}
        title="Discard unsaved changes?"
        description="Leaving this page drops every field you changed since the last save."
        confirmLabel="Discard and leave"
        cancelLabel="Keep editing"
        pending={false}
        destructive
        onCancel={() => setPendingHref(null)}
        onConfirm={leaveNow}
      />
    </div>
  );
}
