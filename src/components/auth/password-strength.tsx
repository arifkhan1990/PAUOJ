import { cn } from "@/lib/utils";

const LEVELS = [
  { label: "Too short", className: "bg-rose-500" },
  { label: "Weak", className: "bg-rose-500" },
  { label: "Fair", className: "bg-amber-500" },
  { label: "Strong", className: "bg-emerald-500" },
  { label: "Excellent", className: "bg-emerald-500" },
];

export function passwordScore(password: string): number {
  if (password.length === 0) return 0;
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[a-z]/i.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (password.length >= 12 && /[^a-z0-9]/i.test(password)) score += 1;
  return score;
}

export function PasswordStrength({ password }: { password: string }) {
  const score = passwordScore(password);
  const level = LEVELS[score] ?? LEVELS[0];

  return (
    <div className="space-y-1.5">
      {password.length > 0 ? (
        <div className="flex items-center gap-1.5">
          {Array.from({ length: 4 }, (_, index) => (
            <span
              key={index}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors",
                index < score ? level.className : "bg-muted",
              )}
            />
          ))}
          <span
            className="ml-1 min-w-14 text-right text-[10px] font-medium text-muted-foreground"
            aria-live="polite"
          >
            {level.label}
          </span>
        </div>
      ) : null}
      <p className="text-[11px] leading-5 text-muted-foreground">
        Use 8+ characters with a letter and a number.
      </p>
    </div>
  );
}
