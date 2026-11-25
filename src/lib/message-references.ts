/**
 * Message references are the entity links a person can insert from the
 * composer suggestion drawer (`@contest`, `@problem`, `@learn`). They travel
 * as plain text so messages stay portable:
 *
 *   @[PAU Cup 2026](/contests/pau-cup-2026)
 *
 * Rendering is allow-listed to the three internal sections, so a typed link can
 * never become an off-site URL or a script. Keep this module free of React and
 * server imports: both the API and the chat UI use it.
 */

export type MessageReferenceKind = "contest" | "problem" | "learn";

export const MESSAGE_REFERENCE_KINDS: readonly MessageReferenceKind[] = [
  "contest",
  "problem",
  "learn",
];

export type MessageReference = {
  kind: MessageReferenceKind;
  label: string;
  href: string;
};

export type MessageBodySegment =
  | { type: "text"; text: string }
  | { type: "reference"; reference: MessageReference };

export const REFERENCE_LABEL_MAX_LENGTH = 120;

const REFERENCE_TOKEN = /@\[([^\]\r\n]{1,120})\]\((\/[A-Za-z0-9][A-Za-z0-9/_-]*)\)/g;

const CONTEST_PREFIX = "/contests/";
const PROBLEM_PREFIX = "/problems/";
const LEARN_PREFIX = "/learn/";

const SEGMENT_PATTERN = /^[a-z0-9][a-z0-9_-]*$/i;

/** Splits a path into validated segments, rejecting traversal or queries. */
function pathSegments(href: string, prefix: string): string[] | null {
  if (!href.startsWith(prefix)) return null;
  if (href.includes("//") || href.includes("..") || href.includes("?")) {
    return null;
  }
  if (href.includes("#") || href.includes("\\") || /\s/.test(href)) return null;
  const segments = href.slice(prefix.length).split("/");
  if (segments.some((segment) => !SEGMENT_PATTERN.test(segment))) return null;
  return segments;
}

/** The reference kind for an internal path, or null when it is not allowed. */
export function messageReferenceKind(
  href: string,
): MessageReferenceKind | null {
  const contest = pathSegments(href, CONTEST_PREFIX);
  if (contest?.length === 1) return "contest";
  const problem = pathSegments(href, PROBLEM_PREFIX);
  if (problem?.length === 1) return "problem";
  const learn = pathSegments(href, LEARN_PREFIX);
  if (learn && learn.length >= 1 && learn.length <= 2) return "learn";
  return null;
}

/** Collapses anything that could break the token into a single-line label. */
export function normalizeReferenceLabel(label: string): string {
  return Array.from(
    label
      .replace(/[\\[\]()\r\n\t]+/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  )
    .slice(0, REFERENCE_LABEL_MAX_LENGTH)
    .join("")
    .trim();
}

/**
 * Builds the token inserted into the composer. Returns null when the path is
 * outside the allow-list or the label is empty after normalisation.
 */
export function formatMessageReference(input: {
  label: string;
  href: string;
}): string | null {
  if (!messageReferenceKind(input.href)) return null;
  const label = normalizeReferenceLabel(input.label);
  if (!label) return null;
  return `@[${label}](${input.href})`;
}

/**
 * Splits a message body into text and renderable references. Unknown or
 * malformed tokens stay literal text, so older messages never lose content.
 */
export function parseMessageReferences(body: string): MessageBodySegment[] {
  const segments: MessageBodySegment[] = [];
  let cursor = 0;

  for (const match of body.matchAll(REFERENCE_TOKEN)) {
    const index = match.index ?? 0;
    const href = match[2] ?? "";
    const kind = messageReferenceKind(href);
    if (!kind) continue;
    const label = normalizeReferenceLabel(match[1] ?? "");
    if (!label) continue;

    if (index > cursor) {
      segments.push({ type: "text", text: body.slice(cursor, index) });
    }
    segments.push({
      type: "reference",
      reference: { kind, label, href },
    });
    cursor = index + match[0].length;
  }

  if (cursor < body.length) {
    segments.push({ type: "text", text: body.slice(cursor) });
  }
  if (segments.length === 0) {
    return [{ type: "text", text: body }];
  }
  return segments;
}

/** Readable one-line form used by inbox previews and notification bodies. */
export function messageReferencePreview(body: string): string {
  return parseMessageReferences(body)
    .map((segment) =>
      segment.type === "text" ? segment.text : `@${segment.reference.label}`,
    )
    .join("");
}

/** True when the body contains at least one valid reference token. */
export function hasMessageReference(body: string): boolean {
  return parseMessageReferences(body).some(
    (segment) => segment.type === "reference",
  );
}
