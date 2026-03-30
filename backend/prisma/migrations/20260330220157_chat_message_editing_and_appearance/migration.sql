-- CreateEnum
CREATE TYPE "ChatMessageStatus" AS ENUM ('SENT', 'DELIVERED', 'READ');

-- CreateEnum
CREATE TYPE "ChatBackgroundType" AS ENUM ('ABSTRACT', 'SOLID', 'GRADIENT', 'IMAGE');

-- AlterTable
ALTER TABLE "ChatMessage" ADD COLUMN     "editedAt" TIMESTAMP(3),
ADD COLUMN     "replyToMessageId" TEXT,
ADD COLUMN     "status" "ChatMessageStatus" NOT NULL DEFAULT 'SENT';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "chatBackgroundColor" TEXT,
ADD COLUMN     "chatBackgroundImageUrl" TEXT,
ADD COLUMN     "chatBackgroundType" "ChatBackgroundType" NOT NULL DEFAULT 'ABSTRACT';

-- CreateIndex
CREATE INDEX "ChatMessage_status_idx" ON "ChatMessage"("status");

-- CreateIndex
CREATE INDEX "ChatMessage_replyToMessageId_idx" ON "ChatMessage"("replyToMessageId");

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_replyToMessageId_fkey" FOREIGN KEY ("replyToMessageId") REFERENCES "ChatMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
