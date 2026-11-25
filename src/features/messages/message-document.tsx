import { FileText } from "lucide-react";
import type { MessageDocumentAttachment } from "@/lib/message-types";
import { cn } from "@/lib/utils";
import { formatFileSize, messageDocumentExtension } from "./message-format";

/**
 * One document inside a message bubble. Pending uploads have no URL yet, so
 * they render as a plain card and only become a download link once the server
 * returns the participant-only attachment URL. Deleted messages never reach
 * this component.
 */
export function MessageDocument({
  attachment,
  pending = false,
}: {
  attachment: MessageDocumentAttachment;
  pending?: boolean;
}) {
  const extension =
    messageDocumentExtension(attachment.fileName)?.toUpperCase() ?? "FILE";
  const size = formatFileSize(attachment.sizeBytes);
  const downloadUrl =
    !pending && attachment.url !== "" && !attachment.url.startsWith("blob:")
      ? attachment.url
      : null;

  const content = (
    <>
      <span className="grid size-9 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground">
        <FileText className="size-4" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span
          className="block truncate text-xs font-medium"
          title={attachment.fileName}
        >
          {attachment.fileName}
        </span>
        <span className="mt-0.5 block text-[11px] text-muted-foreground">
          {extension} · {size}
        </span>
      </span>
    </>
  );

  const base =
    "flex w-[min(18rem,70vw)] items-center gap-2.5 rounded-lg bg-background/70 p-2.5 text-foreground";

  if (!downloadUrl) {
    return <div className={cn(base, "opacity-90")}>{content}</div>;
  }

  return (
    <a
      href={downloadUrl}
      download={attachment.fileName}
      aria-label={`Download ${attachment.fileName} (${size})`}
      title={`Download ${attachment.fileName}`}
      className={cn(
        base,
        "transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      )}
    >
      {content}
    </a>
  );
}
