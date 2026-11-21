"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/providers/toast-provider";
import { MarkdownField } from "@/components/admin/markdown-field";
import { ProblemClassificationFields } from "@/components/admin/problem-classification-fields";
import { ProblemCheckerSection } from "@/components/admin/problem-checker-fields";
import { ProblemFormFooter } from "@/components/admin/problem-form-footer";
import { ProblemFormHeader } from "@/components/admin/problem-form-header";
import { ProblemTagsField } from "@/components/admin/problem-tags-field";
import { TestCaseEditor } from "@/components/admin/test-case-editor";
import {
  initialProblemFormValues,
  type ProblemFormValues,
} from "@/components/admin/problem-form-values";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  NewProblemReviewNotice,
  PublicationStatusNotice,
} from "@/features/reviews/publication-status-notice";
import { ApiClientError, apiPost, apiPut } from "@/lib/api-client";
import { DIFFICULTIES, difficultyMeta } from "@/lib/difficulty";
import { EDITORIAL_OUTLINE } from "@/lib/editorial-template";
import { problemInputSchema } from "@/lib/schemas/problem";
import type { SelectOption } from "@/lib/select-options";
import type {
  AdminProblemDetail,
  Difficulty,
  ProblemCheckerType,
} from "@/lib/types";

const DIFFICULTY_OPTIONS: SelectOption[] = DIFFICULTIES.map((difficulty) => ({
  value: difficulty,
  label: difficultyMeta(difficulty).label,
}));

