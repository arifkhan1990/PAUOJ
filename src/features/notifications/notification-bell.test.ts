import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/components/providers/toast-provider";
import { NotificationBell } from "./notification-bell";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

function render(props: { signedIn: boolean; initialUnread: number }): string {
  return renderToStaticMarkup(
    createElement(
      ToastProvider,
      null,
      createElement(NotificationBell, props),
    ),
  );
}

describe("NotificationBell", () => {
  it("labels the guest bell without a badge", () => {
    const html = render({ signedIn: false, initialUnread: 0 });

    expect(html).toContain(
      'aria-label="Open announcements and upcoming contests"',
    );
    expect(html).toContain('aria-haspopup="dialog"');
    expect(html).toContain('aria-expanded="false"');
    expect(html).not.toContain("bg-destructive");
  });

  it("shows the exact unread count up to 99", () => {
    const html = render({ signedIn: true, initialUnread: 3 });

    expect(html).toContain('aria-label="Open notifications, 3 unread"');
    expect(html).toMatch(/>3<\/span>/);
  });

  it("caps the badge at 99+ while the label keeps the real count", () => {
    const html = render({ signedIn: true, initialUnread: 120 });

    expect(html).toContain("99+");
    expect(html).toContain("120 unread");
  });

  it("hides the badge when everything is read", () => {
    const html = render({ signedIn: true, initialUnread: 0 });

    expect(html).toContain('aria-label="Open notifications, 0 unread"');
    expect(html).not.toContain("bg-destructive");
  });
});
