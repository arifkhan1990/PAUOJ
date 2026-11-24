"use client";

import { X } from "lucide-react";
import { BannerPreview } from "@/components/shared/banner-preview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export const BANNER_URL_HELP =
  "16:5 artwork, around 1200×375, without text (the hero overlays the title); public https URL. Leave blank for the branded default banner.";

/**
 * Banner URL authoring for the admin and host contest forms: 44px control,
 * helper text, optional clear action and a live preview that never shifts.
 */
export function BannerUrlField({
  id = "bannerUrl",
  label = "Banner URL",
  value,
  onChange,
  error,
  hint = BANNER_URL_HELP,
  className,
}: {
  id?: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label htmlFor={id}>{label}</Label>
        {value.trim() ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-11 px-2 text-[11px] text-muted-foreground"
            onClick={() => onChange("")}
          >
            <X aria-hidden="true" />
            Clear
          </Button>
        ) : null}
      </div>
      <Input
        id={id}
        type="url"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="https://…/contest-banner.jpg"
        inputMode="url"
        autoComplete="off"
        maxLength={500}
        className="h-11"
        aria-invalid={error ? true : undefined}
        aria-describedby={`${id}-hint${error ? ` ${id}-error` : ""}`}
      />
      <p
        id={`${id}-hint`}
        className="text-[11px] leading-relaxed text-muted-foreground"
      >
        {hint}
      </p>
      {error ? (
        <p
          id={`${id}-error`}
          role="alert"
          className="text-[11px] font-medium text-rose-600 dark:text-rose-400"
        >
          {error}
        </p>
      ) : null}
      <BannerPreview url={value} />
    </div>
  );
}
