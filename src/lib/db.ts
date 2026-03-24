import { Prisma, PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaSchemaKey?: string;
};

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

function getPrismaSchemaKey() {
  return JSON.stringify({
    user: Prisma.UserScalarFieldEnum,
    client: Prisma.ClientScalarFieldEnum,
    lead: Prisma.LeadScalarFieldEnum,
    deal: Prisma.DealScalarFieldEnum,
    task: Prisma.TaskScalarFieldEnum,
    meeting: Prisma.MeetingScalarFieldEnum,
    promoCode: Prisma.PromoCodeScalarFieldEnum,
    promoCodeUsage: Prisma.PromoCodeUsageScalarFieldEnum,
    activityLog: Prisma.ActivityLogScalarFieldEnum,
  });
}

const prismaSchemaKey = getPrismaSchemaKey();
const shouldReusePrisma = globalForPrisma.prisma && globalForPrisma.prismaSchemaKey === prismaSchemaKey;

if (!shouldReusePrisma && globalForPrisma.prisma) {
  void globalForPrisma.prisma.$disconnect().catch(() => undefined);
}

export const prisma = shouldReusePrisma ? globalForPrisma.prisma! : createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaSchemaKey = prismaSchemaKey;
}
