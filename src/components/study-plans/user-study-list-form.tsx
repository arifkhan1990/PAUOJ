"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Save, ShieldCheck } from "lucide-react";
import {
  MAX_SECTIONS,
  StudyListSectionsEditor,
  findDuplicateProblemIds,
} from "@/components/admin/study-list-sections-editor";
import { useToast } from "@/components/providers/toast-provider";
import { useStudyListSections } from "@/components/study-plans/use-study-list-sections";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Textarea } from "@/components/ui/textarea";
import { ApiClientError, apiPost, apiPut } from "@/lib/api-client";
import { studyListInputSchema } from "@/lib/schemas/study-list";
import {
  STUDY_LIST_LEVELS,
  STUDY_PLAN_QUOTA,
  countStudyDifficulties,
  estimateStudyMinutes,
  formatStudyDuration,
} from "@/lib/study-list";
import type { SelectOption } from "@/lib/select-options";
import type {
  AdminStudyListDetail,
  ProblemOption,
  StudyListLevel,
} from "@/lib/types";

const LEVEL_OPTIONS: SelectOption[] = STUDY_LIST_LEVELS.map((level) => ({
  value: level.value,
  label: level.label,
  description: level.description,
}));

type SaveResponse = { id: string; slug: string };

function issueLocation(path: PropertyKey[]): string {
  const [head, index] = path;
  if (head === "sections" && typeof index === "number") {
    return `Section ${index + 1}`;
  }
  const key = String(head ?? "form");
  const label =
    key === "estimatedMinutes" ? "Estimated time" : key.replace(/_/g, " ");
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function parseEstimate(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const minutes = Number(trimmed);
  return Number.isFinite(minutes) ? minutes : null;
}

export function UserStudyListForm({
  initial,
  options,
}: {
  initial: AdminStudyListDetail | null;
  options: ProblemOption[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [level, setLevel] = useState<StudyListLevel>(
    initial?.level ?? "BEGINNER",
  );
  const [estimatedMinutes, setEstimatedMinutes] = useState(
    initial?.estimatedMinutes != null ? String(initial.estimatedMinutes) : "",
  );
  const [loading, setLoading] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const markDirty = () => setDirty(true);
  const {
    sections,
    activeIndex,
    setActiveIndex,
    addSection,
    removeSection,
    moveSection,
    updateSection,
  } = useStudyListSections({ initial, onChange: markDirty });

  useEffect(() => {
    if (!dirty) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const { autoMinutes, difficultyCounts, duplicateIds } = useMemo(() => {
    const byId = new Map(options.map((option) => [option.id, option]));
    const picked = sections
      .flatMap((section) => section.problemIds)
      .map((id) => byId.get(id))
      .filter((option): option is ProblemOption => Boolean(option));
    return {
      autoMinutes: estimateStudyMinutes(picked),
      difficultyCounts: countStudyDifficulties(picked),
      duplicateIds: findDuplicateProblemIds(sections),
    };
  }, [options, sections]);

  const estimateMinutes = parseEstimate(estimatedMinutes);
  const durationMinutes = estimateMinutes ?? autoMinutes;
  const problemCount = sections.reduce(
    (total, section) => total + section.problemIds.length,
    0,
  );
  const footerStatus = dirty
    ? "Unsaved changes"
    : problemCount === 0
      ? "No problems yet"
      : null;

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    // Learner plans are always private; the API enforces it too.
    const parsed = studyListInputSchema.safeParse({
      title,
      slug: slug.trim() || undefined,
      description,
      level,
      estimatedMinutes: estimateMinutes,
      isFeatured: false,
      isPublic: false,
      sections: sections.map((section) => ({
        title: section.title,
        description: section.description,
        problemIds: section.problemIds,
      })),
    });
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const message = issue
        ? `${issueLocation(issue.path)}: ${issue.message}`
        : "Check the fields and try again.";
      setError(message);
      if (issue?.path[0] === "sections" && typeof issue.path[1] === "number") {
        setActiveIndex(issue.path[1]);
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
      toast({ title: "Check the form", description: message, variant: "warning" });
      return;
    }

    setLoading(true);
    try {
      const result = initial
        ? await apiPut<SaveResponse>(
            `/api/v1/lists/${encodeURIComponent(initial.slug)}`,
            parsed.data,
          )
        : await apiPost<SaveResponse>("/api/v1/lists", parsed.data);
      toast({
        title: initial ? "Plan updated" : "Plan created",
        description: `${sections.length} ${
          sections.length === 1 ? "section" : "sections"
        } · ${problemCount} problems`,
        variant: "success",
      });
      setDirty(false);
      router.push(`/lists/${result.slug}`);
      router.refresh();
    } catch (requestError) {
      const message =
        requestError instanceof ApiClientError
          ? requestError.message
          : "Could not save the plan.";
      setError(message);
      toast({ title: "Save failed", description: message, variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={(event) => void submit(event)} className="space-y-4">
      {error ? (
        <div
          role="alert"
          className="rounded-md border border-rose-300 bg-rose-50 p-3 text-xs leading-relaxed text-rose-900 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-100"
        >
          {error}
        </div>
      ) : null}

      <Card className="p-5">
        <h2 className="text-sm font-semibold">Plan details</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="user-plan-title">Title</Label>
            <Input
              id="user-plan-title"
              value={title}
              onChange={(event) => {
                setTitle(event.target.value);
                markDirty();
              }}
              maxLength={120}
              autoComplete="off"
              autoFocus
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="user-plan-slug">Slug (optional)</Label>
            <Input
              id="user-plan-slug"
              value={slug}
              onChange={(event) => {
                setSlug(event.target.value);
                markDirty();
              }}
              placeholder="array-foundations"
              maxLength={80}
              autoComplete="off"
              aria-describedby="user-plan-slug-hint"
            />
            <p
              id="user-plan-slug-hint"
              className="text-[11px] text-muted-foreground"
            >
              Used in the plan link. Leave blank to generate one.
            </p>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="user-plan-description">Description</Label>
            <Textarea
              id="user-plan-description"
              value={description}
              onChange={(event) => {
                setDescription(event.target.value);
                markDirty();
              }}
              maxLength={5000}
              className="min-h-24"
              placeholder="What will you practice, and what should you already know?"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="user-plan-level">Level</Label>
            <SearchableSelect
              id="user-plan-level"
              value={level}
              onValueChange={(next) => {
                setLevel(next as StudyListLevel);
                markDirty();
              }}
              options={LEVEL_OPTIONS}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="user-plan-estimate">
              Estimated minutes (optional)
            </Label>
            <Input
              id="user-plan-estimate"
              type="number"
              inputMode="numeric"
              min={5}
              max={6000}
              step={1}
              value={estimatedMinutes}
              onChange={(event) => {
                setEstimatedMinutes(event.target.value);
                markDirty();
              }}
              placeholder="Auto — leave blank"
              aria-describedby="user-plan-estimate-hint"
            />
            <p
              id="user-plan-estimate-hint"
              className="text-[11px] text-muted-foreground"
            >
              Leave blank to estimate from the problems you add.
            </p>
          </div>
        </div>
        <p className="mt-4 flex items-start gap-1.5 rounded-md border border-border bg-muted/40 px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
          <ShieldCheck className="mt-px size-3.5 shrink-0" aria-hidden="true" />
          <span>
            Private plan — only you can see it. You can keep up to{" "}
            {STUDY_PLAN_QUOTA} plans.
          </span>
        </p>
      </Card>

      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold">Sections</h2>
            <p className="mt-0.5 max-w-2xl text-xs text-muted-foreground">
              Group problems into an ordered path. Every section needs a title
              and at least one problem; up to 100 problems per section.
            </p>
          </div>
          <span className="text-xs tabular-nums text-muted-foreground">
            {sections.length}/{MAX_SECTIONS} sections
          </span>
        </div>
        <div className="mt-4">
          <StudyListSectionsEditor
            sections={sections}
            activeIndex={activeIndex}
            onSelect={setActiveIndex}
            onAdd={addSection}
            onRemove={removeSection}
            onMove={moveSection}
            onUpdate={updateSection}
            options={options}
            problemCount={problemCount}
            duplicateIds={duplicateIds}
            difficultyCounts={difficultyCounts}
            autoMinutes={autoMinutes}
            durationMinutes={durationMinutes}
          />
        </div>
      </Card>

      <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-background/95 p-3 shadow-lg backdrop-blur">
        <p className="text-xs text-muted-foreground">
          {problemCount} problems · {sections.length}{" "}
          {sections.length === 1 ? "section" : "sections"} ·{" "}
          {formatStudyDuration(durationMinutes)}
          {footerStatus ? ` · ${footerStatus}` : ""}
        </p>
        <div className="flex gap-2">
          <Link
            href={initial ? `/lists/${initial.slug}` : "/lists"}
            prefetch={false}
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
            {loading
              ? "Saving…"
              : initial
                ? "Save changes"
                : "Create plan"}
          </Button>
        </div>
      </div>
    </form>
  );
}
