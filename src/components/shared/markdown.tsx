import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

const FALLBACK_IMAGE_ALT = "Image";

export function Markdown({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  return (
    <div className={cn("prose-pauoj", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
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
