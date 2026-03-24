import type { Prisma } from "@prisma/client";

type ScopedUser = {
  id: string;
  role: string;
};

export function isAdmin(user: ScopedUser) {
  return user.role === "ADMIN";
}

export function teamUsersWhere(user: ScopedUser): Prisma.UserWhereInput | undefined {
  return isAdmin(user) ? undefined : { createdById: user.id };
}

export function visibleUsersWhere(user: ScopedUser): Prisma.UserWhereInput | undefined {
  return isAdmin(user)
    ? undefined
    : {
        OR: [{ id: user.id }, { createdById: user.id }],
      };
}

export function clientAccessWhere(user: ScopedUser): Prisma.ClientWhereInput {
  return isAdmin(user) ? {} : { owner: visibleUsersWhere(user)! };
}

export function leadAccessWhere(user: ScopedUser): Prisma.LeadWhereInput {
  return isAdmin(user) ? {} : { owner: visibleUsersWhere(user)! };
}

export function dealAccessWhere(user: ScopedUser): Prisma.DealWhereInput {
  return isAdmin(user) ? {} : { owner: visibleUsersWhere(user)! };
}

export function meetingAccessWhere(user: ScopedUser): Prisma.MeetingWhereInput {
  return isAdmin(user)
    ? {}
    : {
        OR: [{ assignedTo: visibleUsersWhere(user)! }, { createdBy: visibleUsersWhere(user)! }],
      };
}

export function promoCodeAccessWhere(user: ScopedUser): Prisma.PromoCodeWhereInput {
  return isAdmin(user) ? {} : { createdBy: visibleUsersWhere(user)! };
}

export function promoUsageAccessWhere(user: ScopedUser): Prisma.PromoCodeUsageWhereInput {
  return isAdmin(user) ? {} : { appliedBy: visibleUsersWhere(user)! };
}

export function taskAccessWhere(user: ScopedUser): Prisma.TaskWhereInput {
  return isAdmin(user)
    ? {}
    : {
        OR: [{ assignedTo: visibleUsersWhere(user)! }, { createdBy: visibleUsersWhere(user)! }],
      };
}

export function activityAccessWhere(user: ScopedUser): Prisma.ActivityLogWhereInput {
  return isAdmin(user)
    ? {}
    : {
        OR: [{ actorId: user.id }, { actor: { is: teamUsersWhere(user)! } }],
      };
}
