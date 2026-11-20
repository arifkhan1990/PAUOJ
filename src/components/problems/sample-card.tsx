import { Card } from "@/components/ui/card";
import { CopyButton } from "@/components/shared/copy-button";
import type { SampleTest } from "@/lib/types";

export function SampleCard({
  sample,
  index,
}: {
  sample: SampleTest;
  index: number;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Sample {index + 1}
        </h3>
      </div>
      <div className="grid md:grid-cols-2 md:divide-x md:divide-border">
        <div>
          <div className="flex items-center justify-between px-4 py-2">
            <span className="text-xs font-medium text-muted-foreground">Input</span>
            <CopyButton value={sample.input} label="Copy" />
          </div>
          <pre className="max-h-52 overflow-auto border-t border-border bg-background px-4 py-3 font-mono text-xs leading-relaxed">
            {sample.input || " "}
          </pre>
        </div>
        <div>
          <div className="flex items-center justify-between px-4 py-2">
            <span className="text-xs font-medium text-muted-foreground">Output</span>
            <CopyButton value={sample.output} label="Copy" />
          </div>
          <pre className="max-h-52 overflow-auto border-t border-border bg-background px-4 py-3 font-mono text-xs leading-relaxed">
            {sample.output || " "}
          </pre>
        </div>
      </div>
    </Card>
  );
}
