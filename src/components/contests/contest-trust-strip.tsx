import {
  Leaf,
  LockKeyhole,
  ShieldCheck,
  UserX,
  type LucideIcon,
} from "lucide-react";

const TRUST_ITEMS: { icon: LucideIcon; label: string }[] = [
  { icon: LockKeyhole, label: "Editorials sealed until the round ends" },
  { icon: Leaf, label: "Fresh problems only" },
  { icon: ShieldCheck, label: "Watermarked, copy-guarded statements" },
  { icon: UserX, label: "Crew cannot compete" },
];

export function ContestTrustStrip({ className }: { className?: string }) {
  return (
    <section
      aria-label="Contest integrity"
      className={className}
    >
      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {TRUST_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <li
              key={item.label}
              className="flex items-start gap-2 rounded-md border border-border bg-muted/30 px-2.5 py-2 text-[11px] leading-relaxed text-muted-foreground"
            >
              <Icon className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden="true" />
              <span>{item.label}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
