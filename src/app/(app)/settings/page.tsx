import type { Metadata } from "next";
import Link from "next/link";
import {
  Bell,
  CalendarDays,
  Camera,
  KeyRound,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { AvatarForm } from "@/components/profile/avatar-form";
import { ResendVerificationButton } from "@/components/profile/resend-verification-button";
import { NotificationPreferencesForm } from "@/features/notifications/notification-preferences-form";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { PasswordForm } from "@/components/profile/password-form";
import { ProfileForm } from "@/components/profile/profile-form";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/server/auth/guards";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your PAU OJ profile and account security.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const settingsSections = [
  { href: "#avatar", label: "Avatar", icon: Camera },
  { href: "#profile", label: "Profile", icon: UserRound },
  { href: "#password", label: "Password", icon: KeyRound },
  { href: "#notifications", label: "Notifications", icon: Bell },
] as const;

export default async function SettingsPage() {
  const user = await requireUser("/settings");
  const roleLabel =
    user.role === "ADMIN"
      ? "Administrator"
      : user.role === "TEACHER"
        ? "Teacher"
        : "Coder";

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Account"
        title="Settings"
        description="Update your profile and keep your account secure."
      />

      <div className="mt-6 grid items-start gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="space-y-3 lg:sticky lg:top-20">
          <Card className="overflow-hidden">
            <div className="flex items-center gap-3 border-b border-border bg-muted/30 p-5">
              <UserAvatar
                name={user.displayName}
                username={user.username}
                size="lg"
                avatarPreset={user.avatarPreset}
                avatarImageAt={user.avatarImageUpdatedAt}
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  {user.displayName}
                </p>
                <p className="truncate font-mono text-[11px] text-muted-foreground">
                  @{user.username}
                </p>
              </div>
            </div>

            <dl className="divide-y divide-border">
              <div className="flex items-start gap-3 px-5 py-3">
                <Mail
                  className="mt-0.5 size-3.5 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <dt className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                    Email
                  </dt>
                  <dd className="mt-0.5 break-all text-xs">{user.email}</dd>
                  <dd className="mt-1.5">
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
              </div>

              <div className="flex items-start gap-3 px-5 py-3">
                <CalendarDays
                  className="mt-0.5 size-3.5 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                <div>
                  <dt className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                    Joined
                  </dt>
                  <dd className="mt-0.5 text-xs">
                    {formatDate(user.createdAt)}
                  </dd>
                </div>
              </div>

              <div className="flex items-start gap-3 px-5 py-3">
                <ShieldCheck
                  className="mt-0.5 size-3.5 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                <div>
                  <dt className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                    Role
                  </dt>
                  <dd className="mt-0.5 text-xs">{roleLabel}</dd>
                </div>
              </div>
            </dl>

            <p className="border-t border-border bg-muted/20 px-5 py-3 text-[11px] leading-relaxed text-muted-foreground">
              Username and email changes are handled by an administrator to keep
              contest records consistent.
            </p>
          </Card>

          <nav aria-label="Settings sections" className="hidden lg:block">
            <p className="px-2.5 pb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              On this page
            </p>
            <div className="space-y-0.5">
              {settingsSections.map((section) => {
                const Icon = section.icon;
                return (
                  <a
                    key={section.href}
                    href={section.href}
                    className="flex min-h-9 items-center gap-2 rounded-md px-2.5 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  >
                    <Icon className="size-3.5" aria-hidden="true" />
                    {section.label}
                  </a>
                );
              })}
            </div>
          </nav>
        </aside>

        <div className="space-y-5">
          <Card id="avatar" className="scroll-mt-24 p-5">
            <h2 className="text-base font-semibold">Profile picture</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Your avatar appears on your profile, comments, rank boards and
              messages.
            </p>
            <div className="mt-4">
              <AvatarForm
                username={user.username}
                displayName={user.displayName}
                initialPreset={user.avatarPreset}
                initialImageAt={user.avatarImageUpdatedAt?.toISOString() ?? null}
              />
            </div>
          </Card>

          <Card id="profile" className="scroll-mt-24 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-semibold">Profile details</h2>
              <Link
                href={`/users/${user.username}`}
                className="inline-flex min-h-11 items-center text-xs font-medium text-primary underline-offset-4 hover:underline"
              >
                View public profile
              </Link>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Work and skill details appear on your profile. Phone, address and
              T-shirt size stay private between you and admins.
            </p>
            <div className="mt-4">
              <ProfileForm
                displayName={user.displayName}
                bio={user.bio}
                country={user.country}
                institution={user.institution}
                website={user.website}
                github={user.github}
                linkedin={user.linkedin}
                address={user.address}
                phone={user.phone}
                currentStatus={user.currentStatus}
                companyName={user.companyName}
                jobTitle={user.jobTitle}
                skills={user.skills}
                tshirtSize={user.tshirtSize}
                presenceVisibility={user.presenceVisibility}
              />
            </div>
          </Card>

          <Card id="password" className="scroll-mt-24 p-5">
            <h2 className="text-base font-semibold">Password</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Changing your password signs out every other device.
            </p>
            <div className="mt-4">
              <PasswordForm />
            </div>
          </Card>

          <Card id="notifications" className="scroll-mt-24 p-5">
            <h2 className="text-base font-semibold">Notifications</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Choose which activity reaches you in the app and in your inbox.
            </p>
            <div className="mt-4">
              <NotificationPreferencesForm
                initial={{
                  notifyMessages: user.notifyMessages,
                  notifyFollows: user.notifyFollows,
                  notifyMarketing: user.notifyMarketing,
                  emailVerdicts: user.emailVerdicts,
                  emailContests: user.emailContests,
                  emailClarifications: user.emailClarifications,
                  emailReviews: user.emailReviews,
                  emailAccount: user.emailAccount,
                  emailLearning: user.emailLearning,
                  emailAchievements: user.emailAchievements,
                  emailAnnouncements: user.emailAnnouncements,
                  emailMarketing: user.emailMarketing,
                  emailDiscussions: user.emailDiscussions,
                  emailMessages: user.emailMessages,
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
