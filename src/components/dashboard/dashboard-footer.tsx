import Link from "next/link";
import { APP_NAME, APP_VERSION } from "@/lib/constants";

const footerLinks = [
  { href: "/changelog", label: "Changelog" },
  { href: "/docs", label: "User guide" },
  { href: "/health", label: "System health" },
  { href: "/", label: "Public site" },
];

export function DashboardFooter() {
  return (
    <footer className="mt-auto border-t border-border px-4 py-4 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[11px] text-muted-foreground">
          {APP_NAME}{" "}
          <span className="font-mono">v{APP_VERSION}</span>
          <span className="mx-1.5 text-border">·</span>
          PrimeAsia University Online Judge
        </p>
        <nav
          aria-label="Dashboard footer"
          className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground"
        >
          {footerLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-primary"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
