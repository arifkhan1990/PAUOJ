import Link from "next/link";
import type { ProblemTag } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ProblemTags({
  tags,
  limit = 3,
  className,
  linkable = true,
}: {
  tags: ProblemTag[];
  limit?: number;
  className?: string;
  linkable?: boolean;
}) {
  if (tags.length === 0) return null;
  const visible = tags.slice(0, limit);
  const extra = tags.length - visible.length;
  const tagClassName =
    "rounded border border-border bg-muted/60 px-1.5 py-0.5 text-[11px] text-muted-foreground transition";
  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {visible.map((tag) =>
        linkable ? (
          <Link
            key={tag.slug}
            href={`/problems?tag=${encodeURIComponent(tag.slug)}`}
            className={cn(tagClassName, "hover:border-primary/40 hover:text-primary")}
          >
            {tag.name}
          </Link>
        ) : (
          <span key={tag.slug} className={tagClassName}>
            {tag.name}
          </span>
        ),
      )}
      {extra > 0 ? (
        <span className="text-[11px] text-muted-foreground">+{extra}</span>
      ) : null}
    </div>
  );
}
