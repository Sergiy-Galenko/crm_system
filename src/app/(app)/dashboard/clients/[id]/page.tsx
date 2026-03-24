import { notFound } from "next/navigation";
import { CheckCheck } from "lucide-react";
import { markTaskDoneAction } from "@/actions/deals";
import { NoteForm } from "@/components/forms/note-form";
import { TaskDialog } from "@/components/forms/task-dialog";
import { DealDialog } from "@/components/forms/deal-dialog";
import { ClientDialog } from "@/components/forms/client-dialog";
import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db";
import { decimalToNumber, formatCurrency, formatDate, fromNow } from "@/lib/utils";

type ClientDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ClientDetailPage({ params }: ClientDetailPageProps) {
  const { id } = await params;

  const [client, users, leads, allClients] = await Promise.all([
    prisma.client.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            name: true,
          },
        },
        deals: {
          orderBy: {
            updatedAt: "desc",
          },
          include: {
            promoCode: {
              select: {
                code: true,
              },
            },
          },
        },
        leads: {
          orderBy: {
            updatedAt: "desc",
          },
        },
        tasks: {
          orderBy: {
            dueDate: "asc",
          },
          include: {
            assignedTo: {
              select: {
                name: true,
              },
            },
          },
        },
        notes: {
          orderBy: {
            createdAt: "desc",
          },
          include: {
            author: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    }),
    prisma.user.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    }),
    prisma.lead.findMany({
      select: {
        id: true,
        company: true,
      },
      orderBy: {
        company: "asc",
      },
    }),
    prisma.client.findMany({
      select: {
        id: true,
        company: true,
      },
      orderBy: {
        company: "asc",
      },
    }),
  ]);

  if (!client) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Client record"
        title={client.company}
        description={`${client.name} • ${client.email} • ${client.location ?? "Location not set"} • owned by ${client.owner.name}`}
        actions={
          <>
            <ClientDialog
              users={users}
              client={{
                id: client.id,
                name: client.name,
                company: client.company,
                email: client.email,
                phone: client.phone,
                status: client.status,
                segment: client.segment,
                location: client.location,
                monthlyValue: decimalToNumber(client.monthlyValue),
                ownerId: client.ownerId,
              }}
              triggerLabel="Edit client"
            />
            <DealDialog
              users={users}
              clients={allClients}
              leads={leads}
              triggerLabel="New deal"
            />
          </>
        }
      />

      <div className="grid gap-4 xl:grid-cols-4">
        <MetricCard label="Status" value={client.status.replaceAll("_", " ")} meta={client.segment ?? "No segment set"} />
        <MetricCard
          label="Monthly value"
          value={formatCurrency(decimalToNumber(client.monthlyValue))}
          meta="Current recurring account value."
        />
        <MetricCard
          label="Total revenue"
          value={formatCurrency(decimalToNumber(client.totalRevenue))}
          meta="Won revenue attached to this client."
          tone="brand"
        />
        <MetricCard label="Last contact" value={client.lastContactAt ? fromNow(client.lastContactAt) : "N/A"} meta="Updated from notes, deals, or tasks." />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <div className="card rounded-[2rem] p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-950">Deals</h3>
                <p className="mt-1 text-sm text-slate-500">Commercial work linked to this client.</p>
              </div>
              <StatusBadge value={client.status} />
            </div>
            <div className="mt-6 space-y-3">
              {client.deals.length ? (
                client.deals.map((deal) => (
                  <div key={deal.id} className="rounded-[1.75rem] border border-white/75 bg-white/75 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-slate-950">{deal.title}</p>
                        <p className="mt-1 text-sm text-slate-500">{deal.description ?? "No description added."}</p>
                      </div>
                      <StatusBadge value={deal.stage} />
                    </div>
                    <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-500">
                      <span>Gross {formatCurrency(decimalToNumber(deal.grossAmount), deal.currency)}</span>
                      <span>Net {formatCurrency(decimalToNumber(deal.netAmount), deal.currency)}</span>
                      <span>{deal.promoCode?.code ? `Promo ${deal.promoCode.code}` : "No promo"}</span>
                      <span>{deal.closeDate ? formatDate(deal.closeDate) : "No close date"}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="rounded-[1.75rem] border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
                  No deals linked to this client yet.
                </p>
              )}
            </div>
          </div>

          <NoteForm clientId={client.id} />

          <div className="card rounded-[2rem] p-5">
            <div>
              <h3 className="text-lg font-semibold text-slate-950">Timeline notes</h3>
              <p className="mt-1 text-sm text-slate-500">Context captured across calls, onboarding, and renewal moments.</p>
            </div>
            <div className="mt-6 space-y-3">
              {client.notes.length ? (
                client.notes.map((note) => (
                  <div key={note.id} className="rounded-[1.75rem] border border-white/75 bg-white/75 p-4">
                    <p className="text-sm leading-6 text-slate-700">{note.body}</p>
                    <div className="mt-3 text-xs uppercase tracking-[0.16em] text-slate-400">
                      {note.author.name} • {fromNow(note.createdAt)}
                    </div>
                  </div>
                ))
              ) : (
                <p className="rounded-[1.75rem] border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
                  No notes added for this client yet.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card rounded-[2rem] p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-950">Follow-ups</h3>
                <p className="mt-1 text-sm text-slate-500">Tasks keeping the account moving forward.</p>
              </div>
              <TaskDialog users={users} defaults={{ clientId: client.id }} />
            </div>
            <div className="mt-6 space-y-3">
              {client.tasks.length ? (
                client.tasks.map((task) => (
                  <div key={task.id} className="rounded-[1.75rem] border border-white/75 bg-white/75 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-slate-950">{task.title}</p>
                        <p className="mt-1 text-sm text-slate-500">
                          {task.assignedTo.name} • due {formatDate(task.dueDate)}
                        </p>
                      </div>
                      <StatusBadge value={task.status} />
                    </div>
                    {task.description ? <p className="mt-3 text-sm leading-6 text-slate-600">{task.description}</p> : null}
                    {task.status !== "DONE" ? (
                      <form action={markTaskDoneAction.bind(null, task.id)} className="mt-4">
                        <Button type="submit" variant="secondary" size="sm">
                          <CheckCheck className="h-4 w-4" />
                          Mark done
                        </Button>
                      </form>
                    ) : null}
                  </div>
                ))
              ) : (
                <p className="rounded-[1.75rem] border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
                  No follow-up tasks yet.
                </p>
              )}
            </div>
          </div>

          <div className="card rounded-[2rem] p-5">
            <div>
              <h3 className="text-lg font-semibold text-slate-950">Connected leads</h3>
              <p className="mt-1 text-sm text-slate-500">Lead records currently linked to the account.</p>
            </div>
            <div className="mt-6 space-y-3">
              {client.leads.length ? (
                client.leads.map((lead) => (
                  <div key={lead.id} className="rounded-[1.75rem] border border-white/75 bg-white/75 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-slate-950">{lead.company}</p>
                        <p className="mt-1 text-sm text-slate-500">{lead.name}</p>
                      </div>
                      <StatusBadge value={lead.status} />
                    </div>
                    <p className="mt-3 text-sm text-slate-500">
                      Source {lead.source.replaceAll("_", " ")} • est. {formatCurrency(decimalToNumber(lead.estimatedValue))}
                    </p>
                  </div>
                ))
              ) : (
                <p className="rounded-[1.75rem] border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
                  No leads are linked to this client.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
