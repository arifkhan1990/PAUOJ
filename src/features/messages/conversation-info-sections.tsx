import type { ReactNode } from "react";
import {
  ExternalLink,
  FileText,
  RotateCw,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  ConversationSharedContent,
  ConversationSharedLink,
} from "@/lib/message-types";
import { formatMessageTime } from "./message-format";
import {
  sharedLinkLabel,
  sharedMediaThumbnails,
  splitSharedLinks,
} from "./message-info-format";
import type { SharedContentState } from "./use-conversation-shared-content";

export function SectionTitle({
  id,
  children,
}: {
  id?: string;
  children: ReactNode;
}) {
  return (
    <h3
      id={id}
      className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground"
    >
      {children}
    </h3>
  );
}

export function DetailRow({
  icon: Icon,
  label,
  children,
}: {
  icon: LucideIcon;
  label: string;
  children: ReactNode;
}) {
  return (
    <li className="flex items-start gap-3 px-3 py-2.5">
      <Icon
        className="mt-0.5 size-4 shrink-0 text-muted-foreground"
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {label}
        </p>
        <div className="mt-0.5 break-words text-sm">{children}</div>
      </div>
    </li>
  );
}

function SharedLinkList({
  items,
  icon: Icon,
  empty,
  label,
}: {
  items: ConversationSharedLink[];
  icon: LucideIcon;
  empty: string;
  label: string;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <SectionTitle>{label}</SectionTitle>
        <span className="text-[10px] tabular-nums text-muted-foreground">
          {items.length}
        </span>
      </div>
      {items.length === 0 ? (
        <p className="mt-1.5 text-xs text-muted-foreground">{empty}</p>
      ) : (
        <ul className="mt-2 divide-y divide-border/70 overflow-hidden rounded-lg border border-border/70">
          {items.map((link) => (
            <li key={`${link.url}-${link.createdAt}`}>
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer nofollow ugc"
                title={link.url}
                className="flex min-h-11 items-center gap-2.5 px-2.5 py-2 transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
              >
                <Icon
                  className="size-4 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-medium">
                    {sharedLinkLabel(link)}
                  </span>
                  <span className="block truncate text-[10px] text-muted-foreground">
                    {link.host}
                  </span>
                </span>
                <span className="shrink-0 whitespace-nowrap text-[10px] text-muted-foreground">
                  {formatMessageTime(link.createdAt)}
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SharedSections({
  data,
  participantName,
}: {
  data: ConversationSharedContent;
  participantName: string;
}) {
  const media = sharedMediaThumbnails(data.media);
  const { documents, links } = splitSharedLinks(data.links);

  return (
    <div className="mt-3 space-y-5">
      <div>
        <div className="flex items-baseline justify-between gap-2">
          <SectionTitle>Media</SectionTitle>
          <span className="text-[10px] tabular-nums text-muted-foreground">
            {media.length}
          </span>
        </div>
        {media.length === 0 ? (
          <p className="mt-1.5 text-xs text-muted-foreground">
            No images shared yet.
          </p>
        ) : (
          <ul className="mt-2 grid grid-cols-3 gap-1.5">
            {media.map((image) => (
              <li key={image.id}>
                <a
                  href={image.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Open image shared by ${participantName} in a new tab`}
                  className="group block aspect-square overflow-hidden rounded-lg border border-border/70 bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {/* Auth-checked same-origin bytes; the optimizer would only add a hop. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image.url}
                    alt=""
                    width={image.width}
                    height={image.height}
                    loading="lazy"
                    decoding="async"
                    className="size-full object-cover transition-transform duration-200 group-hover:scale-105 motion-reduce:transform-none motion-reduce:transition-none"
                  />
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>

      <SharedLinkList
        items={documents}
        icon={FileText}
        label="Documents"
        empty="No documents shared yet."
      />
      <SharedLinkList
        items={links}
        icon={ExternalLink}
        label="Links"
        empty="No links shared yet."
      />
    </div>
  );
}

/** Loading, retryable error and ready states for the lazy info payload. */
export function SharedContentStateView({
  state,
  onRetry,
  participantName,
}: {
  state: SharedContentState;
  onRetry: () => void;
  participantName: string;
}) {
  if (state.status === "loading" || state.status === "idle") {
    return (
      <div
        className="mt-3 space-y-4"
        aria-busy="true"
        aria-label="Loading shared content"
      >
        <div className="grid grid-cols-3 gap-1.5">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="aspect-square rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-11 w-full rounded-lg" />
        <Skeleton className="h-11 w-full rounded-lg" />
      </div>
    );
  }

  if (state.status === "error" || !state.data) {
    return (
      <div
        role="alert"
        className="mt-3 rounded-lg border border-border bg-muted/30 px-3 py-3"
      >
        <p className="text-xs text-muted-foreground">
          {state.error ?? "Could not load shared media and links."}
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="mt-2 min-h-11 gap-1.5"
        >
          <RotateCw className="size-3.5" aria-hidden="true" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <SharedSections data={state.data} participantName={participantName} />
  );
}
