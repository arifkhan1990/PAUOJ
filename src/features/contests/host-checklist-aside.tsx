import { CheckCircle2, ClipboardList } from "lucide-react";
import { Card } from "@/components/ui/card";
import { CONTEST_HOST_DATA_CHECKLIST } from "@/lib/contest-ops";

export function HostChecklistAside() {
  return (
    <aside className="min-w-0 space-y-4 lg:sticky lg:top-20 lg:self-start">
      <Card className="p-4">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold">
          <ClipboardList className="size-4 text-primary" aria-hidden="true" />
          Data checklist
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Have these ready before you submit.
        </p>
        <ul className="mt-3 space-y-2">
          {CONTEST_HOST_DATA_CHECKLIST.map((item) => (
            <li key={item} className="flex items-start gap-2 text-xs">
              <CheckCircle2
                className="mt-px size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400"
                aria-hidden="true"
              />
              <span className="text-muted-foreground">{item}</span>
            </li>
          ))}
        </ul>
      </Card>
      <Card className="border-primary/30 bg-primary/5 p-4">
        <h2 className="text-sm font-semibold">What happens next</h2>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          An admin reviews this request and converts an approved one into a
          private draft contest. You become its director and use the crew
          workspace for the roster, shortlist and notes; the contest team attaches
          and publishes the fresh problem set. Nothing is public until it is
          published.
        </p>
      </Card>
    </aside>
  );
}
