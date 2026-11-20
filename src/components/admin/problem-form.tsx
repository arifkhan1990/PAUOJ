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
import { TestCaseEditor, type TestForm } from "@/components/admin/test-case-editor";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { ApiClientError, apiPost, apiPut } from "@/lib/api-client";
import { DIFFICULTIES, difficultyMeta } from "@/lib/difficulty";
import { problemInputSchema } from "@/lib/schemas/problem";
import type {
  AdminProblemDetail,
  Difficulty,
  ProblemCheckerType,
} from "@/lib/types";

type FormValues = {
  title: string;
  slug: string;
  statement: string;
  inputFormat: string;
  outputFormat: string;
  constraints: string;
  editorial: string;
  difficulty: Difficulty;
  points: string;
  timeLimitMs: string;
  memoryLimitMb: string;
  isPublic: boolean;
  tags: string;
  category: string;
  subcategory: string;
  companies: string;
  checkerType: ProblemCheckerType;
  checkerSource: string;
  floatTolerance: string;
  tests: TestForm[];
};

function initialValues(initial: AdminProblemDetail | null): FormValues {
  if (!initial) {
    return {
      title: "",
      slug: "",
      statement: "",
      inputFormat: "",
      outputFormat: "",
      constraints: "",
      editorial: "",
      difficulty: "EASY",
      points: "100",
      timeLimitMs: "1000",
      memoryLimitMb: "256",
      isPublic: true,
      tags: "",
      category: "",
      subcategory: "",
      companies: "",
      checkerType: "EXACT",
      checkerSource: "",
      floatTolerance: "0.000001",
      tests: [
        { input: "", expectedOutput: "", isSample: true },
        { input: "", expectedOutput: "", isSample: false },
      ],
    };
  }
  return {
    title: initial.title,
    slug: initial.slug,
    statement: initial.statement,
    inputFormat: initial.inputFormat ?? "",
    outputFormat: initial.outputFormat ?? "",
    constraints: initial.constraints ?? "",
    editorial: initial.editorial ?? "",
    difficulty: initial.difficulty,
    points: String(initial.points),
    timeLimitMs: String(initial.timeLimitMs),
    memoryLimitMb: String(initial.memoryLimitMb),
    isPublic: initial.isPublic,
    tags: initial.tags.join(", "),
    category: initial.category ?? "",
    subcategory: initial.subcategory ?? "",
    companies: initial.companies.join(", "),
    checkerType: initial.checkerType,
    checkerSource: initial.checkerSource ?? "",
    floatTolerance: String(initial.floatTolerance),
    tests: initial.tests,
  };
}

export function ProblemForm({
  initial,
  basePath = "/admin/problems",
}: {
  initial: AdminProblemDetail | null;
  basePath?: string;
}) {
  const [values, setValues] = useState<FormValues>(() => initialValues(initial));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [dirty, setDirty] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

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
      isPublic: values.isPublic,
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
      } else {
        await apiPost("/api/v1/admin/problems", parsed.data);
      }
      setDirty(false);
      toast({
        title: initial ? "Problem updated" : "Problem created",
        variant: "success",
      });
      router.push(basePath);
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

      {error ? (
        <div
          role="alert"
          className="rounded-md border border-rose-300 bg-rose-50 p-3 text-xs leading-relaxed text-rose-900 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-100"
        >
          {error}
        </div>
      ) : null}

      <form onSubmit={(event) => void submit(event)} className="space-y-5">
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
              <Select
                id="difficulty"
                value={values.difficulty}
                onChange={(event) =>
                  update("difficulty", event.target.value as Difficulty)
                }
              >
                {DIFFICULTIES.map((difficulty) => (
                  <option key={difficulty} value={difficulty}>
                    {difficultyMeta(difficulty).label}
                  </option>
                ))}
              </Select>
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
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input
                type="checkbox"
                checked={values.isPublic}
                onChange={(event) => update("isPublic", event.target.checked)}
                className="size-4 accent-[var(--primary)]"
              />
              Publish this problem publicly
            </label>
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
            rows={6}
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

        <ProblemFormFooter dirty={dirty} loading={loading} basePath={basePath} />
      </form>
    </div>
  );
}
