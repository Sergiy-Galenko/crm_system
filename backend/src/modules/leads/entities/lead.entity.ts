import type { LeadSource, LeadStatus } from "@prisma/client";

export class LeadEntity {
  id!: string;
  name!: string;
  company!: string;
  email!: string;
  source!: LeadSource;
  status!: LeadStatus;
  ownerId!: string;
}
