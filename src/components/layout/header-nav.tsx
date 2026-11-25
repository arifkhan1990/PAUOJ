"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  MailWarning,
  Menu,
  MessageSquare,
  Settings,
  User as UserIcon,
  X,
} from "lucide-react";
import { useToast } from "@/components/providers/toast-provider";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import {
  MessagesHeaderLink,
  useUnreadMessageCount,
} from "@/features/messages/unread-badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { UserAvatar } from "@/components/shared/user-avatar";
import type { HeaderUser } from "@/lib/types";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/problems", label: "Problems" },
  { href: "/learn", label: "Learn" },
  { href: "/lists", label: "Study plans" },
  { href: "/contests", label: "Contests" },
  { href: "/submissions", label: "Submissions" },
  { href: "/rank", label: "Rank" },
];

/** 44px touch target through tablets, compact desktop density from lg up. */
const iconTouchTarget = "min-h-11 min-w-11 lg:min-h-9 lg:min-w-9";

/** Menu rows are 44px tall: the account menu is also used on phones. */
const menuRowClass =
  "flex min-h-11 items-center gap-2 rounded-md px-2.5 py-2 text-sm hover:bg-muted";

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function UserMenu({
  user,
  unreadNotifications,
  unreadMessages = 0,
}: {
  user: Pick<
    HeaderUser,
    "username" | "displayName" | "role" | "avatarPreset" | "avatarImageUpdatedAt"
  >;
  unreadNotifications: number;
  unreadMessages?: number;
}) {
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const messageCount = useUnreadMessageCount(unreadMessages);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const logout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/v1/auth/logout", {
        method: "POST",
        headers: { "content-type": "application/json" },
      });
      router.push("/");
      router.refresh();
    } catch {
      toast({
        title: "Could not sign out",
        description: "Please check your connection and try again.",
        variant: "error",
      });
    } finally {
      setLoggingOut(false);
      setOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        className={cn(
          "flex items-center gap-2 rounded-md p-1 pr-2 transition hover:bg-muted",
          iconTouchTarget,
        )}
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Open user menu for ${user.displayName}`}
      >
        <UserAvatar
          name={user.displayName}
          username={user.username}
          size="sm"
          avatarPreset={user.avatarPreset}
          avatarImageAt={user.avatarImageUpdatedAt}
        />
        <span className="hidden max-w-28 truncate text-sm font-medium sm:block">
          {user.displayName}
        </span>
        <ChevronDown className="hidden size-3.5 text-muted-foreground sm:block" />
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+8px)] z-50 w-60 overflow-hidden rounded-lg border border-border bg-popover p-1.5 text-popover-foreground shadow-lg"
        >
          <div className="border-b border-border px-2.5 pb-2 pt-1.5">
            <p className="truncate text-sm font-semibold">{user.displayName}</p>
            <p className="truncate text-xs text-muted-foreground">
              @{user.username}
            </p>
          </div>
          <div className="py-1">
            <Link href="/dashboard" role="menuitem" className={menuRowClass}>
              <LayoutDashboard className="size-4" /> Coder dashboard
            </Link>
            {user.role === "TEACHER" || user.role === "ADMIN" ? (
              <Link href="/teacher" role="menuitem" className={menuRowClass}>
                <LayoutDashboard className="size-4" /> Teacher panel
              </Link>
            ) : null}
            <Link
              href={`/users/${user.username}`}
              role="menuitem"
              className={menuRowClass}
            >
              <UserIcon className="size-4" /> Profile
            </Link>
            <Link
              href="/submissions?mine=true"
              role="menuitem"
              className={menuRowClass}
            >
              <LayoutDashboard className="size-4" /> My submissions
            </Link>
            <Link href="/notifications" role="menuitem" className={menuRowClass}>
              <Bell className="size-4" /> Notifications
              {unreadNotifications > 0 ? (
                <span className="ml-auto rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
                  {unreadNotifications}
                </span>
              ) : null}
            </Link>
            <Link href="/messages" role="menuitem" className={menuRowClass}>
              <MessageSquare className="size-4" /> Messages
              {messageCount > 0 ? (
                <span className="ml-auto rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
                  {messageCount > 99 ? "99+" : messageCount}
                </span>
              ) : null}
            </Link>
            <Link href="/settings" role="menuitem" className={menuRowClass}>
              <Settings className="size-4" /> Settings
            </Link>
            {user.role === "ADMIN" ? (
              <Link href="/admin" role="menuitem" className={menuRowClass}>
                <LayoutDashboard className="size-4" /> Admin dashboard
              </Link>
            ) : null}
          </div>
          <div className="border-t border-border pt-1">
            <button
              type="button"
              role="menuitem"
              onClick={() => void logout()}
              disabled={loggingOut}
              className={cn(
                menuRowClass,
                "w-full text-left text-destructive hover:bg-destructive/10 disabled:opacity-60",
              )}
            >
              <LogOut className="size-4" />
              {loggingOut ? "Signing out…" : "Sign out"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function HeaderNav({
  user,
  unreadNotifications = 0,
  unreadMessages = 0,
}: {
  user: HeaderUser | null;
  unreadNotifications?: number;
  unreadMessages?: number;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <header id="site-header" className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          aria-label="PAU OJ Online Judge home"
          className={cn(
            "mr-2 flex shrink-0 items-center gap-2.5",
            iconTouchTarget,
          )}
        >
          <Image
            src="/brand/pauoj-mark.png"
            alt=""
            width={368}
            height={383}
            priority
            className="h-9 w-auto"
          />
          <span className="hidden flex-col leading-none sm:flex">
            <span className="text-[15px] font-semibold">PAU OJ</span>{" "}
            <span className="mt-0.5 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Online Judge
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Main">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "inline-flex min-h-11 items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive(pathname, item.href)
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          {user ? (
            <>
              <MessagesHeaderLink
                initialCount={unreadMessages}
                className={iconTouchTarget}
              />
              <Link
                href="/notifications"
                aria-label={
                  unreadNotifications > 0
                    ? `${unreadNotifications} unread notifications`
                    : "Notifications"
                }
                className={cn(
                  buttonVariants({ variant: "ghost", size: "icon" }),
                  "relative",
                  iconTouchTarget,
                )}
              >
                <Bell className="size-4" />
                {unreadNotifications > 0 ? (
                  <span className="absolute -right-0.5 -top-0.5 grid min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-4 text-primary-foreground">
                    {unreadNotifications > 9 ? "9+" : unreadNotifications}
                  </span>
                ) : null}
              </Link>
            </>
          ) : null}
          <ThemeToggle />
          {user ? (
            <UserMenu
              user={user}
              unreadNotifications={unreadNotifications}
              unreadMessages={unreadMessages}
            />
          ) : (
            <div className="hidden items-center gap-1.5 sm:flex">
              <Link
                href="/login"
                className={buttonVariants({ variant: "ghost", size: "sm" })}
              >
                Log in
              </Link>
              <Link
                href="/register"
                className={buttonVariants({ variant: "default", size: "sm" })}
              >
                Sign up
              </Link>
            </div>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn("lg:hidden", iconTouchTarget)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((value) => !value)}
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
      </div>
      {user && !user.emailVerified ? (
        <div className="border-t border-amber-300/70 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-100">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-2 text-xs sm:px-6 lg:px-8">
            <span className="inline-flex items-center gap-1.5">
              <MailWarning className="size-3.5" />
              Verify your email to keep your account recoverable.
            </span>
            <Link
              href="/settings#email"
              className="inline-flex min-h-11 items-center font-semibold underline underline-offset-2 lg:min-h-0"
            >
              Verify now
            </Link>
          </div>
        </div>
      ) : null}

      {mobileOpen ? (
        <div className="border-t border-border bg-background px-4 py-4 lg:hidden">
          <nav className="flex flex-col gap-1" aria-label="Mobile">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex min-h-11 items-center rounded-md px-3 py-2.5 text-sm font-medium",
                  isActive(pathname, item.href)
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          {!user ? (
            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border pt-3">
              <Link
                href="/login"
                className={cn(buttonVariants({ variant: "outline" }), "min-h-11")}
              >
                Log in
              </Link>
              <Link href="/register" className={cn(buttonVariants(), "min-h-11")}>
                Sign up
              </Link>
            </div>
          ) : null}
        </div>
      ) : null}
    </header>
  );
}
