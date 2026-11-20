"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { ProblemCheckerType } from "@/lib/types";

export function ProblemCheckerFields({
  checkerType,
  checkerSource,
  floatTolerance,
  onChange,
}: {
  checkerType: ProblemCheckerType;
  checkerSource: string;
  floatTolerance: string;
  onChange: (
    key: "checkerType" | "checkerSource" | "floatTolerance",
    value: string,
  ) => void;
}) {
  return (
    <div className="mt-3 space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="checkerType">Checker</Label>
          <Select
            id="checkerType"
            value={checkerType}
            onChange={(event) => onChange("checkerType", event.target.value)}
          >
            <option value="EXACT">Exact output</option>
            <option value="TOKEN">Token comparison</option>
            <option value="FLOAT">Floating point</option>
            <option value="CUSTOM">Custom Python checker</option>
          </Select>
        </div>
        {checkerType === "FLOAT" ? (
          <div className="space-y-1.5">
            <Label htmlFor="floatTolerance">Tolerance</Label>
            <Input
              id="floatTolerance"
              type="number"
              step="0.000000001"
              min="0.000000001"
              max="1"
              value={floatTolerance}
              onChange={(event) =>
                onChange("floatTolerance", event.target.value)
              }
            />
          </div>
        ) : null}
      </div>
      {checkerType === "CUSTOM" ? (
        <div className="space-y-1.5">
          <Label htmlFor="checkerSource">Checker script (Python)</Label>
          <Textarea
            id="checkerSource"
            value={checkerSource}
            onChange={(event) => onChange("checkerSource", event.target.value)}
            className="min-h-40 font-mono text-xs"
            placeholder={`import sys\ninput_path, expected_path, output_path = sys.argv[1:4]\n# exit 0 to accept, non-zero to reject`}
          />
          <p className="text-[11px] text-muted-foreground">
            Runs after the submission with the input, expected output and actual
            output paths. Exit 0 accepts; any other exit code rejects.
          </p>
        </div>
      ) : null}
    </div>
  );
}

export function ProblemCheckerSection({
  checkerType,
  checkerSource,
  floatTolerance,
  onChange,
}: {
  checkerType: ProblemCheckerType;
  checkerSource: string;
  floatTolerance: string;
  onChange: (
    key: "checkerType" | "checkerSource" | "floatTolerance",
    value: string,
  ) => void;
}) {
  return (
    <Card className="p-5">
      <h2 className="text-sm font-semibold">Output checker</h2>
      <ProblemCheckerFields
        checkerType={checkerType}
        checkerSource={checkerSource}
        floatTolerance={floatTolerance}
        onChange={onChange}
      />
    </Card>
  );
}
