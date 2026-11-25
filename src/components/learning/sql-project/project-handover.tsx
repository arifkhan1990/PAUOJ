import Link from "next/link";
import {
  ArrowLeft,
  ClipboardCheck,
  Download,
  ListChecks,
} from "lucide-react";
import { SectionHeading } from "@/components/shared/section-heading";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  SQL_PROJECT,
  SQL_PROJECT_HANDOVER,
} from "@/lib/learning/sql-project";
import { cn } from "@/lib/utils";
import { ProjectEmpty, ProblemLinkList, TopicLinkList } from "./project-shared";

/** Renders the inline `code` spans the defense questions already use. */
function QuestionText({ text }: { text: string }) {
  return (
    <>
      {text.split("`").map((part, index) =>
        index % 2 === 1 ? (
          <code
            key={index}
            className="rounded bg-muted/60 px-1 py-0.5 font-mono text-[10.5px] text-foreground"
          >
            {part}
          </code>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </>
  );
}

export function ProjectHandover({ className }: { className?: string }) {
  return (
    <section id="handover" className={cn("scroll-mt-24", className)}>
      <SectionHeading
        title="Final handover"
        description="The checklist the staff engineer signs off, the questions you must answer, and the database you take with you."
      />

      {SQL_PROJECT_HANDOVER.length === 0 ? (
        <ProjectEmpty>
          The handover checklist is being finalised against the capstone and
          finance topics.
        </ProjectEmpty>
      ) : (
        <ol
          role="list"
          className="mt-4 grid min-w-0 gap-4 md:grid-cols-2"
        >
          {SQL_PROJECT_HANDOVER.map((item, index) => (
            <li key={item.id} className="min-w-0">
              <Card className="flex h-full min-w-0 flex-col p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <span
                    className="grid size-8 shrink-0 place-items-center rounded-full border border-primary/25 bg-primary/10 font-mono text-[10px] font-semibold text-primary"
                    aria-hidden="true"
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      {item.id}
                    </p>
                    <h3 className="mt-0.5 break-words text-sm font-semibold leading-snug">
                      {item.title}
                    </h3>
                    <p lang="bn" className="text-xs text-muted-foreground">
                      {item.titleBn}
                    </p>
                  </div>
                </div>

                <p
                  lang="bn"
                  className="mt-2 break-words text-xs leading-relaxed text-muted-foreground"
                >
                  {item.proof}
                </p>

                <div className="mt-auto space-y-2 pt-3">
                  <TopicLinkList
                    topicSlugs={item.topicSlugs}
                    label="Prove it in"
                  />
                  <ProblemLinkList problemSlugs={item.problemSlugs} />
                </div>
              </Card>
            </li>
          ))}
        </ol>
      )}

      {SQL_PROJECT.defenseQuestions.length > 0 ? (
        <Card className="mt-4 min-w-0 p-5">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <ListChecks className="size-4 text-primary" aria-hidden="true" />
            Defense questions
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            A staff engineer asks these in the handover review. Answer with the
            grain, the null handling and the query plan — not just the query.
          </p>
          <ol className="mt-3 space-y-2.5">
            {SQL_PROJECT.defenseQuestions.map((question, index) => (
              <li
                key={question}
                className="flex gap-3 text-xs leading-relaxed text-muted-foreground"
              >
                <span className="shrink-0 font-mono text-[10px] tabular-nums text-primary">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0 break-words">
                  <QuestionText text={question} />
                </span>
              </li>
            ))}
          </ol>
        </Card>
      ) : null}

      <Card className="mt-4 overflow-hidden border-primary/25 bg-primary/[0.04] p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span
              className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"
              aria-hidden="true"
            >
              <ClipboardCheck className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
                Take it with you
              </p>
              <p className="mt-1 text-base font-semibold">
                Download the database, then close the loop
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                The same ShopSphere fixture the judge runs. Open it with{" "}
                <code className="rounded bg-muted/60 px-1 py-0.5 font-mono text-[10.5px] text-foreground">
                  sqlite3
                </code>{" "}
                or DB Browser for SQLite; keep it for the handover review and
                your own EXPLAIN practice.
              </p>
            </div>
          </div>
          <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row">
            <a
              href="/learning/shopsphere.sql"
              download
              className={cn(
                buttonVariants({ size: "lg" }),
                "w-full sm:w-auto",
              )}
            >
              <Download aria-hidden="true" />
              Download database
            </a>
            <Link
              href="/learn/sql"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "w-full sm:w-auto",
              )}
            >
              <ArrowLeft aria-hidden="true" />
              Back to SQL Labs
            </Link>
          </div>
        </div>
      </Card>
    </section>
  );
}
