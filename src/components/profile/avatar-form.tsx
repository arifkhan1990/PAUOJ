"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Trash2, Upload } from "lucide-react";
import { AvatarPresetVisual } from "@/components/shared/avatar-preset";
import { UserAvatar } from "@/components/shared/user-avatar";
import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { prepareAvatarFile } from "@/lib/avatar-image";
import {
  AVATAR_PRESETS,
  isAvatarPresetId,
} from "@/lib/avatars";
import {
  ApiClientError,
  apiDelete,
  apiPatch,
  apiPostForm,
} from "@/lib/api-client";
import { avatarColor, cn, initials } from "@/lib/utils";

type AvatarSelection = {
  avatarPreset: string | null;
  avatarImageUpdatedAt: string | null;
};

export function AvatarForm({
  username,
  displayName,
  initialPreset,
  initialImageAt,
}: {
  username: string;
  displayName: string;
  initialPreset: string | null;
  initialImageAt: string | null;
}) {
  const [preset, setPreset] = useState<string | null>(initialPreset);
  const [imageAt, setImageAt] = useState<string | null>(initialImageAt);
  const [pendingPreset, setPendingPreset] = useState<
    { value: string | null } | null
  >(null);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { toast } = useToast();

  const messageFor = (requestError: unknown, fallback: string) =>
    requestError instanceof ApiClientError
      ? requestError.message
      : requestError instanceof Error
        ? requestError.message
        : fallback;

  const applyPreset = async (value: string | null) => {
    if (saving) return;
    const previousPreset = preset;
    const previousImage = imageAt;
    setSaving(true);
    setError(null);
    setPreset(value);
    setImageAt(null);
    try {
      const result = await apiPatch<AvatarSelection>(
        "/api/v1/users/me/avatar",
        { preset: value },
      );
      setPreset(result.avatarPreset);
      setImageAt(result.avatarImageUpdatedAt);
      setPendingPreset(null);
      toast({ title: "Avatar updated", variant: "success" });
      router.refresh();
    } catch (requestError) {
      setPreset(previousPreset);
      setImageAt(previousImage);
      const message = messageFor(requestError, "Could not update your avatar.");
      setError(message);
      toast({ title: "Update failed", description: message, variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  const choosePreset = (value: string | null) => {
    if (value === preset && !imageAt) return;
    if (imageAt) {
      setPendingPreset({ value });
      return;
    }
    void applyPreset(value);
  };

  const upload = async (file: File) => {
    if (uploading) return;
    setUploading(true);
    setError(null);
    try {
      const prepared = await prepareAvatarFile(file);
      const form = new FormData();
      form.append("file", prepared);
      const result = await apiPostForm<AvatarSelection>(
        "/api/v1/users/me/avatar",
        form,
      );
      setImageAt(result.avatarImageUpdatedAt);
      setPreset(result.avatarPreset);
      toast({ title: "Profile photo uploaded", variant: "success" });
      router.refresh();
    } catch (requestError) {
      const message = messageFor(requestError, "Could not upload that image.");
      setError(message);
      toast({ title: "Upload failed", description: message, variant: "error" });
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = async () => {
    if (removing) return;
    setRemoving(true);
    setError(null);
    try {
      const result = await apiDelete<AvatarSelection>(
        "/api/v1/users/me/avatar",
      );
      setImageAt(result.avatarImageUpdatedAt);
      setPreset(result.avatarPreset);
      setConfirmRemove(false);
      toast({ title: "Profile photo removed", variant: "success" });
      router.refresh();
    } catch (requestError) {
      const message = messageFor(requestError, "Could not remove your photo.");
      setError(message);
      toast({ title: "Remove failed", description: message, variant: "error" });
    } finally {
      setRemoving(false);
    }
  };

  const selected = isAvatarPresetId(preset) ? preset : null;

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <UserAvatar
          name={displayName}
          username={username}
          size="xl"
          avatarPreset={preset}
          avatarImageAt={imageAt}
        />
        <div className="min-w-0">
          <p className="text-sm font-medium">Profile picture</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Upload a photo or choose a preset avatar. Without either, your
            initials are shown.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-11"
              disabled={uploading || saving || removing}
              onClick={() => fileInput.current?.click()}
            >
              {uploading ? (
                <Loader2 className="animate-spin" aria-hidden="true" />
              ) : (
                <Upload aria-hidden="true" />
              )}
              {uploading ? "Uploading…" : "Upload photo"}
            </Button>
            {imageAt ? (
              <Button
                type="button"
                variant="ghost"
                className="h-11"
                disabled={uploading || saving || removing}
                onClick={() => setConfirmRemove(true)}
              >
                <Trash2 aria-hidden="true" />
                Remove photo
              </Button>
            ) : null}
          </div>
          <input
            ref={fileInput}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="sr-only"
            aria-label="Choose a profile photo"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) void upload(file);
            }}
          />
          <p className="mt-2 text-[11px] text-muted-foreground">
            PNG, JPG or WebP. Cropped square and resized to 512×512.
          </p>
        </div>
      </div>

      <fieldset className="mt-5">
        <legend className="text-sm font-medium">Preset avatars</legend>
        <div className="mt-3 grid grid-cols-5 gap-2 sm:grid-cols-7">
          <button
            type="button"
            aria-label="Use my initials"
            aria-pressed={!imageAt && !selected}
            disabled={saving || uploading || removing}
            onClick={() => choosePreset(null)}
            className={cn(
              "group relative grid aspect-square min-h-11 min-w-11 place-items-center rounded-full ring-offset-2 ring-offset-background transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60",
              !imageAt && !selected && "ring-2 ring-primary",
            )}
          >
            <span
              className={cn(
                "grid size-full place-items-center rounded-full text-sm font-semibold text-white ring-1 ring-inset ring-black/10",
                avatarColor(username),
              )}
              aria-hidden="true"
            >
              {initials(displayName)}
            </span>
            {!imageAt && !selected ? (
              <Check className="absolute -right-1 -top-1 size-4 rounded-full bg-primary p-0.5 text-primary-foreground" />
            ) : null}
          </button>

          {AVATAR_PRESETS.map((item) => {
            const active = !imageAt && selected === item.id;
            return (
              <button
                key={item.id}
                type="button"
                aria-label={`${item.label} avatar`}
                aria-pressed={active}
                disabled={saving || uploading || removing}
                onClick={() => choosePreset(item.id)}
                className={cn(
                  "group relative grid aspect-square min-h-11 min-w-11 place-items-center rounded-full ring-offset-2 ring-offset-background transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60",
                  active && "ring-2 ring-primary",
                )}
              >
                <AvatarPresetVisual preset={item.id} className="rounded-full" />
                {active ? (
                  <Check className="absolute -right-1 -top-1 size-4 rounded-full bg-primary p-0.5 text-primary-foreground" />
                ) : null}
              </button>
            );
          })}
        </div>
      </fieldset>

      {error ? (
        <p
          role="alert"
          className="mt-4 rounded-md border border-rose-300 bg-rose-50 p-2.5 text-xs text-rose-800 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-200"
        >
          {error}
        </p>
      ) : null}

      <ConfirmDialog
        open={pendingPreset !== null}
        title="Replace your photo?"
        description="Choosing a preset avatar removes your uploaded photo. You can upload another photo later."
        confirmLabel="Use preset"
        pending={saving}
        onCancel={() => setPendingPreset(null)}
        onConfirm={() => {
          if (pendingPreset) void applyPreset(pendingPreset.value);
        }}
      />
      <ConfirmDialog
        open={confirmRemove}
        title="Remove your photo?"
        description="Your preset avatar or initials will be shown instead. You can upload another photo later."
        confirmLabel="Remove photo"
        pending={removing}
        onCancel={() => setConfirmRemove(false)}
        onConfirm={() => void removePhoto()}
      />
    </div>
  );
}
