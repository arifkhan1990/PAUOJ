"use client";

import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Plus,
  Search,
  X,
} from "lucide-react";
import { DifficultyBadge } from "@/components/shared/difficulty-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { ProblemOption } from "@/lib/types";

type PickerLabelStyle = "letters" | "numbers";

function labelFor(index: number, style: PickerLabelStyle): string {
  if (style === "numbers") return String(index + 1).padStart(2, "0");
  return String.fromCharCode(65 + index);
}

function emptyHint(style: PickerLabelStyle): string {
  return style === "numbers"
    ? "Add problems from the left. The order becomes 01, 02, 03…"
    : "Add problems from the left. The order determines labels A, B, C…";
}

export function ProblemPicker({
  options,
  selected,
  onChange,
  selectedLabel = "Contest problems",
  max = 26,
  labelStyle = "letters",
  orderHint,
}: {
  options: ProblemOption[];
  selected: string[];
  onChange: (ids: string[]) => void;
  selectedLabel?: string;
  /** Maximum number of problems that can be selected. */
  max?: number;
  /** "letters" (contest) or "numbers" (study plan). */
  labelStyle?: PickerLabelStyle;
  /** Replaces the default order hint shown in the selected panel. */
  orderHint?: string;
}) {
  const [search, setSearch] = useState("");
  const byId = useMemo(
    () => new Map(options.map((option) => [option.id, option])),
    [options],
  );

  const available = options.filter((option) => {
    if (selected.includes(option.id)) return false;
    if (!search.trim()) return true;
    return option.title.toLowerCase().includes(search.trim().toLowerCase());
  });

  const add = (id: string) => {
    if (selected.length >= max || selected.includes(id)) return;
    onChange([...selected, id]);
  };

  const remove = (id: string) => {
    onChange(selected.filter((item) => item !== id));
  };

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= selected.length) return;
    const next = [...selected];
    const current = next[index];
    const swap = next[target];
    if (!current || !swap) return;
    next[index] = swap;
    next[target] = current;
    onChange(next);
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-lg border border-border">
        <div className="border-b border-border p-3">
          <p className="text-sm font-medium">Available problems</p>
          <div className="relative mt-2">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search problems…"
              className="h-8 pl-8 text-xs"
            />
          </div>
        </div>
        <div className="max-h-80 overflow-y-auto p-2">
          {selected.length >= max ? (
            <p className="px-2 pb-2 text-[11px] font-medium text-amber-700 dark:text-amber-300">
              Limit of {max} problems reached.
            </p>
          ) : null}
          {available.length === 0 ? (
            <p className="p-3 text-xs text-muted-foreground">
              No more problems available.
            </p>
          ) : (
            <ul className="space-y-1">
              {available.map((option) => (
                <li key={option.id}>
                  <button
                    type="button"
                    onClick={() => add(option.id)}
                    disabled={selected.length >= max}
                    className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-xs hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium">
                        {option.title}
                      </span>
                      <DifficultyBadge
                        difficulty={option.difficulty}
                        className="mt-1"
                      />
                    </span>
                    <Plus className="size-4 shrink-0 text-primary" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-border">
        <div className="flex items-center justify-between gap-2 border-b border-border p-3">
          <p className="min-w-0 truncate text-sm font-medium" title={selectedLabel}>{selectedLabel}</p>
          <span className="shrink-0 text-xs text-muted-foreground">
            {selected.length}/{max}
          </span>
        </div>
        <div className="max-h-80 overflow-y-auto p-2">
          {selected.length === 0 ? (
            <p className="p-3 text-xs text-muted-foreground">
              {orderHint ?? emptyHint(labelStyle)}
            </p>
          ) : (
            <ul className="space-y-1">
              {selected.map((id, index) => {
                const option = byId.get(id);
                return (
                  <li
                    key={id}
                    className="flex items-center gap-2 rounded-md border border-border px-2 py-1.5"
                  >
                    <span
                      className={cn(
                        "grid size-6 shrink-0 place-items-center rounded border border-border font-mono text-[10px] font-semibold",
                        index === 0 && "border-primary text-primary",
                      )}
                    >
                      {labelFor(index, labelStyle)}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-xs font-medium">
                      {option?.title ?? "Unknown problem"}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      onClick={() => move(index, -1)}
                      disabled={index === 0}
                      aria-label="Move up"
                    >
                      <ArrowUp className="size-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      onClick={() => move(index, 1)}
                      disabled={index === selected.length - 1}
                      aria-label="Move down"
                    >
                      <ArrowDown className="size-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-7 text-destructive hover:text-destructive"
                      onClick={() => remove(id)}
                      aria-label="Remove problem"
                    >
                      <X className="size-3.5" />
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
