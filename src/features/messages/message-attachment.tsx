import type { MessageAttachment } from "@/lib/message-types";

/**
 * One image inside a message bubble. Pending uploads use a local blob URL and
 * have unknown dimensions, so width/height are only emitted once the server
 * reports them. Deleted messages never reach this component.
 */
export function MessageAttachmentImage({
  attachment,
}: {
  attachment: MessageAttachment;
}) {
  const pending = attachment.url.startsWith("blob:");
  const width = attachment.width > 0 ? attachment.width : undefined;
  const height = attachment.height > 0 ? attachment.height : undefined;

  const image = (
    // The bytes come from an auth-checked same-origin route, so next/image
    // would add an optimizer hop without any benefit here.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={attachment.url}
      alt="Shared image"
      width={width}
      height={height}
      loading="lazy"
      decoding="async"
      className="h-auto max-h-80 w-auto max-w-full rounded-xl object-contain"
    />
  );

  if (pending) {
    return <div className="max-w-[min(20rem,80vw)]">{image}</div>;
  }

  return (
    <a
      href={attachment.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Open shared image in a new tab"
      className="block max-w-[min(20rem,80vw)] rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {image}
    </a>
  );
}
