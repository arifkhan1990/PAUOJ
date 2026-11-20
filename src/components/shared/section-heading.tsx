import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function SectionHeading({
  title,
  description,
  eyebrow,
  href,
  linkLabel = "View all",
  size = "default",
  className,
}: {
  title: string;
  description?: string;
  eyebrow?: string;
  href?: string;
  linkLabel?: string;
  size?: "default" | "lg";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4",
        className,
      )}
    >
      <div>
        {eyebrow ? (
          <p className="mb-1.5 font-mono text-[10.5px] font-medium uppercase tracking-[0.2em] text-primary">
            {eyebrow}
          </p>
        ) : null}
        <h2
          className={cn(
            "font-semibold tracking-tight",
            size === "lg" ? "text-2xl sm:text-[1.75rem]" : "text-xl",
          )}
        >
          {title}
        </h2>
        {description ? (
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {href ? (
        <Link
          href={href}
          className="group/link inline-flex items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          {linkLabel}
          <ArrowRight className="size-3.5 transition-transform duration-200 group-hover/link:translate-x-0.5" />
        </Link>
      ) : null}
    </div>
  );
}
