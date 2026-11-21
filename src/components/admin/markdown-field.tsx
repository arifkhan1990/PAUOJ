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
  className,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  template?: string;
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
    </div>
  );
}
