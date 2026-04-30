import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Root-level drop-in source files preserved for reference; the live
    // implementations live in components/bug-picker.tsx + lib/picker-bugs.ts.
    "bug-picker.jsx",
    "bug-picker.css",
    "bugs-data.js",
  ]),
]);

export default eslintConfig;
