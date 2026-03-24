import type { Role } from "@prisma/client";

export class AuthUserEntity {
  id!: string;
  name!: string;
  email!: string;
  role!: Role;
  title!: string | null;
}
