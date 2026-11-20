import { createHighlighter, type Highlighter } from "shiki";
import { getLanguage } from "@/lib/languages";

type ShikiCache = {
  highlighter: Highlighter | null;
  promise: Promise<Highlighter> | null;
};

const globalForShiki = globalThis as typeof globalThis & {
  __pauojShiki?: ShikiCache;
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

async function getHighlighter(): Promise<Highlighter> {
  if (!globalForShiki.__pauojShiki) {
    globalForShiki.__pauojShiki = { highlighter: null, promise: null };
  }
  const cache = globalForShiki.__pauojShiki;
  if (cache.highlighter) return cache.highlighter;
  if (!cache.promise) {
    cache.promise = createHighlighter({
      themes: ["github-dark-default"],
      langs: ["cpp", "c", "python", "java", "javascript", "plaintext"],
    });
  }
  cache.highlighter = await cache.promise;
  return cache.highlighter;
}

export async function highlightCode(
  code: string,
  language: string,
): Promise<string> {
  try {
    const highlighter = await getHighlighter();
    const shikiLang = getLanguage(language).shiki;
    return highlighter.codeToHtml(code, {
      lang: shikiLang,
      theme: "github-dark-default",
    });
  } catch {
    return `<pre class="shiki"><code>${escapeHtml(code)}</code></pre>`;
  }
}
