ALTER TABLE "ChatParticipant"
ADD COLUMN "lastReadAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX "ChatParticipant_lastReadAt_idx" ON "ChatParticipant"("lastReadAt");
