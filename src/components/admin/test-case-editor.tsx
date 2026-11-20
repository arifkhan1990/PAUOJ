"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

export type TestForm = {
  input: string;
  expectedOutput: string;
  isSample: boolean;
};

export function TestCaseEditor({
  tests,
  onChange,
}: {
  tests: TestForm[];
  onChange: (tests: TestForm[]) => void;
}) {
  const update = (index: number, patch: Partial<TestForm>) => {
    onChange(tests.map((test, position) => (position === index ? { ...test, ...patch } : test)));
  };

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= tests.length) return;
    const next = [...tests];
    const current = next[index];
    const swap = next[target];
    if (!current || !swap) return;
    next[index] = swap;
    next[target] = current;
    onChange(next);
  };

  const remove = (index: number) => {
    if (tests.length <= 2) return;
    onChange(tests.filter((_, position) => position !== index));
  };

  const add = (isSample: boolean) => {
    if (tests.length >= 100) return;
    onChange([...tests, { input: "", expectedOutput: "", isSample }]);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium">Test cases</p>
          <p className="text-xs text-muted-foreground">
            Sample tests are shown on the problem page. Hidden tests only expose
            pass/fail.
          </p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => add(true)}>
            <Plus className="size-3.5" /> Sample
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => add(false)}>
            <Plus className="size-3.5" /> Hidden
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {tests.map((test, index) => (
          <Card key={index} className="p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-semibold">
                  Test {index + 1}
                </span>
                <Badge variant={test.isSample ? "success" : "muted"}>
                  {test.isSample ? "Sample" : "Hidden"}
                </Badge>
                <label className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={test.isSample}
                    onChange={(event) => update(index, { isSample: event.target.checked })}
                    className="size-3.5 accent-[var(--primary)]"
                  />
                  Show as sample
                </label>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  aria-label="Move test up"
                >
                  <ArrowUp className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => move(index, 1)}
                  disabled={index === tests.length - 1}
                  aria-label="Move test down"
                >
                  <ArrowDown className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(index)}
                  disabled={tests.length <= 2}
                  aria-label="Remove test"
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
            <div className="mt-2 grid gap-2 md:grid-cols-2">
              <div>
                <label
                  htmlFor={`test-input-${index}`}
                  className="mb-1 block text-[11px] font-medium text-muted-foreground"
                >
                  Input
                </label>
                <Textarea
                  id={`test-input-${index}`}
                  value={test.input}
                  onChange={(event) => update(index, { input: event.target.value })}
                  className="min-h-28 font-mono text-xs"
                  spellCheck={false}
                />
              </div>
              <div>
                <label
                  htmlFor={`test-output-${index}`}
                  className="mb-1 block text-[11px] font-medium text-muted-foreground"
                >
                  Expected output
                </label>
                <Textarea
                  id={`test-output-${index}`}
                  value={test.expectedOutput}
                  onChange={(event) =>
                    update(index, { expectedOutput: event.target.value })
                  }
                  className="min-h-28 font-mono text-xs"
                  spellCheck={false}
                />
              </div>
            </div>
          </Card>
        ))}
      </div>
      <p className="text-[11px] text-muted-foreground">
        {tests.length}/100 tests · at least one sample and one hidden test are
        required.
      </p>
    </div>
  );
}
