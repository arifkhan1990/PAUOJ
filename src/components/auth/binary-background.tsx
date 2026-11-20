import { cn } from "@/lib/utils";

const variants = [
  {
    tail: "text-emerald-700/25 dark:text-emerald-400/45",
    head: "text-emerald-800 dark:text-emerald-100",
  },
  {
    tail: "text-teal-700/20 dark:text-teal-300/40",
    head: "text-teal-800 dark:text-teal-50",
  },
  {
    tail: "text-cyan-700/20 dark:text-cyan-300/35",
    head: "text-cyan-900 dark:text-cyan-100",
  },
  {
    tail: "text-foreground/15 dark:text-slate-300/25",
    head: "text-foreground dark:text-white",
  },
];

function hash(value: number): number {
  let x = Math.imul(value ^ 0x9e3779b9, 0x85ebca6b);
  x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35);
  return (x ^ (x >>> 16)) >>> 0;
}

const drops = Array.from({ length: 56 }, (_, index) => {
  const column = index % 28;
  const length = 8 + (hash(index * 7 + 3) % 9);
  const tail = Array.from({ length }, (_, line) =>
    hash(index * 31 + line * 17 + 5) % 2 === 0 ? "0" : "1",
  ).join("\n");
  const variant = variants[hash(index * 13 + 7) % variants.length];

  return {
    id: index,
    left: 1.8 + column * 3.5,
    tail,
    head: hash(index * 19 + 11) % 2 === 0 ? "0" : "1",
    tailClass: variant.tail,
    headClass: variant.head,
    fontSize: 9 + (hash(index * 23 + 13) % 4),
    duration: 8 + (hash(index * 29 + 17) % 11),
    delay: -(hash(index * 37 + 19) % 180) / 10,
    extra: index >= 28,
  };
});

export function BinaryBackground() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {drops.map((drop) => (
        <div
          key={drop.id}
          className={cn(
            "matrix-drop absolute top-0 font-mono",
            drop.extra && "hidden md:block",
          )}
          style={{
            left: `${drop.left}%`,
            fontSize: `${drop.fontSize}px`,
            animationDuration: `${drop.duration}s`,
            animationDelay: `${drop.delay}s`,
          }}
        >
          <pre className={cn("leading-4", drop.tailClass)}>{drop.tail}</pre>
          <span
            className={cn("block leading-4", drop.headClass)}
            style={{ textShadow: "0 0 12px currentColor" }}
          >
            {drop.head}
          </span>
        </div>
      ))}
    </div>
  );
}
