import nodemailer, { type Transporter } from "nodemailer";
import { getEnv } from "@/server/env";
import { logger } from "@/server/logger";
import { formatDateTime } from "@/lib/utils";

type MailCache = {
  transporter: Transporter | null;
};

const globalForMail = globalThis as typeof globalThis & {
  __pauojMail?: MailCache;
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function createTransporter(): Transporter {
  const env = getEnv();
  if (!env.SMTP_HOST) {
    throw new Error("SMTP_HOST is not configured");
  }
  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: env.SMTP_USER
      ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD }
      : undefined,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  });
}

function getTransporter(): Transporter {
  if (!globalForMail.__pauojMail) {
    globalForMail.__pauojMail = { transporter: null };
  }
  if (!globalForMail.__pauojMail.transporter) {
    globalForMail.__pauojMail.transporter = createTransporter();
  }
  return globalForMail.__pauojMail.transporter;
}

async function sendMail(input: {
  to: string;
  subject: string;
  text: string;
  html: string;
}): Promise<boolean> {
  const env = getEnv();
  if (!env.SMTP_HOST) {
    if (env.NODE_ENV !== "production") {
      logger.info("Email not sent (SMTP not configured); development fallback", {
        to: input.to,
        subject: input.subject,
        // Never log the body: verification, reset and invite mails carry
        // single-use tokens in their URLs.
        body: "[omitted]",
      });
    } else {
      logger.error("Email not sent: SMTP is not configured", {
        subject: input.subject,
      });
    }
    return false;
  }
  try {
    await getTransporter().sendMail({
      from: env.MAIL_FROM,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
    });
    return true;
  } catch (error) {
    logger.error("Email delivery failed", {
      subject: input.subject,
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

function shell(title: string, body: string): string {
  return `<!doctype html><html><body style="margin:0;background:#f6f7f4;font-family:system-ui,Segoe UI,Arial,sans-serif;color:#101613">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px">
    <div style="display:inline-flex;align-items:center;gap:10px;margin-bottom:24px">
      <span style="display:inline-grid;place-items:center;width:36px;height:36px;border-radius:10px;background:#0f766e;color:#fff;font:700 10px monospace">PAU</span>
      <strong style="font-size:15px">PAU OJ</strong>
    </div>
    <div style="background:#fff;border:1px solid #dfe4de;border-radius:12px;padding:28px">
      <h1 style="margin:0 0 14px;font-size:22px;line-height:1.25">${title}</h1>
      ${body}
    </div>
    <p style="margin:18px 0 0;font-size:11px;line-height:1.6;color:#65736a">PrimeAsia University Online Judge. If you did not request this email, you can ignore it.</p>
  </div>
  </body></html>`;
}

function button(href: string, label: string): string {
  return `<p style="margin:24px 0"><a href="${href}" style="display:inline-block;background:#0f766e;color:#fff;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:600;font-size:14px">${label}</a></p>`;
}

export type AssessmentInviteEmailInput = {
  candidateName: string | null;
  assessmentTitle: string;
  startAt: Date | string;
  endAt: Date | string;
  durationMinutes: number | null;
  url: string;
};

/**
 * Pure template builder: no SMTP, no env. The caller supplies the personal
 * URL, so the raw token never reaches this module's logs.
 */
export function buildAssessmentInviteEmail(input: AssessmentInviteEmailInput): {
  subject: string;
  text: string;
  html: string;
} {
  const greetingName = input.candidateName?.trim() || "there";
  const window = `${formatDateTime(input.startAt)} to ${formatDateTime(input.endAt)}`;
  const duration = input.durationMinutes
    ? `${input.durationMinutes} minutes`
    : "the full window";
  // Header-injection guard: subject values must not contain CR/LF.
  const safeTitle = input.assessmentTitle.replace(/[\r\n]+/g, " ").trim();
  const subject = `Assessment invite: ${safeTitle}`;
  const title = escapeHtml(safeTitle);
  const link = escapeHtml(input.url);

  const text = [
    `Hi ${greetingName},`,
    "",
    "You have been invited to an assessment on PAU OJ.",
    "",
    `Assessment: ${input.assessmentTitle}`,
    `Window: ${window}`,
    `Duration: ${duration}`,
    "",
    "Open your personal link:",
    input.url,
    "",
    "This link is personal; do not forward it.",
  ].join("\n");

  const html = shell(
    "You have an assessment invite",
    `<p style="margin:0;color:#4d5b52;font-size:14px;line-height:1.7">Hi ${escapeHtml(greetingName)},</p>
     <p style="margin:12px 0 0;color:#4d5b52;font-size:14px;line-height:1.7">You have been invited to an assessment on PAU OJ.</p>
     <p style="margin:12px 0 0;color:#4d5b52;font-size:14px;line-height:1.7"><strong>${title}</strong><br>Window: ${window}<br>Duration: ${duration}</p>
     ${button(link, "Open assessment")}
     <p style="margin:0;color:#65736a;font-size:12px;line-height:1.6">This link is personal; do not forward it. If the button does not work, copy this URL:<br><span style="word-break:break-all">${link}</span></p>`,
  );

  return { subject, text, html };
}

export async function sendAssessmentInviteEmail(
  input: AssessmentInviteEmailInput & { to: string },
): Promise<boolean> {
  const { subject, text, html } = buildAssessmentInviteEmail(input);
  return sendMail({ to: input.to, subject, text, html });
}

export async function sendVerificationEmail(input: {
  to: string;
  displayName: string;
  token: string;
}): Promise<boolean> {
  const env = getEnv();
  const url = `${env.APP_URL.replace(/\/$/, "")}/verify-email?token=${encodeURIComponent(input.token)}`;
  const name = escapeHtml(input.displayName);
  return sendMail({
    to: input.to,
    subject: "Verify your PAU OJ email",
    text: `Hi ${input.displayName},\n\nVerify your email for PAU OJ:\n${url}\n\nThis link expires in 24 hours.`,
    html: shell(
      `Welcome, ${name}`,
      `<p style="margin:0;color:#4d5b52;font-size:14px;line-height:1.7">Confirm your email address to secure your account and receive password-reset links.</p>
       ${button(url, "Verify email")}
       <p style="margin:0;color:#65736a;font-size:12px;line-height:1.6">This link expires in 24 hours. If the button does not work, copy this URL:<br><span style="word-break:break-all">${url}</span></p>`,
    ),
  });
}

export async function sendPasswordResetEmail(input: {
  to: string;
  displayName: string;
  token: string;
}): Promise<boolean> {
  const env = getEnv();
  const url = `${env.APP_URL.replace(/\/$/, "")}/reset-password?token=${encodeURIComponent(input.token)}`;
  const name = escapeHtml(input.displayName);
  return sendMail({
    to: input.to,
    subject: "Reset your PAU OJ password",
    text: `Hi ${input.displayName},\n\nReset your PAU OJ password:\n${url}\n\nThis link expires in 1 hour. If you did not request it, ignore this email.`,
    html: shell(
      `Password reset`,
      `<p style="margin:0;color:#4d5b52;font-size:14px;line-height:1.7">Hi ${name}, we received a request to reset your PAU OJ password.</p>
       ${button(url, "Choose a new password")}
       <p style="margin:0;color:#65736a;font-size:12px;line-height:1.6">This link expires in 1 hour. If you did not request it, ignore this email and your password will stay the same.</p>`,
    ),
  });
}

export async function sendReviewDigestEmail(input: {
  to: string;
  displayName: string;
  items: { title: string; body: string }[];
  href: string;
  unsubscribeUrl: string;
}): Promise<boolean> {
  const name = escapeHtml(input.displayName);
  const count = input.items.length;
  const heading =
    count === 1 ? "1 review request is waiting" : `${count} review requests are waiting`;
  const listHtml = input.items
    .map(
      (item) =>
        `<li style="margin:0 0 14px"><strong style="display:block;font-size:14px">${escapeHtml(item.title)}</strong><span style="color:#4d5b52;font-size:13px;line-height:1.6">${escapeHtml(item.body)}</span></li>`,
    )
    .join("");
  const listText = input.items
    .map((item, index) => `${index + 1}. ${item.title}\n   ${item.body}`)
    .join("\n\n");
  return sendMail({
    to: input.to,
    subject: heading,
    text: `Hi ${input.displayName},\n\n${heading}:\n\n${listText}\n\nOpen your review queue: ${input.href}\n\nManage email preferences or unsubscribe: ${input.unsubscribeUrl}`,
    html: shell(
      heading,
      `<p style="margin:0;color:#4d5b52;font-size:14px;line-height:1.7">Hi ${name},</p>
       <ul style="margin:16px 0 0;padding-left:18px;color:#4d5b52">${listHtml}</ul>
       ${button(input.href, "Open review queue")}
       <p style="margin:24px 0 0;border-top:1px solid #dfe4de;padding-top:16px;color:#65736a;font-size:11px;line-height:1.6">
         You received this because review email notifications are enabled on PAU OJ.
         <a href="${escapeHtml(input.unsubscribeUrl)}" style="color:#0f766e">Unsubscribe</a>.
       </p>`,
    ),
  });
}

export async function sendNotificationEmail(input: {
  to: string;
  displayName: string;
  subject: string;
  message: string;
  href?: string | null;
  unsubscribeUrl: string;
}): Promise<boolean> {
  const name = escapeHtml(input.displayName);
  const message = escapeHtml(input.message);
  const link = input.href
    ? `<p style="margin:18px 0 0"><a href="${escapeHtml(input.href)}" style="color:#0f766e;font-size:14px">Open PAU OJ</a></p>`
    : "";
  return sendMail({
    to: input.to,
    subject: input.subject,
    text: `Hi ${input.displayName},\n\n${input.message}\n${input.href ? `\n${input.href}\n` : ""}\nManage email preferences or unsubscribe: ${input.unsubscribeUrl}`,
    html: shell(
      escapeHtml(input.subject),
      `<p style="margin:0;color:#4d5b52;font-size:14px;line-height:1.7">Hi ${name},</p>
       <p style="margin:12px 0 0;color:#4d5b52;font-size:14px;line-height:1.7">${message}</p>
       ${link}
       <p style="margin:24px 0 0;border-top:1px solid #dfe4de;padding-top:16px;color:#65736a;font-size:11px;line-height:1.6">
         You received this because email notifications are enabled on PAU OJ.
         <a href="${escapeHtml(input.unsubscribeUrl)}" style="color:#0f766e">Unsubscribe</a>.
       </p>`,
    ),
  });
}

