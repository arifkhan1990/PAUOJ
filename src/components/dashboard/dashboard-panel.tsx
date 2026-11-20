import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function DashboardPanel({
  title,
  description,
  action,
  children,
  className,
  bodyClassName,
  icon,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  icon?: ReactNode;
}) {
  return (
    <section
      className={cn(
        "flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card shadow-xs",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3.5">
        <div className="flex min-w-0 items-start gap-2.5">
          {icon ? (
            <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground">
              {icon}
            </span>
          ) : null}
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold">{title}</h2>
            {description ? (
              <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className={cn("flex-1", bodyClassName ?? "p-4")}>{children}</div>
    </section>
  );
}
