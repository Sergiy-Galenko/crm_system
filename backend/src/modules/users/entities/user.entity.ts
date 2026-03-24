import type { Role } from "@prisma/client";

export class UserEntity {
  id!: string;
  name!: string;
  email!: string;
  role!: Role;
  title!: string | null;
  roleLabel!: string | null;
}
