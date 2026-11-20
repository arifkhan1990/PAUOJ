import Link from "next/link";
import { BookOpen, ExternalLink, ShieldCheck } from "lucide-react";
import { DeleteResourceButton } from "@/features/problems/delete-resource-button";
import { ResourceForm } from "@/features/problems/resource-form";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { ProblemResourceItem } from "@/lib/types";
import { formatRelative } from "@/lib/utils";

export function ProblemResources({
  slug,
  resources,
  canManage,
}: {
  slug: string;
  resources: ProblemResourceItem[];
  canManage: boolean;
}) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Resources</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Tutorials and references verified by the problem setter.
        </p>
      </div>

      {canManage ? <ResourceForm slug={slug} /> : null}

      {resources.length === 0 ? (
        <EmptyState
          title="No resources yet"
          description="The problem setter has not linked any tutorials or references."
          icon={BookOpen}
        />
      ) : (
        <Card className="overflow-hidden">
          <ul className="divide-y divide-border">
            {resources.map((resource) => (
              <li key={resource.id} className="px-5 py-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link
                      href={resource.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex items-center gap-1.5 text-sm font-medium hover:text-primary"
                    >
                      {resource.title}
                      <ExternalLink className="size-3.5" />
                    </Link>
                    {resource.description ? (
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        {resource.description}
                      </p>
                    ) : null}
                    <p className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                      {resource.isVerified ? (
                        <Badge variant="success" className="h-5 gap-1 px-1.5 text-[10px]">
                          <ShieldCheck className="size-3" /> Verified
                        </Badge>
                      ) : null}
                      {resource.author ? (
                        <span>by @{resource.author.username}</span>
                      ) : null}
                      <span>{formatRelative(resource.createdAt)}</span>
                    </p>
                  </div>
                  {canManage ? (
                    <DeleteResourceButton slug={slug} resourceId={resource.id} />
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </section>
  );
}
