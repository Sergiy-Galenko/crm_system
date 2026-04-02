import { Global, Module } from "@nestjs/common";
import { PrismaService } from "./prisma.service";
import { ChatPrismaService } from "./chat-prisma.service";

@Global()
@Module({
  providers: [PrismaService, ChatPrismaService],
  exports: [PrismaService, ChatPrismaService],
})
export class PrismaModule {}
