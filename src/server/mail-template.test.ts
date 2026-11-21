import { describe, expect, it } from "vitest";
import {
  appOriginFromUrl,
  emailButton,
  escapeHtml,
  fallbackLink,
  renderEmailShell,
  sanitizeSubject,
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
    expect(html).toContain("@media only screen and (max-width:599px)");
    expect(html).not.toContain("@media only screen and (max-width:600px)");
    expect(html).toContain("data-pauoj-email=\"v1\"");
  });

  it("keeps the inline CTA at exactly 600px and only collapses below it", () => {
    const html = buildShell();

    // 600px still matches the fixed-width desktop table, so the mobile rules
    // (full-width CTA) must not fire there; 599px and down do.
    expect(html).toContain("max-width:600px");
    expect(html.split("max-width:599px").length - 1).toBe(1);
    expect(html).toContain(".pauoj-cta { width: 100% !important; }");
  });

  it("declares light and dark support and ships a dark-mode shell block", () => {
    const html = buildShell({
      body: `${emailButton("https://oj.primeasia.edu.bd/verify", "Verify email")}${fallbackLink("https://oj.primeasia.edu.bd/verify")}`,
    });

    expect(html).toContain('<meta name="color-scheme" content="light dark">');
    expect(html).toContain('<meta name="supported-color-schemes" content="light dark">');
    expect(html).toContain("@media (prefers-color-scheme: dark)");
    // Inline light styles stay the default.
    expect(html).toContain("background:#ffffff");
    expect(html).toContain("color:#0f172a");
    // Every component the dark block themes is reachable through a class hook.
    for (const hook of [
      "pauoj-page",
      "pauoj-header",
      "pauoj-card-box",
      "pauoj-h1",
      "pauoj-body",
      "pauoj-muted",
      "pauoj-badge",
      "pauoj-softbox",
      "pauoj-footerbox",
      "pauoj-footer-name",
      "pauoj-link",
      "pauoj-cta",
    ]) {
      expect(html).toContain(`class="${hook}"`);
    }
    // Dark palette overrides are !important so they beat the inline defaults.
    expect(html).toContain("background:#0b1411 !important");
    expect(html).toContain("background:#111c18 !important");
    expect(html).toContain("color:#cbd5e1 !important");
    expect(html).toContain("background:#14b8a6 !important");
    expect(html).toContain("color:#04211c !important");
  });

  it("hides the preheader text at the top of the email", () => {
    const html = buildShell();

    expect(html).toContain("data-pauoj-preheader");
    expect(html).toContain("display:none");
    expect(html).toContain("max-height:0");
    expect(html).toContain('aria-hidden="true"');
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

describe("sanitizeSubject", () => {
  it("folds CRLF and lone newlines into a single space", () => {
    const subject = sanitizeSubject("Assessment invite: CSE-3B\r\nBcc: victim@example.com");
    expect(subject).toBe("Assessment invite: CSE-3B Bcc: victim@example.com");
    expect(subject).not.toMatch(/[\r\n]/);
  });

  it("trims surrounding whitespace but leaves normal subjects unchanged", () => {
    expect(sanitizeSubject("  Verify your PAU OJ email \n")).toBe("Verify your PAU OJ email");
    expect(sanitizeSubject("Assessment invite: CSE-3B Midterm")).toBe(
      "Assessment invite: CSE-3B Midterm",
    );
  });

  it("handles repeated and trailing line breaks", () => {
    expect(sanitizeSubject("Reset\n\r\n\r\npassword\r\n")).toBe("Reset password");
    expect(sanitizeSubject("\r\n")).toBe("");
  });
});
