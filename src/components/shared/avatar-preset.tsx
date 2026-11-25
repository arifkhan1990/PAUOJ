import {
  Bird,
  Bot,
  Cat,
  Dog,
  Fish,
  Gamepad2,
  Ghost,
  Panda,
  Rabbit,
  Rocket,
  Squirrel,
  Turtle,
  type LucideIcon,
} from "lucide-react";
import {
  findAvatarPreset,
  type AvatarPresetId,
} from "@/lib/avatars";
import { cn } from "@/lib/utils";

const icons: Record<AvatarPresetId, LucideIcon> = {
  cat: Cat,
  dog: Dog,
  bird: Bird,
  fish: Fish,
  rabbit: Rabbit,
  squirrel: Squirrel,
  turtle: Turtle,
  panda: Panda,
  ghost: Ghost,
  rocket: Rocket,
  bot: Bot,
  gamepad: Gamepad2,
};

export function AvatarPresetVisual({
  preset,
  className,
}: {
  preset: AvatarPresetId;
  className?: string;
}) {
  const meta = findAvatarPreset(preset);
  if (!meta) return null;
  const Icon = icons[preset];

  return (
    <span
      className={cn(
        "grid size-full place-items-center bg-gradient-to-br text-white ring-1 ring-inset ring-white/15",
        meta.className,
        className,
      )}
      data-avatar-preset={preset}
      aria-hidden="true"
    >
      <Icon className="h-1/2 w-1/2" strokeWidth={2.1} />
    </span>
  );
}
