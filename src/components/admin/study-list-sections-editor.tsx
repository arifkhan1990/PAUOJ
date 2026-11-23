"use client";

import { useRef } from "react";
import {
  ArrowDown,
  ArrowUp,
  Plus,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { ProblemPicker } from "@/components/admin/problem-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DIFFICULTIES, difficultyMeta } from "@/lib/difficulty";
import { formatStudyDuration } from "@/lib/study-list";
import { cn } from "@/lib/utils";
import type {
  AdminStudyListDetail,
  ProblemOption,
  StudyDifficultyCounts,
} from "@/lib/types";

export const MAX_SECTION_PROBLEMS = 100;
export const MAX_SECTIONS = 20;

export type StudyListSectionDraft = {
  key: string;
  title: string;
  description: string;
  problemIds: string[];
};

/**
 * Seeds editable drafts from the admin detail. New plans and legacy plans
 * without sections start with one (empty) section.
 */
export function initialSectionDrafts(
  initial: AdminStudyListDetail | null,
): StudyListSectionDraft[] {
  const source =
    initial && initial.sections.length > 0
      ? initial.sections
      : [{ id: null, title: "", description: "", problemIds: [] }];
  return source.map((section, index) => ({
    key: section.id ?? `section-${index}`,
    title: section.title,
    description: section.description,
    problemIds: [...section.problemIds],
  }));
}

/** Ids that appear in more than one section (order preserved). */
export function findDuplicateProblemIds(
  sections: ReadonlyArray<{ problemIds: string[] }>,
): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const section of sections) {
    for (const id of section.problemIds) {
      if (seen.has(id)) duplicates.add(id);
      else seen.add(id);
    }
  }
  return [...duplicates];
}

const TAB_KEYS = new Set(["ArrowLeft", "ArrowRight", "Home", "End"]);

