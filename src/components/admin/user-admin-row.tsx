"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Ban, Loader2, ShieldCheck, UserCheck } from "lucide-react";
import { useToast } from "@/components/providers/toast-provider";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { TableCell, TableRow } from "@/components/ui/table";
import { ApiClientError, apiPatch } from "@/lib/api-client";
import type { AdminUserListItem, UserRole } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export function UserAdminRow({
  user,
  isSelf,
}: {
  user: AdminUserListItem;
  isSelf: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<UserRole>(user.role);
  const router = useRouter();
  const { toast } = useToast();

  const updateRole = async (nextRole: UserRole) => {
    if (nextRole === role) return;
    setLoading(true);
    try {
      await apiPatch(`/api/v1/admin/users/${user.id}`, { role: nextRole });
      setRole(nextRole);
      toast({ title: "Role updated", variant: "success" });
      router.refresh();
    } catch (error) {
      toast({
        title: "Could not update role",
        description:
          error instanceof ApiClientError ? error.message : "Please try again.",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleBan = async () => {
    const next = !user.isBanned;
    if (
      !window.confirm(
        next
          ? `Suspend @${user.username}? They will be signed out immediately.`
          : `Restore access for @${user.username}?`,
      )
    ) {
      return;
    }
    setLoading(true);
    try {
      await apiPatch(`/api/v1/admin/users/${user.id}`, { banned: next });
      toast({
        title: next ? "User suspended" : "User restored",
        variant: "success",
      });
      router.refresh();
    } catch (error) {
      toast({
        title: "Could not update user",
        description:
          error instanceof ApiClientError ? error.message : "Please try again.",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-2.5">
          <UserAvatar name={user.displayName} username={user.username} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">
              {user.displayName}
              {isSelf ? (
                <span className="ml-1.5 text-[10px] text-muted-foreground">(you)</span>
              ) : null}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              @{user.username}
            </p>
          </div>
        </div>
      </TableCell>
      <TableCell className="hidden text-xs text-muted-foreground sm:table-cell">
        {user.email}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Select
            value={role}
            onChange={(event) => void updateRole(event.target.value as UserRole)}
            disabled={isSelf || loading}
            className="h-8 w-28 text-xs"
            aria-label={`Role for ${user.username}`}
          >
            <option value="USER">Coder</option>
            <option value="TEACHER">Teacher</option>
            <option value="ADMIN">Admin</option>
          </Select>
          {role === "ADMIN" || role === "TEACHER" ? (
            <ShieldCheck className="size-4 text-primary" />
          ) : null}
        </div>
      </TableCell>
      <TableCell>
        {user.isBanned ? (
          <Badge variant="destructive">Suspended</Badge>
        ) : (
          <Badge variant="success">Active</Badge>
        )}
      </TableCell>
      <TableCell className="hidden text-xs text-muted-foreground md:table-cell">
        {formatDate(user.createdAt)}
      </TableCell>
      <TableCell className="text-right">
        <Button
          type="button"
          variant={user.isBanned ? "outline" : "ghost"}
          size="sm"
          onClick={() => void toggleBan()}
          disabled={isSelf || loading}
          className={user.isBanned ? "" : "text-destructive hover:text-destructive"}
        >
          {loading ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : user.isBanned ? (
            <UserCheck className="size-3.5" />
          ) : (
            <Ban className="size-3.5" />
          )}
          {user.isBanned ? "Restore" : "Suspend"}
        </Button>
      </TableCell>
    </TableRow>
  );
}
