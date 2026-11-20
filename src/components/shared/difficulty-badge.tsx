import { Badge } from "@/components/ui/badge";
import { difficultyMeta } from "@/lib/difficulty";
import { cn } from "@/lib/utils";

export function DifficultyBadge({
  difficulty,
  className,
}: {
  difficulty: string;
  className?: string;
}) {
  const meta = difficultyMeta(difficulty);
  return (
    <Badge className={cn("font-medium", meta.className, className)}>
      {meta.label}
    </Badge>
  );
}
