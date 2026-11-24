import { describe, expect, it } from "vitest";
import {
  parseGitHub,
  parseLinkedIn,
  parseProfileLink,
  parseWebsite,
} from "./profile-links";
import { profileSchema } from "./schemas/auth";

function value(result: ReturnType<typeof parseWebsite>): string | null {
  expect(result.ok).toBe(true);
  return result.ok ? result.value : null;
}

function message(result: ReturnType<typeof parseWebsite>): string {
  expect(result.ok).toBe(false);
  return result.ok ? "" : result.message;
}

describe("parseWebsite", () => {
  it("accepts bare domains and adds https", () => {
    expect(value(parseWebsite("example.com"))).toBe("https://example.com");
    expect(value(parseWebsite("  sub.example.co.uk  "))).toBe(
      "https://sub.example.co.uk",
    );
  });

  it("keeps http and normalizes the host", () => {
    expect(value(parseWebsite("http://Example.COM"))).toBe("http://example.com");
    expect(value(parseWebsite("https://example.com:8080/path"))).toBe(
      "https://example.com:8080/path",
    );
  });

  it("strips a single trailing slash", () => {
    expect(value(parseWebsite("https://example.com/"))).toBe(
      "https://example.com",
    );
    expect(value(parseWebsite("https://example.com/docs/"))).toBe(
      "https://example.com/docs",
    );
    expect(value(parseWebsite("https://example.com/docs/?a=1"))).toBe(
      "https://example.com/docs?a=1",
    );
  });

  it("treats blank input as null", () => {
    expect(value(parseWebsite(""))).toBeNull();
    expect(value(parseWebsite("    "))).toBeNull();
  });

  it("rejects non-http schemes (scheme injection)", () => {
    expect(message(parseWebsite("javascript:alert(1)"))).toMatch(/http/i);
    expect(message(parseWebsite("data:text/html,<script>x</script>"))).toMatch(
      /http/i,
    );
    expect(message(parseWebsite("ftp://example.com"))).toMatch(/http/i);
    expect(message(parseWebsite("vbscript:msgbox(1)"))).toMatch(/http/i);
  });

  it("rejects embedded credentials", () => {
    expect(message(parseWebsite("https://user:pass@example.com"))).toMatch(
      /username or password/i,
    );
    expect(message(parseWebsite("https://user@example.com"))).toMatch(
      /username or password/i,
    );
    expect(message(parseWebsite("example.com@evil.com"))).toMatch(
      /username or password/i,
    );
  });

  it("rejects hosts without a dot and internal whitespace", () => {
    expect(message(parseWebsite("localhost"))).toMatch(/valid website/i);
    expect(message(parseWebsite("https://localhost:3000"))).toMatch(
      /valid website/i,
    );
    expect(message(parseWebsite("not a url"))).toMatch(/spaces/i);
    expect(message(parseWebsite("exa\tmple.com"))).toMatch(/spaces/i);
  });

  it("rejects oversized values", () => {
    const long = `https://example.com/${"a".repeat(200)}`;
    expect(message(parseWebsite(long))).toMatch(/200 characters/i);
  });
});

describe("parseGitHub", () => {
  it("accepts handles, @handles and profile URLs", () => {
    expect(value(parseGitHub("octocat"))).toBe("https://github.com/octocat");
    expect(value(parseGitHub("@octocat"))).toBe("https://github.com/octocat");
    expect(value(parseGitHub("  github.com/octocat  "))).toBe(
      "https://github.com/octocat",
    );
    expect(value(parseGitHub("https://github.com/octocat/"))).toBe(
      "https://github.com/octocat",
    );
    expect(value(parseGitHub("https://www.github.com/octocat"))).toBe(
      "https://github.com/octocat",
    );
    expect(value(parseGitHub("HTTP://GitHub.com/Octocat"))).toBe(
      "https://github.com/Octocat",
    );
  });

  it("treats blank input as null", () => {
    expect(value(parseGitHub(""))).toBeNull();
    expect(value(parseGitHub("   "))).toBeNull();
  });

  it("rejects foreign hosts, extra paths and invalid handles", () => {
    expect(message(parseGitHub("https://gitlab.com/octocat"))).toMatch(
      /github profile/i,
    );
    expect(message(parseGitHub("github.com/octocat/repo"))).toMatch(
      /github profile/i,
    );
    expect(message(parseGitHub("https://gist.github.com/octocat"))).toMatch(
      /github profile/i,
    );
    expect(message(parseGitHub("github.com"))).toMatch(/github profile/i);
    expect(message(parseGitHub("@"))).toMatch(/github profile/i);
    expect(message(parseGitHub("-octocat"))).toMatch(/github profile/i);
    expect(message(parseGitHub("octocat-"))).toMatch(/github profile/i);
    expect(message(parseGitHub("octo cat"))).toMatch(/spaces/i);
    expect(message(parseGitHub("octocat/repo"))).toMatch(/github profile/i);
    expect(message(parseGitHub("https://github.com/octocat?tab=repos"))).toMatch(
      /github profile/i,
    );
    expect(message(parseGitHub("https://user@github.com/octocat"))).toMatch(
      /github profile/i,
    );
  });

  it("enforces the 39 character handle limit", () => {
    expect(value(parseGitHub("a".repeat(39)))).toBe(
      `https://github.com/${"a".repeat(39)}`,
    );
    expect(message(parseGitHub("a".repeat(40)))).toMatch(/github profile/i);
  });
});

