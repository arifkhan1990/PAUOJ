import { describe, expect, it } from "vitest";
import {
  buildAssessmentInviteEmail,
  buildNotificationEmail,
  buildPasswordResetEmail,
  buildReviewDigestEmail,
  buildVerificationEmail,
} from "./mail";
import { sanitizeSubject } from "./mail-template";

const APP_URL = "https://oj.primeasia.edu.bd";
const SHELL_MARKER = 'data-pauoj-email="v1"';

const BRAND_PATHS = [
  "/brand/pauoj-mark.png",
  "/brand/social/facebook.png",
  "/brand/social/x.png",
  "/brand/social/linkedin.png",
  "/brand/social/github.png",
];

/** Counts URL occurrences that are neither an href value nor visible link text. */
function unstyledUrlOccurrences(html: string, url: string): number {
  const total = html.split(url).length - 1;
  const inHref = html.split(`href="${url}"`).length - 1;
  const asLinkText = html.split(`>${url}</a>`).length - 1;
  return total - inHref - asLinkText;
}

/** Asserts only the five same-origin brand images are present. */
function expectSameOriginBrandImages(html: string, origin: string) {
  const tags = html.match(/<img\b[^>]*>/g) ?? [];
  const srcs = tags.map((tag) => /src="([^"]+)"/.exec(tag)?.[1] ?? "");

  expect(srcs).toHaveLength(BRAND_PATHS.length);
  expect(srcs.map((src) => new URL(src).pathname)).toEqual(BRAND_PATHS);
  for (const src of srcs) {
    expect(new URL(src).origin).toBe(origin);
  }
  for (const tag of tags) {
    expect(tag).toContain('border="0"');
    expect(tag).toContain("display:block");
  }
  expect(html).not.toContain("data:");
  expect(html.split('href="#"').length - 1).toBe(4);
}

function expectEmailSafeHtml(html: string, origin: string) {
  expect(html).toContain(SHELL_MARKER);
  expect(html).toContain('role="presentation"');
  expect(html).toContain("max-width:600px");
  expect(html).toContain("@media only screen and (max-width:599px)");
  expect(html).toContain("@media (prefers-color-scheme: dark)");
  expect(html).toContain('<meta name="color-scheme" content="light dark">');
  expect(html).not.toContain("display:flex");
  expect(html).not.toContain("display:grid");
  expect(html).not.toContain("<script");
  expect(html).not.toContain("<link");
  expectSameOriginBrandImages(html, origin);
}

const INVITE_URL = "http://localhost:3000/assessments/midterm/invite/raw-token-123";

function build(overrides: Partial<Parameters<typeof buildAssessmentInviteEmail>[0]> = {}) {
  return buildAssessmentInviteEmail({
    candidateName: "Md. Rakib Hasan",
    assessmentTitle: "CSE-3B Midterm",
    startAt: "2026-11-21T10:00:00.000Z",
    endAt: "2026-11-21T12:00:00.000Z",
    durationMinutes: 60,
    url: INVITE_URL,
    ...overrides,
  });
}

