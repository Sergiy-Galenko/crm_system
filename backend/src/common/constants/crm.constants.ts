export const roles = ["ADMIN", "MANAGER"] as const;
export type AppRole = (typeof roles)[number];

export const clientStatuses = ["ACTIVE", "AT_RISK", "INACTIVE"] as const;
export const leadStatuses = ["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL", "WON", "LOST"] as const;
export const leadSources = ["WEBSITE", "REFERRAL", "OUTBOUND", "PARTNER", "EVENT"] as const;
export const dealStages = ["DISCOVERY", "PROPOSAL", "NEGOTIATION", "WON", "LOST"] as const;
export const taskStatuses = ["TODO", "IN_PROGRESS", "DONE"] as const;
export const taskPriorities = ["LOW", "MEDIUM", "HIGH"] as const;
export const meetingStatuses = ["SCHEDULED", "COMPLETED", "CANCELED", "NO_SHOW"] as const;
export const discountTypes = ["PERCENT", "FIXED"] as const;
