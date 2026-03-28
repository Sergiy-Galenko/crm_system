import { defineConfig, env } from "prisma/config";
import { loadWorkspaceEnv } from "./src/common/env/load-workspace-env";

loadWorkspaceEnv();

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  datasource: {
    url: env("DATABASE_URL"),
  },
});
