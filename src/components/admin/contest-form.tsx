"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ExternalLink, Loader2, Save } from "lucide-react";
import { useToast } from "@/components/providers/toast-provider";
import { PageHeader } from "@/components/shared/page-header";
import { MarkdownField } from "@/components/admin/markdown-field";
import { ProblemPicker } from "@/components/admin/problem-picker";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { ApiClientError, apiPost, apiPut } from "@/lib/api-client";
import { contestInputSchema } from "@/lib/schemas/contest";
import type { SelectOption } from "@/lib/select-options";
import type { AdminContestDetail, ProblemOption } from "@/lib/types";

const DIVISION_OPTIONS: SelectOption[] = [
  { value: "OPEN", label: "Open" },
  { value: "DIV1", label: "Div. 1" },
  { value: "DIV2", label: "Div. 2" },
  { value: "DIV3", label: "Div. 3" },
  { value: "DIV4", label: "Div. 4" },
];

type FormValues = {
  title: string;
  slug: string;
  description: string;
  startAt: string;
  endAt: string;
  isPublic: boolean;
  division: "OPEN" | "DIV1" | "DIV2" | "DIV3" | "DIV4";
  freezeMinutes: string;
  problemIds: string[];
};

function toLocalDateTime(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function defaultValues(initial: AdminContestDetail | null): FormValues {
  if (!initial) {
    const start = new Date();
    start.setUTCDate(start.getUTCDate() + 1);
    start.setUTCHours(10, 0, 0, 0);
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
    return {
      title: "",
      slug: "",
      description: "",
      startAt: toLocalDateTime(start.toISOString()),
      endAt: toLocalDateTime(end.toISOString()),
      isPublic: true,
      division: "OPEN",
      freezeMinutes: "0",
      problemIds: [],
    };
  }
  return {
    title: initial.title,
    slug: initial.slug,
    description: initial.description,
    startAt: toLocalDateTime(initial.startAt),
    endAt: toLocalDateTime(initial.endAt),
    isPublic: initial.isPublic,
    division: initial.division,
    freezeMinutes: String(initial.freezeMinutes),
    problemIds: initial.problemIds,
  };
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
  const [values, setValues] = useState<FormValues>(() => defaultValues(initial));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [dirty, setDirty] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const pendingApprovals =
    initial?.problemApprovals.filter(
      (approval) => approval.status !== "APPROVED",
    ) ?? [];

  useEffect(() => {
    if (!dirty) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const update = <K extends keyof FormValues,>(
    key: K,
    value: FormValues[K],
  ) => {
    setValues((current) => ({ ...current, [key]: value }));
    setDirty(true);
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
    const parsed = contestInputSchema.safeParse({
      title: values.title,
      slug: values.slug || undefined,
      description: values.description,
      startAt: start.toISOString(),
      endAt: end.toISOString(),
      isPublic: values.isPublic,
      division: values.division,
      freezeMinutes: Number(values.freezeMinutes),
      problemIds: values.problemIds,
    });
    if (!parsed.success) {
      setError(
        parsed.error.issues
          .map((issue) => `${issue.path.join(".") || "form"}: ${issue.message}`)
          .join(" · "),
      );
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
        description="Set the window, pick the problems and publish. Labels are assigned from the selected order."
        actions={
          <>
            {initial ? (
              <Link
                href={`/contests/${initial.slug}`}
                className={buttonVariants({ variant: "outline" })}
              >
                <ExternalLink className="size-4" /> View
              </Link>
            ) : null}
            <Link
              href={basePath}
              className={buttonVariants({ variant: "ghost" })}
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
        <Card className="space-y-4 p-5">
          <h2 className="text-sm font-semibold">Basics</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={values.title}
                onChange={(event) => update("title", event.target.value)}
                required
                maxLength={120}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={values.slug}
                onChange={(event) => update("slug", event.target.value)}
                placeholder="generated-from-title"
                maxLength={80}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="division">Division</Label>
              <SearchableSelect
                id="division"
                value={values.division}
                onValueChange={(next) =>
                  update("division", next as FormValues["division"])
                }
                options={DIVISION_OPTIONS}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="freezeMinutes">Freeze (minutes)</Label>
              <Input
                id="freezeMinutes"
                type="number"
                min="0"
                max="720"
                value={values.freezeMinutes}
                onChange={(event) =>
                  update("freezeMinutes", event.target.value)
                }
              />
              <p className="text-[11px] text-muted-foreground">
                0 disables the freeze window.
              </p>
            </div>
            <label className="flex items-center gap-2 self-end pb-2 text-sm">
              <input
                type="checkbox"
                checked={values.isPublic}
                onChange={(event) => update("isPublic", event.target.checked)}
                className="size-4 accent-[var(--primary)]"
              />
              Public contest
            </label>
            <div className="space-y-1.5">
              <Label htmlFor="startAt">Starts</Label>
              <Input
                id="startAt"
                type="datetime-local"
                value={values.startAt}
                onChange={(event) => update("startAt", event.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="endAt">Ends</Label>
              <Input
                id="endAt"
                type="datetime-local"
                value={values.endAt}
                onChange={(event) => update("endAt", event.target.value)}
                required
              />
            </div>
          </div>
          <MarkdownField
            id="description"
            label="Description"
            value={values.description}
            onChange={(value) => update("description", value)}
            rows={6}
            placeholder="Rules, eligibility, prizes or anything participants should know."
          />
        </Card>

        <Card className="p-5">
          <h2 className="text-sm font-semibold">Problem set</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Select problems and put them in order. The first problem becomes A,
            the second B, and so on. Problems authored by another setter need
            their approval before the contest can be public; save a private
            draft first.
          </p>
          <div className="mt-4">
            <ProblemPicker
              options={options}
              selected={values.problemIds}
              onChange={(ids) => update("problemIds", ids)}
            />
          </div>
        </Card>

        <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-background/95 p-3 shadow-lg backdrop-blur">
          <p className="text-xs text-muted-foreground">
            {dirty ? "Unsaved changes" : "No unsaved changes"}
          </p>
          <div className="flex gap-2">
            <Link href={basePath} className={buttonVariants({ variant: "ghost" })}>
              Cancel
            </Link>
            <Button type="submit" disabled={loading}>
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
    </div>
  );
}
