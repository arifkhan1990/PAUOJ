"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ClipboardCheck,
  ExternalLink,
  Loader2,
  RefreshCw,
  Save,
} from "lucide-react";
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
import { assessmentInputSchema } from "@/lib/schemas/assessment";
import type { SelectOption } from "@/lib/select-options";
import type { AdminAssessmentDetail, ProblemOption } from "@/lib/types";

const JOIN_MODE_OPTIONS: SelectOption[] = [
  { value: "OPEN_CODE", label: "Shared access code" },
  { value: "INVITE", label: "Personal invite links" },
];

type FormValues = {
  title: string;
  slug: string;
  description: string;
  accessCode: string;
  joinMode: "OPEN_CODE" | "INVITE";
  startAt: string;
  endAt: string;
  durationMinutes: string;
  isPublished: boolean;
  problemIds: string[];
};

function generateCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(5));
  return Array.from(bytes)
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}

function toLocalDateTime(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function defaultValues(initial: AdminAssessmentDetail | null): FormValues {
  if (!initial) {
    const start = new Date();
    start.setUTCDate(start.getUTCDate() + 1);
    start.setUTCHours(10, 0, 0, 0);
    const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
    return {
      title: "",
      slug: "",
      description: "",
      accessCode: "",
      joinMode: "OPEN_CODE",
      startAt: toLocalDateTime(start.toISOString()),
      endAt: toLocalDateTime(end.toISOString()),
      durationMinutes: "90",
      isPublished: false,
      problemIds: [],
    };
  }
  return {
    title: initial.title,
    slug: initial.slug,
    description: initial.description,
    accessCode: initial.accessCode,
    joinMode: initial.joinMode,
    startAt: toLocalDateTime(initial.startAt),
    endAt: toLocalDateTime(initial.endAt),
    durationMinutes: String(initial.durationMinutes ?? 0),
    isPublished: initial.isPublished,
    problemIds: initial.problemIds,
  };
}

export function AssessmentForm({
  initial,
  options,
  basePath = "/admin/assessments",
}: {
  initial: AdminAssessmentDetail | null;
  options: ProblemOption[];
  basePath?: string;
}) {
  const [values, setValues] = useState<FormValues>(() => defaultValues(initial));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [dirty, setDirty] = useState(false);
  const generatedCode = useRef(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (initial || generatedCode.current) return;
    generatedCode.current = true;
    setValues((current) => ({
      ...current,
      accessCode: current.accessCode || generateCode(),
    }));
  }, [initial]);

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
    const parsed = assessmentInputSchema.safeParse({
      title: values.title,
      slug: values.slug || undefined,
      description: values.description,
      accessCode: values.accessCode,
      joinMode: values.joinMode,
      startAt: start.toISOString(),
      endAt: end.toISOString(),
      durationMinutes: Number(values.durationMinutes),
      isPublished: values.isPublished,
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
        await apiPut(`/api/v1/admin/assessments/${initial.id}`, parsed.data);
      } else {
        await apiPost("/api/v1/admin/assessments", parsed.data);
      }
      setDirty(false);
      toast({
        title: initial ? "Assessment updated" : "Assessment created",
        variant: "success",
      });
      router.push(basePath);
      router.refresh();
    } catch (submitError) {
      const message =
        submitError instanceof ApiClientError
          ? submitError.message
          : "Could not save the assessment.";
      setError(message);
      toast({ title: "Save failed", description: message, variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Coding test"
        title={initial ? "Edit assessment" : "New assessment"}
        description="Candidates join with the access code or their personal invite link, get their own timer and only see the problems while their session is active."
        actions={
          <>
            {initial ? (
              <>
                <Link
                  href={`/assessments/${initial.slug}`}
                  className={buttonVariants({ variant: "outline" })}
                >
                  <ExternalLink className="size-4" /> Candidate view
                </Link>
                <Link
                  href={`${basePath}/${initial.id}`}
                  className={buttonVariants({ variant: "outline" })}
                >
                  <ClipboardCheck className="size-4" /> Results
                </Link>
              </>
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
              <Label htmlFor="accessCode">Access code</Label>
              <div className="flex gap-2">
                <Input
                  id="accessCode"
                  value={values.accessCode}
                  onChange={(event) =>
                    update("accessCode", event.target.value.toUpperCase())
                  }
                  required
                  minLength={6}
                  maxLength={20}
                  className="font-mono tracking-wider"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => update("accessCode", generateCode())}
                  aria-label="Generate access code"
                >
                  <RefreshCw className="size-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="joinMode">Join mode</Label>
              <SearchableSelect
                id="joinMode"
                value={values.joinMode}
                onValueChange={(next) =>
                  update("joinMode", next as FormValues["joinMode"])
                }
                options={JOIN_MODE_OPTIONS}
              />
              <p className="text-[11px] text-muted-foreground">
                Invite links disable the shared code for candidates. Create the
                roster after saving.
              </p>
            </div>
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
            <div className="space-y-1.5">
              <Label htmlFor="durationMinutes">Session length (minutes)</Label>
              <Input
                id="durationMinutes"
                type="number"
                min={0}
                max={1440}
                step={5}
                value={values.durationMinutes}
                onChange={(event) =>
                  update("durationMinutes", event.target.value)
                }
              />
              <p className="text-[11px] text-muted-foreground">
                0 means candidates get the whole window.
              </p>
            </div>
            <label className="flex items-center gap-2 self-end pb-2 text-sm">
              <input
                type="checkbox"
                checked={values.isPublished}
                onChange={(event) => update("isPublished", event.target.checked)}
                className="size-4 accent-[var(--primary)]"
              />
              Publish and accept candidates
            </label>
          </div>
          <MarkdownField
            id="description"
            label="Description and instructions"
            value={values.description}
            onChange={(value) => update("description", value)}
            rows={8}
            placeholder="Rules, allowed languages, grading, contact details…"
          />
        </Card>

        <Card className="p-5">
          <h2 className="text-sm font-semibold">Problem set</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Only participants can open these problems while the assessment is
            active. Labels are assigned from the selected order.
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
            <Link
              href={basePath}
              className={buttonVariants({ variant: "ghost" })}
            >
              Cancel
            </Link>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              {loading ? "Saving…" : "Save assessment"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
