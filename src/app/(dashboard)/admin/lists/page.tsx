import type { Metadata } from "next";
import Link from "next/link";
import { ListChecks, Plus } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
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
import { formatRelative } from "@/lib/utils";

export const metadata: Metadata = { title: "Manage study lists" };

export const dynamic = "force-dynamic";

export default async function AdminListsPage() {
  const lists = await listAdminStudyLists();
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Curated practice"
        title="Study lists"
        description="Group problems into ordered practice plans."
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
        <Card className="overflow-hidden p-1">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead className="hidden sm:table-cell">Slug</TableHead>
                <TableHead className="text-right">Problems</TableHead>
                <TableHead className="hidden sm:table-cell">Visibility</TableHead>
                <TableHead className="hidden text-right md:table-cell">
                  Updated
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lists.map((list) => (
                <TableRow key={list.id}>
                  <TableCell>
                    <Link
                      href={`/admin/lists/${list.id}/edit`}
                      className="text-sm font-medium hover:text-primary"
                    >
                      {list.title}
                    </Link>
                  </TableCell>
                  <TableCell className="hidden font-mono text-xs text-muted-foreground sm:table-cell">
                    {list.slug}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs">
                    {list.problemCount}
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
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
