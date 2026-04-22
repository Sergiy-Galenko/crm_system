import { Global, Module } from "@nestjs/common";
import { AuthPrismaService } from "./auth-prisma.service";
import { PrismaService } from "./prisma.service";
import { ChatPrismaService } from "./chat-prisma.service";

@Global()
@Module({
  providers: [PrismaService, ChatPrismaService, AuthPrismaService],
  exports: [PrismaService, ChatPrismaService, AuthPrismaService],
})
export class PrismaModule {}
