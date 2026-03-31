import {
  ActivityAction,
  ActivityEntity,
  ClientStatus,
  DealStage,
  DiscountType,
  LeadSource,
  LeadStatus,
  MeetingStatus,
  PrismaClient,
  Role,
  TaskPriority,
  TaskStatus,
} from "@prisma/client";
import { addDays, subDays } from "date-fns";
import bcrypt from "bcryptjs";
import { loadWorkspaceEnv } from "../src/common/env/load-workspace-env";

loadWorkspaceEnv();

const prisma = new PrismaClient();

async function main() {
  await prisma.chatMessage.deleteMany();
  await prisma.chatParticipant.deleteMany();
  await prisma.chatConversation.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.promoCodeUsage.deleteMany();
  await prisma.meeting.deleteMany();
  await prisma.task.deleteMany();
  await prisma.note.deleteMany();
  await prisma.deal.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.client.deleteMany();
  await prisma.promoCode.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("Admin@12345", 12);
  const managerPasswordHash = await bcrypt.hash("Manager@12345", 12);

  const admin = await prisma.user.create({
    data: {
      name: "Olivia Hart",
      email: "admin@korucrm.dev",
      nickname: "olivia",
      passwordHash,
      role: Role.ADMIN,
      title: "Revenue Operations Lead",
      statusMessage: "Expansion planning, renewals, and revenue orchestration.",
      phone: "+1 415 555 0104",
      location: "San Francisco, CA",
      bio: "I coordinate the operating rhythm for pipeline reviews, strategic accounts, and promo-backed commercial initiatives.",
      avatarColor: "#2154FF",
    },
  });

  const manager = await prisma.user.create({
    data: {
      name: "Noah Bennett",
      email: "manager@korucrm.dev",
      nickname: "noah",
      passwordHash: managerPasswordHash,
      role: Role.MANAGER,
      title: "Account Manager",
      statusMessage: "Client retention, follow-ups, and regional growth accounts.",
      phone: "+1 646 555 0122",
      location: "New York, NY",
      bio: "I focus on customer momentum after handoff, renewal preparation, and identifying expansion opportunities inside active accounts.",
      avatarColor: "#0F9F68",
      createdById: admin.id,
    },
  });

  const clients = await Promise.all([
    prisma.client.create({
      data: {
        name: "Mila Harper",
        company: "Northstar Labs",
        email: "mila@northstarlabs.com",
        phone: "+1 415 555 0198",
        status: ClientStatus.ACTIVE,
        segment: "Enterprise",
        location: "San Francisco, CA",
        monthlyValue: 8200,
        totalRevenue: 74600,
        lastContactAt: subDays(new Date(), 2),
        ownerId: admin.id,
      },
    }),
    prisma.client.create({
      data: {
        name: "Ethan Cole",
        company: "Velvet Commerce",
        email: "ethan@velvetcommerce.io",
        phone: "+1 646 555 0182",
        status: ClientStatus.ACTIVE,
        segment: "Growth",
        location: "New York, NY",
        monthlyValue: 5400,
        totalRevenue: 39200,
        lastContactAt: subDays(new Date(), 3),
        ownerId: manager.id,
      },
    }),
    prisma.client.create({
      data: {
        name: "Ava Quinn",
        company: "Summit AI",
        email: "ava@summitai.co",
        phone: "+1 312 555 0176",
        status: ClientStatus.AT_RISK,
        segment: "Mid-market",
        location: "Chicago, IL",
        monthlyValue: 2800,
        totalRevenue: 14600,
        lastContactAt: subDays(new Date(), 9),
        ownerId: admin.id,
      },
    }),
    prisma.client.create({
      data: {
        name: "Luca Mason",
        company: "Harbor Ventures",
        email: "luca@harborventures.com",
        phone: "+1 206 555 0128",
        status: ClientStatus.ACTIVE,
        segment: "Private Equity",
        location: "Seattle, WA",
        monthlyValue: 11600,
        totalRevenue: 102000,
        lastContactAt: subDays(new Date(), 1),
        ownerId: admin.id,
      },
    }),
  ]);

  const leads = await Promise.all([
    prisma.lead.create({
      data: {
        name: "Sophia Reed",
        company: "Cinder Health",
        email: "sophia@cinderhealth.io",
        phone: "+1 512 555 0114",
        source: LeadSource.WEBSITE,
        status: LeadStatus.QUALIFIED,
        estimatedValue: 14800,
        nextFollowUpAt: addDays(new Date(), 1),
        ownerId: manager.id,
      },
    }),
    prisma.lead.create({
      data: {
        name: "Jack Monroe",
        company: "Orbit Capital",
        email: "jack@orbitcapital.com",
        phone: "+1 303 555 0163",
        source: LeadSource.REFERRAL,
        status: LeadStatus.PROPOSAL,
        estimatedValue: 26400,
        nextFollowUpAt: addDays(new Date(), 4),
        ownerId: admin.id,
      },
    }),
    prisma.lead.create({
      data: {
        name: "Chloe Brooks",
        company: "Verde Retail",
        email: "chloe@verderetail.com",
        phone: "+1 786 555 0155",
        source: LeadSource.OUTBOUND,
        status: LeadStatus.CONTACTED,
        estimatedValue: 9600,
        nextFollowUpAt: addDays(new Date(), 2),
        ownerId: manager.id,
      },
    }),
    prisma.lead.create({
      data: {
        name: "Leo Murphy",
        company: "Aster Digital",
        email: "leo@asterdigital.io",
        phone: "+1 213 555 0139",
        source: LeadSource.EVENT,
        status: LeadStatus.NEW,
        estimatedValue: 7600,
        nextFollowUpAt: addDays(new Date(), 3),
        ownerId: admin.id,
      },
    }),
  ]);

  const promoCodes = await Promise.all([
    prisma.promoCode.create({
      data: {
        code: "GROWTH15",
        description: "15% off for quarterly contracts",
        active: true,
        expiresAt: addDays(new Date(), 21),
        usageLimit: 30,
        usedCount: 2,
        discountType: DiscountType.PERCENT,
        discountValue: 15,
        createdById: admin.id,
      },
    }),
    prisma.promoCode.create({
      data: {
        code: "VIP500",
        description: "Fixed $500 onboarding credit",
        active: true,
        expiresAt: addDays(new Date(), 45),
        usageLimit: 10,
        usedCount: 1,
        discountType: DiscountType.FIXED,
        discountValue: 500,
        createdById: admin.id,
      },
    }),
    prisma.promoCode.create({
      data: {
        code: "SPRING20",
        description: "Spring sales push",
        active: false,
        usageLimit: 50,
        usedCount: 12,
        discountType: DiscountType.PERCENT,
        discountValue: 20,
        createdById: admin.id,
      },
    }),
  ]);

  await Promise.all([
    prisma.meeting.create({
      data: {
        title: "Northstar renewal review",
        description: "Walk through renewal terms, onboarding blockers, and budget confirmation.",
        status: MeetingStatus.SCHEDULED,
        startsAt: addDays(new Date(), 1),
        endsAt: addDays(new Date(Date.now() + 60 * 60 * 1000), 1),
        location: "Google Meet",
        meetingLink: "https://meet.google.com/example-northstar",
        clientId: clients[0]!.id,
        assignedToId: admin.id,
        createdById: admin.id,
      },
    }),
    prisma.meeting.create({
      data: {
        title: "Velvet Commerce expansion call",
        description: "Discuss new regional rollout and promo-assisted onboarding package.",
        status: MeetingStatus.SCHEDULED,
        startsAt: addDays(new Date(), 2),
        endsAt: addDays(new Date(Date.now() + 45 * 60 * 1000), 2),
        location: "Kyiv office / Zoom",
        clientId: clients[1]!.id,
        assignedToId: manager.id,
        createdById: manager.id,
      },
    }),
    prisma.meeting.create({
      data: {
        title: "Summit AI recovery check-in",
        description: "Review churn signals and escalation plan.",
        status: MeetingStatus.COMPLETED,
        startsAt: subDays(new Date(), 2),
        endsAt: subDays(new Date(Date.now() - 30 * 60 * 1000), 2),
        location: "Phone call",
        outcome: "Agreed on a two-week recovery plan and shared technical blockers.",
        clientId: clients[2]!.id,
        assignedToId: admin.id,
        createdById: admin.id,
      },
    }),
  ]);

  const deals = await Promise.all([
    prisma.deal.create({
      data: {
        title: "Northstar annual expansion",
        description: "Expansion across CS and lifecycle teams.",
        stage: DealStage.WON,
        currency: "USD",
        grossAmount: 18000,
        discountAmount: 2700,
        netAmount: 15300,
        closeDate: subDays(new Date(), 5),
        clientId: clients[0].id,
        ownerId: admin.id,
        promoCodeId: promoCodes[0].id,
      },
    }),
    prisma.deal.create({
      data: {
        title: "Velvet Commerce optimization",
        description: "Retention program and workflow cleanup.",
        stage: DealStage.NEGOTIATION,
        currency: "USD",
        grossAmount: 9400,
        discountAmount: 0,
        netAmount: 9400,
        closeDate: addDays(new Date(), 7),
        clientId: clients[1].id,
        ownerId: manager.id,
      },
    }),
    prisma.deal.create({
      data: {
        title: "Orbit Capital onboarding",
        description: "Mid-market rollout with training seats.",
        stage: DealStage.PROPOSAL,
        currency: "USD",
        grossAmount: 26000,
        discountAmount: 500,
        netAmount: 25500,
        closeDate: addDays(new Date(), 10),
        clientId: clients[3].id,
        leadId: leads[1].id,
        ownerId: admin.id,
        promoCodeId: promoCodes[1].id,
      },
    }),
  ]);

  await Promise.all([
    prisma.promoCodeUsage.create({
      data: {
        promoCodeId: promoCodes[0].id,
        dealId: deals[0].id,
        clientId: clients[0].id,
        appliedById: admin.id,
        usedAt: subDays(new Date(), 5),
        dealAmount: 18000,
        discountAmount: 2700,
        discountType: DiscountType.PERCENT,
        discountValue: 15,
      },
    }),
    prisma.promoCodeUsage.create({
      data: {
        promoCodeId: promoCodes[1].id,
        dealId: deals[2].id,
        clientId: clients[3].id,
        appliedById: admin.id,
        usedAt: subDays(new Date(), 1),
        dealAmount: 26000,
        discountAmount: 500,
        discountType: DiscountType.FIXED,
        discountValue: 500,
      },
    }),
  ]);

  await Promise.all([
    prisma.note.create({
      data: {
        body: "Northstar is ready to expand if onboarding is compressed into two weeks.",
        authorId: admin.id,
        clientId: clients[0].id,
        dealId: deals[0].id,
      },
    }),
    prisma.note.create({
      data: {
        body: "Orbit requested legal review before approving the proposal.",
        authorId: admin.id,
        leadId: leads[1].id,
        dealId: deals[2].id,
      },
    }),
    prisma.note.create({
      data: {
        body: "Velvet needs a revised pricing model for three stores.",
        authorId: manager.id,
        clientId: clients[1].id,
        dealId: deals[1].id,
      },
    }),
  ]);

  await Promise.all([
    prisma.task.create({
      data: {
        title: "Prepare executive recap",
        description: "Send 1-pager for Northstar Q2 rollout.",
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.HIGH,
        dueDate: addDays(new Date(), 1),
        assignedToId: admin.id,
        createdById: admin.id,
        clientId: clients[0].id,
        dealId: deals[0].id,
      },
    }),
    prisma.task.create({
      data: {
        title: "Follow up with finance",
        description: "Confirm billing cycle and implementation budget.",
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
        dueDate: addDays(new Date(), 2),
        assignedToId: manager.id,
        createdById: admin.id,
        leadId: leads[1].id,
        dealId: deals[2].id,
      },
    }),
    prisma.task.create({
      data: {
        title: "Renewal risk review",
        description: "Call Summit AI and review adoption metrics.",
        status: TaskStatus.TODO,
        priority: TaskPriority.HIGH,
        dueDate: addDays(new Date(), 3),
        assignedToId: manager.id,
        createdById: manager.id,
        clientId: clients[2].id,
      },
    }),
    prisma.task.create({
      data: {
        title: "Close onboarding checklist",
        description: "Finalize Harbor Ventures setup.",
        status: TaskStatus.DONE,
        priority: TaskPriority.LOW,
        dueDate: subDays(new Date(), 1),
        completedAt: subDays(new Date(), 1),
        assignedToId: admin.id,
        createdById: admin.id,
        clientId: clients[3].id,
      },
    }),
  ]);

  await prisma.activityLog.createMany({
    data: [
      {
        actorId: admin.id,
        entity: ActivityEntity.DEAL,
        action: ActivityAction.PROMO_APPLIED,
        entityId: deals[0].id,
        description: "Applied GROWTH15 to Northstar annual expansion.",
      },
      {
        actorId: admin.id,
        entity: ActivityEntity.PROMO_CODE,
        action: ActivityAction.CREATED,
        entityId: promoCodes[1].id,
        description: "Created VIP500 promo code for premium onboarding offers.",
      },
      {
        actorId: manager.id,
        entity: ActivityEntity.LEAD,
        action: ActivityAction.UPDATED,
        entityId: leads[0].id,
        description: "Updated Sophia Reed to qualified and scheduled follow-up.",
      },
      {
        actorId: admin.id,
        entity: ActivityEntity.CLIENT,
        action: ActivityAction.UPDATED,
        entityId: clients[2].id,
        description: "Flagged Summit AI as at risk after delayed renewal signal.",
      },
      {
        actorId: admin.id,
        entity: ActivityEntity.USER,
        action: ActivityAction.LOGIN,
        entityId: admin.id,
        description: "Admin user signed in from the internal dashboard.",
      },
    ],
  });

  const directConversation = await prisma.chatConversation.create({
    data: {
      type: "DIRECT",
      createdById: admin.id,
      lastMessageAt: subDays(new Date(), 1),
      participants: {
        create: [{ userId: admin.id }, { userId: manager.id }],
      },
    },
  });

  const groupConversation = await prisma.chatConversation.create({
    data: {
      type: "GROUP",
      title: "Revenue standup",
      createdById: admin.id,
      lastMessageAt: new Date(),
      participants: {
        create: [{ userId: admin.id }, { userId: manager.id }],
      },
    },
  });

  await prisma.chatMessage.createMany({
    data: [
      {
        conversationId: directConversation.id,
        senderId: admin.id,
        body: "Can you send the latest renewal notes for Northstar before noon?",
        createdAt: subDays(new Date(), 1),
      },
      {
        conversationId: directConversation.id,
        senderId: manager.id,
        body: "Yes, I have the summary and next-step timeline ready.",
        createdAt: subDays(new Date(), 1),
      },
      {
        conversationId: groupConversation.id,
        senderId: admin.id,
        body: "Team, let's keep today focused on renewals, deal follow-ups, and promo approvals.",
        createdAt: subDays(new Date(), 1),
      },
      {
        conversationId: groupConversation.id,
        senderId: manager.id,
        body: "I will cover the at-risk accounts and update the board after client calls.",
        createdAt: new Date(),
      },
    ],
  });

  console.log("Seed complete.");
  console.log("Admin login: admin@korucrm.dev / Admin@12345");
  console.log("Manager login: manager@korucrm.dev / Manager@12345");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
