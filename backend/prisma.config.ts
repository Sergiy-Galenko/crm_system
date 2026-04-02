import { defineConfig, env } from "prisma/config";
import { loadWorkspaceEnv } from "./src/common/env/load-workspace-env";

loadWorkspaceEnv();

const isChat = process.argv.join(" ").includes("chat-schema.prisma");

export default defineConfig({
  schema: isChat ? "prisma/chat-schema.prisma" : "prisma/schema.prisma",
  engine: "classic",
  datasource: {
    url: isChat ? process.env.CHAT_DATABASE_URL! : env("DATABASE_URL"),
  },
});
