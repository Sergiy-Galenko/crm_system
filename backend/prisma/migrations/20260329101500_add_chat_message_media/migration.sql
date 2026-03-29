CREATE TYPE "ChatMessageMediaType" AS ENUM ('IMAGE', 'VIDEO');

ALTER TABLE "ChatMessage"
ALTER COLUMN "body" DROP NOT NULL,
ADD COLUMN "mediaUrl" TEXT,
ADD COLUMN "mediaType" "ChatMessageMediaType";

CREATE INDEX "ChatMessage_mediaType_idx" ON "ChatMessage"("mediaType");
