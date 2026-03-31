-- CreateTable
CREATE TABLE "RecordComment" (
    "id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "editedAt" TIMESTAMP(3),
    "mentionUserIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "authorId" TEXT NOT NULL,
    "taskId" TEXT,
    "meetingId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecordComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RecordComment_authorId_idx" ON "RecordComment"("authorId");

-- CreateIndex
CREATE INDEX "RecordComment_taskId_createdAt_idx" ON "RecordComment"("taskId", "createdAt");

-- CreateIndex
CREATE INDEX "RecordComment_meetingId_createdAt_idx" ON "RecordComment"("meetingId", "createdAt");

-- AddForeignKey
ALTER TABLE "RecordComment" ADD CONSTRAINT "RecordComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecordComment" ADD CONSTRAINT "RecordComment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecordComment" ADD CONSTRAINT "RecordComment_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;
