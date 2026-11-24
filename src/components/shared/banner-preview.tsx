"use client";

import { useState } from "react";
import { ImageOff } from "lucide-react";
import { cn, safeHttpUrl } from "@/lib/utils";

/**
 * 16:5 banner frame. The aspect box is reserved before the image loads, so the
 * surrounding form never shifts, and a failed load falls back to a message
 * instead of a broken-image icon.
 */
export function BannerPreview({
  url,
  alt = "Contest banner preview",
  emptyLabel = "No banner set — the branded default banner is shown.",
  className,
}: {
  url: string | null | undefined;
  alt?: string;
  emptyLabel?: string;
  className?: string;
}) {
  const src = safeHttpUrl(url);
  const [brokenSrc, setBrokenSrc] = useState<string | null>(null);
  const empty = !url?.trim();

  let message: string | null = null;
  if (empty) message = emptyLabel;
  else if (!src) message = "Enter a full https:// image URL to preview the banner.";
  else if (brokenSrc === src) {
    message =
      "This URL did not load an image. Check that it is public and returns an image file.";
  }

  return (
    <div
      className={cn(
        "relative aspect-[16/5] w-full max-w-lg overflow-hidden rounded-lg border border-border bg-muted/30",
        className,
      )}
    >
      {src && !message ? (
        // Arbitrary admin/host-supplied public URL, so next/image remote hosts cannot be configured.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          width={1200}
          height={375}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setBrokenSrc(src)}
          className="size-full object-cover"
        />
      ) : (
        <p className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 px-4 text-center text-[11px] leading-relaxed text-muted-foreground">
          <ImageOff className="size-4 shrink-0" aria-hidden="true" />
          <span className="max-w-xs">{message}</span>
        </p>
      )}
    </div>
  );
}
