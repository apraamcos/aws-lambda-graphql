import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import unusedImports from "eslint-plugin-unused-imports";
import importX from "eslint-plugin-import-x";
import prettier from "eslint-config-prettier";

export const commonLintConfig = tseslint.config(
  {
    plugins: {
      ["@typescript-eslint"]: tseslint.plugin,
      "unused-imports": unusedImports,
      "import-x": importX
    }
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  {
    ignores: [
      "**/dist/**",
      "**/node_modules/**",
      "**/*.graphql",
      "**/*.mustache",
      "**/*.md",
      "entities/**",
      "**/*.js",
      "**/*.cjs",
      "**/*.mjs"
    ]
  }
);

export const getLintModuleConfiguration = ({ files, tsConfigPath, extraRules }) =>
  tseslint.config({
    files,
    languageOptions: {
      sourceType: "module",
      parserOptions: {
        ecmaVersion: 2022,
        projectService: true,
        tsconfigRootDir: tsConfigPath,
        warnOnUnsupportedTypeScriptVersion: false
      }
    },
    settings: {
      "import-x/parsers": {
        "@typescript-eslint/parser": [".ts", ".tsx"]
      },
      "import-x/resolver": {
        typescript: {
          project: tsConfigPath
        }
      }
    },
    rules: {
      // conflict with recommendation
      "no-useless-escape": 0,
      "no-empty": 0,
      "comma-dangle": 0,
      "consistent-return": 0,
      "no-param-reassign": 0,
      "no-useless-return": 0,
      "no-unsafe-finally": 2,
      "no-case-declarations": 0,
      "no-async-promise-executor": 0,
      "arrow-parens": ["error", "as-needed"],
      curly: ["error", "all"],

      // conflict ts
      // can open but too much work, later
      "@typescript-eslint/no-unused-vars": 0,
      "@typescript-eslint/no-explicit-any": 0,
      "@typescript-eslint/no-duplicate-enum-values": 0,
      "@typescript-eslint/ban-ts-comment": 0,
      "@typescript-eslint/ban-types": 0,
      "@typescript-eslint/no-unsafe-function-type": 0,
      "@typescript-eslint/no-unused-expressions": 0,

      // extra rules help
      "object-curly-newline": 2,
      "eol-last": 2,
      "no-return-assign": 2,
      "no-unneeded-ternary": 2,
      yoda: 2,
      "spaced-comment": 2,

      // typescript rules
      "@typescript-eslint/no-empty-object-type": 2,
      "@typescript-eslint/consistent-type-imports": 2,
      "@typescript-eslint/consistent-type-exports": 2,
      "@typescript-eslint/no-empty-interface": 2,
      // maybe 2 by default
      "@typescript-eslint/no-non-null-asserted-optional-chain": 2,

      // import rules
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "off",
        { vars: "all", varsIgnorePattern: "^_", args: "after-used", argsIgnorePattern: "^_" }
      ],
      "import-x/no-cycle": [2, { ignoreExternal: true }],
      "import-x/no-duplicates": "error",
      "import-x/no-unresolved": "error",
      "no-restricted-syntax": [
        "error",
        {
          message: "Please don't use Decimal.sum. It's not work on big array!",
          selector: 'MemberExpression[object.name="Decimal"][property.name="sum"]'
        },
        {
          message:
            "Lodash chain() function is not allowed. Reference: https://github.com/lodash/lodash/issues/3298",
          selector: 'CallExpression[callee.name="chain"]'
        }
      ],
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "lodash-es",
              importNames: ["chain"],
              message:
                "Importing chain() from lodash is not allowed. Reference: https://github.com/lodash/lodash/issues/3298"
            },
            {
              name: "lodash-es/chain",
              message:
                "Importing chain from lodash is not allowed. Reference: https://github.com/lodash/lodash/issues/3298"
            }
          ]
        }
      ],
      ...(extraRules || {})
    }
  });

export default tseslint.config(
  ...commonLintConfig,
  ...getLintModuleConfiguration({ files: ["**/*.ts"], extraRules: {} })
);
