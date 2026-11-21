import nodemailer, { type Transporter } from "nodemailer";
import { getEnv } from "@/server/env";
import { logger } from "@/server/logger";
import { formatDateTime } from "@/lib/utils";
import {
  emailButton,
  escapeHtml,
  fallbackLink,
  footerAppUrl,
  renderEmailShell,
  sanitizeSubject,
  toPreheader,
  withTextFooter,
} from "@/server/mail-template";

type MailCache = {
  transporter: Transporter | null;
};

const globalForMail = globalThis as typeof globalThis & {
  __pauojMail?: MailCache;
};

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
  // Single choke point: fold the subject before it reaches the SMTP header.
  const subject = sanitizeSubject(input.subject);
  if (!env.SMTP_HOST) {
    if (env.NODE_ENV !== "production") {
      logger.info("Email not sent (SMTP not configured); development fallback", {
        to: input.to,
        subject,
        // Never log the body: verification, reset and invite mails carry
        // single-use tokens in their URLs.
        body: "[omitted]",
      });
    } else {
      logger.error("Email not sent: SMTP is not configured", {
        subject,
      });
    }
    return false;
  }
  try {
    await getTransporter().sendMail({
      from: env.MAIL_FROM,
      to: input.to,
      subject,
      text: input.text,
      html: input.html,
    });
    return true;
  } catch (error) {
    logger.error("Email delivery failed", {
      subject,
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

export type VerificationEmailInput = {
  displayName: string;
  token: string;
  appUrl: string;
};

/** Pure builder so the rendered HTML can be tested without SMTP or env. */
export function buildVerificationEmail(input: VerificationEmailInput): {
  subject: string;
  text: string;
  html: string;
} {
  const base = input.appUrl.replace(/\/$/, "");
  const url = `${base}/verify-email?token=${encodeURIComponent(input.token)}`;
  const name = escapeHtml(input.displayName);

  const text = withTextFooter(`Hi ${input.displayName},

Verify your email for PAU OJ:
${url}

This link expires in 24 hours. If you didn't create a PAU OJ account, you can safely ignore this email.`);

  const body = `<p style="margin:0">Hi ${name},</p>
        <p style="margin:12px 0 0">Confirm your email address to secure your account and receive password-reset links.</p>
        ${emailButton(url, "Verify email")}
        ${fallbackLink(url)}
        <p class="pauoj-muted" style="margin:20px 0 0;font-size:13px;line-height:1.65;color:#64748b">This link expires in 24 hours. If you didn't create a PAU OJ account, you can safely ignore this email.</p>`;

  const html = renderEmailShell({
    title: `Welcome, ${input.displayName}`,
    badge: "ACCOUNT SECURITY",
    preheader: "Confirm your email address to activate your PAU OJ account.",
    appUrl: footerAppUrl(input.appUrl),
    body,
  });

  return { subject: "Verify your PAU OJ email", text, html };
}

export async function sendVerificationEmail(input: {
  to: string;
  displayName: string;
  token: string;
}): Promise<boolean> {
  const env = getEnv();
  return sendMail({
    to: input.to,
    ...buildVerificationEmail({ ...input, appUrl: env.APP_URL }),
  });
}

export type PasswordResetEmailInput = {
  displayName: string;
  token: string;
  appUrl: string;
};

/** Pure builder so the rendered HTML can be tested without SMTP or env. */
export function buildPasswordResetEmail(input: PasswordResetEmailInput): {
  subject: string;
  text: string;
  html: string;
} {
  const base = input.appUrl.replace(/\/$/, "");
  const url = `${base}/reset-password?token=${encodeURIComponent(input.token)}`;
  const name = escapeHtml(input.displayName);

  const text = withTextFooter(`Hi ${input.displayName},

Reset your PAU OJ password:
${url}

This link expires in 1 hour. If you did not request it, ignore this email and your password will stay the same.`);

  const body = `<p style="margin:0">Hi ${name}, we received a request to reset your PAU OJ password.</p>
        ${emailButton(url, "Choose a new password")}
        ${fallbackLink(url)}
        <p class="pauoj-muted" style="margin:20px 0 0;font-size:13px;line-height:1.65;color:#64748b">This link expires in 1 hour. If you did not request it, ignore this email and your password will stay the same.</p>`;

  const html = renderEmailShell({
    title: "Password reset",
    badge: "PASSWORD RESET",
    preheader: "Choose a new password for your PAU OJ account. The link expires in 1 hour.",
    appUrl: footerAppUrl(input.appUrl),
    body,
  });

  return { subject: "Reset your PAU OJ password", text, html };
}

export async function sendPasswordResetEmail(input: {
  to: string;
  displayName: string;
  token: string;
}): Promise<boolean> {
  const env = getEnv();
  return sendMail({
    to: input.to,
    ...buildPasswordResetEmail({ ...input, appUrl: env.APP_URL }),
  });
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

  const text = withTextFooter(`Hi ${greetingName},

You have been invited to an assessment on PAU OJ.

Assessment: ${input.assessmentTitle}
Window: ${window}
Duration: ${duration}

Open your personal link:
${input.url}

This link is personal; do not forward it.`);

  const body = `<p style="margin:0">Hi ${escapeHtml(greetingName)},</p>
        <p style="margin:12px 0 0">You have been invited to an assessment on PAU OJ.</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="pauoj-softbox" bgcolor="#f7faf8" style="width:100%;margin:18px 0 0;background:#f7faf8;border:1px solid #e3ebe6;border-radius:8px">
          <tr>
            <td class="pauoj-body" style="padding:14px 16px;font-size:14px;line-height:1.7;color:#475569">
              <strong class="pauoj-ink" style="color:#0f172a">${title}</strong><br>
              Window: ${escapeHtml(window)}<br>
              Duration: ${escapeHtml(duration)}
            </td>
          </tr>
        </table>
        ${emailButton(input.url, "Open assessment")}
        ${fallbackLink(input.url)}
        <p class="pauoj-muted" style="margin:20px 0 0;font-size:13px;line-height:1.65;color:#64748b">This link is personal; do not forward it.</p>`;

  const html = renderEmailShell({
    title: "You have an assessment invite",
    badge: "ASSESSMENT INVITE",
    preheader: `Your assessment window for ${safeTitle} is ready.`,
    appUrl: footerAppUrl(input.url),
    body,
  });

  return { subject, text, html };
}

export async function sendAssessmentInviteEmail(
  input: AssessmentInviteEmailInput & { to: string },
): Promise<boolean> {
  const { subject, text, html } = buildAssessmentInviteEmail(input);
  return sendMail({ to: input.to, subject, text, html });
}

export type ReviewDigestEmailInput = {
  displayName: string;
  items: { title: string; body: string }[];
  href: string;
  unsubscribeUrl: string;
};

export function buildReviewDigestEmail(input: ReviewDigestEmailInput): {
  subject: string;
  text: string;
  html: string;
} {
  const name = escapeHtml(input.displayName);
  const count = input.items.length;
  const heading =
    count === 1
      ? "1 review request is waiting"
      : `${count} review requests are waiting`;
  const unsubscribe = escapeHtml(input.unsubscribeUrl);
  const listHtml = input.items
    .map(
      (item) =>
        `<li style="margin:0 0 14px"><strong class="pauoj-ink" style="display:block;font-size:14px;color:#0f172a">${escapeHtml(item.title)}</strong><span class="pauoj-body" style="font-size:13px;line-height:1.6;color:#475569">${escapeHtml(item.body)}</span></li>`,
    )
    .join("");
  const listText = input.items
    .map((item, index) => `${index + 1}. ${item.title}\n   ${item.body}`)
    .join("\n\n");

  const text = withTextFooter(`Hi ${input.displayName},

${heading}:

${listText}

Open your review queue: ${input.href}

Manage email preferences or unsubscribe: ${input.unsubscribeUrl}`);

  const body = `<p style="margin:0">Hi ${name},</p>
        <ul class="pauoj-body" style="margin:16px 0 0;padding-left:18px;color:#475569">${listHtml}</ul>
        ${emailButton(input.href, "Open review queue")}
        ${fallbackLink(input.href)}
        <p class="pauoj-muted pauoj-rule" style="margin:22px 0 0;border-top:1px solid #dbe5df;padding-top:16px;font-size:12px;line-height:1.6;color:#64748b">
          <a class="pauoj-link" href="${unsubscribe}" target="_blank" rel="noopener" style="color:#0f766e;text-decoration:underline">Unsubscribe</a> from review emails.
        </p>`;

  const html = renderEmailShell({
    title: heading,
    badge: "REVIEW QUEUE",
    preheader: heading,
    appUrl: footerAppUrl(input.href),
    footerNote: "You received this because review email notifications are enabled on PAU OJ.",
    body,
  });

  return { subject: heading, text, html };
}

export async function sendReviewDigestEmail(input: {
  to: string;
  displayName: string;
  items: { title: string; body: string }[];
  href: string;
  unsubscribeUrl: string;
}): Promise<boolean> {
  const { subject, text, html } = buildReviewDigestEmail(input);
  return sendMail({ to: input.to, subject, text, html });
}

export type NotificationEmailInput = {
  displayName: string;
  subject: string;
  message: string;
  href?: string | null;
  unsubscribeUrl: string;
};

export function buildNotificationEmail(input: NotificationEmailInput): {
  subject: string;
  text: string;
  html: string;
} {
  const name = escapeHtml(input.displayName);
  const message = escapeHtml(input.message);
  const unsubscribe = escapeHtml(input.unsubscribeUrl);
  const href = input.href ?? null;
  const linkBlock = href
    ? `${emailButton(href, "Open PAU OJ")}
        ${fallbackLink(href)}`
    : "";

  const text = withTextFooter(`Hi ${input.displayName},

${input.message}
${input.href ? `\n${input.href}\n` : ""}
Manage email preferences or unsubscribe: ${input.unsubscribeUrl}`);

  const body = `<p style="margin:0">Hi ${name},</p>
        <p style="margin:12px 0 0">${message}</p>
        ${linkBlock}
        <p class="pauoj-muted pauoj-rule" style="margin:22px 0 0;border-top:1px solid #dbe5df;padding-top:16px;font-size:12px;line-height:1.6;color:#64748b">
          <a class="pauoj-link" href="${unsubscribe}" target="_blank" rel="noopener" style="color:#0f766e;text-decoration:underline">Unsubscribe</a> from these emails.
        </p>`;

  const html = renderEmailShell({
    title: input.subject,
    badge: "NOTIFICATION",
    preheader: toPreheader(input.message),
    appUrl: input.href ? footerAppUrl(input.href) : null,
    footerNote: "You received this because email notifications are enabled on PAU OJ.",
    body,
  });

  return { subject: input.subject, text, html };
}

export async function sendNotificationEmail(input: {
  to: string;
  displayName: string;
  subject: string;
  message: string;
  href?: string | null;
  unsubscribeUrl: string;
}): Promise<boolean> {
  const { subject, text, html } = buildNotificationEmail(input);
  return sendMail({ to: input.to, subject, text, html });
}
