import Link from "next/link";
import { APP_NAME, APP_VERSION } from "@/lib/constants";

const footerLinks = [
  { href: "/changelog", label: "Changelog" },
  { href: "/docs", label: "User guide" },
  { href: "/problems", label: "Problems" },
  { href: "/", label: "Public site" },
];

export function ReferenceFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-border py-6">
      <div className="flex flex-col gap-2 text-[11px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>
          © {year} {APP_NAME}
          <span className="mx-1.5 text-border">·</span>
          <span className="font-mono">v{APP_VERSION}</span>
        </p>
        <nav aria-label="Reference footer" className="flex flex-wrap gap-x-4 gap-y-1">
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
