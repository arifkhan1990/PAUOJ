import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Code2,
  ShieldCheck,
  Trophy,
  Zap,
} from "lucide-react";
import { AuthBackground } from "@/components/auth/auth-background";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { APP_VERSION } from "@/lib/constants";
import { cn } from "@/lib/utils";

type AuthShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
  mode?: "login" | "register";
  nextPath?: string;
};

const FEATURES = [
  { icon: ShieldCheck, label: "Sandboxed judge" },
  { icon: Zap, label: "Live verdicts" },
  { icon: Trophy, label: "Contests & Elo" },
  { icon: Code2, label: "10 languages" },
];

export function AuthShell({
  eyebrow,
  title,
  description,
  footer,
  children,
  mode,
  nextPath,
}: AuthShellProps) {
  const nextQuery =
    nextPath && nextPath !== "/"
      ? `?next=${encodeURIComponent(nextPath)}`
      : "";
  const loginHref = `/login${nextQuery}`;
  const registerHref = `/register${nextQuery}`;

  return (
    <div className="relative min-h-dvh overflow-hidden bg-background text-foreground">
      <AuthBackground />

      <main className="relative z-10 flex min-h-dvh items-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-[820px]">
          <div className="relative">
            <div
              aria-hidden
              className="absolute -inset-6 rounded-[2.5rem] bg-primary/10 blur-3xl"
            />

            <section className="relative z-10 overflow-hidden rounded-[2rem] border border-border bg-card text-card-foreground shadow-[0_50px_160px_-50px_rgba(0,0,0,0.95)] lg:grid lg:grid-cols-[0.9fr_1.1fr]">
              <aside className="relative hidden overflow-hidden bg-muted/40 p-8 text-foreground lg:flex lg:flex-col lg:justify-between dark:bg-[#07110d] dark:text-slate-100">
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.16),transparent_42%),radial-gradient(circle_at_bottom_right,rgba(245,158,11,0.1),transparent_38%)]"
                />
                <div className="relative">
                  <Link href="/" className="inline-flex items-center gap-2.5">
                    <Image
                      src="/brand/pauoj-mark.png"
                      alt=""
                      width={368}
                      height={383}
                      priority
                      className="h-10 w-auto"
                    />
                    <span className="flex flex-col leading-none">
                      <span className="text-[16px] font-semibold">PAU OJ</span>
                      <span className="mt-1 text-[9px] uppercase tracking-[0.22em] text-muted-foreground">
                        Online Judge
                      </span>
                    </span>
                  </Link>

                  <div className="mt-12">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
                      Built for problem solvers
                    </p>
                    <h2 className="mt-3 text-[2rem] font-semibold leading-[1.15] tracking-tight text-foreground">
                      Code. Submit.
                      <br />
                      Climb the board.
                    </h2>
                    <p className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground">
                      One account for practice problems, rated contests,
                      assessments and your coder profile.
                    </p>
                  </div>

                  <div className="mt-8 rounded-2xl border border-border bg-card/60 p-4 backdrop-blur-sm dark:border-white/10 dark:bg-white/[0.045]">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[9px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                        Sample profile
                      </span>
                      <span className="rounded-full border border-emerald-600/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[9px] text-emerald-700 dark:border-emerald-400/25 dark:bg-emerald-400/10 dark:text-emerald-200">
                        +10 last contest
                      </span>
                    </div>
                    <div className="mt-2 flex items-end justify-between gap-3">
                      <div className="flex items-end gap-2">
                        <span className="font-mono text-4xl font-semibold leading-none text-foreground">
                          1788
                        </span>
                        <span className="mb-0.5 rounded-full border border-sky-600/30 bg-sky-500/10 px-2 py-0.5 text-[9px] font-medium text-sky-700 dark:border-sky-400/30 dark:bg-sky-400/10 dark:text-sky-200">
                          Specialist
                        </span>
                      </div>
                      <span className="mb-1 text-[9px] text-muted-foreground">
                        Top 25%
                      </span>
                    </div>
                    <svg
                      viewBox="0 0 260 74"
                      className="mt-3 h-16 w-full"
                      aria-hidden="true"
                    >
                      <defs>
                        <linearGradient
                          id="auth-spark-fill"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="#2dd4bf"
                            stopOpacity="0.28"
                          />
                          <stop
                            offset="100%"
                            stopColor="#2dd4bf"
                            stopOpacity="0"
                          />
                        </linearGradient>
                      </defs>
                      <path
                        d="M0 58 C 30 58 48 44 72 47 S 124 33 154 36 S 214 16 260 12 L260 74 L0 74Z"
                        fill="url(#auth-spark-fill)"
                      />
                      <path
                        d="M0 58 C 30 58 48 44 72 47 S 124 33 154 36 S 214 16 260 12"
                        fill="none"
                        stroke="#2dd4bf"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />
                      <circle cx="72" cy="47" r="2.5" fill="#2dd4bf" />
                      <circle cx="154" cy="36" r="2.5" fill="#2dd4bf" />
                      <circle cx="260" cy="12" r="4" fill="#2dd4bf" />
                      <circle
                        cx="260"
                        cy="12"
                        r="8"
                        fill="#2dd4bf"
                        fillOpacity="0.18"
                      />
                    </svg>
                    <div className="mt-1 grid grid-cols-3 gap-2 border-t border-border pt-3 text-center">
                      {[
                        ["3", "contests"],
                        ["7", "solved"],
                        ["25%", "top slice"],
                      ].map(([value, label]) => (
                        <div key={label}>
                          <p className="font-mono text-sm font-semibold text-foreground">
                            {value}
                          </p>
                          <p className="text-[8px] uppercase tracking-[0.12em] text-muted-foreground">
                            {label}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="relative mt-8">
                  <div className="grid grid-cols-2 gap-2">
                    {FEATURES.map((feature) => (
                      <div
                        key={feature.label}
                        className="flex items-center gap-2 rounded-lg border border-border bg-card/50 px-2.5 py-2 text-[10px] text-muted-foreground dark:border-white/10 dark:bg-white/[0.025] dark:text-slate-300"
                      >
                        <feature.icon className="size-3.5 text-primary" />
                        {feature.label}
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 flex items-center justify-between text-[9px] text-muted-foreground">
                    <span>PrimeAsia University</span>
                    <span className="font-mono">v{APP_VERSION}</span>
                  </div>
                </div>
              </aside>

              <div className="p-6 sm:p-8 lg:flex lg:flex-col lg:justify-center lg:p-9">
                <div className="mb-6 flex items-center justify-between gap-3 lg:hidden">
                  <Link href="/" className="inline-flex items-center gap-2.5">
                    <Image
                      src="/brand/pauoj-mark.png"
                      alt=""
                      width={368}
                      height={383}
                      priority
                      className="h-9 w-auto"
                    />
                    <span className="flex flex-col leading-none">
                      <span className="text-[15px] font-semibold">PAU OJ</span>
                      <span className="mt-1 text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
                        Online Judge
                      </span>
                    </span>
                  </Link>
                  <span className="rounded-full border border-border px-2.5 py-1 font-mono text-[10px] text-muted-foreground">
                    v{APP_VERSION}
                  </span>
                </div>

                {mode ? (
                  <div className="mb-6 grid grid-cols-2 gap-1 rounded-xl border border-border bg-muted/30 p-1">
                    <Link
                      href={loginHref}
                      aria-current={mode === "login" ? "page" : undefined}
                      className={cn(
                        "rounded-lg px-3 py-2 text-center text-xs font-semibold transition-colors",
                        mode === "login"
                          ? "bg-card text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      Sign in
                    </Link>
                    <Link
                      href={registerHref}
                      aria-current={mode === "register" ? "page" : undefined}
                      className={cn(
                        "rounded-lg px-3 py-2 text-center text-xs font-semibold transition-colors",
                        mode === "register"
                          ? "bg-card text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      Create account
                    </Link>
                  </div>
                ) : null}

                <header>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
                    {eyebrow}
                  </p>
                  <h1
                    id="auth-title"
                    className="mt-2 text-[1.65rem] font-semibold leading-tight tracking-tight sm:text-3xl"
                  >
                    {title}
                  </h1>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {description}
                  </p>
                </header>

                <div className="mt-6">{children}</div>

                {footer ? (
                  <div className="mt-4 text-center text-[11px] leading-5 text-muted-foreground">
                    {footer}
                  </div>
                ) : null}

                <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 border-t border-border pt-4 text-[10px] text-muted-foreground lg:hidden">
                  <span className="inline-flex items-center gap-1.5">
                    <ShieldCheck className="size-3.5 text-primary" />
                    Sandboxed runs
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Zap className="size-3.5 text-primary" />
                    Live verdicts
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Check className="size-3.5 text-primary" />
                    Free account
                  </span>
                </div>
              </div>
            </section>
          </div>

          <div className="mt-4 flex items-center justify-between px-1">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-3.5" />
              Back to home
            </Link>
            <ThemeToggle className="text-muted-foreground hover:bg-muted hover:text-foreground" />
          </div>
        </div>
      </main>
    </div>
  );
}
