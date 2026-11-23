import Image from "next/image";
import Link from "next/link";
import { APP_NAME, APP_VERSION } from "@/lib/constants";

/** Tappable row on phones, compact inline link from md up. */
const footerLink =
  "inline-flex min-h-11 items-center hover:text-primary md:min-h-0";

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr] lg:px-8">
        <div>
          <div className="flex items-center gap-2.5">
            <Image
              src="/brand/pauoj-mark.png"
              alt=""
              width={368}
              height={383}
              className="h-9 w-auto"
            />
            <div>
              <p className="text-sm font-semibold">{APP_NAME}</p>
              <p className="text-xs text-muted-foreground">
                PrimeAsia University Online Judge
              </p>
            </div>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
            A real online judge for programming practice, university contests and
            coding assessments. Write code in your browser, get sandboxed
            verdicts, and track your progress.
          </p>
        </div>
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Platform
          </h3>
          <ul className="mt-3 space-y-1 text-sm md:space-y-2">
            <li>
              <Link href="/problems" className={footerLink}>
                Problems
              </Link>
            </li>
            <li>
              <Link href="/contests" className={footerLink}>
                Contests
              </Link>
            </li>
            <li>
              <Link href="/submissions" className={footerLink}>
                Submissions
              </Link>
            </li>
            <li>
              <Link href="/rank" className={footerLink}>
                Ranking
              </Link>
            </li>
            <li>
              <Link href="/reviewers" className={footerLink}>
                Reviewers
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Resources
          </h3>
          <ul className="mt-3 space-y-1 text-sm md:space-y-2">
            <li>
              <Link href="/docs" className={footerLink}>
                User guide
              </Link>
            </li>
            <li>
              <Link href="/changelog" className={footerLink}>
                Changelog
              </Link>
            </li>
            <li>
              <Link href="/docs#judging" className={footerLink}>
                How judging works
              </Link>
            </li>
            <li>
              <a href="/health" className={footerLink}>
                System health
              </a>
            </li>
            <li>
              <Link href="/register" className={footerLink}>
                Create an account
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-4 text-xs text-muted-foreground sm:flex-row sm:px-6 lg:px-8">
          <p>
            © {year} PrimeAsia University Online Judge. All rights reserved.
          </p>
          <p className="font-mono">v{APP_VERSION}</p>
        </div>
      </div>
    </footer>
  );
}
