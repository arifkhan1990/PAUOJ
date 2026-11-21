import { describe, expect, it } from "vitest";
import {
  appOriginFromUrl,
  emailButton,
  escapeHtml,
  fallbackLink,
  renderEmailShell,
} from "./mail-template";

const LONG_URL = `https://oj.primeasia.edu.bd/verify-email?token=${"a".repeat(180)}`;

function buildShell(overrides: Partial<Parameters<typeof renderEmailShell>[0]> = {}) {
  return renderEmailShell({
    title: "Welcome, Rakib",
    badge: "ACCOUNT SECURITY",
    preheader: "Confirm your email address to activate your PAU OJ account.",
    appUrl: "https://oj.primeasia.edu.bd/",
    body: '<p style="margin:0">Body copy</p>',
    ...overrides,
  });
}

describe("renderEmailShell", () => {
  it("renders a single-column, 600px, table-based shell", () => {
    const html = buildShell();

    expect(html).toContain("<html lang=\"en\"");
    expect(html).toContain('width="600"');
    expect(html).toContain("max-width:600px");
    expect(html).toContain('role="presentation"');
    expect(html).toContain('cellpadding="0"');
    expect(html).toContain('cellspacing="0"');
    expect(html).toContain("background:#eef3f0");
    expect(html).toContain("@media only screen and (max-width:600px)");
    expect(html).toContain("data-pauoj-email=\"v1\"");
  });

  it("hides the preheader text at the top of the email", () => {
    const html = buildShell();

    expect(html).toContain("data-pauoj-preheader");
    expect(html).toContain("display:none");
    expect(html).toContain("max-height:0");
    expect(html).toContain("Confirm your email address to activate your PAU OJ account.");
    expect(html).not.toContain("mso-hide:all;display:block");
  });

  it("includes the dark brand header, monogram, wordmark and teal accent", () => {
    const html = buildShell();

    expect(html).toContain("#0b1f1a");
    expect(html).toContain(">PAU</td>");
    expect(html).toContain("PAU OJ");
    expect(html).toContain("PrimeAsia University");
    expect(html).toContain("#0f766e");
    expect(html).toContain("height:4px");
  });

  it("renders the badge, heading, body, footer and optional app link", () => {
    const html = buildShell({ footerNote: "You received this because notifications are on." });

    expect(html).toContain("ACCOUNT SECURITY");
    expect(html).toContain("border-radius:999px");
    expect(html).toContain('font-size:26px');
    expect(html).toContain("Body copy");
    expect(html).toContain("PrimeAsia University Online Judge");
    expect(html).toContain("This is a transactional email about your account.");
    expect(html).toContain("You received this because notifications are on.");
    expect(html).toContain('href="https://oj.primeasia.edu.bd"');
    expect(html).toContain(">Open PAU OJ</a>");
  });

  it("omits the footer app link when no app URL is available", () => {
    const html = buildShell({ appUrl: null });

    expect(html).not.toContain(">Open PAU OJ</a>");
  });

  it("escapes every display value it interpolates", () => {
    const html = buildShell({
      title: 'Hi <b onclick="x">there</b>',
      badge: "ACCOUNT <SECURITY>",
      preheader: "Preview <script>alert(1)</script>",
      footerNote: 'Note <img src=x onerror="alert(1)">',
    });

    expect(html).toContain("Hi &lt;b onclick=&quot;x&quot;&gt;there&lt;/b&gt;");
    expect(html).toContain("ACCOUNT &lt;SECURITY&gt;");
    expect(html).toContain("Preview &lt;script&gt;alert(1)&lt;/script&gt;");
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<img");
    expect(html).not.toContain('onclick="x"');
  });

  it("uses no flex, grid, external CSS, scripts or images", () => {
    const html = buildShell();

    expect(html).not.toContain("display:flex");
    expect(html).not.toContain("display:grid");
    expect(html).not.toContain("<link");
    expect(html).not.toContain("<script");
    expect(html).not.toContain("<img");
    expect(html).not.toContain("@import");
    expect(html).not.toContain("url(");
  });

  it("keeps at least 1:1 text contrast for the body copy", () => {
    const html = buildShell();

    expect(html).toContain("color:#475569");
    expect(html).toContain("color:#0f172a");
  });
});

describe("emailButton", () => {
  it("renders a table-based teal CTA that opens in a new tab", () => {
    const html = emailButton("https://oj.primeasia.edu.bd/verify?token=a&b=1", "Verify email");

    expect(html).toContain('role="presentation"');
    expect(html).toContain("background:#0f766e");
    expect(html).toContain("target=\"_blank\"");
    expect(html).toContain("rel=\"noopener\"");
    expect(html).toContain("padding:14px 24px");
    expect(html).toContain("border-radius:10px");
    expect(html).toContain(">Verify email</a>");
    expect(html).toContain("href=\"https://oj.primeasia.edu.bd/verify?token=a&amp;b=1\"");
    expect(html).not.toContain("display:flex");
  });

  it("escapes the label", () => {
    expect(emailButton("https://example.com", "<b>Go</b>")).toContain("&lt;b&gt;Go&lt;/b&gt;");
  });
});

describe("fallbackLink", () => {
  it("renders a muted box with a wrapping, styled URL", () => {
    const html = fallbackLink(LONG_URL);

    expect(html).toContain("BUTTON NOT WORKING?");
    expect(html).toContain("word-break:break-all");
    expect(html).toContain("font-size:12px");
    expect(html).toContain(`>${LONG_URL}</a>`);
    expect(html).toContain('target="_blank"');
    expect(html).toContain("color:#0f766e");
    expect(html).not.toContain("display:flex");
  });

  it("escapes query separators in both the href and the visible URL", () => {
    const html = fallbackLink("https://example.com/reset?token=a&next=<x>");

    expect(html).toContain("token=a&amp;next=&lt;x&gt;");
    expect(html).not.toContain("next=<x>");
  });
});

describe("appOriginFromUrl", () => {
  it("returns the origin for absolute http(s) URLs", () => {
    expect(appOriginFromUrl("https://oj.primeasia.edu.bd/assessments/a")).toBe(
      "https://oj.primeasia.edu.bd",
    );
  });

  it("returns null for relative or non-web URLs", () => {
    expect(appOriginFromUrl("/assessments/a")).toBeNull();
    expect(appOriginFromUrl("mailto:help@primeasia.edu.bd")).toBeNull();
    expect(appOriginFromUrl("not a url")).toBeNull();
  });
});

describe("escapeHtml", () => {
  it("escapes the five HTML-significant characters", () => {
    expect(escapeHtml(`<>&"'`)).toBe("&lt;&gt;&amp;&quot;&#39;");
  });
});
