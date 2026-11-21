/**
 * Shared transactional-email shell and primitives.
 *
 * Email-client constraints:
 * - Table layout only (no flex/grid), inline styles for clients.
 * - One small <style> block for the mobile + dark-mode media queries; no
 *   external CSS. Inline light styles stay the default, so clients that drop
 *   <style> (or Outlook, which ignores media queries) still render correctly.
 * - No images, web fonts or JavaScript, so the mail survives image blocking.
 * - `body` passed to the shell is trusted, pre-escaped HTML built by callers.
 * - Known Outlook limitation: wrapped in conditional VML a rounded CTA would
 *   be possible, but the extra markup risks other clients and dark overrides,
 *   so Outlook shows square corners on the CTA and keeps the light palette.
 * - Gmail preheader: the hidden div is first in <body> with zero-width filler
 *   so the inbox preview picks it up; this stays best-effort per client.
 */

const FONT = "'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

const COLOR = {
  page: "#eef3f0",
  card: "#ffffff",
  border: "#dbe5df",
  ink: "#0f172a",
  body: "#475569",
  muted: "#64748b",
  teal: "#0f766e",
  soft: "#f7faf8",
  softBorder: "#e3ebe6",
  header: "#0b1f1a",
  wordmark: "#ffffff",
  eyebrow: "#7fb3a4",
  badgeBg: "#eaf4f0",
  badgeBorder: "#cfe6df",
  badgeText: "#0f5f58",
} as const;

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/** Folds CR/LF out of a subject so header injection cannot split the line. */
export function sanitizeSubject(value: string): string {
  return value.replace(/[\r\n]+/g, " ").trim();
}

/** Returns the http(s) origin of an absolute URL, or null when it cannot be parsed. */
export function appOriginFromUrl(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.origin;
  } catch {
    return null;
  }
}

/** Normalises an app URL for footer links; keeps unparseable values as-is. */
export function footerAppUrl(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  return appOriginFromUrl(trimmed) ?? trimmed;
}

const TEXT_FOOTER =
  "PrimeAsia University Online Judge\nThis is a transactional email about your account.";

/** Appends the plain-text counterpart of the HTML footer. */
export function withTextFooter(body: string): string {
  return `${body}\n\n--\n${TEXT_FOOTER}`;
}

/** Flattens a message into a short, token-free inbox preview line. */
export function toPreheader(message: string, max = 140): string {
  const flat = message.replace(/\s+/g, " ").trim();
  return flat.length > max ? `${flat.slice(0, max - 3)}…` : flat;
}

export type EmailShellInput = {
  /** Heading and document title. Escaped by the shell. */
  title: string;
  /** Trusted, already-escaped HTML for the card body. */
  body: string;
  /** Small uppercase pill above the heading, e.g. "ACCOUNT SECURITY". */
  badge?: string;
  /** Hidden inbox preview text. Escaped by the shell. */
  preheader?: string;
  /** Absolute app URL used for the "Open PAU OJ" footer link. */
  appUrl?: string | null;
  /** Extra muted line in the footer. Escaped by the shell. */
  footerNote?: string;
};

function badgeMarkup(label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 14px">
            <tr>
              <td class="pauoj-badge" bgcolor="${COLOR.badgeBg}" style="background:${COLOR.badgeBg};border:1px solid ${COLOR.badgeBorder};border-radius:999px;padding:5px 10px;font:700 10px/1.2 ${FONT};letter-spacing:0.1em;text-transform:uppercase;color:${COLOR.badgeText}">${escapeHtml(label)}</td>
            </tr>
          </table>`;
}

function footerMarkup(input: EmailShellInput): string {
  const href = input.appUrl ? input.appUrl.trim().replace(/\/+$/, "") : "";
  const appLink = href
    ? `<div style="margin-top:10px"><a class="pauoj-link" href="${escapeHtml(href)}" target="_blank" rel="noopener" style="font:600 12px/1.5 ${FONT};color:${COLOR.teal};text-decoration:none">Open PAU OJ</a></div>`
    : "";
  const note = input.footerNote
    ? `<div class="pauoj-muted" style="margin-top:4px;font:400 12px/1.6 ${FONT};color:${COLOR.muted}">${escapeHtml(input.footerNote)}</div>`
    : "";

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="pauoj-footerbox" bgcolor="${COLOR.soft}" style="width:100%;background:${COLOR.soft};border-top:1px solid ${COLOR.border}">
            <tr>
              <td class="pauoj-footer" style="padding:20px 24px;font-family:${FONT}">
                <div class="pauoj-footer-name" style="font:600 12px/1.5 ${FONT};color:#334155">PrimeAsia University Online Judge</div>
                <div class="pauoj-muted" style="margin-top:2px;font:400 12px/1.6 ${FONT};color:${COLOR.muted}">This is a transactional email about your account.</div>
                ${note}
                ${appLink}
              </td>
            </tr>
          </table>`;
}

