"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, ExternalLink, Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { UserMenu } from "@/components/layout/header-nav";
import { DashboardFooter } from "@/components/dashboard/dashboard-footer";
import { UserAvatar } from "@/components/shared/user-avatar";
import { buttonVariants } from "@/components/ui/button";
import { apiRequest } from "@/lib/api-client";
import {
  dashboardBadgeNoun,
  dashboardNav,
  dashboardRoleLabel,
  dashboardWorkspaceMeta,
  type DashboardBadges,
  type DashboardRole,
} from "@/lib/dashboard-nav";
import type { SocialCounts } from "@/lib/social-types";
import type { UserRole } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Cross-panel counters refresh cadence while the tab stays visible. */
const SOCIAL_COUNTS_POLL_MS = 45_000;

function countsChanged(previous: SocialCounts, next: SocialCounts): boolean {
  return (
    previous.messages !== next.messages ||
    previous.notifications !== next.notifications ||
    previous.requests !== next.requests
  );
}

function isItemActive(
  pathname: string,
  href: string,
  exact = false,
): boolean {
  if (href.includes("#")) return false;
  const cleanHref = href.split("?")[0] ?? href;
  if (exact) return pathname === cleanHref;
  return pathname === cleanHref || pathname.startsWith(`${cleanHref}/`);
}

