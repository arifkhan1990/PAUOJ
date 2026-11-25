"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2, Megaphone, Send } from "lucide-react";
import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ApiClientError, apiPost } from "@/lib/api-client";

const TITLE_MIN = 4;
const TITLE_MAX = 120;
const BODY_MIN = 10;
const BODY_MAX = 2000;
const HREF_MAX = 300;

type PublishResult = { created: boolean; recipients: number };

type Field = "title" | "body" | "href";

function validate(
  title: string,
  body: string,
  href: string,
): { field: Field; message: string } | null {
  if (title.length < TITLE_MIN || title.length > TITLE_MAX) {
    return {
      field: "title",
      message: `Add a title between ${TITLE_MIN} and ${TITLE_MAX} characters.`,
    };
  }
  if (body.length < BODY_MIN || body.length > BODY_MAX) {
    return {
      field: "body",
      message: `Add a message between ${BODY_MIN} and ${BODY_MAX} characters.`,
    };
  }
  if (href.length > HREF_MAX) {
    return {
      field: "href",
      message: `Keep the link under ${HREF_MAX} characters.`,
    };
  }
  if (href && !href.startsWith("/")) {
    return {
      field: "href",
      message: "Use an in-app path that starts with /.",
    };
  }
  return null;
}

export function AnnouncementComposer() {
  const router = useRouter();
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [href, setHref] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;

    const trimmedTitle = title.trim();
    const trimmedBody = body.trim();
    const trimmedHref = href.trim();
    const problem = validate(trimmedTitle, trimmedBody, trimmedHref);
    if (problem) {
      setError(problem.message);
      const fieldId =
        problem.field === "title"
          ? "announcement-title"
          : problem.field === "body"
            ? "announcement-body"
            : "announcement-href";
      document.getElementById(fieldId)?.focus();
      return;
    }

    setPending(true);
    setError(null);
    try {
      const result = await apiPost<PublishResult>(
        "/api/v1/admin/announcements",
        {
          title: trimmedTitle,
          body: trimmedBody,
          ...(trimmedHref ? { href: trimmedHref } : {}),
        },
      );
      toast({
        title: "Announcement sent",
        description:
          result.recipients === 0
            ? "Saved, but no eligible recipients were found."
            : `${result.recipients} ${
                result.recipients === 1 ? "person received" : "people received"
              } it in the app.`,
        variant: "success",
      });
      setTitle("");
      setBody("");
      setHref("");
      router.refresh();
    } catch (requestError) {
      const message =
        requestError instanceof ApiClientError
          ? requestError.message
          : "Could not send the announcement.";
      setError(message);
      toast({
        title: "Could not send announcement",
        description: message,
        variant: "error",
      });
    } finally {
      setPending(false);
    }
  };

  return (
    <Card className="p-5">
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
          <Megaphone className="size-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className="text-base font-semibold">New announcement</h2>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
            Appears in every coder&apos;s notification center and is emailed to
            those who allow announcement email.
          </p>
        </div>
      </div>

      <form className="mt-4 space-y-4" onSubmit={(event) => void submit(event)}>
        <div>
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="announcement-title">Title</Label>
            <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
              {title.length}/{TITLE_MAX}
            </span>
          </div>
          <Input
            id="announcement-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={TITLE_MAX}
            placeholder="e.g. Judge maintenance on 30 Nov"
            className="mt-1.5 h-11"
            aria-describedby="announcement-title-hint"
            required
          />
          <p
            id="announcement-title-hint"
            className="mt-1 text-[11px] text-muted-foreground"
          >
            Short and specific; this is the notification headline.
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="announcement-body">Message</Label>
            <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
              {body.length}/{BODY_MAX}
            </span>
          </div>
          <Textarea
            id="announcement-body"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            maxLength={BODY_MAX}
            rows={5}
            placeholder="What changed, who it affects and what to do next."
            className="mt-1.5 min-h-28"
            aria-describedby="announcement-body-hint"
            required
          />
          <p
            id="announcement-body-hint"
            className="mt-1 text-[11px] text-muted-foreground"
          >
            Keep it to a few sentences. Links inside the text are not clickable.
          </p>
        </div>

        <div>
          <Label htmlFor="announcement-href">Link (optional)</Label>
          <Input
            id="announcement-href"
            value={href}
            onChange={(event) => setHref(event.target.value)}
            maxLength={HREF_MAX}
            placeholder="/contests/weekly-1"
            className="mt-1.5 h-11"
            aria-describedby="announcement-href-hint"
            inputMode="url"
          />
          <p
            id="announcement-href-hint"
            className="mt-1 text-[11px] text-muted-foreground"
          >
            In-app path starting with /, e.g. /learn or /contests. Leave empty
            for a text-only notice.
          </p>
        </div>

        {error ? (
          <p
            className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive"
            role="alert"
          >
            <AlertCircle
              className="mt-0.5 size-3.5 shrink-0"
              aria-hidden="true"
            />
            {error}
          </p>
        ) : null}

        <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[11px] text-muted-foreground">
            Sending is immediate and cannot be undone.
          </p>
          <Button
            type="submit"
            disabled={pending}
            className="h-11 w-full sm:w-auto"
          >
            {pending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Send className="size-4" aria-hidden="true" />
            )}
            {pending ? "Sending…" : "Send announcement"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
