import tseslint from "typescript-eslint";
import vuePlugin from "eslint-plugin-vue";
import vueParser from "vue-eslint-parser";

const isProduction = process.env.NODE_ENV === "production";

export default tseslint.config(
  ...tseslint.configs.recommended,
  ...vuePlugin.configs["flat/base"],
  ...vuePlugin.configs["flat/essential"],

  {
    files: ["**/*.js", "**/*.ts", "**/*.tsx", "**/*.vue"],
    languageOptions: {
      parser: vueParser, 
      parserOptions: {
        parser: tseslint.parser, 
        sourceType: "module",
        ecmaVersion: "latest",
        // PERFORMANCE BOOST: Stops ESLint from searching your whole disk for tsconfig files
        extraFileExtensions: [".vue"],
      },
    },
    // PERFORMANCE BOOST: Ignore massive folders so ESLint doesn't scan them
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.nuxt/**",
      "**/public/**"
    ],
    rules: {
      "prefer-const": isProduction ? "warn" : "error",                      
      "no-unneeded-ternary": isProduction ? "warn" : "error",               
      "@typescript-eslint/no-explicit-any": "warn", 
      "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }] 
    },
  }
);
