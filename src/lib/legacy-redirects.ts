import type { NextConfig } from "next";

type Redirect = NonNullable<
  Awaited<ReturnType<NonNullable<NextConfig["redirects"]>>>
>[number];

/**
 * Social pages moved inside the coder dashboard (T-161). These are permanent
 * (308) so search engines and clients update their stored links immediately.
 * Query strings are forwarded by Next's redirect handling.
 *
 * Safe to remove in a later release once old inbound links have aged out.
 */
export const legacyRedirects: Redirect[] = [
  {
    source: "/notifications",
    destination: "/dashboard/notifications",
    permanent: true,
  },
  {
    source: "/messages",
    destination: "/dashboard/messages",
    permanent: true,
  },
  {
    source: "/messages/:id",
    destination: "/dashboard/messages/:id",
    permanent: true,
  },
  {
    source: "/connections/requests",
    destination: "/dashboard/connections/requests",
    permanent: true,
  },
  {
    source: "/connections",
    destination: "/dashboard/connections",
    permanent: true,
  },
];
