import type { ClientStatus } from "@prisma/client";

export class ClientEntity {
  id!: string;
  name!: string;
  company!: string;
  email!: string;
  phone!: string;
  status!: ClientStatus;
  monthlyValue!: number;
  ownerId!: string;
}
