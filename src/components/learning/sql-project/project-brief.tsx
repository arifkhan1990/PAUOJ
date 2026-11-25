import {
  Building2,
  ClipboardList,
  Layers3,
  ListChecks,
  Target,
  Users,
} from "lucide-react";
import { SectionHeading } from "@/components/shared/section-heading";
import { Card } from "@/components/ui/card";
import { SQL_PROJECT } from "@/lib/learning/sql-project";
import { cn } from "@/lib/utils";
import { CheckList } from "./project-shared";

const WORKFLOW = [
  {
    title: "Read the ticket",
    detail: "ব্যবসার প্রশ্ন, মেট্রিক আর owner স্পষ্ট করো—query আগে নয়।",
  },
  {
    title: "Inspect the schema",
    detail: "grain, key আর relationship না বুঝে SQL লেখা শুরু কোরো না।",
  },
  {
    title: "Draft & test",
    detail: "NULL, fan-out, খালি গ্রুপ আর edge case চেক করো।",
  },
  {
    title: "Review",
    detail: "peer review আর EXPLAIN; dashboard-এ যাওয়ার আগে ঠিক করো।",
  },
  {
    title: "Ship",
    detail: "view/export publish করে ticket-এ deliverable link দাও।",
  },
  {
    title: "Monitor",
    detail: "freshness, failure আর reconciliation—release-এর পরেও দেখো।",
  },
];

export function ProjectBrief({ className }: { className?: string }) {
  return (
    <section id="brief" className={cn("scroll-mt-24", className)}>
      <SectionHeading
        title="Project brief"
        description="The company, the seat you are filling, and the rules the squad works by."
      />

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <Card className="min-w-0 p-5 sm:p-6">
          <p className="inline-flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
            <Building2 className="size-3.5" aria-hidden="true" />
            Company brief
          </p>
          <h3 className="mt-1.5 break-words text-lg font-semibold">
            {SQL_PROJECT.company}
          </h3>
          <p className="text-sm text-muted-foreground">{SQL_PROJECT.tagline}</p>
          <p
            lang="bn"
            className="mt-3 break-words text-sm leading-relaxed text-muted-foreground"
          >
            {SQL_PROJECT.brief}
          </p>

          <div className="mt-4 rounded-lg border border-primary/20 bg-primary/[0.04] px-3.5 py-3">
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">
              <Target className="size-3.5" aria-hidden="true" />
              Your role
            </p>
            <p className="mt-1 text-sm font-medium">{SQL_PROJECT.role}</p>
          </div>
        </Card>

        <Card className="min-w-0 p-5">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <Users className="size-4 text-primary" aria-hidden="true" />
            The team
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            The people you report to, pair with, or hand work over to.
          </p>
          <ul
            role="list"
            className="mt-3 divide-y divide-border border-t border-border"
          >
            {SQL_PROJECT.team.map((member) => (
              <li key={member.name} className="min-w-0 py-2.5">
                <p className="text-[13px] font-medium">{member.name}</p>
                <p
                  lang="bn"
                  className="mt-0.5 break-words text-xs leading-relaxed text-muted-foreground"
                >
                  {member.responsibility}
                </p>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="mt-4 grid min-w-0 gap-4 md:grid-cols-3">
        <Card className="min-w-0 p-5">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <Layers3 className="size-4 text-primary" aria-hidden="true" />
            Stack
          </h3>
          <ul
            role="list"
            className="mt-3 space-y-2 text-xs leading-relaxed text-muted-foreground"
          >
            {SQL_PROJECT.stack.map((item) => (
              <li key={item} className="flex min-w-0 gap-2">
                <span
                  aria-hidden="true"
                  className="mt-1.5 size-1 shrink-0 rounded-full bg-primary/60"
                />
                <span className="min-w-0 break-words">{item}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="min-w-0 p-5">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <ListChecks className="size-4 text-primary" aria-hidden="true" />
            Working agreement
          </h3>
          <CheckList
            items={SQL_PROJECT.workingAgreement}
            lang="bn"
            className="mt-3"
          />
        </Card>

        <Card className="min-w-0 p-5">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <Target className="size-4 text-primary" aria-hidden="true" />
            Definition of done
          </h3>
          <CheckList
            items={SQL_PROJECT.definitionOfDone}
            lang="bn"
            className="mt-3"
          />
        </Card>
      </div>
      <Card className="mt-4 min-w-0 p-5">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <ClipboardList className="size-4 text-primary" aria-hidden="true" />
          How a ticket moves
        </h3>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          The same loop for every squad: the query is only one step between the
          business question and the shipped report.
        </p>
        <ol className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {WORKFLOW.map((step, index) => (
            <li
              key={step.title}
              className="min-w-0 rounded-lg border border-border bg-background/50 p-3"
            >
              <div className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="grid size-7 shrink-0 place-items-center rounded-full border border-primary/25 bg-primary/10 font-mono text-[10px] font-semibold text-primary"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <p className="text-[13px] font-semibold">{step.title}</p>
              </div>
              <p
                lang="bn"
                className="mt-1.5 break-words text-xs leading-relaxed text-muted-foreground"
              >
                {step.detail}
              </p>
            </li>
          ))}
        </ol>
      </Card>
    </section>
  );
}
