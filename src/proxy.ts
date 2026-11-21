import { NextResponse, type NextRequest } from "next/server";
import { getSql } from "@/server/db";
import { SESSION_COOKIE } from "@/lib/auth-cookie";

/**
 * `notFound()` inside the page runs after the `(app)/loading.tsx` boundary has
 * started streaming, so the response keeps a 200 status. This pre-render check
 * returns a real 404 for unknown slugs while leaving the page's own access and
 * lock handling untouched for every existing row.
 *
 * Anonymous `/contribute` requests still go to the page's sign-in gate; a
 * signed-in request for an unknown slug gets the 404 here.
 */
export async function proxy(request: NextRequest) {
  const match = /^\/problems\/([^/]+)(\/contribute)?\/?$/.exec(
    request.nextUrl.pathname,
  );
  if (!match) return NextResponse.next();

  const isContribute = Boolean(match[2]);
  if (isContribute && !request.cookies.has(SESSION_COOKIE)) {
    return NextResponse.next();
  }

  let slug: string;
  try {
    slug = decodeURIComponent(match[1]);
  } catch {
    return new NextResponse(null, { status: 404 });
  }

  try {
    const rows = await getSql()`select 1 from problems where slug = ${slug} limit 1`;
    if (rows.length === 0) {
      return NextResponse.rewrite(new URL("/_not-found", request.url), {
        status: 404,
      });
    }
  } catch {
    // A database outage should not turn every problem into a 404.
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/problems/:slug", "/problems/:slug/contribute"],
};
