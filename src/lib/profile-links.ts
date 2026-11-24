const MAX_LINK_LENGTH = 200;

const WEBSITE_MESSAGE =
  "Enter a valid website URL, for example https://example.com.";
const GITHUB_MESSAGE =
  "Enter a GitHub profile such as github.com/octocat or @octocat.";
const LINKEDIN_MESSAGE =
  "Enter a LinkedIn profile such as linkedin.com/in/your-name.";

const GITHUB_HANDLE = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/;
const LINKEDIN_SLUG = /^[A-Za-z0-9_-]{2,100}$/;
const SCHEME_WITH_SLASHES = /^[a-z][a-z0-9+.-]*:\/\//i;
const ANY_SCHEME = /^[a-z][a-z0-9+.-]*:/i;
const HOST_WITH_PORT = /^[a-z][a-z0-9+.-]*:\d+(\/|$)/i;

export type ProfileLinkField = "website" | "github" | "linkedin";

export type ProfileLinkParse =
  | { ok: true; value: string | null }
  | { ok: false; message: string };

const EMPTY: ProfileLinkParse = { ok: true, value: null };

function fail(message: string): ProfileLinkParse {
  return { ok: false, message };
}

function unsafeCharacters(value: string): string | null {
  if (/\s/.test(value)) return "Links cannot contain spaces.";
  if (/[\\\u0000-\u001F\u007F]/.test(value)) {
    return "Links contain characters that are not allowed.";
  }
  return null;
}

function tooLong(value: string, label: string): ProfileLinkParse | null {
  if (value.length <= MAX_LINK_LENGTH) return null;
  return fail(`${label} must be at most ${MAX_LINK_LENGTH} characters.`);
}

function serialize(url: URL): string {
  const path = url.pathname === "/" ? "" : url.pathname.replace(/\/$/, "");
  return `${url.protocol}//${url.host}${path}${url.search}${url.hash}`;
}

/**
 * Accepts a full http(s) URL or a bare host with an optional path.
 * Returns null when the value is blank or malformed/scheme-unsafe.
 */
export function parseWebsite(raw: string): ProfileLinkParse {
  const value = raw.trim();
  if (value === "") return EMPTY;

  const unsafe = unsafeCharacters(value);
  if (unsafe) return fail(unsafe);
  const lengthProblem = tooLong(value, "Website");
  if (lengthProblem) return lengthProblem;

  const hasScheme = SCHEME_WITH_SLASHES.test(value);
  const looksLikeScheme = ANY_SCHEME.test(value) && !HOST_WITH_PORT.test(value);
  if (!hasScheme && looksLikeScheme) {
    return fail("Website must start with http:// or https://.");
  }

  let url: URL;
  try {
    url = new URL(hasScheme ? value : `https://${value}`);
  } catch {
    return fail(WEBSITE_MESSAGE);
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return fail("Website must start with http:// or https://.");
  }
  if (url.username || url.password) {
    return fail("Website cannot include a username or password.");
  }
  if (
    !url.hostname.includes(".") ||
    url.hostname.startsWith(".") ||
    url.hostname.endsWith(".")
  ) {
    return fail(WEBSITE_MESSAGE);
  }

  const normalized = serialize(url);
  if (normalized.length > MAX_LINK_LENGTH) {
    return fail(`Website must be at most ${MAX_LINK_LENGTH} characters.`);
  }
  return { ok: true, value: normalized };
}

type ParsedParts = { host: string; segments: string[] };

function parseParts(value: string): ParsedParts | null {
  const candidate = SCHEME_WITH_SLASHES.test(value) ? value : `https://${value}`;
  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  if (url.username || url.password) return null;
  if (url.search || url.hash) return null;
  const segments = url.pathname.split("/").filter((part) => part.length > 0);
  return { host: url.hostname.toLowerCase(), segments };
}

function githubHandle(value: string): string | null {
  if (value.startsWith("@")) return value.slice(1);
  const isHostStyle =
    SCHEME_WITH_SLASHES.test(value) || /^(www\.)?github\.com\//i.test(value);
  if (!isHostStyle) return value.includes("/") ? null : value;

  const parts = parseParts(value);
  if (!parts) return null;
  if (parts.host !== "github.com" && parts.host !== "www.github.com") {
    return null;
  }
  return parts.segments.length === 1 ? parts.segments[0]! : null;
}

export function parseGitHub(raw: string): ProfileLinkParse {
  const value = raw.trim();
  if (value === "") return EMPTY;

  const unsafe = unsafeCharacters(value);
  if (unsafe) return fail(unsafe);
  const lengthProblem = tooLong(value, "GitHub link");
  if (lengthProblem) return lengthProblem;

  const handle = githubHandle(value);
  if (!handle || !GITHUB_HANDLE.test(handle)) return fail(GITHUB_MESSAGE);
  return { ok: true, value: `https://github.com/${handle}` };
}

function linkedinSlug(value: string): string | null {
  const isHostStyle =
    SCHEME_WITH_SLASHES.test(value) || /^(www\.)?linkedin\.com\//i.test(value);
  if (isHostStyle) {
    const parts = parseParts(value);
    if (!parts) return null;
    if (parts.host !== "linkedin.com" && parts.host !== "www.linkedin.com") {
      return null;
    }
    if (parts.segments.length !== 2) return null;
    if (parts.segments[0]!.toLowerCase() !== "in") return null;
    return parts.segments[1]!;
  }
  if (/^in\//i.test(value)) return value.slice(3);
  return value.includes("/") ? null : value;
}

export function parseLinkedIn(raw: string): ProfileLinkParse {
  const value = raw.trim();
  if (value === "") return EMPTY;

  const unsafe = unsafeCharacters(value);
  if (unsafe) return fail(unsafe);
  const lengthProblem = tooLong(value, "LinkedIn link");
  if (lengthProblem) return lengthProblem;

  const slug = linkedinSlug(value);
  if (!slug || !LINKEDIN_SLUG.test(slug)) return fail(LINKEDIN_MESSAGE);
  return { ok: true, value: `https://www.linkedin.com/in/${slug}` };
}

export function parseProfileLink(
  field: ProfileLinkField,
  raw: string,
): ProfileLinkParse {
  if (field === "website") return parseWebsite(raw);
  if (field === "github") return parseGitHub(raw);
  return parseLinkedIn(raw);
}
