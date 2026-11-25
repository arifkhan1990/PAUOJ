import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { ArrowLeft, ExternalLink, ShieldAlert } from "lucide-react";
import { ProfileSocialLinks } from "@/components/profile/profile-social-links";
import { SkillChips } from "@/components/profile/profile-details";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { AdminUserDetail } from "@/lib/admin-user-types";
import {
  TSHIRT_SIZE_LABELS,
  USER_STATUS_LABELS,
} from "@/lib/profile-fields";
import { parseProfileLink, type ProfileLinkField } from "@/lib/profile-links";
import { cn, formatDate } from "@/lib/utils";
import { requireAdmin } from "@/server/auth/guards";
import { getAdminUserDetail } from "@/server/services/admin-user-detail";

export const metadata: Metadata = {
  title: "User details",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const DASH = <span className="text-muted-foreground">—</span>;

function DetailItem({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5 break-words text-sm">{children}</dd>
    </div>
  );
}

function roleLabel(role: AdminUserDetail["role"]): string {
  if (role === "ADMIN") return "Administrator";
  if (role === "TEACHER") return "Teacher";
  return "Coder";
}

function hasPublicLinks(user: AdminUserDetail): boolean {
  const fields: { field: ProfileLinkField; value: string | null }[] = [
    { field: "website", value: user.website },
    { field: "github", value: user.github },
    { field: "linkedin", value: user.linkedin },
  ];
  return fields.some(({ field, value }) => {
    if (!value?.trim()) return false;
    const parsed = parseProfileLink(field, value);
    return parsed.ok && Boolean(parsed.value);
  });
}

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const user = await getAdminUserDetail(id);
  if (!user) notFound();

  return (
    <div className="space-y-6">
      <Link
        href="/admin/users"
        className="inline-flex min-h-11 items-center gap-1.5 rounded-sm text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <ArrowLeft className="size-4" aria-hidden="true" /> All users
      </Link>

      <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <UserAvatar
            name={user.displayName}
            username={user.username}
            size="xl"
            avatarPreset={user.avatarPreset}
            avatarImageAt={user.avatarImageUpdatedAt}
          />
          <div className="min-w-0 pt-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="min-w-0 break-words text-2xl font-semibold tracking-tight">
                {user.displayName}
              </h1>
              <Badge variant={user.role === "ADMIN" ? "default" : "outline"}>
                {roleLabel(user.role)}
              </Badge>
              {user.isBanned ? (
                <Badge variant="destructive">Suspended</Badge>
              ) : (
                <Badge variant="success">Active</Badge>
              )}
            </div>
            <p className="mt-0.5 font-mono text-[13px] text-muted-foreground">
              @{user.username}
            </p>
          </div>
        </div>
        <Link
          href={`/users/${user.username}`}
          className={cn(
            buttonVariants({ variant: "outline", size: "lg" }),
            "shrink-0",
          )}
        >
          <ExternalLink className="size-4" aria-hidden="true" /> View public
          profile
        </Link>
      </header>

      <p className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">
        <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <span>
          This page contains private contact details. Use them only for account
          support and event logistics, and never share them publicly.
        </span>
      </p>

      <div className="grid gap-5 md:grid-cols-2">
        <Card className="p-5">
          <h2 className="text-sm font-semibold">Account</h2>
          <dl className="mt-3 grid gap-3">
            <DetailItem label="Email">
              <span className="break-all">{user.email}</span>
            </DetailItem>
            <DetailItem label="Joined">{formatDate(user.createdAt)}</DetailItem>
            <DetailItem label="Rating">
              <span className="tabular-nums">
                {user.rating.toLocaleString("en-US")}
              </span>
            </DetailItem>
            <DetailItem label="Email verified">
              {user.emailVerifiedAt ? (
                <Badge variant="success">Verified</Badge>
              ) : (
                <Badge variant="warning">Not verified</Badge>
              )}
            </DetailItem>
            <DetailItem label="Account status">
              {user.isBanned ? (
                <Badge variant="destructive">Suspended</Badge>
              ) : (
                <Badge variant="success">Active</Badge>
              )}
            </DetailItem>
          </dl>
        </Card>

        <Card className="p-5">
          <h2 className="text-sm font-semibold">Contact</h2>
          <dl className="mt-3 grid gap-3">
            <DetailItem label="Phone">
              {user.phone ? (
                <a
                  href={`tel:${user.phone.replace(/[^\d+]/g, "")}`}
                  className="inline-flex min-h-11 items-center rounded-sm text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  {user.phone}
                </a>
              ) : (
                DASH
              )}
            </DetailItem>
            <DetailItem label="Address">
              {user.address ? (
                <span className="whitespace-pre-line">{user.address}</span>
              ) : (
                DASH
              )}
            </DetailItem>
            <DetailItem label="T-shirt size">
              {user.tshirtSize ? TSHIRT_SIZE_LABELS[user.tshirtSize] : DASH}
            </DetailItem>
          </dl>
        </Card>

        <Card className="p-5">
          <h2 className="text-sm font-semibold">Work &amp; skills</h2>
          <dl className="mt-3 grid gap-3 sm:grid-cols-2">
            <DetailItem label="Current status">
              {user.currentStatus
                ? USER_STATUS_LABELS[user.currentStatus]
                : DASH}
            </DetailItem>
            <DetailItem label="Company">
              {user.companyName || DASH}
            </DetailItem>
            <DetailItem label="Job title">{user.jobTitle || DASH}</DetailItem>
          </dl>
          <div className="mt-3">
            {user.skills.some((skill) => skill.trim()) ? (
              <SkillChips skills={user.skills} />
            ) : (
              <p className="text-sm text-muted-foreground">No skills listed.</p>
            )}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-sm font-semibold">Public links</h2>
          {hasPublicLinks(user) ? (
            <div className="-mt-1">
              <ProfileSocialLinks
                website={user.website}
                github={user.github}
                linkedin={user.linkedin}
              />
            </div>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              No public links.
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}
