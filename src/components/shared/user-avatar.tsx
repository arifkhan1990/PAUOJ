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
}: {
  name: string;
  username: string;
  size?: keyof typeof sizeMap;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white ring-2 ring-background",
        avatarColor(username),
        sizeMap[size],
        className,
      )}
      aria-hidden="true"
      title={name}
    >
      {initials(name)}
    </span>
  );
}
