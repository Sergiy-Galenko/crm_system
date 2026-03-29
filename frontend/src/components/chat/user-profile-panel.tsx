"use client";

import { Download, ImageIcon, Settings2, Star, Users, X } from "lucide-react";
import { useLocale } from "@/components/providers/locale-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/avatar";
import { ChatImageLightbox } from "@/components/chat/chat-image-lightbox";
import type { ActiveConversation } from "./chat-types";

export function UserProfilePanel({
  conversation,
  onClose,
  showMobileClose = false,
}: {
  conversation: ActiveConversation;
  onClose?: () => void;
  showMobileClose?: boolean;
}) {
  const { t } = useLocale();
  const primaryUser = conversation.participants[0] ?? conversation.participantDirectory[0];

  return (
    <aside className="flex h-full min-h-0 flex-col bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(248,250,252,0.88))]">
      <div className="border-b border-slate-200 px-5 py-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">{t("Conversation details")}</p>
            <p className="mt-1 text-sm text-slate-500">{t("Profile, media, and quick actions in one place.")}</p>
          </div>
          {showMobileClose ? (
            <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label={t("Close details")}>
              <X className="h-4 w-4" />
            </Button>
          ) : null}
        </div>

        <div className="flex flex-col items-center text-center">
          {primaryUser ? (
            <UserAvatar
              name={primaryUser.name}
              color={primaryUser.avatarColor}
              imageUrl={primaryUser.companyLogoUrl}
              className="h-20 w-20 rounded-[1.75rem]"
            />
          ) : null}
          <h3 className="mt-4 text-lg font-semibold text-slate-950">{conversation.title}</h3>
          <p className="mt-1 text-sm text-slate-500">{conversation.subtitle}</p>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            <Badge variant="info">{conversation.statusLabel}</Badge>
            <Badge>{conversation.type === "GROUP" ? t("Group") : t("Direct")}</Badge>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5">
        <section className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-4">
          <div className="flex items-center gap-2 text-slate-900">
            <Users className="h-4 w-4" />
            <h4 className="text-sm font-semibold">{t("Participants")}</h4>
          </div>
          <div className="mt-4 space-y-3">
            {conversation.participantDirectory.map((participant) => (
              <div key={participant.id} className="flex items-center gap-3 rounded-2xl bg-white px-3 py-3 shadow-sm">
                <UserAvatar
                  name={participant.name}
                  color={participant.avatarColor}
                  imageUrl={participant.companyLogoUrl}
                  className="h-11 w-11 rounded-[1.1rem]"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-950">{participant.name}</p>
                  <p className="truncate text-xs text-slate-500">
                    {participant.nickname ? `@${participant.nickname}` : participant.title || participant.email}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-slate-900">
              <ImageIcon className="h-4 w-4" />
              <h4 className="text-sm font-semibold">{t("Shared media")}</h4>
            </div>
            <span className="text-xs text-slate-400">{conversation.sharedMedia.length}</span>
          </div>

          {conversation.sharedMedia.length ? (
            <div className="mt-4 grid grid-cols-2 gap-3">
              {conversation.sharedMedia.map((item) => (
                <div key={item.id} className="overflow-hidden rounded-[1.2rem] border border-slate-200 bg-white shadow-sm">
                  {item.mediaType === "IMAGE" ? (
                    <ChatImageLightbox
                      src={item.mediaUrl}
                      alt={item.previewLabel}
                      className="rounded-none border-0 bg-transparent"
                      aspectClassName="aspect-square"
                    />
                  ) : (
                    <video src={item.mediaUrl} controls className="aspect-square w-full bg-black object-cover" />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm leading-6 text-slate-500">{t("No shared media in this conversation yet.")}</p>
          )}
        </section>

        <section className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-4">
          <h4 className="text-sm font-semibold text-slate-900">{t("Actions")}</h4>
          <div className="mt-4 grid gap-2">
            <Button type="button" variant="secondary" className="justify-start rounded-2xl">
              <Star className="h-4 w-4" />
              {t("Favorite chat")}
            </Button>
            <Button type="button" variant="secondary" className="justify-start rounded-2xl">
              <Download className="h-4 w-4" />
              {t("Download media")}
            </Button>
            <Button type="button" variant="secondary" className="justify-start rounded-2xl">
              <Settings2 className="h-4 w-4" />
              {t("Conversation settings")}
            </Button>
          </div>
        </section>
      </div>
    </aside>
  );
}
