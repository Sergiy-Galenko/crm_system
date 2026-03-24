import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypeScript,
  {
    ignores: [".next/**", "frontend/.next/**", "node_modules/**", "tmp_crm_app/**"],
    settings: {
      next: {
        rootDir: "frontend",
      },
    },
    rules: {
      "@next/next/no-html-link-for-pages": "off",
    },
  },
];

export default eslintConfig;
