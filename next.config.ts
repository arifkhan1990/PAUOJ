import type { NextConfig } from "next";
import pkg from "./package.json";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION:
      process.env.NEXT_PUBLIC_APP_VERSION ?? pkg.version,
  },
  output: "standalone",
  poweredByHeader: false,
  serverExternalPackages: ["@node-rs/argon2", "postgres"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async redirects() {
    // Messaging and notifications moved inside the coder dashboard. Temporary
    // (307) so old bookmarks keep working without being cached forever.
    return [
      {
        source: "/notifications",
        destination: "/dashboard/notifications",
        permanent: false,
      },
      {
        source: "/messages",
        destination: "/dashboard/messages",
        permanent: false,
      },
      {
        source: "/messages/:id",
        destination: "/dashboard/messages/:id",
        permanent: false,
      },
      {
        source: "/connections/requests",
        destination: "/dashboard/connections/requests",
        permanent: false,
      },
      {
        source: "/connections",
        destination: "/dashboard/connections",
        permanent: false,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      {
        // Invite links carry a bearer token in the path. This rule must come
        // after the global policy so it overrides the Referrer-Policy value.
        source: "/assessments/:slug/invite/:token",
        headers: [
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "Cache-Control", value: "no-store" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
      {
        source: "/api/v1/assessments/:slug/invites/:token",
        headers: [
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "Cache-Control", value: "no-store" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
    ];
  },
};

export default nextConfig;
