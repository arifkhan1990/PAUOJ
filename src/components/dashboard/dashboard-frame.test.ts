import { createElement, type ComponentProps, type FC } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/components/providers/toast-provider";
import type { DashboardRole } from "@/lib/dashboard-nav";
import type { UserRole } from "@/lib/types";
import { DashboardFrame } from "./dashboard-frame";

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
  useRouter: () => ({ push: () => undefined, refresh: () => undefined }),
}));

// The shell requires children, so widen its type to pass them as a third arg.
type FrameProps = Omit<ComponentProps<typeof DashboardFrame>, "children">;
const Frame = DashboardFrame as unknown as FC<FrameProps>;

function render(panel: DashboardRole, role: UserRole): string {
  return renderToStaticMarkup(
    createElement(
      ToastProvider,
      null,
      createElement(
        Frame,
        {
          panel,
          role,
          username: "ada",
          displayName: "Ada Lovelace",
          unreadNotifications: 7,
        },
        createElement("p", null, "Panel content"),
      ),
    ),
  );
}

describe("DashboardFrame", () => {
  it("renders the notification bell in the top header with the shared count", () => {
    const html = render("CODER", "USER");

    expect(html).toContain('aria-label="Open notifications, 7 unread"');
    expect(html.match(/Open notifications/g)).toHaveLength(1);
    expect(html).toContain('aria-label="Toggle theme"');
    expect(html).toContain('aria-label="Open user menu for Ada Lovelace"');

    const bell = html.indexOf('aria-label="Open notifications, 7 unread"');
    const theme = html.indexOf('aria-label="Toggle theme"');
    const user = html.indexOf('aria-label="Open user menu for Ada Lovelace"');
    expect(bell).toBeGreaterThan(-1);
    expect(bell).toBeLessThan(theme);
    expect(theme).toBeLessThan(user);
  });

  it("keeps the public-site link and the sidebar unread badge", () => {
    const html = render("CODER", "USER");

    expect(html).toContain("Public site");
    expect(html).toContain("Back to public site");
    expect(html).toContain('href="/dashboard/notifications"');
  });

  it("shows the same bell for coder, teacher and admin shells", () => {
    const shells: Array<[DashboardRole, UserRole]> = [
      ["CODER", "USER"],
      ["TEACHER", "TEACHER"],
      ["ADMIN", "ADMIN"],
    ];

    for (const [panel, role] of shells) {
      const html = render(panel, role);
      expect(html).toContain('aria-label="Open notifications, 7 unread"');
      expect(html).toContain('aria-label="Open user menu for Ada Lovelace"');
    }
  });
});
