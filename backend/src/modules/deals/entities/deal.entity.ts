import type { DealStage } from "@prisma/client";

export class DealEntity {
  id!: string;
  title!: string;
  stage!: DealStage;
  clientId!: string;
  ownerId!: string;
  netAmount!: number;
}
