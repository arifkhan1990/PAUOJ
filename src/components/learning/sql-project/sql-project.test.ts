import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { getSqlProjectTicket } from "@/lib/learning/sql-project";
import { SqlProjectLink } from "./sql-project-link";
import { SqlWorkTicket } from "./sql-work-ticket";
import { ProjectHandover } from "./project-handover";
import { ProjectBoard } from "./project-board";

const orientationTicket = getSqlProjectTicket("orientation");

describe("SqlProjectLink", () => {
  it("points at the dossier and names the track", () => {
    const html = renderToStaticMarkup(
      createElement(SqlProjectLink, { moduleSlug: "basic-sql" }),
    );
    expect(html).toContain('href="/learn/sql/project"');
    expect(html).toContain("ShopSphere industry project");
    expect(html).toContain("Basic SQL");
  });

  it("deep-links the handover variant", () => {
    const html = renderToStaticMarkup(
      createElement(SqlProjectLink, {
        moduleSlug: "advanced-sql",
        variant: "handover",
      }),
    );
    expect(html).toContain('href="/learn/sql/project#handover"');
    expect(html).toContain("Final handover");
    expect(html).toContain("Advanced SQL");
  });
});

describe("SqlWorkTicket", () => {
  it("renders the real orientation ticket for the Basic SQL topic", () => {
    expect(orientationTicket).not.toBeNull();
    if (!orientationTicket) return;

    const html = renderToStaticMarkup(
      createElement(SqlWorkTicket, {
        topicSlug: "orientation",
        moduleSlug: "basic-sql",
      }),
    );
    expect(html).toContain(orientationTicket.id);
    expect(html).toContain(orientationTicket.title);
    expect(html).toContain(orientationTicket.brief);
    expect(html).toContain("Acceptance");
    expect(html).toContain(orientationTicket.acceptance[0]);
    expect(html).toContain(orientationTicket.tables[0]);
    expect(html).toContain(
      `href="/learn/sql/project#epic-${orientationTicket.epicSlug}"`,
    );
    expect(html).toContain("Open the full dossier");
  });

  it("renders nothing when the topic has no ticket", () => {
    const html = renderToStaticMarkup(
      createElement(SqlWorkTicket, {
        topicSlug: "not-a-topic",
        moduleSlug: "basic-sql",
      }),
    );
    expect(html).toBe("");
  });

  it("renders nothing when the module does not match the ticket", () => {
    const html = renderToStaticMarkup(
      createElement(SqlWorkTicket, {
        topicSlug: "orientation",
        moduleSlug: "advanced-sql",
      }),
    );
    expect(html).toBe("");
  });

  it("renders an advanced ticket on the advanced track", () => {
    const ticket = getSqlProjectTicket("window-thinking");
    expect(ticket).not.toBeNull();
    if (!ticket) return;

    const html = renderToStaticMarkup(
      createElement(SqlWorkTicket, {
        topicSlug: "window-thinking",
        moduleSlug: "advanced-sql",
      }),
    );
    expect(html).toContain(ticket.id);
    expect(html).toContain("Analytics platform");
    expect(html).toContain(
      `href="/learn/sql/project#epic-${ticket.epicSlug}"`,
    );
  });
});

describe("ProjectHandover", () => {
  it("links each handover proof to a real judge problem", () => {
    const html = renderToStaticMarkup(createElement(ProjectHandover));
    expect(html).toContain("Final handover");
    expect(html).toContain("Judge problems");
    expect(html).toContain('href="/problems/sql-adv-vendor-scorecard"');
    expect(html).toContain('href="/learning/shopsphere.sql"');
  });
});

describe("ProjectBoard", () => {
  it("lists the full 23-ticket delivery board", () => {
    const html = renderToStaticMarkup(createElement(ProjectBoard));
    expect(html).toContain("All 23 work tickets");
    expect(html).toContain("SHOP-CAT-01");
    expect(html).toContain('href="/learn/basic-sql/orientation"');
    expect(html).toContain('href="/learn/advanced-sql/window-thinking"');
  });

  it("orders tickets by curriculum, not by ticket id", () => {
    const html = renderToStaticMarkup(createElement(ProjectBoard));
    const orientation = html.indexOf("SHOP-CAT-01");
    const analytics = html.indexOf("SHOP-ANL-01");
    const capstone = html.indexOf("SHOP-FIN-02");

    expect(orientation).toBeGreaterThan(-1);
    expect(analytics).toBeGreaterThan(-1);
    expect(capstone).toBeGreaterThan(-1);
    expect(orientation).toBeLessThan(analytics);
    expect(orientation).toBeLessThan(capstone);
    expect(analytics).toBeLessThan(capstone);
  });
});
