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
const APP_ORIGIN = "https://oj.primeasia.edu.bd";

const BRAND_SRCS = [
  `${APP_ORIGIN}/brand/pauoj-mark.png`,
  `${APP_ORIGIN}/brand/social/facebook.png`,
  `${APP_ORIGIN}/brand/social/x.png`,
  `${APP_ORIGIN}/brand/social/linkedin.png`,
  `${APP_ORIGIN}/brand/social/github.png`,
];

function imageTags(html: string): string[] {
  return html.match(/<img\b[^>]*>/g) ?? [];
}

function imageSrcs(html: string): string[] {
  return imageTags(html).map((tag) => /src="([^"]*)"/.exec(tag)?.[1] ?? "");
}

function socialAnchors(html: string): string[] {
  return html.match(/<a\b[^>]*href="#"[^>]*>/g) ?? [];
}

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

  it("renders the original mark in a light tile beside the wordmark", () => {
    const html = buildShell();

    expect(html).toContain("#0b1f1a");
    expect(html).toContain(
      `<img src="${APP_ORIGIN}/brand/pauoj-mark.png" width="30" height="31" alt="PAU OJ logo" border="0"`,
    );
    expect(html).toContain('class="pauoj-marktile"');
    expect(html).toContain("background:#ffffff;border-radius:12px");
    expect(html).not.toContain(">PAU</td>");
    expect(html).toContain("PAU OJ");
    expect(html).toContain("PrimeAsia University &middot; Online Judge");
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
    expect(html).toContain("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;");
    expect(html).not.toContain("<img src=x");
    expect(html).not.toContain('onclick="x"');
    // The injected <img> stays escaped; only the five brand images render.
    expect(imageTags(html)).toHaveLength(5);
  });

  it("renders exactly four social placeholders in Facebook, X, LinkedIn, GitHub order", () => {
    const html = buildShell();

    expect(html).toContain('class="pauoj-socials"');
    expect(socialAnchors(html)).toHaveLength(4);
    for (const anchor of socialAnchors(html)) {
      expect(anchor).toContain('title="');
      expect(anchor).toContain('aria-label="');
      expect(anchor).not.toContain("target=");
      expect(anchor).not.toContain("rel=");
    }

    expect(imageSrcs(html)).toEqual(BRAND_SRCS);
    for (const [index, network] of ["Facebook", "X", "LinkedIn", "GitHub"].entries()) {
      const src = BRAND_SRCS[index + 1];
      expect(html).toContain(
        `<img class="pauoj-social-icon" src="${src}" width="32" height="32" alt="${network}" border="0"`,
      );
      expect(html).toContain(`aria-label="${network}"`);
    }
    // 10px spacer cells separate the icons; no flex or grid.
    expect(html.split('width="10" height="32"').length - 1).toBe(3);
  });

  it("resolves brand images from assetBaseUrl when no app URL is available", () => {
    const html = buildShell({ appUrl: null, assetBaseUrl: "https://judge.example.edu/path" });

    expect(imageSrcs(html)).toEqual([
      "https://judge.example.edu/brand/pauoj-mark.png",
      "https://judge.example.edu/brand/social/facebook.png",
      "https://judge.example.edu/brand/social/x.png",
      "https://judge.example.edu/brand/social/linkedin.png",
      "https://judge.example.edu/brand/social/github.png",
    ]);
  });

  it("falls back to a text mark when no trustworthy origin exists", () => {
    const html = buildShell({ appUrl: null });

    expect(html).not.toContain("<img");
    expect(html).not.toContain("/brand/");
    expect(html).not.toContain('class="pauoj-socials"');
    expect(html).toContain(">PAU</td>");
    expect(html).toContain("PAU OJ");
    expect(html).not.toContain(">Open PAU OJ</a>");
  });

  it("renders only same-origin brand images with no scripts, flex, grid or data URIs", () => {
    const html = buildShell();

    expect(html).not.toContain("display:flex");
    expect(html).not.toContain("display:grid");
    expect(html).not.toContain("<link");
    expect(html).not.toContain("<script");
    expect(html).not.toContain("@import");
    expect(html).not.toContain("url(");
    expect(html).not.toContain("data:");

    expect(imageSrcs(html)).toEqual(BRAND_SRCS);
    for (const tag of imageTags(html)) {
      expect(tag).toContain('border="0"');
      expect(tag).toContain("display:block");
      expect(tag).toContain('alt="');
    }
    for (const src of imageSrcs(html)) {
      expect(new URL(src).origin).toBe(APP_ORIGIN);
      expect(BRAND_SRCS).toContain(src);
    }
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
