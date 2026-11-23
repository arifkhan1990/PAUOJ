import type { Metadata } from "next";
import Link from "next/link";
import { Library, ListChecks, Plus, Star } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listAdminStudyLists } from "@/server/services/study-lists";
import { formatStudyDuration, studyListLevelMeta } from "@/lib/study-list";
import { formatRelative } from "@/lib/utils";

export const metadata: Metadata = { title: "Manage study lists" };

export const dynamic = "force-dynamic";

export default async function AdminListsPage() {
  const lists = await listAdminStudyLists();
  const totalProblems = lists.reduce((sum, list) => sum + list.problemCount, 0);
  const featuredCount = lists.filter((list) => list.isFeatured).length;
  const publicCount = lists.filter((list) => list.isPublic).length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Curated practice"
        title="Study lists"
        description="Group problems into ordered, sectioned practice plans."
        actions={
          <Link href="/admin/lists/new" className={buttonVariants()}>
            <Plus className="size-4" /> New list
          </Link>
        }
      />

      {lists.length === 0 ? (
        <EmptyState
          title="No study lists yet"
          description="Create a list to guide users through a topic."
          icon={ListChecks}
          action={
            <Link href="/admin/lists/new" className={buttonVariants()}>
              Create a list
            </Link>
          }
        />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard
              label="Plans"
              value={lists.length}
              hint={`${publicCount} public`}
              icon={ListChecks}
            />
            <StatCard
              label="Problems"
              value={totalProblems}
              hint="Across every plan"
              icon={Library}
            />
            <StatCard
              label="Featured"
              value={featuredCount}
              hint="Highlighted on the landing page"
              icon={Star}
            />
          </div>

          <Card className="overflow-hidden p-1">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead className="hidden sm:table-cell">Level</TableHead>
                  <TableHead className="hidden text-right md:table-cell">
                    Sections
                  </TableHead>
                  <TableHead className="text-right">Problems</TableHead>
                  <TableHead className="hidden text-right sm:table-cell">
                    Duration
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">Featured</TableHead>
                  <TableHead className="hidden sm:table-cell">
                    Visibility
                  </TableHead>
                  <TableHead className="hidden text-right md:table-cell">
                    Updated
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lists.map((list) => {
                  const level = studyListLevelMeta(list.level);
                  const duration = formatStudyDuration(list.durationMinutes);
                  return (
                    <TableRow key={list.id}>
                      <TableCell>
                        <Link
                          href={`/admin/lists/${list.id}/edit`}
                          className="text-sm font-medium hover:text-primary"
                        >
                          {list.title}
                        </Link>
                        <span className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground sm:hidden">
                          <span>{level.label}</span>
                          <span aria-hidden="true">·</span>
                          <span>{duration}</span>
                          {list.isFeatured ? (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="inline-flex items-center gap-0.5 font-medium text-primary">
                                <Star className="size-3" /> Featured
                              </span>
                            </>
                          ) : null}
                        </span>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant="outline">{level.label}</Badge>
                      </TableCell>
                      <TableCell className="hidden text-right font-mono text-xs tabular-nums md:table-cell">
                        {list.sectionCount}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs tabular-nums">
                        {list.problemCount}
                      </TableCell>
                      <TableCell
                        className="hidden text-right text-xs tabular-nums text-muted-foreground sm:table-cell"
                        title={
                          list.estimatedMinutes == null
                            ? "Estimated from the problem mix"
                            : "Admin estimate"
                        }
                      >
                        {duration}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {list.isFeatured ? (
                          <Badge variant="accent">
                            <Star className="size-3" /> Featured
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {list.isPublic ? (
                          <Badge variant="success">Public</Badge>
                        ) : (
                          <Badge variant="warning">Hidden</Badge>
                        )}
                      </TableCell>
                      <TableCell className="hidden text-right text-xs text-muted-foreground md:table-cell">
                        {formatRelative(list.updatedAt)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </>
      )}
    </div>
  );
}
