import path from "node:path";
import { build } from "esbuild";

const alias = {
  "@": path.resolve("src"),
};

const shared = {
  bundle: true,
  platform: "node",
  target: "node22",
  format: "cjs",
  sourcemap: true,
  alias,
  external: ["@node-rs/argon2"],
  logLevel: "info",
};

await build({
  ...shared,
  entryPoints: ["src/worker/index.ts"],
  outfile: "dist/worker.js",
});

await build({
  ...shared,
  entryPoints: ["src/server/db/migrate.ts"],
  outfile: "dist/migrate.js",
});

await build({
  ...shared,
  entryPoints: ["src/server/db/seed.ts"],
  outfile: "dist/seed.js",
});

await build({
  ...shared,
  entryPoints: ["src/server/db/reset-admin.ts"],
  outfile: "dist/reset-admin.js",
});
