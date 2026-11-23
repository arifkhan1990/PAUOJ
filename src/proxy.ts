import { NextResponse, type NextRequest } from "next/server";
import { getSql } from "@/server/db";
import { SESSION_COOKIE } from "@/lib/auth-cookie";
import { isLearningRoute } from "@/lib/learning/route-slugs";

/**
 * `notFound()` inside the page runs after the `(app)/loading.tsx` boundary has
 * started streaming, so the response keeps a 200 status. This pre-render check
 * returns a real 404 for unknown slugs while leaving the page's own access and
 * lock handling untouched for every existing row.
 *
 * Anonymous `/contribute` requests still go to the page's sign-in gate; a
 * signed-in request for an unknown slug gets the 404 here.
 *
 * Learning tracks use a static route index so `/learn/<unknown>` is a real
 * 404 before the page's streaming boundary, without importing the curriculum
 * content into the proxy.
 */
/** Non-module pages below /learn that the static route index must allow. */
const RESERVED_LEARNING_SEGMENTS = new Set(["pricing"]);

export async function proxy(request: NextRequest) {
  const learningMatch = /^\/learn\/([^/]+)(?:\/([^/]+))?\/?$/.exec(
    request.nextUrl.pathname,
  );
  if (learningMatch) {
    let moduleSlug: string;
    let topicSlug: string | undefined;
    try {
      moduleSlug = decodeURIComponent(learningMatch[1] ?? "");
      topicSlug = learningMatch[2]
        ? decodeURIComponent(learningMatch[2])
        : undefined;
    } catch {
      return new NextResponse(null, { status: 404 });
    }
    if (
      topicSlug === undefined &&
      RESERVED_LEARNING_SEGMENTS.has(moduleSlug)
    ) {
      return NextResponse.next();
    }
    if (!isLearningRoute(moduleSlug, topicSlug)) {
      return NextResponse.rewrite(new URL("/_not-found", request.url), {
        status: 404,
      });
    }
    return NextResponse.next();
  }

  const listMatch = /^\/lists\/([^/]+)\/?$/.exec(request.nextUrl.pathname);
  if (listMatch) {
    let slug: string;
    try {
      slug = decodeURIComponent(listMatch[1] ?? "");
    } catch {
      return new NextResponse(null, { status: 404 });
    }
    try {
      const rows = await getSql()`select is_public from study_lists where slug = ${slug} limit 1`;
      if (rows.length === 0 || rows[0]?.is_public === false) {
        return NextResponse.rewrite(new URL("/_not-found", request.url), {
          status: 404,
        });
      }
    } catch {
      // A database outage should not turn every study plan into a 404.
    }
    return NextResponse.next();
  }

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
  matcher: [
    "/problems/:slug",
    "/problems/:slug/contribute",
    "/learn/:module",
    "/learn/:module/:topic",
    "/lists/:slug",
  ],
};
