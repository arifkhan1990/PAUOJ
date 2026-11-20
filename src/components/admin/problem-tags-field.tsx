"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ProblemTagsField({
  tags,
  onChange,
}: {
  tags: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="mt-3 space-y-1.5">
      <Label htmlFor="tags">Comma-separated tags</Label>
      <Input
        id="tags"
        value={tags}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Arrays, Dynamic Programming, Graphs"
      />
      <p className="text-[11px] text-muted-foreground">
        Up to 10 tags. Existing tags are reused.
      </p>
    </div>
  );
}
