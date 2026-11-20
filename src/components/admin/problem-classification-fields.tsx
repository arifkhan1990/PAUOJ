"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ProblemClassificationFields({
  category,
  subcategory,
  companies,
  onChange,
}: {
  category: string;
  subcategory: string;
  companies: string;
  onChange: (
    key: "category" | "subcategory" | "companies",
    value: string,
  ) => void;
}) {
  return (
    <div className="mt-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="category">Category</Label>
          <Input
            id="category"
            value={category}
            onChange={(event) => onChange("category", event.target.value)}
            placeholder="Algorithms"
            maxLength={60}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="subcategory">Subcategory</Label>
          <Input
            id="subcategory"
            value={subcategory}
            onChange={(event) => onChange("subcategory", event.target.value)}
            placeholder="Dynamic Programming"
            maxLength={60}
          />
        </div>
      </div>
      <div className="mt-3 space-y-1.5">
        <Label htmlFor="companies">Company tags</Label>
        <Input
          id="companies"
          value={companies}
          onChange={(event) => onChange("companies", event.target.value)}
          placeholder="Google, Amazon, Meta"
          maxLength={400}
        />
        <p className="text-[11px] text-muted-foreground">
          Comma-separated. Used by the company filter on the problem list.
        </p>
      </div>
    </div>
  );
}
