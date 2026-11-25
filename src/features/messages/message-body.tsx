import Link from "next/link";
import { Code2, GraduationCap, Trophy, type LucideIcon } from "lucide-react";
import {
  parseMessageReferences,
  type MessageReferenceKind,
} from "@/lib/message-references";
import { cn } from "@/lib/utils";

const KIND_ICON: Record<MessageReferenceKind, LucideIcon> = {
  contest: Trophy,
  problem: Code2,
  learn: GraduationCap,
};

const KIND_LABEL: Record<MessageReferenceKind, string> = {
  contest: "Contest",
  problem: "Problem",
  learn: "Learning resource",
};

/**
 * Renders a message body: plain text keeps its newlines, while allow-listed
 * `@[Label](/path)` tokens become compact link chips. Raw HTML is never
 * rendered; unrecognised tokens stay visible as text.
 */
export function MessageBody({ body, mine }: { body: string; mine: boolean }) {
  const segments = parseMessageReferences(body);

  return (
    <div className="whitespace-pre-wrap break-words">
      {segments.map((segment, index) => {
        if (segment.type === "text") {
          return <span key={index}>{segment.text}</span>;
        }
        const { reference } = segment;
        const Icon = KIND_ICON[reference.kind];
        return (
          <Link
            key={index}
            href={reference.href}
            title={reference.label}
            aria-label={`${KIND_LABEL[reference.kind]}: ${reference.label}`}
            className={cn(
              "mx-0.5 inline-flex max-w-full items-center gap-1 rounded-md border px-1.5 py-0.5 align-middle text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              mine
                ? "border-primary-foreground/40 bg-primary-foreground/15 text-primary-foreground hover:bg-primary-foreground/25"
                : "border-primary/30 bg-primary/10 text-primary hover:bg-primary/15",
            )}
          >
            <Icon className="size-3.5 shrink-0" aria-hidden="true" />
            <span className="max-w-[min(16rem,60vw)] truncate">
              {reference.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
