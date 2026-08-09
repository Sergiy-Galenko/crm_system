import { Global, Module } from "@nestjs/common";
import { AuthPrismaService, authPrisma } from "./auth-prisma.service";
import { PrismaService, prisma } from "./prisma.service";
import { ChatPrismaService, chatPrisma } from "./chat-prisma.service";

@Global()
@Module({
  // The frontend adapter and NestJS share these instances within a process.
  // Registering classes directly would create a second client and DB pool per schema.
  providers: [
    { provide: PrismaService, useValue: prisma },
    { provide: ChatPrismaService, useValue: chatPrisma },
    { provide: AuthPrismaService, useValue: authPrisma },
  ],
  exports: [PrismaService, ChatPrismaService, AuthPrismaService],
})
export class PrismaModule {}