describe("buildAssessmentInviteEmail", () => {
  it("puts the assessment title in the subject and the personal link in the body", () => {
    const email = build();

    expect(email.subject).toBe("Assessment invite: CSE-3B Midterm");
    expect(email.text).toContain(INVITE_URL);
    expect(email.html).toContain(INVITE_URL);
    expect(email.text).toContain("This link is personal; do not forward it.");
    expect(email.html).toContain("This link is personal; do not forward it.");
  });

  it("shows the UTC window and the duration", () => {
    const email = build();

    expect(email.text).toContain(
      "Window: 21 Nov 2026, 10:00 UTC to 21 Nov 2026, 12:00 UTC",
    );
    expect(email.text).toContain("Duration: 60 minutes");
  });

  it("falls back to the full window when no duration is set", () => {
    const email = build({ durationMinutes: null });

    expect(email.text).toContain("Duration: the full window");
    expect(email.html).toContain("Duration: the full window");
  });

  it("escapes the candidate name and title in the HTML body", () => {
    const email = build({
      candidateName: 'Rakib <b onclick="x">',
      assessmentTitle: "Midterm <script>alert(1)</script>",
    });

    expect(email.html).toContain("Rakib &lt;b onclick=&quot;x&quot;&gt;");
    expect(email.html).toContain(
      "Midterm &lt;script&gt;alert(1)&lt;/script&gt;",
    );
    expect(email.html).not.toContain("<script>");
    expect(email.html).not.toContain('onclick="x"');
  });

  it("never carries an access code, a candidate ref, or the token in the subject", () => {
    const email = build();
    const subject = email.subject.toLowerCase();

    expect(subject).not.toContain("raw-token-123");
    expect(subject).not.toContain("accesscode");
    expect(subject).not.toContain("candidate_ref");
    expect(email.text).not.toMatch(/access code/i);
    expect(email.text).not.toContain("candidate_ref");
    expect(email.html).not.toMatch(/access code/i);
    expect(email.html).not.toContain("candidate_ref");
  });

  it("greets the candidate by name", () => {
    expect(build().text.startsWith("Hi Md. Rakib Hasan,")).toBe(true);
    expect(build({ candidateName: null }).text.startsWith("Hi there,")).toBe(
      true,
    );
  });

  it("renders the invite inside the shared shell with a badge and fallback link", () => {
    const email = build();

    expectEmailSafeHtml(email.html, "http://localhost:3000");
    expect(email.html).toContain("ASSESSMENT INVITE");
    expect(email.html).toContain("You have an assessment invite");
    expect(email.html).toContain("BUTTON NOT WORKING?");
    expect(email.html).toContain("word-break:break-all");
    expect(email.html).toContain("Open assessment");
    expect(email.html).not.toContain("data-pauoj-preheader=\"1\" style=\"display:block");
  });

  it("derives the footer app link from the invite URL origin", () => {
    const email = build();

    expect(email.html).toContain('href="http://localhost:3000"');
    expect(email.html).toContain(">Open PAU OJ</a>");
  });

  it("wraps long personal links without leaving an unstyled URL", () => {
    const longUrl = `${APP_URL}/assessments/cse-3b-midterm/invite/${"z".repeat(200)}`;
    const email = build({ url: longUrl });

    expect(unstyledUrlOccurrences(email.html, longUrl)).toBe(0);
    expect(email.html).toContain("word-break:break-all");
    expect(Buffer.byteLength(email.html, "utf8")).toBeLessThan(30_000);
  });
});

