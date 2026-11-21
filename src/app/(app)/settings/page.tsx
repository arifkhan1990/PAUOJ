import type { Metadata } from "next";
import { CalendarDays, Mail, ShieldCheck, UserRound } from "lucide-react";
import { ResendVerificationButton } from "@/components/profile/resend-verification-button";
import { NotificationPreferencesForm } from "@/features/notifications/notification-preferences-form";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { PasswordForm } from "@/components/profile/password-form";
import { ProfileForm } from "@/components/profile/profile-form";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/server/auth/guards";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your PAU OJ profile and account security.",
};

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireUser("/settings");

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Account"
        title="Settings"
        description="Update your public profile and keep your account secure."
      />

      <div className="mt-6 grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
        <Card className="h-fit p-5">
          <h2 className="text-sm font-semibold">Account</h2>
          <dl className="mt-3 space-y-3 text-sm">
            <div>
              <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <UserRound className="size-3.5" /> Username
              </dt>
              <dd className="mt-0.5 font-mono text-xs">@{user.username}</dd>
            </div>
            <div id="email">
              <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Mail className="size-3.5" /> Email
              </dt>
              <dd className="mt-0.5 break-all text-xs">{user.email}</dd>
              <dd className="mt-2">
                {user.emailVerifiedAt ? (
                  <Badge variant="success" className="gap-1">
                    <ShieldCheck className="size-3" /> Verified
                  </Badge>
                ) : (
                  <div className="space-y-2">
                    <Badge variant="warning">Not verified</Badge>
                    <ResendVerificationButton />
                  </div>
                )}
              </dd>
            </div>
            <div>
              <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CalendarDays className="size-3.5" /> Joined
              </dt>
              <dd className="mt-0.5 text-xs">{formatDate(user.createdAt)}</dd>
            </div>
            <div>
              <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <ShieldCheck className="size-3.5" /> Role
              </dt>
              <dd className="mt-0.5 text-xs">
                {user.role === "ADMIN"
                  ? "Administrator"
                  : user.role === "TEACHER"
                    ? "Teacher"
                    : "Coder"}
              </dd>
            </div>
          </dl>
          <p className="mt-4 border-t border-border pt-3 text-[11px] leading-relaxed text-muted-foreground">
            Username and email changes are handled by an administrator to keep
            contest records consistent.
          </p>
        </Card>

        <div className="space-y-5">
          <Card className="p-5">
            <h2 className="text-base font-semibold">Public profile</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              This information is visible on your profile page.
            </p>
            <div className="mt-4">
              <ProfileForm
                displayName={user.displayName}
                bio={user.bio}
                country={user.country}
                institution={user.institution}
              />
            </div>
          </Card>
          <Card className="p-5">
            <h2 className="text-base font-semibold">Password</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Changing your password signs out every other device.
            </p>
            <div className="mt-4">
              <PasswordForm />
            </div>
          </Card>
          <Card id="notifications" className="scroll-mt-24 p-5">
            <h2 className="text-base font-semibold">Email notifications</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Choose which activity should also reach your inbox.
            </p>
            <div className="mt-4">
              <NotificationPreferencesForm
                initial={{
                  emailVerdicts: user.emailVerdicts,
                  emailContests: user.emailContests,
                  emailClarifications: user.emailClarifications,
                  emailReviews: user.emailReviews,
                  reviewEmailFrequency: user.reviewEmailFrequency,
                }}
              />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
