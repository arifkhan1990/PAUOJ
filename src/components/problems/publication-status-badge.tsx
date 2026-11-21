import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  FilePenLine,
  type LucideIcon,
} from "lucide-react";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import {
  PUBLICATION_STATUS_LABELS,
  type ProblemPublicationStatus,
} from "@/lib/problem-review-types";
import { cn } from "@/lib/utils";

const STATUS_META: Record<
  ProblemPublicationStatus,
  { variant: BadgeProps["variant"]; icon: LucideIcon }
> = {
  DRAFT: { variant: "muted", icon: FilePenLine },
  IN_REVIEW: { variant: "warning", icon: Clock3 },
  CHANGES_REQUESTED: { variant: "destructive", icon: AlertTriangle },
  PUBLISHED: { variant: "success", icon: CheckCircle2 },
};

export function PublicationStatusBadge({
  status,
  className,
  withIcon = true,
}: {
  status: ProblemPublicationStatus;
  className?: string;
  withIcon?: boolean;
}) {
  const meta = STATUS_META[status];
  const Icon = meta.icon;

  return (
    <Badge variant={meta.variant} className={cn("gap-1", className)}>
      {withIcon ? <Icon className="size-3" aria-hidden="true" /> : null}
      {PUBLICATION_STATUS_LABELS[status]}
    </Badge>
  );
}
