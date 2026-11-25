/**
 * Discord-style avatar choices. A user can upload a photo or pick one preset;
 * with neither, the existing initials-on-color avatar is used.
 */
export const AVATAR_PRESET_IDS = [
  "cat",
  "dog",
  "bird",
  "fish",
  "rabbit",
  "squirrel",
  "turtle",
  "panda",
  "ghost",
  "rocket",
  "bot",
  "gamepad",
] as const;

export type AvatarPresetId = (typeof AVATAR_PRESET_IDS)[number];

export type AvatarPreset = {
  id: AvatarPresetId;
  label: string;
  className: string;
};

export const AVATAR_PRESETS: readonly AvatarPreset[] = [
  { id: "cat", label: "Cat", className: "from-orange-500 to-rose-600" },
  { id: "dog", label: "Dog", className: "from-amber-600 to-orange-700" },
  { id: "bird", label: "Bird", className: "from-sky-500 to-blue-700" },
  { id: "fish", label: "Fish", className: "from-cyan-500 to-teal-700" },
  { id: "rabbit", label: "Rabbit", className: "from-pink-500 to-rose-700" },
  {
    id: "squirrel",
    label: "Squirrel",
    className: "from-amber-700 to-orange-800",
  },
  { id: "turtle", label: "Turtle", className: "from-emerald-500 to-green-700" },
  { id: "panda", label: "Panda", className: "from-slate-500 to-slate-700" },
  { id: "ghost", label: "Ghost", className: "from-violet-500 to-purple-700" },
  { id: "rocket", label: "Rocket", className: "from-indigo-500 to-blue-700" },
  { id: "bot", label: "Bot", className: "from-teal-500 to-cyan-700" },
  { id: "gamepad", label: "Gamepad", className: "from-fuchsia-500 to-pink-700" },
];

export const AVATAR_IMAGE_MAX_BYTES = 1024 * 1024;
export const AVATAR_IMAGE_MAX_DIMENSION = 2048;
export const AVATAR_IMAGE_OUTPUT_SIZE = 512;

export function isAvatarPresetId(
  value: string | null | undefined,
): value is AvatarPresetId {
  return (
    typeof value === "string" &&
    (AVATAR_PRESET_IDS as readonly string[]).includes(value)
  );
}

export function findAvatarPreset(
  id: string | null | undefined,
): AvatarPreset | null {
  if (!isAvatarPresetId(id)) return null;
  return AVATAR_PRESETS.find((preset) => preset.id === id) ?? null;
}

/** Versioned URL: a new upload always changes the timestamp, so the bytes can
 * be cached as immutable by the browser and any CDN in front of the app. */
export function avatarImageSrc(
  username: string,
  imageUpdatedAt: Date | string | number,
): string {
  const raw =
    imageUpdatedAt instanceof Date
      ? imageUpdatedAt.getTime()
      : typeof imageUpdatedAt === "number"
        ? imageUpdatedAt
        : new Date(imageUpdatedAt).getTime();
  const version = Number.isFinite(raw) ? raw : 0;
  return `/api/v1/users/${encodeURIComponent(username)}/avatar?v=${version}`;
}
