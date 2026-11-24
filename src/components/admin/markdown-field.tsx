"use client";

import { MarkdownEditor } from "@/components/shared/markdown-editor";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function MarkdownField({
  id,
  label,
  value,
  onChange,
  placeholder,
  rows = 6,
  template,
  hint,
  className,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  template?: string;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={id}>{label}</Label>
      <MarkdownEditor
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        template={template}
      />
      {hint ? (
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
