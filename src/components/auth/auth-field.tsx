import type { LucideIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type AuthFieldProps = React.ComponentProps<"input"> & {
  label: string;
  icon: LucideIcon;
  hint?: React.ReactNode;
  action?: React.ReactNode;
};

export function AuthField({
  id,
  label,
  icon: Icon,
  hint,
  action,
  className,
  ...props
}: AuthFieldProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={id}>{label}</Label>
        {action}
      </div>
      <div className="relative">
        <Icon
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          id={id}
          className={cn(
            "h-11 rounded-xl border-input bg-background pl-10 text-sm shadow-none focus-visible:ring-2",
            className,
          )}
          {...props}
        />
      </div>
      {hint ? (
        <div className="text-[11px] leading-5 text-muted-foreground">
          {hint}
        </div>
      ) : null}
    </div>
  );
}
