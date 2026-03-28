ALTER TABLE "User"
ADD COLUMN "nickname" TEXT;

CREATE UNIQUE INDEX "User_nickname_key" ON "User"("nickname");
