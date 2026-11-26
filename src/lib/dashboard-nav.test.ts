import { describe, expect, it } from "vitest";
import {
  dashboardBadgeNoun,
  dashboardNav,
  type DashboardNavItem,
} from "./dashboard-nav";

function allItems(role: "ADMIN" | "TEACHER" | "CODER"): DashboardNavItem[] {
  return dashboardNav(role, "tester").flatMap((section) => section.items);
}

describe("dashboardNav admin access queue", () => {
  it("exposes exactly one payments and access entry", () => {
    const items = allItems("ADMIN").filter(
      (item) => item.href === "/admin/payments",
    );

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      label: "Payments & access",
      badgeKey: "access",
    });
  });

  it("attaches the pending access count as a badge", () => {
    const items = dashboardNav("ADMIN", "tester", { access: 3 }).flatMap(
      (section) => section.items,
    );
    const entry = items.find((item) => item.href === "/admin/payments");

    expect(entry?.badge).toBe(3);
  });

  it("keeps the admin queue out of coder and teacher nav", () => {
    const hasPayments = (role: "TEACHER" | "CODER") =>
      allItems(role).some((item) => item.href === "/admin/payments");

    expect(hasPayments("CODER")).toBe(false);
    expect(hasPayments("TEACHER")).toBe(false);
  });

  it("names the access badge for screen readers", () => {
    expect(dashboardBadgeNoun("access")).toBe("pending access request");
  });
});