export function StudyListSectionsEditor({
  sections,
  activeIndex,
  onSelect,
  onAdd,
  onRemove,
  onMove,
  onUpdate,
  options,
  problemCount,
  duplicateIds,
  difficultyCounts,
  autoMinutes,
  durationMinutes,
}: {
  sections: StudyListSectionDraft[];
  activeIndex: number;
  onSelect: (index: number) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  onMove: (index: number, direction: -1 | 1) => void;
  onUpdate: (
    index: number,
    patch: Partial<Pick<StudyListSectionDraft, "title" | "description" | "problemIds">>,
  ) => void;
  options: ProblemOption[];
  problemCount: number;
  duplicateIds: string[];
  difficultyCounts: StudyDifficultyCounts;
  autoMinutes: number;
  durationMinutes: number;
}) {
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const active = sections[activeIndex] ?? sections[0];
  if (!active) return null;

  const tabId = (key: string) => `section-tab-${key}`;
  const panelId = (key: string) => `section-panel-${key}`;
  const autoHint =
    autoMinutes > 0
      ? `Auto estimate ${formatStudyDuration(autoMinutes)}${
          durationMinutes === autoMinutes
            ? " from the difficulty mix."
            : " (overridden by the plan estimate)."
        }`
      : "Add problems to calculate a duration.";

  const handleTabKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    if (!TAB_KEYS.has(event.key)) return;
    event.preventDefault();
    const next =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? sections.length - 1
          : event.key === "ArrowLeft"
            ? (index - 1 + sections.length) % sections.length
            : (index + 1) % sections.length;
    onSelect(next);
    tabRefs.current[next]?.focus();
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div
          role="tablist"
          aria-label="Plan sections"
          className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto pb-1"
        >
          {sections.map((section, index) => {
            const isActive = index === activeIndex;
            return (
              <button
                key={section.key}
                ref={(node) => {
                  tabRefs.current[index] = node;
                }}
                type="button"
                role="tab"
                id={tabId(section.key)}
                aria-selected={isActive}
                aria-controls={isActive ? panelId(section.key) : undefined}
                tabIndex={isActive ? 0 : -1}
                onClick={() => onSelect(index)}
                onKeyDown={(event) => handleTabKeyDown(event, index)}
                className={cn(
                  "flex max-w-[220px] shrink-0 items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isActive
                    ? "border-primary bg-primary/10 font-semibold text-primary"
                    : "border-border bg-background text-muted-foreground hover:bg-muted",
                )}
              >
                <span className="truncate">
                  {section.title.trim() || "Untitled section"}
                </span>
                <span className="shrink-0 font-mono text-[10px] tabular-nums">
                  {section.problemIds.length}
                </span>
              </button>
            );
          })}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            onAdd();
            requestAnimationFrame(() =>
              tabRefs.current[sections.length]?.focus(),
            );
          }}
          disabled={sections.length >= MAX_SECTIONS}
        >
          <Plus className="size-3.5" /> Add section
        </Button>
      </div>

      <div
        role="tabpanel"
        id={panelId(active.key)}
        aria-labelledby={tabId(active.key)}
        className="space-y-4 rounded-lg border border-border p-3 sm:p-4"
      >
        <div className="flex flex-wrap items-start gap-2">
          <div className="min-w-[220px] flex-1 space-y-1.5">
            <Label htmlFor={`section-title-${active.key}`}>Section title</Label>
            <Input
              id={`section-title-${active.key}`}
              value={active.title}
              onChange={(event) =>
                onUpdate(activeIndex, { title: event.target.value })
              }
              placeholder="e.g. Two pointers"
              maxLength={80}
              autoComplete="off"
            />
          </div>
          <div className="flex gap-1 self-end">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => onMove(activeIndex, -1)}
              disabled={activeIndex === 0}
              aria-label="Move section up"
              title="Move section up"
            >
              <ArrowUp className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => onMove(activeIndex, 1)}
              disabled={activeIndex === sections.length - 1}
              aria-label="Move section down"
              title="Move section down"
            >
              <ArrowDown className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 text-destructive hover:text-destructive"
              onClick={() => {
                const nextIndex = Math.min(activeIndex, sections.length - 2);
                onRemove(activeIndex);
                requestAnimationFrame(() =>
                  tabRefs.current[nextIndex]?.focus(),
                );
              }}
              disabled={sections.length === 1}
              aria-label="Remove section"
              title={
                sections.length === 1
                  ? "A plan needs at least one section."
                  : "Remove section"
              }
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={`section-description-${active.key}`}>
            Section description
          </Label>
          <Textarea
            id={`section-description-${active.key}`}
            value={active.description}
            onChange={(event) =>
              onUpdate(activeIndex, { description: event.target.value })
            }
            rows={3}
            maxLength={500}
            placeholder="What should the learner focus on in this section?"
            className="min-h-0"
          />
        </div>

        <ProblemPicker
          options={options}
          selected={active.problemIds}
          onChange={(problemIds) => onUpdate(activeIndex, { problemIds })}
          selectedLabel={`Problems in “${active.title.trim() || "Untitled section"}”`}
          max={MAX_SECTION_PROBLEMS}
          labelStyle="numbers"
        />
      </div>

      <div className="grid gap-3 rounded-lg border border-border bg-muted/40 p-3 sm:grid-cols-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Plan total
          </p>
          <p className="mt-0.5 text-sm font-semibold tabular-nums">
            {problemCount} problems · {sections.length} sections
          </p>
          {duplicateIds.length > 0 ? (
            <p className="mt-1 flex items-start gap-1 text-[11px] font-medium text-rose-700 dark:text-rose-300">
              <TriangleAlert className="mt-px size-3 shrink-0" />
              {duplicateIds.length} duplicate{" "}
              {duplicateIds.length === 1 ? "problem" : "problems"} across
              sections. Each problem can appear once.
            </p>
          ) : (
            <p className="mt-1 text-[11px] text-muted-foreground">
              No duplicate problems.
            </p>
          )}
        </div>
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Difficulty mix
          </p>
          <div className="mt-1 flex flex-wrap gap-1">
            {DIFFICULTIES.map((difficulty) => (
              <span
                key={difficulty}
                className={cn(
                  "rounded border px-1.5 py-0.5 text-[10px] font-medium tabular-nums",
                  difficultyMeta(difficulty).className,
                )}
              >
                {difficultyMeta(difficulty).label} {difficultyCounts[difficulty]}
              </span>
            ))}
          </div>
        </div>
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Estimated duration
          </p>
          <p className="mt-0.5 text-sm font-semibold tabular-nums">
            {formatStudyDuration(durationMinutes)}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">{autoHint}</p>
        </div>
      </div>
    </div>
  );
}
