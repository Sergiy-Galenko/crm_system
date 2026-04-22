import { defineConfig, env } from "prisma/config";
import { loadWorkspaceEnv } from "./src/common/env/load-workspace-env";

loadWorkspaceEnv();

const joinedArgs = process.argv.join(" ");
const isChat = joinedArgs.includes("chat-schema.prisma");
const isAuth = joinedArgs.includes("prisma/auth/schema.prisma") || joinedArgs.includes("prisma\\auth\\schema.prisma");

export default defineConfig({
  schema: isChat ? "prisma/chat-schema.prisma" : isAuth ? "prisma/auth/schema.prisma" : "prisma/schema.prisma",
  engine: "classic",
  datasource: {
    url: isChat ? process.env.CHAT_DATABASE_URL! : isAuth ? env("AUTH_DATABASE_URL") : env("DATABASE_URL"),
  },
});
