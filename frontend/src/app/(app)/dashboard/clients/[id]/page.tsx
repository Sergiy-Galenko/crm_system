import { notFound } from "next/navigation";
import { CheckCheck } from "lucide-react";
import { updateMeetingStatusAction } from "@/actions/meetings";
import { markTaskDoneAction } from "@/actions/tasks";
import { NoteForm } from "@/components/forms/note-form";
import { TaskDialog } from "@/components/forms/task-dialog";
import { DealDialog } from "@/components/forms/deal-dialog";
import { ClientDialog } from "@/components/forms/client-dialog";
import { MeetingDialog } from "@/components/forms/meeting-dialog";
import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { clientAccessWhere, leadAccessWhere, visibleUsersWhere } from "@/lib/crm-scope";
import { prisma } from "@/lib/db";
import { getServerTranslator } from "@/lib/locale-server";
import { requireUser } from "@/lib/session";
import { decimalToNumber, formatCurrency, formatDate, fromNow, toDateInputValue } from "@/lib/utils";

type ClientDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ClientDetailPage({ params }: ClientDetailPageProps) {
  const { id } = await params;
  const user = await requireUser();
  const { locale, t } = await getServerTranslator();
  const defaultDueDate = new Date();
  defaultDueDate.setDate(defaultDueDate.getDate() + 1);

  const [client, users, leads, allClients] = await Promise.all([
    prisma.client.findFirst({
      where: {
        id,
        ...clientAccessWhere(user),
      },
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
        meetings: {
          orderBy: {
            startsAt: "asc",
          },
          include: {
            assignedTo: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    }),
    prisma.user.findMany({
      where: visibleUsersWhere(user),
      select: {
        id: true,
        name: true,
        email: true,
      },
      orderBy: {
        name: "asc",
      },
    }),
    prisma.lead.findMany({
      where: leadAccessWhere(user),
      select: {
        id: true,
        company: true,
      },
      orderBy: {
        company: "asc",
      },
    }),
    prisma.client.findMany({
      where: clientAccessWhere(user),
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
        eyebrow={t("Client record")}
        title={client.company}
        description={`${client.name} • ${client.email} • ${client.location ?? t("Location not set")} • ${t("Owned by {name}", { name: client.owner.name })}`}
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
            <MeetingDialog
              users={users}
              clients={allClients}
              defaults={{ clientId: client.id, assignedToId: client.ownerId }}
              hideClientField
            />
          </>
        }
      />

      <div className="grid gap-4 xl:grid-cols-4">
        <MetricCard label={t("Status")} value={t(client.status)} meta={client.segment ?? t("No segment set")} />
        <MetricCard
          label={t("Monthly value")}
          value={formatCurrency(decimalToNumber(client.monthlyValue))}
          meta={t("Current recurring account value.")}
        />
        <MetricCard
          label={t("Total revenue")}
          value={formatCurrency(decimalToNumber(client.totalRevenue))}
          meta={t("Won revenue attached to this client.")}
          tone="brand"
        />
        <MetricCard label={t("Last contact")} value={client.lastContactAt ? fromNow(client.lastContactAt, locale) : t("N/A")} meta={t("Updated from notes, deals, or tasks.")} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <div className="card rounded-[2rem] p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-950">{t("Deals")}</h3>
                <p className="mt-1 text-sm text-slate-500">{t("Commercial work linked to this client.")}</p>
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
                        <p className="mt-1 text-sm text-slate-500">{deal.description ?? t("No description added.")}</p>
                      </div>
                      <StatusBadge value={deal.stage} />
                    </div>
                    <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-500">
                      <span>{t("Gross")} {formatCurrency(decimalToNumber(deal.grossAmount), deal.currency)}</span>
                      <span>{t("Net")} {formatCurrency(decimalToNumber(deal.netAmount), deal.currency)}</span>
                      <span>{deal.promoCode?.code ? `${t("Promo")} ${deal.promoCode.code}` : t("No promo")}</span>
                      <span>{deal.closeDate ? formatDate(deal.closeDate, locale) : t("No close date")}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="rounded-[1.75rem] border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
                  {t("No deals linked to this client yet.")}
                </p>
              )}
            </div>
          </div>

          <NoteForm clientId={client.id} />

          <div className="card rounded-[2rem] p-5">
            <div>
              <h3 className="text-lg font-semibold text-slate-950">{t("Timeline notes")}</h3>
              <p className="mt-1 text-sm text-slate-500">{t("Context captured across calls, onboarding, and renewal moments.")}</p>
            </div>
            <div className="mt-6 space-y-3">
              {client.notes.length ? (
                client.notes.map((note) => (
                  <div key={note.id} className="rounded-[1.75rem] border border-white/75 bg-white/75 p-4">
                    <p className="text-sm leading-6 text-slate-700">{note.body}</p>
                    <div className="mt-3 text-xs uppercase tracking-[0.16em] text-slate-400">
                      {note.author.name} • {fromNow(note.createdAt, locale)}
                    </div>
                  </div>
                ))
              ) : (
                <p className="rounded-[1.75rem] border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
                  {t("No notes added for this client yet.")}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card rounded-[2rem] p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-950">{t("Meetings")}</h3>
                <p className="mt-1 text-sm text-slate-500">{t("Scheduled account calls, demos, and review sessions tied to this client.")}</p>
              </div>
              <MeetingDialog
                users={users}
                clients={allClients}
                defaults={{ clientId: client.id, assignedToId: client.ownerId }}
                hideClientField
              />
            </div>
            <div className="mt-6 space-y-3">
              {client.meetings.length ? (
                client.meetings.map((meeting) => (
                  <div key={meeting.id} className="rounded-[1.75rem] border border-white/75 bg-white/75 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-slate-950">{meeting.title}</p>
                        <p className="mt-1 text-sm text-slate-500">
                          {meeting.assignedTo.name} • {formatDate(meeting.startsAt, locale, "MMM d, yyyy • HH:mm")}
                        </p>
                      </div>
                      <StatusBadge value={meeting.status} />
                    </div>
                    <div className="mt-3 space-y-2 text-sm text-slate-600">
                      <p>{formatDate(meeting.startsAt, locale, "MMM d, yyyy • HH:mm")} - {formatDate(meeting.endsAt, locale, "HH:mm")}</p>
                      {meeting.location ? <p>{meeting.location}</p> : null}
                      {meeting.description ? <p>{meeting.description}</p> : null}
                      {meeting.outcome ? <p className="text-slate-500">{meeting.outcome}</p> : null}
                      {meeting.meetingLink ? (
                        <p>
                          <a href={meeting.meetingLink} target="_blank" rel="noreferrer" className="font-medium text-slate-900 underline decoration-slate-300 underline-offset-4">
                            {t("Open meeting link")}
                          </a>
                        </p>
                      ) : null}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <MeetingDialog
                        users={users}
                        clients={allClients}
                        hideClientField
                        meeting={{
                          id: meeting.id,
                          title: meeting.title,
                          description: meeting.description,
                          status: meeting.status,
                          startsAt: meeting.startsAt,
                          endsAt: meeting.endsAt,
                          location: meeting.location,
                          meetingLink: meeting.meetingLink,
                          outcome: meeting.outcome,
                          clientId: meeting.clientId,
                          assignedToId: meeting.assignedToId,
                        }}
                        triggerLabel="Edit"
                      />
                      {meeting.status === "SCHEDULED" ? (
                        <>
                          <form action={updateMeetingStatusAction.bind(null, meeting.id, "COMPLETED")}>
                            <Button type="submit" variant="secondary" size="sm">{t("Mark completed")}</Button>
                          </form>
                          <form action={updateMeetingStatusAction.bind(null, meeting.id, "NO_SHOW")}>
                            <Button type="submit" variant="subtle" size="sm">{t("Mark no-show")}</Button>
                          </form>
                          <form action={updateMeetingStatusAction.bind(null, meeting.id, "CANCELED")}>
                            <Button type="submit" variant="danger" size="sm">{t("Cancel meeting")}</Button>
                          </form>
                        </>
                      ) : null}
                    </div>
                  </div>
                ))
              ) : (
                <p className="rounded-[1.75rem] border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
                  {t("No meetings are scheduled for this client yet.")}
                </p>
              )}
            </div>
          </div>

          <div className="card rounded-[2rem] p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-950">{t("Follow-ups")}</h3>
                <p className="mt-1 text-sm text-slate-500">{t("Tasks keeping the account moving forward.")}</p>
              </div>
              <TaskDialog
                users={users}
                defaults={{ clientId: client.id, assignedToId: client.ownerId }}
                defaultDueDate={toDateInputValue(defaultDueDate)}
              />
            </div>
            <div className="mt-6 space-y-3">
              {client.tasks.length ? (
                client.tasks.map((task) => (
                  <div key={task.id} className="rounded-[1.75rem] border border-white/75 bg-white/75 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-slate-950">{task.title}</p>
                        <p className="mt-1 text-sm text-slate-500">
                          {task.assignedTo?.name ?? t("Unassigned")} • {t("due")} {formatDate(task.dueDate, locale)}
                        </p>
                      </div>
                      <StatusBadge value={task.status} />
                    </div>
                    {task.description ? <p className="mt-3 text-sm leading-6 text-slate-600">{task.description}</p> : null}
                    {task.status !== "DONE" ? (
                      <form action={markTaskDoneAction.bind(null, task.id)} className="mt-4">
                        <Button type="submit" variant="secondary" size="sm">
                          <CheckCheck className="h-4 w-4" />
                          {t("Mark done")}
                        </Button>
                      </form>
                    ) : null}
                  </div>
                ))
              ) : (
                <p className="rounded-[1.75rem] border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
                  {t("No follow-up tasks yet.")}
                </p>
              )}
            </div>
          </div>

          <div className="card rounded-[2rem] p-5">
            <div>
              <h3 className="text-lg font-semibold text-slate-950">{t("Connected leads")}</h3>
              <p className="mt-1 text-sm text-slate-500">{t("Lead records currently linked to the account.")}</p>
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
                      {t("Source")} {t(lead.source)} • {t("est.")} {formatCurrency(decimalToNumber(lead.estimatedValue))}
                    </p>
                  </div>
                ))
              ) : (
                <p className="rounded-[1.75rem] border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
                  {t("No leads are linked to this client.")}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