describe("buildVerificationEmail", () => {
  const token = "tok-123";
  const url = `${APP_URL}/verify-email?token=${token}`;

  function buildVerification(
    overrides: Partial<Parameters<typeof buildVerificationEmail>[0]> = {},
  ) {
    return buildVerificationEmail({
      displayName: "Md. Rakib Hasan",
      token,
      appUrl: `${APP_URL}/`,
      ...overrides,
    });
  }

  it("uses the shared shell, badge, preheader and expiry note", () => {
    const email = buildVerification();

    expectEmailSafeHtml(email.html, APP_URL);
    expect(email.subject).toBe("Verify your PAU OJ email");
    expect(email.html).toContain("ACCOUNT SECURITY");
    expect(email.html).toContain("data-pauoj-preheader");
    expect(email.html).toContain("This link expires in 24 hours");
    expect(email.html).toContain(
      "If you didn't create a PAU OJ account, you can safely ignore this email.",
    );
    expect(email.html).toContain(`href="${APP_URL}"`);
    expect(email.text).toContain(url);
    expect(email.text).toContain("This link expires in 24 hours.");
    expect(email.text).toContain("PrimeAsia University Online Judge");
  });

  it("renders the CTA and fallback box with no raw unstyled URL", () => {
    const email = buildVerification();

    expect(email.html).toContain(">Verify email</a>");
    expect(email.html).toContain("BUTTON NOT WORKING?");
    expect(email.html).toContain("word-break:break-all");
    expect(unstyledUrlOccurrences(email.html, url)).toBe(0);
    expect(email.html.split(url).length - 1).toBe(3);
  });

  it("escapes the display name in the heading and greeting", () => {
    const email = buildVerification({
      displayName: 'Rakib <img src=x onerror="alert(1)">',
    });

    expectEmailSafeHtml(email.html, APP_URL);
    expect(email.html).toContain("Rakib &lt;img src=x onerror=&quot;alert(1)&quot;&gt;");
    expect(email.html).not.toContain("<img src=x");
    expect(email.html).not.toContain('onerror="alert(1)"');
    expect(email.subject).not.toContain("img");
  });

  it("keeps long tokens wrapped and the email under 30KB", () => {
    const longToken = "x".repeat(240);
    const longUrl = `${APP_URL}/verify-email?token=${longToken}`;
    const email = buildVerification({ token: longToken });

    expect(unstyledUrlOccurrences(email.html, longUrl)).toBe(0);
    expect(email.html).toContain("word-break:break-all");
    expect(Buffer.byteLength(email.html, "utf8")).toBeLessThan(30_000);
    expect(email.subject).not.toContain(longToken);
  });
});

describe("buildPasswordResetEmail", () => {
  const url = `${APP_URL}/reset-password?token=reset-1`;

  it("uses the shared shell, badge, expiry note and fallback link", () => {
    const email = buildPasswordResetEmail({
      displayName: "Md. Rakib Hasan",
      token: "reset-1",
      appUrl: APP_URL,
    });

    expectEmailSafeHtml(email.html, APP_URL);
    expect(email.subject).toBe("Reset your PAU OJ password");
    expect(email.html).toContain("PASSWORD RESET");
    expect(email.html).toContain("Password reset");
    expect(email.html).toContain("This link expires in 1 hour");
    expect(email.html).toContain(">Choose a new password</a>");
    expect(email.html).toContain("BUTTON NOT WORKING?");
    expect(unstyledUrlOccurrences(email.html, url)).toBe(0);
    expect(email.text).toContain(url);
  });

  it("escapes the display name", () => {
    const email = buildPasswordResetEmail({
      displayName: "<b>Rakib</b>",
      token: "reset-1",
      appUrl: APP_URL,
    });

    expect(email.html).toContain("&lt;b&gt;Rakib&lt;/b&gt;");
    expect(email.html).not.toContain("<b>Rakib</b>");
  });
});

describe("buildReviewDigestEmail", () => {
  const input = {
    displayName: "Reviewer",
    items: [{ title: "Two sum <script>", body: "Please review & approve." }],
    href: `${APP_URL}/review/queue`,
    unsubscribeUrl: `${APP_URL}/unsubscribe?token=u&scope=reviews`,
  };

  it("uses the shared shell with a review badge and unsubscribe link", () => {
    const email = buildReviewDigestEmail(input);

    expectEmailSafeHtml(email.html, APP_URL);
    expect(email.html).toContain("REVIEW QUEUE");
    expect(email.html).toContain("1 review request is waiting");
    expect(email.html).toContain("Two sum &lt;script&gt;");
    expect(email.html).toContain("Please review &amp; approve.");
    expect(email.html).toContain(">Open review queue</a>");
    expect(email.html).toContain("BUTTON NOT WORKING?");
    expect(email.html).toContain(
      `href="${APP_URL}/unsubscribe?token=u&amp;scope=reviews"`,
    );
    expect(email.html).toContain(
      "You received this because review email notifications are enabled on PAU OJ.",
    );
    expect(email.text).toContain("Manage email preferences or unsubscribe");
  });

  it("handles multiple items and keeps the count in the subject", () => {
    const email = buildReviewDigestEmail({
      ...input,
      items: [input.items[0], { title: "Second", body: "And another." }],
    });

    expect(email.subject).toBe("2 review requests are waiting");
    expect(email.text).toContain("2. Second");
  });
});

