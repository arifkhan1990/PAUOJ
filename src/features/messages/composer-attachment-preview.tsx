"use client";

import { FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  formatFileSize,
  messageDocumentExtension,
} from "./message-format";

function RemoveAttachmentButton({
  label,
  disabled,
  onRemove,
}: {
  label: string;
  disabled: boolean;
  onRemove: () => void;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={onRemove}
      disabled={disabled}
      aria-label={label}
      className="min-h-11 min-w-11 shrink-0 text-muted-foreground"
    >
      <X className="size-4" aria-hidden="true" />
    </Button>
  );
}

/** The image picked for the next message, previewed from a local blob URL. */
export function ImageDraftPreview({
  file,
  url,
  disabled,
  onRemove,
}: {
  file: File;
  url: string;
  disabled: boolean;
  onRemove: () => void;
}) {
  return (
    <div className="mb-2 flex items-center gap-3 rounded-md border border-border bg-muted/40 p-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt=""
        className="size-12 shrink-0 rounded object-cover"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium">{file.name}</p>
        <p className="text-[11px] text-muted-foreground">
          {formatFileSize(file.size)} ·{" "}
          {file.type.replace("image/", "").toUpperCase()}
        </p>
      </div>
      <RemoveAttachmentButton
        label="Remove image"
        disabled={disabled}
        onRemove={onRemove}
      />
    </div>
  );
}

/** The document picked for the next message; no blob URL is created. */
export function DocumentDraftPreview({
  file,
  disabled,
  onRemove,
}: {
  file: File;
  disabled: boolean;
  onRemove: () => void;
}) {
  const extension = messageDocumentExtension(file.name);
  return (
    <div className="mb-2 flex items-center gap-3 rounded-md border border-border bg-muted/40 p-2">
      <span className="grid size-12 shrink-0 place-items-center rounded bg-background text-muted-foreground">
        <FileText className="size-5" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium" title={file.name}>
          {file.name}
        </p>
        <p className="text-[11px] text-muted-foreground">
          {formatFileSize(file.size)}
          {extension ? ` · ${extension.toUpperCase()}` : null}
        </p>
      </div>
      <RemoveAttachmentButton
        label="Remove document"
        disabled={disabled}
        onRemove={onRemove}
      />
    </div>
  );
}
