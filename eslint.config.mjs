import nextConfig from "eslint-config-next"
import eslintConfigPrettier from "eslint-config-prettier"
import tseslint from "typescript-eslint"

export default [
    ...nextConfig,
    eslintConfigPrettier,
    ...tseslint.configs.recommended,
    {
        rules: {
            "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
            "@typescript-eslint/no-explicit-any": "warn",
            "@next/next/no-img-element": "off",
            "react/no-unescaped-entities": "off",
            "react-hooks/set-state-in-effect": "off",
        },
    },
]
