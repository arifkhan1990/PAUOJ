const MAX_HREF_LENGTH = 500;
/** C0/C1 controls plus DEL: never valid in a stored in-app path. */
const CONTROL_CHARS = /[\u0000-\u001f\u007f-\u009f]/;

/**
 * Shared same-origin path rule for links that may be stored by admins or
 * rendered from notification/broadcast rows. Anything that could leave the
 * site (`//host`, `https:`, `\`) or smuggle control characters is rejected.
 */
export function safeInternalHref(href: string | null): string | null {
  if (!href) return null;
  if (href.length > MAX_HREF_LENGTH) return null;
  if (!href.startsWith("/") || href.startsWith("//")) return null;
  if (href.includes("\\")) return null;
  if (CONTROL_CHARS.test(href)) return null;
  if (href !== href.trimStart()) return null;
  return href;
}