function pageSuffix(pathname: string): string | null {
  if (pathname.endsWith("/new")) return "New";
  if (pathname.endsWith("/edit")) return "Edit";
  if (pathname.endsWith("/requests")) return "Requests";
  if (pathname.endsWith("/contributions") && pathname.split("/").length > 3) {
    return "Contributions";
  }
  if (/\/[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(pathname)) return "Details";
  return null;
}

export function DashboardFrame({
  panel,
  role,
  username,
  displayName,
  avatarPreset = null,
  avatarImageUpdatedAt = null,
  unreadMessages = 0,
  unreadNotifications = 0,
  pendingFollowRequests = 0,
  children,
}: {
  panel: DashboardRole;
  role: UserRole;
  username: string;
  displayName: string;
  avatarPreset?: string | null;
  avatarImageUpdatedAt?: Date | null;
  unreadMessages?: number;
  unreadNotifications?: number;
  pendingFollowRequests?: number;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [socialCounts, setSocialCounts] = useState<SocialCounts>({
    messages: unreadMessages,
    notifications: unreadNotifications,
    requests: pendingFollowRequests,
  });
  const badges: DashboardBadges = {
    messages: socialCounts.messages,
    notifications: socialCounts.notifications,
    requests: socialCounts.requests,
  };
  const sections = dashboardNav(panel, username, badges);
  const meta = dashboardWorkspaceMeta(panel);
  const WorkspaceIcon = meta.icon;
  const allItems = sections.flatMap((section) => section.items);
  const activeItem = allItems
    .filter((item) => isItemActive(pathname, item.href, item.exact))
    .sort((left, right) => right.href.length - left.href.length)[0];
  const suffix = pageSuffix(pathname);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [mobileOpen]);

  // A server render (refresh or navigation) carries fresher counts than the
  // last poll, so adopt them without dropping a still-valid object identity.
  useEffect(() => {
    setSocialCounts((previous) =>
      countsChanged(previous, {
        messages: unreadMessages,
        notifications: unreadNotifications,
        requests: pendingFollowRequests,
      })
        ? {
            messages: unreadMessages,
            notifications: unreadNotifications,
            requests: pendingFollowRequests,
          }
        : previous,
    );
  }, [unreadMessages, unreadNotifications, pendingFollowRequests]);

  // The server layout already fetched the counts, so the first request waits
  // for the interval or for the tab becoming visible again.
  useEffect(() => {
    let active = true;
    let inFlight = false;

    const load = async () => {
      if (!active || inFlight || document.visibilityState !== "visible") {
        return;
      }
      inFlight = true;
      try {
        const counts = await apiRequest<SocialCounts>("/api/v1/social/counts");
        if (!active) return;
        const next = {
          messages: counts.messages,
          notifications: counts.notifications,
          requests: counts.requests,
        };
        setSocialCounts((previous) =>
          countsChanged(previous, next) ? next : previous,
        );
      } catch {
        // Keep the last known counts; the next tick retries.
      } finally {
        inFlight = false;
      }
    };

    const interval = window.setInterval(() => void load(), SOCIAL_COUNTS_POLL_MS);
    const onVisibility = () => {
      if (document.visibilityState === "visible") void load();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      active = false;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <div className="min-h-screen bg-muted/20">
      <div className="mx-auto flex w-full max-w-[1440px]">
        {mobileOpen ? (
          <button
            type="button"
            aria-label="Close dashboard menu"
            className="fixed inset-0 z-40 cursor-default bg-background/60 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        ) : null}

        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 flex w-[min(18rem,85vw)] flex-col border-r border-border bg-card transition-transform duration-200 ease-out lg:sticky lg:top-0 lg:z-0 lg:h-screen lg:w-64 lg:shrink-0 lg:translate-x-0",
            mobileOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="flex items-center gap-3 border-b border-border px-4 py-4">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
              <WorkspaceIcon className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold leading-tight">
                {meta.title}
              </p>
              <p className="truncate text-[11px] text-muted-foreground">
                {meta.subtitle}
              </p>
            </div>
            <button
              type="button"
              className={cn(
                buttonVariants({ variant: "ghost", size: "icon" }),
                "size-8 lg:hidden",
              )}
              aria-label="Close menu"
              onClick={() => setMobileOpen(false)}
            >
              <X className="size-4" />
            </button>
          </div>

          <nav
            aria-label="Dashboard"
            className="reference-nav-scroll flex-1 overflow-y-auto overscroll-contain px-3 py-4"
          >
            <div className="space-y-5">
              {sections.map((section) => (
                <div key={section.label}>
                  <p className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    {section.label}
                  </p>
                  <div className="space-y-0.5">
                    {section.items.map((item) => {
                      const active = isItemActive(
                        pathname,
                        item.href,
                        item.exact,
                      );
                      const Icon = item.icon;
                      const badge = item.badge;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          aria-current={active ? "page" : undefined}
                          className={cn(
                            "relative flex min-h-11 items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors lg:min-h-9",
                            active
                              ? "bg-primary/10 text-primary"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground",
                          )}
                        >
                          {active ? (
                            <span
                              className="absolute -left-3 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-primary"
                              aria-hidden="true"
                            />
                          ) : null}
                          <Icon className="size-4 shrink-0" aria-hidden="true" />
                          <span className="min-w-0 flex-1 truncate">
                            {item.label}
                          </span>
                          {badge && item.badgeKey ? (
                            <>
                              <span
                                aria-hidden="true"
                                className="grid min-w-5 shrink-0 place-items-center rounded-full bg-primary px-1.5 text-[10px] font-semibold leading-4 tabular-nums text-primary-foreground"
                              >
                                {badge > 99 ? "99+" : badge}
                              </span>
                              <span className="sr-only">
                                {badge} {dashboardBadgeNoun(item.badgeKey)}
                                {badge === 1 ? "" : "s"}
                              </span>
                            </>
                          ) : null}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </nav>

          <div className="border-t border-border p-3">
            <Link
              href={`/users/${username}`}
              className="flex items-center gap-2.5 rounded-lg p-2 transition-colors hover:bg-muted"
            >
              <UserAvatar
                name={displayName}
                username={username}
                size="sm"
                avatarPreset={avatarPreset}
                avatarImageAt={avatarImageUpdatedAt}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold">{displayName}</p>
                <p className="truncate text-[10px] text-muted-foreground">
                  {dashboardRoleLabel(role)}
                </p>
              </div>
            </Link>
            <Link
              href="/"
              className="mt-1 flex items-center gap-2 rounded-lg px-2 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <ExternalLink className="size-3.5" aria-hidden="true" />
              Back to public site
            </Link>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-background/85 px-4 backdrop-blur sm:px-6 lg:px-8">
            <button
              type="button"
              className={cn(
                buttonVariants({ variant: "ghost", size: "icon" }),
                "lg:hidden",
              )}
              aria-label="Open dashboard menu"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((value) => !value)}
            >
              <Menu className="size-5" />
            </button>

            <nav
              aria-label="Breadcrumb"
              className="flex min-w-0 flex-1 items-center gap-1.5 text-xs text-muted-foreground"
            >
              <span className="hidden shrink-0 sm:inline">{meta.title}</span>
              <ChevronRight
                className="hidden size-3 shrink-0 sm:block"
                aria-hidden="true"
              />
              <span className="truncate font-medium text-foreground">
                {activeItem?.label ?? "Overview"}
              </span>
              {suffix ? (
                <>
                  <ChevronRight
                    className="size-3 shrink-0"
                    aria-hidden="true"
                  />
                  <span className="shrink-0">{suffix}</span>
                </>
              ) : null}
            </nav>

            <Link
              href="/"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "hidden gap-1.5 text-muted-foreground sm:inline-flex",
              )}
            >
              <ExternalLink className="size-3.5" aria-hidden="true" />
              Public site
            </Link>
            <ThemeToggle />
            <UserMenu
              user={{ username, displayName, role, avatarPreset, avatarImageUpdatedAt }}
            />
          </header>

          <main className="min-w-0 flex-1 py-6 pl-4 pr-4 sm:pl-6 sm:pr-6 lg:py-8 lg:pl-8 lg:pr-0">
            {children}
          </main>
          <DashboardFooter />
        </div>
      </div>
    </div>
  );
}
