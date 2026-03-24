-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'MANAGER');

-- CreateEnum
CREATE TYPE "ClientStatus" AS ENUM ('ACTIVE', 'AT_RISK', 'INACTIVE');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'WON', 'LOST');

-- CreateEnum
CREATE TYPE "LeadSource" AS ENUM ('WEBSITE', 'REFERRAL', 'OUTBOUND', 'PARTNER', 'EVENT');

-- CreateEnum
CREATE TYPE "DealStage" AS ENUM ('DISCOVERY', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'DONE');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENT', 'FIXED');

-- CreateEnum
CREATE TYPE "ActivityEntity" AS ENUM ('USER', 'CLIENT', 'LEAD', 'DEAL', 'PROMO_CODE', 'TASK', 'NOTE', 'SYSTEM');

-- CreateEnum
CREATE TYPE "ActivityAction" AS ENUM ('CREATED', 'UPDATED', 'STATUS_CHANGED', 'PROMO_APPLIED', 'COMPLETED', 'LOGIN', 'REGISTERED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'MANAGER',
    "title" TEXT,
    "avatarColor" TEXT NOT NULL DEFAULT '#2154FF',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "status" "ClientStatus" NOT NULL DEFAULT 'ACTIVE',
    "segment" TEXT,
    "location" TEXT,
    "monthlyValue" DECIMAL(12,2) NOT NULL,
    "totalRevenue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "lastContactAt" TIMESTAMP(3),
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "source" "LeadSource" NOT NULL,
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "estimatedValue" DECIMAL(12,2) NOT NULL,
    "nextFollowUpAt" TIMESTAMP(3),
    "ownerId" TEXT NOT NULL,
    "clientId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Deal" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "stage" "DealStage" NOT NULL DEFAULT 'DISCOVERY',
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "grossAmount" DECIMAL(12,2) NOT NULL,
    "discountAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "netAmount" DECIMAL(12,2) NOT NULL,
    "closeDate" TIMESTAMP(3),
    "clientId" TEXT NOT NULL,
    "leadId" TEXT,
    "ownerId" TEXT NOT NULL,
    "promoCodeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Deal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Note" (
    "id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "clientId" TEXT,
    "leadId" TEXT,
    "dealId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "TaskStatus" NOT NULL DEFAULT 'TODO',
    "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "dueDate" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "assignedToId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "clientId" TEXT,
    "leadId" TEXT,
    "dealId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromoCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "usageLimit" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "discountType" "DiscountType" NOT NULL,
    "discountValue" DECIMAL(12,2) NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromoCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromoCodeUsage" (
    "id" TEXT NOT NULL,
    "promoCodeId" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "appliedById" TEXT NOT NULL,
    "usedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dealAmount" DECIMAL(12,2) NOT NULL,
    "discountAmount" DECIMAL(12,2) NOT NULL,
    "discountType" "DiscountType" NOT NULL,
    "discountValue" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "PromoCodeUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "entity" "ActivityEntity" NOT NULL,
    "action" "ActivityAction" NOT NULL,
    "entityId" TEXT,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Client_email_key" ON "Client"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Lead_email_key" ON "Lead"("email");

-- CreateIndex
CREATE UNIQUE INDEX "PromoCode_code_key" ON "PromoCode"("code");

-- CreateIndex
CREATE UNIQUE INDEX "PromoCodeUsage_dealId_key" ON "PromoCodeUsage"("dealId");

-- CreateIndex
CREATE INDEX "ActivityLog_createdAt_idx" ON "ActivityLog"("createdAt");

-- CreateIndex
CREATE INDEX "ActivityLog_entity_idx" ON "ActivityLog"("entity");

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_promoCodeId_fkey" FOREIGN KEY ("promoCodeId") REFERENCES "PromoCode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromoCode" ADD CONSTRAINT "PromoCode_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromoCodeUsage" ADD CONSTRAINT "PromoCodeUsage_promoCodeId_fkey" FOREIGN KEY ("promoCodeId") REFERENCES "PromoCode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromoCodeUsage" ADD CONSTRAINT "PromoCodeUsage_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromoCodeUsage" ADD CONSTRAINT "PromoCodeUsage_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromoCodeUsage" ADD CONSTRAINT "PromoCodeUsage_appliedById_fkey" FOREIGN KEY ("appliedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
