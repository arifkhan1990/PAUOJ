import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ProfileSocialLinks } from "./profile-social-links";

type Props = {
  website: string | null;
  github: string | null;
  linkedin: string | null;
};

const empty: Props = { website: null, github: null, linkedin: null };

function render(props: Props) {
  return renderToStaticMarkup(createElement(ProfileSocialLinks, props));
}

describe("ProfileSocialLinks", () => {
  it("renders nothing when every link is empty", () => {
    expect(render(empty)).toBe("");
  });

  it("drops malformed or unsafe values instead of linking them", () => {
    const html = render({
      website: "javascript:alert(1)",
      github: "not a handle",
      linkedin: "https://evil.example/in/someone",
    });

    expect(html).toBe("");
  });

  it("links each populated profile with a safe target and rel", () => {
    const html = render({
      website: "https://arif.dev",
      github: "octocat",
      linkedin: "https://www.linkedin.com/in/your-name",
    });

    expect((html.match(/<a /g) ?? []).length).toBe(3);
    expect((html.match(/target="_blank"/g) ?? []).length).toBe(3);
    expect(
      (html.match(/rel="me ugc nofollow noopener noreferrer"/g) ?? []).length,
    ).toBe(3);
    expect(html).not.toContain('target="_self"');
  });

  it("uses normalized hrefs for websites, handles and profile URLs", () => {
    const html = render({
      website: "arif.dev",
      github: "@octocat",
      linkedin: "your-name",
    });

    expect(html).toContain('href="https://arif.dev"');
    expect(html).toContain('href="https://github.com/octocat"');
    expect(html).toContain('href="https://www.linkedin.com/in/your-name"');
  });

  it("gives every link an accessible name that mentions the new tab", () => {
    const html = render({
      website: "https://www.arif.dev",
      github: "octocat",
      linkedin: "your-name",
    });

    expect(html).toContain(
      'aria-label="arif.dev website (opens in a new tab)"',
    );
    expect(html).toContain('aria-label="GitHub profile (opens in a new tab)"');
    expect(html).toContain(
      'aria-label="LinkedIn profile (opens in a new tab)"',
    );
  });

  it("renders only the populated profiles", () => {
    const html = render({ website: null, github: "octocat", linkedin: null });

    expect((html.match(/<a /g) ?? []).length).toBe(1);
    expect(html).toContain(">GitHub</span>");
    expect(html).not.toContain("LinkedIn");
    expect(html).not.toContain("website");
  });
});
