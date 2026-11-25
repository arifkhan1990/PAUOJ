"use client";

import { useState } from "react";
import { AvatarPresetVisual } from "@/components/shared/avatar-preset";
import {
  avatarImageSrc,
  isAvatarPresetId,
} from "@/lib/avatars";
import { avatarColor, cn, initials } from "@/lib/utils";

const sizeMap = {
  sm: "size-7 text-[10px]",
  md: "size-9 text-xs",
  lg: "size-12 text-sm",
  xl: "size-20 text-2xl",
};

export function UserAvatar({
  name,
  username,
  size = "md",
  className,
  avatarPreset,
  avatarImageAt,
}: {
  name: string;
  username: string;
  size?: keyof typeof sizeMap;
  className?: string;
  avatarPreset?: string | null;
  avatarImageAt?: Date | string | number | null;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const preset = isAvatarPresetId(avatarPreset) ? avatarPreset : null;
  const image =
    avatarImageAt && !imageFailed
      ? avatarImageSrc(username, avatarImageAt)
      : null;

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold text-white ring-2 ring-background",
        avatarColor(username),
        sizeMap[size],
        className,
      )}
      aria-hidden="true"
      title={name}
    >
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element -- small, versioned avatar served by our own route
        <img
          src={image}
          alt=""
          loading="lazy"
          decoding="async"
          className="absolute inset-0 size-full object-cover"
          onError={() => setImageFailed(true)}
        />
      ) : preset ? (
        <AvatarPresetVisual preset={preset} />
      ) : (
        initials(name)
      )}
    </span>
  );
}
