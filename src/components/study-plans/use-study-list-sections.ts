"use client";

import { useState } from "react";
import {
  MAX_SECTIONS,
  initialSectionDrafts,
  type StudyListSectionDraft,
} from "@/components/admin/study-list-sections-editor";
import type { AdminStudyListDetail } from "@/lib/types";

type SectionPatch = Partial<
  Pick<StudyListSectionDraft, "title" | "description" | "problemIds">
>;

/**
 * Draft sections for the learner plan form: add, remove, reorder and edit.
 * The form owns submission; this hook owns section state only.
 */
export function useStudyListSections({
  initial,
  onChange,
}: {
  initial: AdminStudyListDetail | null;
  onChange: () => void;
}) {
  const [sections, setSections] = useState<StudyListSectionDraft[]>(() =>
    initialSectionDrafts(initial),
  );
  const [activeIndex, setActiveIndex] = useState(0);

  const addSection = () => {
    if (sections.length >= MAX_SECTIONS) return;
    setSections((current) => [
      ...current,
      { key: crypto.randomUUID(), title: "", description: "", problemIds: [] },
    ]);
    setActiveIndex(sections.length);
    onChange();
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
    onChange();
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
    onChange();
  };

  const updateSection = (index: number, patch: SectionPatch) => {
    setSections((current) =>
      current.map((section, position) =>
        position === index ? { ...section, ...patch } : section,
      ),
    );
    onChange();
  };

  return {
    sections,
    activeIndex,
    setActiveIndex,
    addSection,
    removeSection,
    moveSection,
    updateSection,
  };
}
