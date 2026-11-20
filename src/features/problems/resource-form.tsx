"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ApiClientError, apiPost } from "@/lib/api-client";

export function ResourceForm({ slug }: { slug: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      await apiPost(`/api/v1/problems/${slug}/resources`, {
        title,
        url,
        description,
      });
      setTitle("");
      setUrl("");
      setDescription("");
      toast({ title: "Resource added", variant: "success" });
      router.refresh();
    } catch (error) {
      toast({
        title: "Could not add the resource",
        description:
          error instanceof ApiClientError
            ? error.message
            : "Please try again.",
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="p-4 sm:p-5">
      <h3 className="text-sm font-semibold">Add a resource</h3>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Link a tutorial, article or video that helps solve this problem.
      </p>
      <form onSubmit={submit} className="mt-4 space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="resource-title">Title</Label>
            <Input
              id="resource-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={120}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="resource-url">URL</Label>
            <Input
              id="resource-url"
              type="url"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://…"
              maxLength={500}
              required
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="resource-description">Description (optional)</Label>
          <Textarea
            id="resource-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={500}
            className="min-h-16"
          />
        </div>
        <Button type="submit" size="sm" disabled={saving || title.trim().length < 3 || !url.trim()}>
          {saving ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Plus className="size-3.5" />
          )}
          Add resource
        </Button>
      </form>
    </Card>
  );
}
