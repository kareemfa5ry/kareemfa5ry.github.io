// @ts-check
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";
import eslintPluginAstro from "eslint-plugin-astro";
import { importX, createNodeResolver } from "eslint-plugin-import-x";

// Structural caps from the fable-code skill; never loosen these, split the code instead.
/** @type {import("eslint").Linter.RulesRecord} */
const FABLE_CODE_RULES = {
  "max-lines": ["error", { max: 400, skipBlankLines: false, skipComments: false }],
  complexity: ["error", 10],
  "max-params": ["error", 5],
  "max-depth": ["error", 4],
  "max-statements": ["error", 50],
  "max-len": ["error", { code: 120, ignoreUrls: true, ignoreStrings: true }],
};

export default defineConfig(
  { ignores: ["dist/", ".astro/", "node_modules/"] },
  tseslint.configs.recommended,
  eslintPluginAstro.configs.recommended,
  {
    plugins: { "import-x": importX },
    settings: {
      "import-x/resolver-next": [createNodeResolver({ extensions: [".ts", ".js", ".mjs", ".astro"] })],
      "import-x/extensions": [".ts", ".js", ".mjs", ".astro"],
      // .astro is left to each file's own parser: astro-eslint-parser is ESM-only and import-x require()s by name.
      "import-x/parsers": { "@typescript-eslint/parser": [".ts"] },
    },
    rules: { "import-x/no-cycle": "error", ...FABLE_CODE_RULES },
  },
);
