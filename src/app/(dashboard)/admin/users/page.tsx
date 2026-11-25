import type { Metadata } from "next";
import Link from "next/link";
import { Search, Users } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Pagination } from "@/components/shared/pagination";
import { UserAdminRow } from "@/components/admin/user-admin-row";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireAdmin } from "@/server/auth/guards";
import { listAdminUsers } from "@/server/services/auth";
import { firstValue, readPage, type SearchParams } from "@/lib/pagination";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Manage users" };

export const dynamic = "force-dynamic";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const admin = await requireAdmin();
  const params = await searchParams;
  const page = readPage(params);
  const pageSize = 20;
  const q = firstValue(params.q)?.trim().slice(0, 100) || undefined;
  const { items, total } = await listAdminUsers({ page, pageSize, q });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Access control"
        title="Users"
        description={`${total} registered account${total === 1 ? "" : "s"}. Assign coder, teacher or admin roles and suspend abusive accounts.`}
      />

      <form action="/admin/users" method="get" className="flex max-w-md gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="q"
            defaultValue={q}
            placeholder="Search name, username or email…"
            className="pl-9"
          />
        </div>
        <button type="submit" className={cn(buttonVariants({ variant: "outline" }))}>
          Search
        </button>
      </form>

      {items.length === 0 ? (
        <EmptyState
          title="No users found"
          description="Try a different search term."
          icon={Users}
          action={
            <Link href="/admin/users" className={buttonVariants({ variant: "outline" })}>
              Clear search
            </Link>
          }
        />
      ) : (
        <Card className="overflow-hidden p-1">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead className="hidden sm:table-cell">Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Joined</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((user) => (
                <UserAdminRow
                  key={user.id}
                  user={{
                    id: user.id,
                    username: user.username,
                    displayName: user.displayName,
                    email: user.email,
                    role: user.role,
                    isBanned: user.isBanned,
                    rating: user.rating,
                    createdAt: user.createdAt.toISOString(),
                    avatarPreset: user.avatarPreset,
                    avatarImageUpdatedAt:
                      user.avatarImageUpdatedAt?.toISOString() ?? null,
                  }}
                  isSelf={user.id === admin.id}
                />
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <Pagination
        pathname="/admin/users"
        searchParams={params}
        page={page}
        totalPages={totalPages}
      />
    </div>
  );
}
