import Image from "next/image";
import { ArrowLeftRight } from "lucide-react";
import { cn } from "@/lib/utils";

type ModuleDiagramProps = {
  src: string;
  alt: string;
  className?: string;
};

/**
 * Track concept-map diagram. The SVG keeps a light card background on
 * purpose so it reads as an inset panel in both themes; the border uses
 * the site token so the panel blends with dark mode. The scroll container
 * is focusable so keyboard users can pan the map on small screens.
 */
export function ModuleDiagram({ src, alt, className }: ModuleDiagramProps) {
  return (
    <figure
      className={cn(
        "overflow-hidden rounded-xl border bg-card shadow-xs",
        className,
      )}
    >
      <div
        role="region"
        aria-label={alt}
        tabIndex={0}
        className="overflow-x-auto bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      >
        <Image
          src={src}
          alt=""
          width={1200}
          height={320}
          unoptimized
          className="h-auto w-full min-w-[720px] max-w-full sm:min-w-0"
        />
      </div>
      <figcaption className="flex items-center gap-1.5 border-t border-border bg-muted/30 px-4 py-2 text-[11px] text-muted-foreground sm:hidden">
        <ArrowLeftRight className="size-3.5 shrink-0" aria-hidden="true" />
        Scroll the map sideways to see every topic
      </figcaption>
    </figure>
  );
}
