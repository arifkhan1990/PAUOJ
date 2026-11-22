import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

const FALLBACK_IMAGE_ALT = "Image";

const HEADING_ANCHOR_CLASS =
  "scroll-mt-[calc(var(--lesson-header-bottom,0px)_+_1rem)]";

/** Same id scheme as `extractMarkdownHeadings`: prefix + 1-based source line. */
function headingIdFromNode(
  prefix: string | undefined,
  node: unknown,
): string | undefined {
  if (!prefix) return undefined;
  const start = (
    node as { position?: { start?: { line?: number } } } | undefined
  )?.position?.start;
  return typeof start?.line === "number" ? `${prefix}-${start.line}` : undefined;
}

export function Markdown({
  children,
  className,
  lang,
  headingIdPrefix,
}: {
  children: string;
  className?: string;
  lang?: string;
  headingIdPrefix?: string;
}) {
  return (
    <div className={cn("prose-pauoj", className)} lang={lang}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h2: ({ node, children: headingChildren, ...props }) => {
            const id = headingIdFromNode(headingIdPrefix, node);
            return (
              <h2
                {...props}
                id={id}
                className={cn(id ? HEADING_ANCHOR_CLASS : undefined, props.className)}
              >
                {headingChildren}
              </h2>
            );
          },
          h3: ({ node, children: headingChildren, ...props }) => {
            const id = headingIdFromNode(headingIdPrefix, node);
            return (
              <h3
                {...props}
                id={id}
                className={cn(id ? HEADING_ANCHOR_CLASS : undefined, props.className)}
              >
                {headingChildren}
              </h3>
            );
          },
          a: ({ href, children: linkChildren, ...props }) => {
            const external = href?.startsWith("http");
            return (
              <a
                href={href}
                target={external ? "_blank" : undefined}
                rel={external ? "noreferrer noopener" : undefined}
                {...props}
              >
                {linkChildren}
              </a>
            );
          },
          img: ({ alt, ...props }) => {
            if (!props.src) return null;
            return (
              // eslint-disable-next-line @next/next/no-img-element -- Markdown images point at arbitrary remote hosts, so next/image cannot be configured for them.
              <img
                {...props}
                alt={alt?.trim() || FALLBACK_IMAGE_ALT}
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
              />
            );
          },
          table: ({ children: tableChildren, ...props }) => (
            <div className="overflow-x-auto">
              <table {...props}>{tableChildren}</table>
            </div>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