export function renderEmailShell(input: EmailShellInput): string {
  const preheader = input.preheader
    ? `<div aria-hidden="true" data-pauoj-preheader="1" style="display:none;max-height:0;max-width:0;overflow:hidden;opacity:0;mso-hide:all;font-size:1px;line-height:1px;color:${COLOR.page}">${escapeHtml(input.preheader)}${"&nbsp;&zwnj;".repeat(16)}</div>`
    : "";

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>${escapeHtml(input.title)}</title>
<style>
  :root { color-scheme: light dark; }
  @media only screen and (max-width:599px) {
    .pauoj-shell { padding: 16px 12px !important; }
    .pauoj-header { padding: 18px 20px 20px !important; }
    .pauoj-card { padding: 22px 20px 24px !important; }
    .pauoj-h1 { font-size: 22px !important; line-height: 1.3 !important; }
    .pauoj-cta { width: 100% !important; }
    .pauoj-cta a { display: block !important; padding: 15px 18px !important; text-align: center !important; }
    .pauoj-footer { padding: 18px 20px !important; }
  }
  @media (prefers-color-scheme: dark) {
    body.pauoj-page { background:#0b1411 !important; color:#cbd5e1 !important; }
    .pauoj-page { background:#0b1411 !important; }
    .pauoj-header { background:#071310 !important; }
    .pauoj-card-box { background:#111c18 !important; border-color:#23342d !important; }
    .pauoj-h1, .pauoj-ink { color:#f1f5f9 !important; }
    .pauoj-body { color:#cbd5e1 !important; }
    .pauoj-muted { color:#94a3b8 !important; }
    .pauoj-rule { border-top-color:#23342d !important; }
    .pauoj-badge { background:#12312b !important; border-color:#1f4a40 !important; color:#8fd8c8 !important; }
    .pauoj-softbox { background:#0f1a16 !important; border-color:#23342d !important; }
    .pauoj-footerbox { background:#0d1714 !important; border-top-color:#23342d !important; }
    .pauoj-footer-name { color:#e2e8f0 !important; }
    .pauoj-link { color:#5eead4 !important; }
    .pauoj-cta td { background:#14b8a6 !important; }
    .pauoj-cta a { color:#04211c !important; }
  }
</style>
</head>
<body class="pauoj-page" data-pauoj-email="v1" style="margin:0;padding:0;width:100%;background:${COLOR.page};font-family:${FONT};color:${COLOR.body};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%">
${preheader}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="pauoj-page" bgcolor="${COLOR.page}" style="width:100%;background:${COLOR.page}">
  <tr>
    <td align="center" class="pauoj-shell" style="padding:28px 16px">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px">

        <tr>
          <td bgcolor="${COLOR.header}" class="pauoj-header" style="background:${COLOR.header};padding:20px 24px 22px;border-radius:14px 14px 0 0">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td height="4" bgcolor="${COLOR.teal}" style="height:4px;line-height:4px;font-size:0;background:${COLOR.teal};border-radius:999px">&nbsp;</td>
              </tr>
              <tr>
                <td style="padding-top:18px">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td width="42" height="42" align="center" valign="middle" bgcolor="${COLOR.teal}" style="width:42px;height:42px;background:${COLOR.teal};border-radius:11px;font:800 11px/1 ${FONT};letter-spacing:0.06em;color:#ffffff">PAU</td>
                      <td valign="middle" style="padding-left:12px">
                        <div style="font:700 17px/1.2 ${FONT};color:${COLOR.wordmark};letter-spacing:-0.01em">PAU OJ</div>
                        <div style="margin-top:3px;font:600 10px/1.3 ${FONT};letter-spacing:0.12em;text-transform:uppercase;color:${COLOR.eyebrow}">PrimeAsia University</div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <tr>
          <td style="padding:20px 0 0">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="pauoj-card-box" bgcolor="${COLOR.card}" style="width:100%;background:${COLOR.card};border:1px solid ${COLOR.border};border-radius:16px">
              <tr>
                <td class="pauoj-card" style="padding:32px 36px 34px;font-family:${FONT}">
                  ${input.badge ? badgeMarkup(input.badge) : ""}
                  <h1 class="pauoj-h1" style="margin:0 0 14px;font-size:26px;line-height:1.25;font-weight:700;color:${COLOR.ink};letter-spacing:-0.02em">${escapeHtml(input.title)}</h1>
                  <div class="pauoj-body" style="font-size:15px;line-height:1.7;color:${COLOR.body}">${input.body}</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <tr>
          <td style="padding:18px 0 0">${footerMarkup(input)}</td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

export function emailButton(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" class="pauoj-cta" style="margin:24px 0 0">
            <tr>
              <td align="center" bgcolor="${COLOR.teal}" style="background:${COLOR.teal};border-radius:10px">
                <a href="${escapeHtml(href)}" target="_blank" rel="noopener" style="display:inline-block;padding:14px 24px;font:700 15px/1.2 ${FONT};color:#ffffff;text-decoration:none;border-radius:10px">${escapeHtml(label)}</a>
              </td>
            </tr>
          </table>`;
}

export function fallbackLink(url: string): string {
  const href = escapeHtml(url);
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="pauoj-softbox" bgcolor="${COLOR.soft}" style="width:100%;margin:22px 0 0;background:${COLOR.soft};border:1px solid ${COLOR.softBorder};border-radius:8px">
            <tr>
              <td style="padding:12px 14px;font-family:${FONT}">
                <div class="pauoj-muted" style="font:700 10px/1.4 ${FONT};letter-spacing:0.1em;text-transform:uppercase;color:${COLOR.muted}">BUTTON NOT WORKING?</div>
                <div class="pauoj-muted" style="margin-top:6px;font-family:${FONT};font-size:12px;line-height:1.6;color:${COLOR.muted};word-break:break-all;overflow-wrap:anywhere"><a href="${href}" target="_blank" rel="noopener" class="pauoj-link" style="color:${COLOR.teal};text-decoration:none">${href}</a></div>
              </td>
            </tr>
          </table>`;
}
