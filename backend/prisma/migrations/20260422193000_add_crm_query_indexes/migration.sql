CREATE INDEX IF NOT EXISTS "Client_ownerId_idx" ON "Client"("ownerId");
CREATE INDEX IF NOT EXISTS "Client_status_idx" ON "Client"("status");
CREATE INDEX IF NOT EXISTS "Client_createdAt_idx" ON "Client"("createdAt");
CREATE INDEX IF NOT EXISTS "Client_lastContactAt_idx" ON "Client"("lastContactAt");

CREATE INDEX IF NOT EXISTS "Lead_ownerId_idx" ON "Lead"("ownerId");
CREATE INDEX IF NOT EXISTS "Lead_clientId_idx" ON "Lead"("clientId");
CREATE INDEX IF NOT EXISTS "Lead_status_idx" ON "Lead"("status");
CREATE INDEX IF NOT EXISTS "Lead_source_idx" ON "Lead"("source");
CREATE INDEX IF NOT EXISTS "Lead_nextFollowUpAt_idx" ON "Lead"("nextFollowUpAt");
CREATE INDEX IF NOT EXISTS "Lead_createdAt_idx" ON "Lead"("createdAt");

CREATE INDEX IF NOT EXISTS "Deal_clientId_idx" ON "Deal"("clientId");
CREATE INDEX IF NOT EXISTS "Deal_leadId_idx" ON "Deal"("leadId");
CREATE INDEX IF NOT EXISTS "Deal_ownerId_idx" ON "Deal"("ownerId");
CREATE INDEX IF NOT EXISTS "Deal_promoCodeId_idx" ON "Deal"("promoCodeId");
CREATE INDEX IF NOT EXISTS "Deal_stage_idx" ON "Deal"("stage");
CREATE INDEX IF NOT EXISTS "Deal_closeDate_idx" ON "Deal"("closeDate");
CREATE INDEX IF NOT EXISTS "Deal_createdAt_idx" ON "Deal"("createdAt");

CREATE INDEX IF NOT EXISTS "Note_authorId_idx" ON "Note"("authorId");
CREATE INDEX IF NOT EXISTS "Note_clientId_createdAt_idx" ON "Note"("clientId", "createdAt");
CREATE INDEX IF NOT EXISTS "Note_leadId_createdAt_idx" ON "Note"("leadId", "createdAt");
CREATE INDEX IF NOT EXISTS "Note_dealId_createdAt_idx" ON "Note"("dealId", "createdAt");

CREATE INDEX IF NOT EXISTS "Task_clientId_idx" ON "Task"("clientId");
CREATE INDEX IF NOT EXISTS "Task_leadId_idx" ON "Task"("leadId");
CREATE INDEX IF NOT EXISTS "Task_dealId_idx" ON "Task"("dealId");
CREATE INDEX IF NOT EXISTS "Task_status_dueDate_idx" ON "Task"("status", "dueDate");
CREATE INDEX IF NOT EXISTS "Task_assignedToId_status_idx" ON "Task"("assignedToId", "status");

CREATE INDEX IF NOT EXISTS "Meeting_createdById_idx" ON "Meeting"("createdById");
CREATE INDEX IF NOT EXISTS "Meeting_status_startsAt_idx" ON "Meeting"("status", "startsAt");

CREATE INDEX IF NOT EXISTS "PromoCode_createdById_idx" ON "PromoCode"("createdById");
CREATE INDEX IF NOT EXISTS "PromoCode_active_idx" ON "PromoCode"("active");
CREATE INDEX IF NOT EXISTS "PromoCode_expiresAt_idx" ON "PromoCode"("expiresAt");
CREATE INDEX IF NOT EXISTS "PromoCode_usedCount_idx" ON "PromoCode"("usedCount");

CREATE INDEX IF NOT EXISTS "PromoCodeUsage_promoCodeId_idx" ON "PromoCodeUsage"("promoCodeId");
CREATE INDEX IF NOT EXISTS "PromoCodeUsage_clientId_idx" ON "PromoCodeUsage"("clientId");
CREATE INDEX IF NOT EXISTS "PromoCodeUsage_appliedById_idx" ON "PromoCodeUsage"("appliedById");
CREATE INDEX IF NOT EXISTS "PromoCodeUsage_usedAt_idx" ON "PromoCodeUsage"("usedAt");

CREATE INDEX IF NOT EXISTS "ActivityLog_actorId_idx" ON "ActivityLog"("actorId");
CREATE INDEX IF NOT EXISTS "ActivityLog_entity_createdAt_idx" ON "ActivityLog"("entity", "createdAt");