export function ProblemForm({
  initial,
  basePath = "/admin/problems",
}: {
  initial: AdminProblemDetail | null;
  basePath?: string;
}) {
  const [values, setValues] = useState<ProblemFormValues>(() => initialProblemFormValues(initial));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [dirty, setDirty] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const reviewBasePath = basePath.startsWith("/admin")
    ? "/admin/reviews"
    : "/teacher/reviews";
  const locked = Boolean(
    initial &&
      (initial.publicationStatus === "IN_REVIEW" ||
        initial.publicationStatus === "PUBLISHED"),
  );
  const lockedReason =
    initial?.publicationStatus === "PUBLISHED"
      ? "Published problems are locked. Publication review is terminal for this workflow."
      : "This problem is locked while two setters review it. Ask a reviewer to put it on hold before editing.";

  useEffect(() => {
    if (!dirty) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const update = <K extends keyof ProblemFormValues,>(
    key: K,
    value: ProblemFormValues[K],
  ) => {
    setValues((current) => ({ ...current, [key]: value }));
    setDirty(true);
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (locked) {
      setError(lockedReason);
      return;
    }
    setError(null);

    const parsed = problemInputSchema.safeParse({
      title: values.title,
      slug: values.slug || undefined,
      statement: values.statement,
      inputFormat: values.inputFormat,
      outputFormat: values.outputFormat,
      constraints: values.constraints,
      editorial: values.editorial,
      difficulty: values.difficulty,
      points: Number(values.points),
      timeLimitMs: Number(values.timeLimitMs),
      memoryLimitMb: Number(values.memoryLimitMb),
      tags: values.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      category: values.category,
      subcategory: values.subcategory,
      companies: values.companies
        .split(",")
        .map((company) => company.trim())
        .filter(Boolean),
      checkerType: values.checkerType,
      checkerSource: values.checkerSource,
      floatTolerance: Number(values.floatTolerance),
      tests: values.tests,
    });

    if (!parsed.success) {
      setError(
        parsed.error.issues
          .map((issue) => `${issue.path.join(".") || "form"}: ${issue.message}`)
          .join(" · "),
      );
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setLoading(true);
    try {
      if (initial) {
        await apiPut(`/api/v1/admin/problems/${initial.id}`, parsed.data);
        toast({
          title: "Problem updated",
          description:
            initial.publicationStatus === "CHANGES_REQUESTED"
              ? "Changes saved. Respond to every hold so the review can reopen."
              : undefined,
          variant: "success",
        });
        router.push(
          initial.publicationStatus === "CHANGES_REQUESTED"
            ? `${reviewBasePath}/${initial.id}`
            : basePath,
        );
      } else {
        const created = await apiPost<{ id: string; slug: string }>(
          "/api/v1/admin/problems",
          parsed.data,
        );
        toast({
          title: "Problem created",
          description:
            "Sent to publication review. Two other setters must approve it before it can go public.",
          variant: "success",
        });
        router.push(`${reviewBasePath}/${created.id}`);
      }
      setDirty(false);
      router.refresh();
    } catch (submitError) {
      const message =
        submitError instanceof ApiClientError
          ? submitError.message
          : "Could not save the problem.";
      setError(message);
      toast({ title: "Save failed", description: message, variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <ProblemFormHeader initial={initial} basePath={basePath} />

      {initial ? (
        <PublicationStatusNotice
          problem={initial}
          reviewBasePath={reviewBasePath}
        />
      ) : (
        <NewProblemReviewNotice />
      )}

      {error ? (
        <div
          role="alert"
          className="rounded-md border border-rose-300 bg-rose-50 p-3 text-xs leading-relaxed text-rose-900 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-100"
        >
          {error}
        </div>
      ) : null}

      <form onSubmit={(event) => void submit(event)} className="space-y-5">
        <fieldset disabled={locked} className="space-y-5">
        <Card className="p-5">
          <h2 className="text-sm font-semibold">Basics</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
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
              <p className="text-[11px] text-muted-foreground">
                Leave empty to generate from the title.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="difficulty">Difficulty</Label>
              <SearchableSelect
                id="difficulty"
                value={values.difficulty}
                onValueChange={(next) =>
                  update("difficulty", next as Difficulty)
                }
                options={DIFFICULTY_OPTIONS}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="points">Points</Label>
              <Input
                id="points"
                type="number"
                min={10}
                max={1000}
                value={values.points}
                onChange={(event) => update("points", event.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="timeLimit">Time (ms)</Label>
                <Input
                  id="timeLimit"
                  type="number"
                  min={100}
                  max={10000}
                  step={100}
                  value={values.timeLimitMs}
                  onChange={(event) => update("timeLimitMs", event.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="memoryLimit">Memory (MB)</Label>
                <Input
                  id="memoryLimit"
                  type="number"
                  min={64}
                  max={1024}
                  step={32}
                  value={values.memoryLimitMb}
                  onChange={(event) => update("memoryLimitMb", event.target.value)}
                  required
                />
              </div>
            </div>
          </div>
        </Card>

        <Card className="space-y-4 p-5">
          <h2 className="text-sm font-semibold">Statement</h2>
          <MarkdownField
            id="statement"
            label="Problem statement"
            value={values.statement}
            onChange={(value) => update("statement", value)}
            rows={10}
            placeholder={"Describe the task.\n\nUse **bold**, lists, tables and code spans."}
          />
          <div className="grid gap-4 md:grid-cols-2">
            <MarkdownField
              id="inputFormat"
              label="Input format"
              value={values.inputFormat}
              onChange={(value) => update("inputFormat", value)}
              rows={4}
            />
            <MarkdownField
              id="outputFormat"
              label="Output format"
              value={values.outputFormat}
              onChange={(value) => update("outputFormat", value)}
              rows={4}
            />
          </div>
          <MarkdownField
            id="constraints"
            label="Constraints"
            value={values.constraints}
            onChange={(value) => update("constraints", value)}
            rows={4}
          />
          <MarkdownField
            id="editorial"
            label="Editorial (unlocks after acceptance)"
            value={values.editorial}
            onChange={(value) => update("editorial", value)}
            rows={10}
            template={EDITORIAL_OUTLINE}
          />
        </Card>

        <Card className="p-5">
          <h2 className="text-sm font-semibold">Tags</h2>
          <ProblemTagsField
            tags={values.tags}
            onChange={(value) => update("tags", value)}
          />
        </Card>

        <Card className="p-5">
          <h2 className="text-sm font-semibold">Classification</h2>
          <ProblemClassificationFields
            category={values.category}
            subcategory={values.subcategory}
            companies={values.companies}
            onChange={(key, value) => update(key, value)}
          />
        </Card>

        <ProblemCheckerSection
          checkerType={values.checkerType}
          checkerSource={values.checkerSource}
          floatTolerance={values.floatTolerance}
          onChange={(key, value) => {
            if (key === "checkerType") {
              update("checkerType", value as ProblemCheckerType);
            } else {
              update(key, value);
            }
          }}
        />

        <Card className="p-5">
          <TestCaseEditor
            tests={values.tests}
            onChange={(tests) => update("tests", tests)}
          />
        </Card>

        </fieldset>

        <ProblemFormFooter
          dirty={dirty}
          loading={loading}
          locked={locked}
          lockedReason={lockedReason}
          basePath={basePath}
        />
      </form>
    </div>
  );
}
