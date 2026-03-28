"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquarePlus, MessagesSquare, Search, UserRound } from "lucide-react";
import { createConversationAction } from "@/actions/chat";
import { ActionDialog } from "@/components/form/action-dialog";
import { FormField } from "@/components/form/form-field";
import { SubmitButton } from "@/components/form/submit-button";
import { useLocale } from "@/components/providers/locale-provider";
import { UserAvatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { ActionResult } from "@/lib/actions";

type Teammate = {
  id: string;
  name: string;
  email: string;
  nickname?: string | null;
  title?: string | null;
  avatarColor?: string | null;
  companyLogoUrl?: string | null;
};

const initialState: ActionResult<{ conversationId: string } | undefined> = {
  success: false,
  message: "",
};

export function ChatConversationDialog({ teammates }: { teammates: Teammate[] }) {
  const [state, formAction] = useActionState(createConversationAction, initialState);
  const [type, setType] = useState<"DIRECT" | "GROUP">("DIRECT");
  const [searchQuery, setSearchQuery] = useState("");
  const { t } = useLocale();
  const router = useRouter();
  const canCreateConversation = teammates.length > 0;
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const filteredTeammates = normalizedSearchQuery
    ? teammates.filter((teammate) =>
        [teammate.name, teammate.email, teammate.nickname ? `@${teammate.nickname}` : "", teammate.nickname ?? ""]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearchQuery),
      )
    : teammates;

  useEffect(() => {
    if (!state.success || !state.data?.conversationId) {
      return;
    }

    router.push(`/dashboard/chat?conversation=${state.data.conversationId}`);
    router.refresh();
  }, [router, state]);

  return (
    <ActionDialog
      trigger={
        <Button>
          <MessageSquarePlus className="h-4 w-4" />
          {t("New conversation")}
        </Button>
      }
      title={t("New conversation")}
      description={t("Open a direct chat or create a focused group thread for your team.")}
      state={state}
      contentClassName="max-w-3xl"
    >
      {() => (
        <form action={formAction} className="grid gap-6">
          <fieldset className="grid gap-3">
            <legend className="text-sm font-medium text-slate-800">{t("Conversation type")}</legend>
            <div className="grid gap-3 md:grid-cols-2">
              <label
                className={cn(
                  "grid gap-2 rounded-[1.5rem] border p-4 transition",
                  type === "DIRECT" ? "border-slate-950 bg-slate-50 shadow-sm" : "border-slate-200 bg-white hover:border-slate-300",
                )}
              >
                <input
                  type="radio"
                  name="type"
                  value="DIRECT"
                  className="sr-only"
                  checked={type === "DIRECT"}
                  onChange={() => setType("DIRECT")}
                />
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
                    <UserRound className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-950">{t("Direct")}</p>
                    <p className="text-sm leading-6 text-slate-500">{t("Pick one teammate for a private thread.")}</p>
                  </div>
                </div>
              </label>

              <label
                className={cn(
                  "grid gap-2 rounded-[1.5rem] border p-4 transition",
                  type === "GROUP" ? "border-slate-950 bg-slate-50 shadow-sm" : "border-slate-200 bg-white hover:border-slate-300",
                )}
              >
                <input
                  type="radio"
                  name="type"
                  value="GROUP"
                  className="sr-only"
                  checked={type === "GROUP"}
                  onChange={() => setType("GROUP")}
                />
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
                    <MessagesSquare className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-950">{t("Group")}</p>
                    <p className="text-sm leading-6 text-slate-500">{t("Create a named room for shared coordination.")}</p>
                  </div>
                </div>
              </label>
            </div>
            {state.fields?.type ? <p className="text-xs font-medium text-rose-500">{state.fields.type}</p> : null}
          </fieldset>

          {type === "GROUP" ? (
            <FormField
              label={t("Group name")}
              error={state.fields?.title}
              description={t("Name this group so the team can recognize it quickly.")}
            >
              <Input name="title" placeholder={t("Revenue standup")} />
            </FormField>
          ) : null}

          <fieldset className="grid gap-3">
            <legend className="text-sm font-medium text-slate-800">{t("Choose teammates")}</legend>
            <p className="text-sm leading-6 text-slate-500">
              {t("Select one teammate for a direct chat or several for a group thread.")}
            </p>
            {teammates.length ? (
              <div className="grid gap-3">
                <FormField
                  label={t("Find teammates")}
                  description={t("Search by name, email, or @nickname.")}
                >
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder={t("Type a name or @nickname")}
                      className="pl-10"
                    />
                  </div>
                </FormField>

                {filteredTeammates.length ? (
                  <div className="grid gap-3 md:grid-cols-2">
                    {filteredTeammates.map((teammate) => (
                      <label
                        key={teammate.id}
                        className="flex cursor-pointer items-center gap-3 rounded-[1.5rem] border border-slate-200 bg-white px-4 py-3 transition hover:border-slate-300 hover:bg-slate-50"
                      >
                        <input
                          type={type === "DIRECT" ? "radio" : "checkbox"}
                          name="participantIds"
                          value={teammate.id}
                          className="h-4 w-4 border-slate-300 text-slate-950 accent-slate-950"
                        />
                        <UserAvatar
                          name={teammate.name}
                          color={teammate.avatarColor}
                          imageUrl={teammate.companyLogoUrl}
                          className="h-11 w-11 rounded-[1.25rem]"
                        />
                        <div className="min-w-0">
                          <p className="truncate font-medium text-slate-950">{teammate.name}</p>
                          <p className="truncate text-xs leading-5 text-slate-500">
                            {teammate.nickname ? `@${teammate.nickname}` : teammate.title || teammate.email}
                          </p>
                          {teammate.nickname && (teammate.title || teammate.email) ? (
                            <p className="truncate text-xs leading-5 text-slate-400">{teammate.title || teammate.email}</p>
                          ) : null}
                        </div>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm leading-6 text-slate-500">
                    {t("No teammates match this search yet.")}
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm leading-6 text-slate-500">
                {t("No one else is visible in your workspace yet. Add teammates first to start chatting.")}
              </div>
            )}
            {state.fields?.participantIds ? <p className="text-xs font-medium text-rose-500">{state.fields.participantIds}</p> : null}
          </fieldset>

          <div className="flex justify-end">
            <SubmitButton disabled={!canCreateConversation}>{t("New conversation")}</SubmitButton>
          </div>
        </form>
      )}
    </ActionDialog>
  );
}
