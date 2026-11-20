import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function FinalCta({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <section id="start" className="mx-auto max-w-7xl scroll-mt-20 px-4 pb-20 sm:px-6 lg:px-8">
      <div className="reveal relative overflow-hidden rounded-2xl border border-primary/20 bg-[#0b1411] px-6 py-14 text-center shadow-2xl shadow-emerald-950/10 sm:px-10">
        <div
          className="grid-pattern absolute inset-0 opacity-10"
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(45,212,191,0.18),transparent_45%),radial-gradient(circle_at_75%_90%,rgba(245,158,11,0.10),transparent_40%)]"
          aria-hidden
        />
        <div className="relative">
          <Image
            src="/brand/pauoj-mark.png"
            alt=""
            width={368}
            height={383}
            className="mx-auto h-12 w-auto animate-float-slow"
          />
          <h2 className="mx-auto mt-5 max-w-2xl text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Your next accepted solution starts here.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-400">
            Pick a problem, open the editor and submit. Real compilers, real
            tests and a verdict in seconds.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-2.5">
            <Link
              href="/problems"
              className={cn(buttonVariants({ size: "lg" }), "group")}
            >
              Start solving
              <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
            <Link
              href={isAuthenticated ? "/settings" : "/register"}
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white",
              )}
            >
              {isAuthenticated ? "Your account" : "Create an account"}
            </Link>
          </div>
          <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">
            5 languages · sandboxed runs · live verdicts
          </p>
        </div>
      </div>
    </section>
  );
}
