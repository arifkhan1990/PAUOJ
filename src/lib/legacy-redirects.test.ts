import { describe, expect, it } from "vitest";
import { legacyRedirects } from "./legacy-redirects";

describe("legacy social redirects", () => {
  it("maps every old social path into the dashboard exactly once", () => {
    expect(legacyRedirects).toHaveLength(5);
    expect(
      legacyRedirects.map(({ source, destination }) => ({
        source,
        destination,
      })),
    ).toEqual([
      { source: "/notifications", destination: "/dashboard/notifications" },
      { source: "/messages", destination: "/dashboard/messages" },
      { source: "/messages/:id", destination: "/dashboard/messages/:id" },
      {
        source: "/connections/requests",
        destination: "/dashboard/connections/requests",
      },
      { source: "/connections", destination: "/dashboard/connections" },
    ]);
  });

  it("marks every redirect permanent so it answers with a 308", () => {
    expect(legacyRedirects).toHaveLength(5);
    for (const redirect of legacyRedirects) {
      expect(redirect.permanent).toBe(true);
    }
  });
});
