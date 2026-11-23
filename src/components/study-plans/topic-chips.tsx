import { Badge } from "@/components/ui/badge";
import { uniqueStudyTopics } from "@/lib/study-list";
import { cn } from "@/lib/utils";

export function TopicChips({
  topics,
  limit = 4,
  className,
}: {
  topics: readonly string[];
  limit?: number;
  className?: string;
}) {
  const visible = uniqueStudyTopics(topics, limit);
  if (visible.length === 0) return null;

  return (
    <ul
      aria-label="Topics"
      className={cn("flex flex-wrap gap-1.5", className)}
    >
      {visible.map((topic) => (
        <li key={topic}>
          <Badge
            variant="outline"
            className="max-w-full overflow-hidden font-normal text-muted-foreground"
          >
            <span className="min-w-0 truncate">{topic}</span>
          </Badge>
        </li>
      ))}
    </ul>
  );
}
