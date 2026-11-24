import { cn, safeHttpUrl } from "@/lib/utils";

/**
 * Shared contest artwork. A custom banner image is used when present; otherwise
 * a branded teal/grid backdrop keeps cards and heroes intentional instead of
 * showing an empty grey block. The fallback is theme-independent (deep teal)
 * so white overlay text stays legible in both light and dark mode.
 */
export function ContestBannerBackdrop({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "absolute inset-0 overflow-hidden bg-[linear-gradient(135deg,#04231f_0%,#0b3f37_48%,#062822_100%)]",
        className,
      )}
    >
      <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(rgba(255,255,255,0.18)_1px,transparent_1px)] [background-size:20px_20px]" />
      <div className="absolute -right-12 -top-16 size-52 rounded-full bg-primary/30 blur-3xl" />
      <div className="absolute -bottom-16 left-1/4 size-48 rounded-full bg-amber-400/15 blur-3xl" />
      <span
        aria-hidden="true"
        className={cn(
          "absolute left-4 top-1/2 -translate-y-1/2 font-mono font-bold text-white/10",
          compact ? "text-3xl" : "text-5xl sm:text-6xl",
        )}
      >
        {"{ }"}
      </span>
      {/* eslint-disable-next-line @next/next/no-img-element -- small decorative local mark; the banner itself already sets the aspect ratio. */}
      <img
        src="/brand/pauoj-mark.png"
        alt=""
        width={compact ? 56 : 96}
        height={compact ? 56 : 96}
        loading="lazy"
        decoding="async"
        className={cn(
          "absolute right-4 top-4 rounded-md object-contain opacity-25",
          compact ? "size-10" : "size-14 sm:size-20",
        )}
      />
      <span
        aria-hidden="true"
        className={cn(
          "absolute bottom-3 right-4 font-mono font-semibold uppercase tracking-[0.28em] text-white/20",
          compact ? "text-[9px] tracking-[0.2em]" : "text-[10px] sm:text-xs",
        )}
      >
        PAU OJ
      </span>
    </div>
  );
}

export function ContestBannerMedia({
  bannerUrl,
  title,
  compact = false,
  className,
}: {
  bannerUrl: string | null;
  title: string;
  compact?: boolean;
  className?: string;
}) {
  const url = safeHttpUrl(bannerUrl);

  return (
    <div className={cn("absolute inset-0", className)}>
      {url ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element -- contest banners are arbitrary organiser URLs, so next/image cannot be configured for them. */}
          <img
            src={url}
            alt={`${title} banner`}
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            className="absolute inset-0 size-full object-cover"
          />
          <div aria-hidden="true" className="absolute inset-0 bg-black/25" />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[linear-gradient(to_top,rgba(3,10,8,0.92)_0%,rgba(3,10,8,0.55)_48%,rgba(3,10,8,0.2)_100%)]"
          />
        </>
      ) : (
        <ContestBannerBackdrop compact={compact} />
      )}
      {compact ? (
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[linear-gradient(to_top,rgba(3,10,8,0.45)_0%,transparent_70%)]"
        />
      ) : null}
    </div>
  );
}
