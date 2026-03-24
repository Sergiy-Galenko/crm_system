import type { MeetingStatus } from "@prisma/client";

export class MeetingEntity {
  id!: string;
  title!: string;
  status!: MeetingStatus;
  startsAt!: Date;
  endsAt!: Date;
  clientId!: string;
  assignedToId!: string;
}
