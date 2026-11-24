import { createHash } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { getSql } from "@/server/db";
import { SESSION_COOKIE } from "@/lib/auth-cookie";
import { isLearningRoute } from "@/lib/learning/route-slugs";

/** Sessions store the SHA-256 of the raw cookie token, never the token itself. */
function sessionTokenHash(request: NextRequest): string | null {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return createHash("sha256").update(token).digest("hex");
}

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
const RESERVED_LEARNING_SEGMENTS = new Set(["pricing", "sql"]);

/** Non-plan pages below /lists that the slug check must allow. */
const RESERVED_STUDY_LIST_SEGMENTS = new Set(["new"]);

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

  const listMatch = /^\/lists\/([^/]+)(\/edit)?\/?$/.exec(
    request.nextUrl.pathname,
  );
  if (listMatch) {
    const isEdit = Boolean(listMatch[2]);
    let slug: string;
    try {
      slug = decodeURIComponent(listMatch[1] ?? "");
    } catch {
      return new NextResponse(null, { status: 404 });
    }
    if (!isEdit && RESERVED_STUDY_LIST_SEGMENTS.has(slug)) {
      return NextResponse.next();
    }
    const tokenHash = sessionTokenHash(request);
    try {
      const rows = await getSql()`
        select l.is_public, l.created_by, s.user_id as session_user_id
        from study_lists l
        left join sessions s
          on s.token_hash = ${tokenHash}
         and s.expires_at > now()
        where l.slug = ${slug}
        limit 1`;
      const row = rows[0];
      if (!row) {
        return NextResponse.rewrite(new URL("/_not-found", request.url), {
          status: 404,
        });
      }
      const isOwner =
        tokenHash !== null &&
        typeof row.created_by === "string" &&
        row.session_user_id === row.created_by;
      // The edit page is owner-only; private pages are owner-only for everyone.
      if (isEdit || row.is_public === false) {
        if (!isOwner) {
          return NextResponse.rewrite(new URL("/_not-found", request.url), {
            status: 404,
          });
        }
      }
    } catch {
      // A database outage should not turn every study plan into a 404.
    }
    return NextResponse.next();
  }

  const userMatch = /^\/users\/([^/]+)(\/connections)?\/?$/.exec(
    request.nextUrl.pathname,
  );
  if (userMatch) {
    let rawUsername: string;
    try {
      rawUsername = decodeURIComponent(userMatch[1] ?? "");
    } catch {
      return new NextResponse(null, { status: 404 });
    }
    const username = rawUsername.toLowerCase();
    if (rawUsername !== username) {
      const url = request.nextUrl.clone();
      url.pathname = `/users/${username}${userMatch[2] ?? ""}`;
      return NextResponse.redirect(url, 301);
    }
    try {
      const rows = await getSql()`
        select 1 from users
        where username = ${username} and is_banned = false
        limit 1`;
      if (rows.length === 0) {
        return NextResponse.rewrite(new URL("/_not-found", request.url), {
          status: 404,
        });
      }
    } catch {
      // A database outage should not turn every profile into a 404.
    }
    return NextResponse.next();
  }

  const contestMatch = /^\/contests\/([^/]+)(?:\/.*)?\/?$/.exec(
    request.nextUrl.pathname,
  );
  if (contestMatch) {
    let contestSlug: string;
    try {
      contestSlug = decodeURIComponent(contestMatch[1] ?? "");
    } catch {
      return new NextResponse(null, { status: 404 });
    }
    if (contestSlug === "host") return NextResponse.next();
    try {
      const rows = await getSql()`
        select 1 from contests where slug = ${contestSlug} limit 1`;
      if (rows.length === 0) {
        return NextResponse.rewrite(new URL("/_not-found", request.url), {
          status: 404,
        });
      }
    } catch {
      // A database outage should not turn every contest into a 404.
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
    "/contests/:slug",
    "/contests/:slug/standings",
    "/contests/:slug/submissions",
    "/contests/:slug/clarifications",
    "/contests/:slug/virtual",
    "/contests/:slug/sponsor",
    "/learn/:module",
    "/learn/:module/:topic",
    "/lists/:slug",
    "/lists/:slug/edit",
    "/users/:username",
    "/users/:username/connections",
  ],
};
