"use client";

import {
  Fragment,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ClipboardEvent,
  type KeyboardEvent,
} from "react";
import type { LucideIcon } from "lucide-react";
import {
  Bold,
  Code,
  Code2,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Quote,
  Table2,
} from "lucide-react";
import { Markdown } from "@/components/shared/markdown";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { applyMarkdownAction, type MarkdownAction } from "@/lib/markdown-editing";
import { cn } from "@/lib/utils";

type Mode = "write" | "split" | "preview";

type ToolbarItem = {
  action: MarkdownAction;
  label: string;
  icon: LucideIcon;
};

const MODES: { id: Mode; label: string }[] = [
  { id: "write", label: "Write" },
  { id: "split", label: "Split" },
  { id: "preview", label: "Preview" },
];

const TOOLBAR_GROUPS: ToolbarItem[][] = [
  [
    { action: "heading2", label: "Heading 2", icon: Heading2 },
    { action: "heading3", label: "Heading 3", icon: Heading3 },
  ],
  [
    { action: "bold", label: "Bold", icon: Bold },
    { action: "italic", label: "Italic", icon: Italic },
    { action: "inline-code", label: "Inline code", icon: Code },
  ],
  [{ action: "code-block", label: "Code block", icon: Code2 }],
  [
    { action: "link", label: "Insert link", icon: Link2 },
    { action: "image", label: "Insert image", icon: ImageIcon },
  ],
  [
    { action: "bullet-list", label: "Bullet list", icon: List },
    { action: "ordered-list", label: "Numbered list", icon: ListOrdered },
    { action: "quote", label: "Blockquote", icon: Quote },
  ],
  [
    { action: "table", label: "Table", icon: Table2 },
    { action: "divider", label: "Divider", icon: Minus },
  ],
];

const LANGUAGES = [
  "cpp",
  "python",
  "java",
  "javascript",
  "csharp",
  "go",
  "php",
  "kotlin",
  "swift",
  "text",
];

const LINE_HEIGHT = 22;
const IMAGE_NOTE =
  "Image upload isn't available. Host the image and paste its public URL.";

function ToolbarButton({
  item,
  disabled,
  onAction,
}: {
  item: ToolbarItem;
  disabled: boolean;
  onAction: (action: MarkdownAction) => void;
}) {
  const Icon = item.icon;
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="size-8"
      aria-label={item.label}
      title={item.label}
      disabled={disabled}
      onClick={() => onAction(item.action)}
    >
      <Icon aria-hidden="true" />
    </Button>
  );
}

function ToolbarSeparator() {
  return (
    <span aria-hidden="true" className="mx-0.5 h-5 w-px shrink-0 bg-border" />
  );
}

function MarkdownPreview({ value }: { value: string }) {
  if (!value.trim()) {
    return (
      <p className="text-xs text-muted-foreground">Nothing to preview yet.</p>
    );
  }
  return <Markdown>{value}</Markdown>;
}