describe("parseLinkedIn", () => {
  it("accepts slugs and profile URLs", () => {
    expect(value(parseLinkedIn("john-doe"))).toBe(
      "https://www.linkedin.com/in/john-doe",
    );
    expect(value(parseLinkedIn("in/john-doe"))).toBe(
      "https://www.linkedin.com/in/john-doe",
    );
    expect(value(parseLinkedIn("linkedin.com/in/john-doe"))).toBe(
      "https://www.linkedin.com/in/john-doe",
    );
    expect(value(parseLinkedIn("https://www.linkedin.com/in/john-doe/"))).toBe(
      "https://www.linkedin.com/in/john-doe",
    );
    expect(value(parseLinkedIn("https://linkedin.com/in/John_Doe-1"))).toBe(
      "https://www.linkedin.com/in/John_Doe-1",
    );
  });

  it("treats blank input as null", () => {
    expect(value(parseLinkedIn(""))).toBeNull();
    expect(value(parseLinkedIn("  "))).toBeNull();
  });

  it("rejects other hosts, paths and invalid slugs", () => {
    expect(message(parseLinkedIn("https://example.com/in/john-doe"))).toMatch(
      /linkedin profile/i,
    );
    expect(
      message(parseLinkedIn("https://www.linkedin.com/company/acme")),
    ).toMatch(/linkedin profile/i);
    expect(
      message(parseLinkedIn("https://www.linkedin.com/in/john-doe/extra")),
    ).toMatch(/linkedin profile/i);
    expect(
      message(parseLinkedIn("https://www.linkedin.com/in/john-doe?x=1")),
    ).toMatch(/linkedin profile/i);
    expect(message(parseLinkedIn("https://user@linkedin.com/in/john-doe"))).toMatch(
      /linkedin profile/i,
    );
    expect(message(parseLinkedIn("in/"))).toMatch(/linkedin profile/i);
    expect(message(parseLinkedIn("a"))).toMatch(/linkedin profile/i);
    expect(message(parseLinkedIn("john doe"))).toMatch(/spaces/i);
  });

  it("enforces the 100 character slug limit", () => {
    expect(value(parseLinkedIn("a".repeat(100)))).toBe(
      `https://www.linkedin.com/in/${"a".repeat(100)}`,
    );
    expect(message(parseLinkedIn("a".repeat(101)))).toMatch(
      /linkedin profile/i,
    );
  });
});

describe("parseProfileLink", () => {
  it("routes to the right parser", () => {
    expect(value(parseProfileLink("website", "example.com"))).toBe(
      "https://example.com",
    );
    expect(value(parseProfileLink("github", "@octocat"))).toBe(
      "https://github.com/octocat",
    );
    expect(value(parseProfileLink("linkedin", "in/john-doe"))).toBe(
      "https://www.linkedin.com/in/john-doe",
    );
  });
});

describe("profileSchema links", () => {
  it("normalizes valid links and keeps blank ones null", () => {
    const parsed = profileSchema.parse({
      displayName: "Ada Lovelace",
      website: "example.com/",
      github: "@octocat",
      linkedin: "",
    });
    expect(parsed.website).toBe("https://example.com");
    expect(parsed.github).toBe("https://github.com/octocat");
    expect(parsed.linkedin).toBeNull();
  });

  it("leaves links undefined when omitted", () => {
    const parsed = profileSchema.parse({ displayName: "Ada Lovelace" });
    expect(parsed.website).toBeUndefined();
    expect(parsed.github).toBeUndefined();
    expect(parsed.linkedin).toBeUndefined();
  });

  it("reports the field path for invalid links", () => {
    const result = profileSchema.safeParse({
      displayName: "Ada Lovelace",
      github: "https://gitlab.com/octocat",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues[0];
      expect(issue?.path).toEqual(["github"]);
      expect(issue?.message).toMatch(/github profile/i);
    }
  });
});
