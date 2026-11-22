export type LessonOutlineHeading = {
  id: string;
  label: string;
  level: 2 | 3;
};

const HEADING_RE = /^(#{2,3})[ \t]+(.+?)[ \t]*#*[ \t]*$/;
const FENCE_RE = /^ {0,3}(`{3,}|~{3,})/;
const INDENTED_CODE_RE = /^( {4,}|\t)/;

/** Strips the common inline Markdown syntax so a heading can label a nav item. */
function stripInline(text: string): string {
  return text
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Reads the `##`/`###` headings of a Markdown note in document order.
 * Ids are derived from the 1-based source line, so they are deterministic and
 * collision-free without a slugger dependency; `Markdown` uses the same scheme.
 */
export function extractMarkdownHeadings(
  markdown: string,
  prefix: string,
): LessonOutlineHeading[] {
  const headings: LessonOutlineHeading[] = [];
  let fence: string | null = null;
  let inComment = false;

  markdown.split(/\r?\n/).forEach((line, index) => {
    const trimmed = line.trim();

    if (inComment) {
      if (trimmed.includes("-->")) inComment = false;
      return;
    }
    if (trimmed.startsWith("<!--")) {
      if (!trimmed.includes("-->")) inComment = true;
      return;
    }

    const fenceMatch = line.match(FENCE_RE);
    if (fence) {
      if (
        fenceMatch &&
        fenceMatch[1][0] === fence[0] &&
        fenceMatch[1].length >= fence.length
      ) {
        fence = null;
      }
      return;
    }
    if (fenceMatch) {
      fence = fenceMatch[1];
      return;
    }

    if (INDENTED_CODE_RE.test(line)) return;

    const match = line.match(HEADING_RE);
    if (!match) return;
    const label = stripInline(match[2]);
    if (!label) return;

    headings.push({
      id: `${prefix}-${index + 1}`,
      label,
      level: match[1].length === 2 ? 2 : 3,
    });
  });

  return headings;
}
