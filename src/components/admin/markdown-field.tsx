"use client";

import { useState } from "react";
import { Markdown } from "@/components/shared/markdown";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export function MarkdownField({
  id,
  label,
  value,
  onChange,
  placeholder,
  rows = 6,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  const [mode, setMode] = useState<"write" | "preview">("write");

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={id}>{label}</Label>
        <div className="flex rounded-md border border-border p-0.5">
          {(["write", "preview"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setMode(item)}
              className={cn(
                "rounded px-2 py-0.5 text-[11px] font-medium capitalize",
                mode === item
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
      {mode === "write" ? (
        <Textarea
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          rows={rows}
          className="font-mono text-xs"
          spellCheck={false}
        />
      ) : (
        <div className="min-h-28 rounded-md border border-border bg-muted/20 p-4">
          {value.trim() ? (
            <Markdown>{value}</Markdown>
          ) : (
            <p className="text-xs text-muted-foreground">Nothing to preview.</p>
          )}
        </div>
      )}
      <p className="text-[11px] text-muted-foreground">
        Markdown supported. Raw HTML is not rendered.
      </p>
    </div>
  );
}
