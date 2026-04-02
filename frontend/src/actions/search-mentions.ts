"use server";

import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/db";

export type SmartMentionResult = {
  id: string;
  type: "DEAL" | "LEAD" | "CLIENT";
  title: string;
  subtitle: string;
};

export async function searchMentionsAction(query: string): Promise<SmartMentionResult[]> {
  const user = await requireUser();
  const q = query.trim();
  
  if (!q) {
    return [];
  }

  const [deals, leads, clients] = await Promise.all([
    prisma.deal.findMany({
      where: { 
        ownerId: user.id, 
        title: { contains: q, mode: "insensitive" } 
      },
      take: 5,
    }),
    prisma.lead.findMany({
      where: { 
        ownerId: user.id, 
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { company: { contains: q, mode: "insensitive" } },
        ]
      },
      take: 5,
    }),
    prisma.client.findMany({
      where: { 
        ownerId: user.id, 
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { company: { contains: q, mode: "insensitive" } },
        ]
      },
      take: 5,
    }),
  ]);

  const results: SmartMentionResult[] = [
    ...deals.map((d) => ({ 
      id: d.id, 
      type: "DEAL" as const, 
      title: d.title, 
      subtitle: `Deal • ${d.currency} ${Number(d.grossAmount).toFixed(0)}` 
    })),
    ...leads.map((l) => ({ 
      id: l.id, 
      type: "LEAD" as const, 
      title: l.name, 
      subtitle: `Lead • ${l.company}` 
    })),
    ...clients.map((c) => ({ 
      id: c.id, 
      type: "CLIENT" as const, 
      title: c.name, 
      subtitle: `Client • ${c.company}` 
    })),
  ];

  return results;
}
