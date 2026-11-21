"use client";

import { useState } from "react";
import { BadgeCheck, PauseCircle } from "lucide-react";
import { MarkdownField } from "@/components/admin/markdown-field";
import {
  TestCaseEditor,
  type TestForm,
} from "@/components/admin/test-case-editor";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Textarea } from "@/components/ui/textarea";
import {
  ReviewActionCard,
  ReviewFormError,
} from "@/features/reviews/review-action-shell";
import { useProblemReviewAction } from "@/features/reviews/use-problem-review-action";
import { DEFAULT_LANGUAGE, LANGUAGES, type LanguageId } from "@/lib/languages";
import type { ProblemReviewDetail } from "@/lib/problem-review-types";
import type { SelectOption } from "@/lib/select-options";

const LANGUAGE_OPTIONS: SelectOption[] = LANGUAGES.map((language) => ({
  value: language.id,
  label: language.label,
}));

const BLANK_TESTS: TestForm[] = [
  { input: "", expectedOutput: "", isSample: false },
  { input: "", expectedOutput: "", isSample: false },
];

export function ApproveCard({ review }: { review: ProblemReviewDetail }) {
  const [language, setLanguage] = useState<LanguageId>(DEFAULT_LANGUAGE);
  const [solution, setSolution] = useState("");
  const [note, setNote] = useState("");
  const [editorial, setEditorial] = useState("");
  const [tests, setTests] = useState<TestForm[]>(BLANK_TESTS);
  const { run, pending, error } = useProblemReviewAction(review.problemId);

  const trimmedEditorial = editorial.trim();
  const editorialTooShort =
    trimmedEditorial.length > 0 && trimmedEditorial.length < 40;
  const ready = solution.trim().length > 0 && !editorialTooShort;

  const approve = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!ready) return;
    const result = await run(
      {
        action: "approve",
        solutionLanguage: language,
        solutionSource: solution.trim(),
        note: note.trim() || undefined,
        editorial: trimmedEditorial || undefined,
        tests: tests.filter(
          (test) =>
            test.input.trim().length > 0 ||
            test.expectedOutput.trim().length > 0,
        ),
      },
      {
        successTitle: (result) =>
          result.published
            ? "Your approval published the problem"
            : "Approval recorded",
        successDescription: "Your approval is recorded.",
      },
    );
    if (result) {
      setSolution("");
      setNote("");
      setEditorial("");
      setTests(BLANK_TESTS);
    }
  };

  return (
    <ReviewActionCard
      title="Approve this problem"
      description={`Your approval counts toward the ${review.gates.requiredApprovals} setter sign-offs. The reference solution is stored with it.`}
      icon={BadgeCheck}
    >
      <form onSubmit={(event) => void approve(event)} className="space-y-4">
        {!review.gates.editorialReady ||
        !review.gates.reviewerTestsReady ? (
          <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2.5 text-[11px] leading-relaxed text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">
            <p className="font-semibold">
              Add these before approving, or the problem will stay in review:
            </p>
            <ul className="mt-1 list-disc space-y-0.5 pl-4">
              {!review.gates.editorialReady ? (
                <li>an editorial (use the field below)</li>
              ) : null}
              {!review.gates.reviewerTestsReady ? (
                <li>at least one extra test (use the test editor below)</li>
              ) : null}
            </ul>
          </div>
        ) : null}
        <div className="space-y-1.5">
          <Label htmlFor="approve-language">Solution language</Label>
          <SearchableSelect
            id="approve-language"
            value={language}
            onValueChange={(next) => setLanguage(next as LanguageId)}
            options={LANGUAGE_OPTIONS}
            aria-label="Reference solution language"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="approve-solution">Reference solution</Label>
          <Textarea
            id="approve-solution"
            value={solution}
            onChange={(event) => setSolution(event.target.value)}
            rows={8}
            maxLength={65_536}
            spellCheck={false}
            required
            placeholder={"// The solution you verified the problem with\n"}
            className="min-h-44 font-mono text-xs"
            aria-describedby="approve-solution-hint"
          />
          <p
            id="approve-solution-hint"
            className="text-[11px] text-muted-foreground"
          >
            Never shown publicly. A working solution is required before you can
            approve.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="approve-note">Note for the author (optional)</Label>
          <Textarea
            id="approve-note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={3}
            maxLength={2_000}
            placeholder="Anything you checked, or a small improvement suggestion."
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="approve-editorial">Editorial (optional)</Label>
          <MarkdownField
            id="approve-editorial"
            label="Editorial"
            value={editorial}
            onChange={setEditorial}
            rows={6}
            placeholder="Add the approach if the author has not written one yet."
          />
          {editorialTooShort ? (
            <p className="text-[11px] text-rose-700 dark:text-rose-300">
              Add at least 40 characters, or clear the field.
            </p>
          ) : (
            <p className="text-[11px] text-muted-foreground">
              Publishing requires an editorial. Adding one here satisfies that
              gate.
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <p className="text-sm font-medium">Extra tests (optional)</p>
          <p className="text-[11px] text-muted-foreground">
            Only tests with an input or expected output are sent. Blank rows are
            ignored.
          </p>
          <TestCaseEditor tests={tests} onChange={setTests} />
        </div>

        <Button type="submit" className="w-full" disabled={pending || !ready}>
          <BadgeCheck className="size-4" />
          {pending ? "Recording approval…" : "Approve problem"}
        </Button>
        <ReviewFormError message={error} />
      </form>
    </ReviewActionCard>
  );
}

export function HoldCard({ problemId }: { problemId: string }) {
  const [comment, setComment] = useState("");
  const { run, pending, error } = useProblemReviewAction(problemId);

  const hold = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = await run(
      { action: "hold", note: comment.trim() },
      {
        successTitle: "Problem put on hold",
        successDescription:
          "Approvals are reset and every setter has been notified.",
      },
    );
    if (result) setComment("");
  };

  return (
    <ReviewActionCard
      title="Put on hold"
      description="Use a hold when the problem needs changes. Every active approval is superseded and approvals lock until it is resolved."
      icon={PauseCircle}
    >
      <form onSubmit={(event) => void hold(event)} className="space-y-2">
        <Label htmlFor="hold-comment">What needs to change?</Label>
        <Textarea
          id="hold-comment"
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          rows={4}
          maxLength={2_000}
          required
          placeholder="Be specific: wrong constraint, missing edge case, unclear statement…"
        />
        <p className="text-[11px] text-muted-foreground">
          At least 10 characters. The author and every setter are notified.
        </p>
        <Button
          type="submit"
          variant="destructive"
          className="w-full"
          disabled={pending || comment.trim().length < 10}
        >
          <PauseCircle className="size-4" />
          {pending ? "Raising hold…" : "Put on hold"}
        </Button>
        <ReviewFormError message={error} />
      </form>
    </ReviewActionCard>
  );
}
