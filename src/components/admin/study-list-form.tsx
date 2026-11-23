"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import {
  MAX_SECTIONS,
  StudyListSectionsEditor,
  findDuplicateProblemIds,
  initialSectionDrafts,
  type StudyListSectionDraft,
} from "@/components/admin/study-list-sections-editor";
import { useToast } from "@/components/providers/toast-provider";
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

function parseAdminEstimate(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const minutes = Number(trimmed);
  return Number.isFinite(minutes) ? minutes : null;
}

function CheckboxField({
  checked,
  onChange,
  title,
  hint,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  title: string;
  hint: string;
}) {
  return (
    <label className="flex items-start gap-2 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 size-4 accent-[var(--primary)]"
      />
      <span>
        <span className="font-medium">{title}</span>
        <span className="block text-[11px] text-muted-foreground">{hint}</span>
      </span>
    </label>
  );
}

export function StudyListForm({
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
  const [level, setLevel] = useState<StudyListLevel>(initial?.level ?? "BEGINNER");
  const [estimatedMinutes, setEstimatedMinutes] = useState(
    initial?.estimatedMinutes != null ? String(initial.estimatedMinutes) : "",
  );
  const [isFeatured, setIsFeatured] = useState(initial?.isFeatured ?? false);
  const [isPublic, setIsPublic] = useState(initial?.isPublic ?? true);
  const [sections, setSections] = useState<StudyListSectionDraft[]>(() =>
    initialSectionDrafts(initial),
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const adminEstimateMinutes = parseAdminEstimate(estimatedMinutes);
  const durationMinutes = adminEstimateMinutes ?? autoMinutes;
  const problemCount = sections.reduce((total, section) => total + section.problemIds.length, 0);
  const footerStatus = dirty ? "Unsaved changes" : problemCount === 0 ? "No problems yet" : null;
  const markDirty = () => setDirty(true);
  const addSection = () => {
    if (sections.length >= MAX_SECTIONS) return;
    setSections((current) => [
      ...current,
      { key: crypto.randomUUID(), title: "", description: "", problemIds: [] },
    ]);
    setActiveIndex(sections.length);
    markDirty();
  };

  const removeSection = (index: number) => {
    if (sections.length <= 1) return;
    const next = sections.filter((_, position) => position !== index);
    setSections(next);
    setActiveIndex((current) =>
      current === index
        ? Math.min(index, next.length - 1)
        : current > index
          ? current - 1
          : current,
    );
    markDirty();
  };

  const moveSection = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    const current = sections[index];
    const swap = sections[target];
    if (!current || !swap) return;
    const next = [...sections];
    next[index] = swap;
    next[target] = current;
    setSections(next);
    setActiveIndex(target);
    markDirty();
  };

  const updateSection = (
    index: number,
    patch: Partial<
      Pick<StudyListSectionDraft, "title" | "description" | "problemIds">
    >,
  ) => {
    setSections((current) =>
      current.map((section, position) =>
        position === index ? { ...section, ...patch } : section,
      ),
    );
    markDirty();
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const parsed = studyListInputSchema.safeParse({
      title,
      slug: slug.trim() || undefined,
      description,
      level,
      estimatedMinutes: adminEstimateMinutes,
      isFeatured,
      isPublic,
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
      if (initial) {
        await apiPut(`/api/v1/admin/lists/${initial.id}`, parsed.data);
      } else {
        await apiPost("/api/v1/admin/lists", parsed.data);
      }
      toast({
        title: initial ? "Study list updated" : "Study list created",
        description: `${sections.length} sections · ${problemCount} problems`,
        variant: "success",
      });
      setDirty(false);
      router.push("/admin/lists");
      router.refresh();
    } catch (requestError) {
      const message =
        requestError instanceof ApiClientError
          ? requestError.message
          : "Could not save the study list.";
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
            <Label htmlFor="list-title">Title</Label>
            <Input
              id="list-title"
              value={title}
              onChange={(event) => {
                setTitle(event.target.value);
                markDirty();
              }}
              maxLength={120}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="list-slug">Slug (optional)</Label>
            <Input
              id="list-slug"
              value={slug}
              onChange={(event) => { setSlug(event.target.value); markDirty(); }}
              placeholder="array-foundations"
              maxLength={80}
              autoComplete="off"
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="list-description">Description</Label>
            <Textarea
              id="list-description"
              value={description}
              onChange={(event) => {
                setDescription(event.target.value);
                markDirty();
              }}
              maxLength={5000}
              className="min-h-24"
              placeholder="What will learners practice, and what should they already know?"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="list-level">Level</Label>
            <SearchableSelect
              id="list-level"
              value={level}
              onValueChange={(next) => { setLevel(next as StudyListLevel); markDirty(); }}
              options={LEVEL_OPTIONS}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="list-estimate">Estimated minutes (optional)</Label>
            <Input
              id="list-estimate"
              type="number"
              inputMode="numeric"
              min={5}
              max={6000}
              step={1}
              value={estimatedMinutes}
              onChange={(event) => { setEstimatedMinutes(event.target.value); markDirty(); }}
              placeholder="Auto — leave blank"
            />
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <CheckboxField
            checked={isFeatured}
            onChange={(checked) => { setIsFeatured(checked); markDirty(); }}
            title="Featured plan"
            hint="Highlight it on the study list landing page."
          />
          <CheckboxField
            checked={isPublic}
            onChange={(checked) => { setIsPublic(checked); markDirty(); }}
            title="Public plan"
            hint="Visible to everyone. Hidden plans stay admin-only."
          />
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold">Sections</h2>
            <p className="mt-0.5 max-w-2xl text-xs text-muted-foreground">
              Group problems into an ordered path. Every section needs a title and
              at least one problem; up to 100 problems per section.
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
            href="/admin/lists"
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
            {loading ? "Saving…" : "Save list"}
          </Button>
        </div>
      </div>
    </form>
  );
}