export function MarkdownEditor({
  id,
  value,
  onChange,
  placeholder,
  rows = 12,
  template,
  className,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  template?: string;
  className?: string;
}) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const [mode, setMode] = useState<Mode>("write");
  const [language, setLanguage] = useState("cpp");
  const [imageNote, setImageNote] = useState<string | null>(null);

  useEffect(
    () => () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    },
    [],
  );

  const previewing = mode === "preview";

  const focusSelection = (selectionStart: number, selectionEnd: number) => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = null;
      const textarea = textareaRef.current;
      if (!textarea) return;
      textarea.focus();
      textarea.setSelectionRange(selectionStart, selectionEnd);
    });
  };

  const runAction = (action: MarkdownAction) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const result = applyMarkdownAction(
      textarea.value,
      textarea.selectionStart,
      textarea.selectionEnd,
      action,
      { language },
    );
    setImageNote(null);
    onChange(result.value);
    focusSelection(result.selectionStart, result.selectionEnd);
  };

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setImageNote(null);
    onChange(event.target.value);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!(event.metaKey || event.ctrlKey) || event.altKey) return;
    const key = event.key.toLowerCase();

    let action: MarkdownAction | null = null;
    if (key === "e") {
      action = event.shiftKey ? "code-block" : "inline-code";
    } else if (!event.shiftKey) {
      if (key === "b") action = "bold";
      else if (key === "i") action = "italic";
      else if (key === "k") action = "link";
    }
    if (!action) return;

    event.preventDefault();
    runAction(action);
  };

  const handlePaste = (event: ClipboardEvent<HTMLTextAreaElement>) => {
    const items = event.clipboardData?.items;
    if (!items) return;
    const hasImage = Array.from(items).some((item) =>
      item.type.startsWith("image/"),
    );
    if (!hasImage) return;
    event.preventDefault();
    setImageNote(IMAGE_NOTE);
  };

  const insertOutline = () => {
    if (!template) return;
    const next = value.trim()
      ? `${value.replace(/\s+$/, "")}\n\n${template}`
      : template;
    setImageNote(null);
    onChange(next);
    focusSelection(next.length, next.length);
  };

  return (
    <div
      className={cn(
        "overflow-hidden rounded-md border border-border bg-background focus-within:ring-2 focus-within:ring-ring",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/30 px-2 py-1.5">
        <div className="flex flex-wrap items-center gap-0.5">
          {TOOLBAR_GROUPS.map((group, index) => (
            <Fragment key={group[0].action}>
              {index > 0 ? <ToolbarSeparator /> : null}
              {group.map((item) => (
                <ToolbarButton
                  key={item.action}
                  item={item}
                  disabled={previewing}
                  onAction={runAction}
                />
              ))}
              {group.some((item) => item.action === "code-block") ? (
                <Select
                  value={language}
                  onChange={(event) => setLanguage(event.target.value)}
                  aria-label="Code block language"
                  title="Code block language"
                  disabled={previewing}
                  className="h-8 w-[7.25rem] px-2 pr-7 text-xs"
                >
                  {LANGUAGES.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </Select>
              ) : null}
            </Fragment>
          ))}
        </div>
        <div
          role="group"
          aria-label="Editor mode"
          className="flex items-center rounded-md border border-border bg-background p-0.5"
        >
          {MODES.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={mode === item.id}
              onClick={() => setMode(item.id)}
              className={cn(
                "inline-flex min-h-8 items-center rounded px-2.5 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                item.id === "split" && "hidden lg:inline-flex",
                mode === item.id
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {previewing ? (
        <div className="min-h-40 bg-muted/20 p-4">
          <MarkdownPreview value={value} />
        </div>
      ) : (
        <div
          className={cn(
            "grid min-w-0 grid-cols-1",
            mode === "split" && "lg:grid-cols-2",
          )}
        >
          <div
            className={cn(
              "min-w-0",
              mode === "split" && "lg:border-r lg:border-border",
            )}
          >
            <Textarea
              ref={textareaRef}
              id={id}
              value={value}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder={placeholder}
              spellCheck={false}
              aria-describedby={`${id}-hint`}
              className="w-full resize-y rounded-none border-0 bg-transparent font-mono text-xs leading-[22px] shadow-none focus-visible:ring-0"
              style={{ minHeight: rows * LINE_HEIGHT }}
            />
          </div>
          {mode === "split" ? (
            <div className="hidden min-w-0 bg-muted/20 p-4 lg:block">
              <MarkdownPreview value={value} />
            </div>
          ) : null}
        </div>
      )}

      <div className="space-y-1 border-t border-border px-3 py-2">
        {imageNote ? (
          <p role="status" className="text-[11px] text-warning">
            {imageNote}
          </p>
        ) : null}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p id={`${id}-hint`} className="text-[11px] text-muted-foreground">
            Markdown supported. Raw HTML is not rendered. Images need a public
            URL.
          </p>
          <div className="flex items-center gap-2">
            <span className="text-[11px] tabular-nums text-muted-foreground">
              {value.length} {value.length === 1 ? "character" : "characters"}
            </span>
            {template ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-[11px]"
                onClick={insertOutline}
              >
                Insert outline
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
