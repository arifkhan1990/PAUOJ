import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "max-lines": ["error", { max: 400, skipBlankLines: true, skipComments: true }],
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/purity": "off",
    },
  },
  {
    files: ["judge/**/*.js"],
    rules: {
      // The judge scripts run as plain CommonJS files inside the sandbox image;
      // they are not part of the Next.js bundle.
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "dist/**",
    "drizzle/**",
    "public/monaco/**",
    "PAU-OJ-Design/**",
    "rules-kit/**",
    "next-env.d.ts",
    "coverage/**",
  ]),
]);

export default eslintConfig;
