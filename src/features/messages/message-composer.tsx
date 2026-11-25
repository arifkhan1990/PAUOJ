"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";
import { ImagePlus, Loader2, Paperclip, Send } from "lucide-react";
import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ApiClientError } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { insertEmoji, type TextInsertion } from "./composer-insert";
import {
  DocumentDraftPreview,
  ImageDraftPreview,
} from "./composer-attachment-preview";
import { EmojiPicker } from "./emoji-picker";
import {
  MESSAGE_DOCUMENT_ACCEPT,
  MESSAGE_IMAGE_MIME_TYPES,
  MESSAGE_MAX_LENGTH,
  validateMessageDocument,
  validateMessageImage,
} from "./message-format";
import { MessageSuggestionDrawer } from "./message-suggestion-drawer";
import { useComposerSuggestions } from "./use-composer-suggestions";

const COUNTER_THRESHOLD = MESSAGE_MAX_LENGTH - 200;

type SelectedImage = { file: File; url: string };

function describeError(requestError: unknown): string {
  return requestError instanceof ApiClientError
    ? requestError.message
    : "Please check your connection and try again.";
}

export function MessageComposer({
  blocked,
  onSend,
  onSendImage,
  onSendDocument,
}: {
  blocked: boolean;
  onSend: (body: string) => Promise<void>;
  onSendImage: (file: File, caption: string) => Promise<void>;
  onSendDocument: (file: File, caption: string) => Promise<void>;
}) {
  const { toast } = useToast();
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [image, setImage] = useState<SelectedImage | null>(null);
  const [document, setDocument] = useState<File | null>(null);
  const [caretRequest, setCaretRequest] = useState(0);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);
  const pendingCaret = useRef<number | null>(null);

  // Every replacement bubble gets its own blob URL; the previous one is freed.
  useEffect(() => {
    if (!image) return;
    return () => URL.revokeObjectURL(image.url);
  }, [image]);

  const applyInsert = useCallback((insertion: TextInsertion) => {
    pendingCaret.current = insertion.caret;
    setBody(insertion.value);
    setCaretRequest((current) => current + 1);
  }, []);

  useEffect(() => {
    if (caretRequest === 0) return;
    const field = textareaRef.current;
    const caret = pendingCaret.current;
    if (!field || caret === null) return;
    field.focus();
    field.setSelectionRange(caret, caret);
    pendingCaret.current = null;
  }, [caretRequest]);

  const suggestions = useComposerSuggestions({ value: body, applyInsert });

  const submit = async () => {
    if (sending || blocked) return;
    const caption = body.trim();
    if (!image && !document && !caption) return;

    suggestions.reset();
    setSending(true);
    setError(null);
    try {
      if (image) {
        await onSendImage(image.file, caption);
        setImage(null);
      } else if (document) {
        await onSendDocument(document, caption);
        setDocument(null);
      } else {
        await onSend(caption);
      }
      setBody("");
    } catch (requestError) {
      const description = describeError(requestError);
      setError(description);
      toast({
        title: image
          ? "Image not sent"
          : document
            ? "Document not sent"
            : "Message not sent",
        description,
        variant: "error",
      });
    } finally {
      setSending(false);
    }
  };

  const handleEmoji = (emoji: string) => {
    const field = textareaRef.current;
    const start = field?.selectionStart ?? body.length;
    const end = field?.selectionEnd ?? start;
    const result = insertEmoji(
      { value: body, selectionStart: start, selectionEnd: end },
      emoji,
    );
    if (!result) {
      setError(
        `Messages can be up to ${MESSAGE_MAX_LENGTH.toLocaleString("en-US")} characters.`,
      );
      return;
    }
    setError(null);
    applyInsert(result);
    suggestions.sync(result.value, result.caret);
  };

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    // Reset so choosing the same file again still fires onChange.
    event.target.value = "";
    if (!file) return;
    const problem = validateMessageImage(file);
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    // At most one attachment per message, so picking an image drops a document.
    setDocument(null);
    setImage({ file, url: URL.createObjectURL(file) });
  };

  const handleDocumentFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";
    if (!file) return;
    const problem = validateMessageDocument(file);
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    setImage(null);
    setDocument(file);
  };

  const removeImage = () => {
    setImage(null);
    setError(null);
  };

  const removeDocument = () => {
    setDocument(null);
    setError(null);
  };

  const onBodyChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const next = event.target.value;
    setBody(next);
    suggestions.sync(next, event.target.selectionStart);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.nativeEvent.isComposing) return;
    if (suggestions.handleKeyDown(event)) return;
    // Moving the caret horizontally makes the remembered trigger range stale.
    if (
      suggestions.open &&
      (event.key === "ArrowLeft" || event.key === "ArrowRight")
    ) {
      suggestions.close();
    }
    if (event.key !== "Enter" || event.shiftKey) return;
    event.preventDefault();
    void submit();
  };

  const nearLimit = body.length >= COUNTER_THRESHOLD;
  const disabled = blocked || sending;
  const canSend =
    !disabled && (image !== null || document !== null || body.trim().length > 0);

  return (
    <form
      className="border-t border-border p-3 sm:p-4"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      {suggestions.open ? (
        <MessageSuggestionDrawer suggestions={suggestions} />
      ) : null}

      {image ? (
        <ImageDraftPreview
          file={image.file}
          url={image.url}
          disabled={sending}
          onRemove={removeImage}
        />
      ) : null}

      {document ? (
        <DocumentDraftPreview
          file={document}
          disabled={sending}
          onRemove={removeDocument}
        />
      ) : null}

      <label htmlFor="message-body" className="sr-only">
        Message
      </label>
      <Textarea
        ref={textareaRef}
        id="message-body"
        value={body}
        onChange={onBodyChange}
        onKeyDown={onKeyDown}
        onSelect={(event) =>
          suggestions.sync(body, event.currentTarget.selectionStart)
        }
        onClick={(event) =>
          suggestions.sync(body, event.currentTarget.selectionStart)
        }
        maxLength={MESSAGE_MAX_LENGTH}
        rows={2}
        placeholder={
          image || document ? "Add a caption (optional)…" : "Write a message…"
        }
        disabled={disabled}
        aria-describedby={
          error ? "message-counter message-error" : "message-counter"
        }
        aria-controls={
          suggestions.activeOptionId ? suggestions.listboxId : undefined
        }
        aria-activedescendant={suggestions.activeOptionId}
        aria-autocomplete="list"
        className="max-h-40 min-h-11 resize-none"
      />

      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-0.5">
          <EmojiPicker disabled={disabled} onSelect={handleEmoji} />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            aria-label={image ? "Replace image" : "Attach image"}
            className="min-h-11 min-w-11 text-muted-foreground"
          >
            <ImagePlus className="size-4" aria-hidden="true" />
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept={MESSAGE_IMAGE_MIME_TYPES.join(",")}
            onChange={handleFile}
            className="hidden"
            tabIndex={-1}
            aria-hidden="true"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => documentInputRef.current?.click()}
            disabled={disabled}
            aria-label={document ? "Replace document" : "Attach document"}
            className="min-h-11 min-w-11 text-muted-foreground"
          >
            <Paperclip className="size-4" aria-hidden="true" />
          </Button>
          <input
            ref={documentInputRef}
            type="file"
            accept={MESSAGE_DOCUMENT_ACCEPT}
            onChange={handleDocumentFile}
            className="hidden"
            tabIndex={-1}
            aria-hidden="true"
          />
        </div>
        <div className="flex min-w-0 items-center gap-2">
          <p
            id="message-counter"
            aria-live="off"
            className={cn(
              "min-h-4 text-[11px] tabular-nums",
              nearLimit
                ? "font-medium text-amber-700 dark:text-amber-400"
                : "text-muted-foreground",
            )}
          >
            {nearLimit ? (
              `${body.length.toLocaleString("en-US")} / ${MESSAGE_MAX_LENGTH.toLocaleString("en-US")}`
            ) : (
              <span className="hidden sm:inline">
                Enter to send · Shift + Enter for a new line
              </span>
            )}
          </p>
          <Button
            type="submit"
            className="min-h-11 shrink-0 px-4"
            disabled={!canSend}
            aria-label="Send message"
          >
            {sending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Send className="size-4" aria-hidden="true" />
            )}
            Send
          </Button>
        </div>
      </div>

      {error ? (
        <p id="message-error" role="alert" className="mt-2 text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </form>
  );
}