describe("buildNotificationEmail", () => {
  const input = {
    displayName: "Md. Rakib Hasan",
    subject: "New reply on your thread",
    message: "Someone replied to your discussion <b>post</b>.",
    href: `${APP_URL}/community/threads/1`,
    unsubscribeUrl: `${APP_URL}/unsubscribe?token=n1&scope=all`,
  };

  it("uses the shared shell, CTA, fallback and footer note", () => {
    const email = buildNotificationEmail(input);

    expectEmailSafeHtml(email.html, APP_URL);
    expect(email.subject).toBe(input.subject);
    expect(email.html).toContain("NOTIFICATION");
    expect(email.html).toContain("Someone replied to your discussion &lt;b&gt;post&lt;/b&gt;.");
    expect(email.html).toContain(">Open PAU OJ</a>");
    expect(email.html).toContain("BUTTON NOT WORKING?");
    expect(email.html).toContain(
      "You received this because email notifications are enabled on PAU OJ.",
    );
    expect(email.text).toContain(input.href);
    expect(email.text).toContain("Manage email preferences or unsubscribe");
    expect(email.text.startsWith("Hi Md. Rakib Hasan,\n\nSomeone replied")).toBe(true);
    expect(email.subject).not.toContain("token");
  });

  it("escapes query separators in links exactly once", () => {
    const href = `${APP_URL}/community/threads/1?tab=replies&page=2`;
    const email = buildNotificationEmail({ ...input, href });

    expect(email.html).toContain(`href="${href.replace("&", "&amp;")}"`);
    expect(email.html).not.toContain("&amp;amp;");
  });

  it("folds a CRLF notification subject and leaves normal subjects untouched", () => {
    const injected = buildNotificationEmail({
      ...input,
      subject: "New reply on your thread\r\nBcc: victim@example.com",
    });
    const sent = sanitizeSubject(injected.subject);

    expect(sent).toBe("New reply on your thread Bcc: victim@example.com");
    expect(sent).not.toMatch(/[\r\n]/);
    // Builders keep their raw value; sendMail sanitises centrally.
    expect(injected.subject).toBe("New reply on your thread\r\nBcc: victim@example.com");
    expect(sanitizeSubject(input.subject)).toBe(input.subject);
  });

  it("exposes dark-mode hooks for the body copy and unsubscribe row", () => {
    const email = buildNotificationEmail(input);

    expect(email.html).toContain('class="pauoj-muted pauoj-rule"');
    expect(email.html).toContain('class="pauoj-link"');
  });

  it("omits the CTA and app link when no href is provided", () => {
    const email = buildNotificationEmail({ ...input, href: null });

    expect(email.html).not.toContain(">Open PAU OJ</a>");
    expect(email.html).not.toContain("BUTTON NOT WORKING?");
    expectEmailSafeHtml(email.html, APP_URL);
    // Brand assets still resolve from the absolute unsubscribe URL.
    expect(email.html).toContain(`src="${APP_URL}/brand/pauoj-mark.png"`);
    expect(email.html).toContain(`src="${APP_URL}/brand/social/github.png"`);
  });

  it("does not leak the unsubscribe token into the hidden preheader", () => {
    const email = buildNotificationEmail(input);
    const preheader = email.html.slice(
      email.html.indexOf("data-pauoj-preheader"),
      email.html.indexOf("</div>", email.html.indexOf("data-pauoj-preheader")),
    );

    expect(preheader).toContain("Someone replied to your discussion");
    expect(preheader).not.toContain("n1");
    expect(preheader).not.toContain("unsubscribe");
  });
});
