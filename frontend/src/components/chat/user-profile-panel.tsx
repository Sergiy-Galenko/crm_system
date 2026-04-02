"use client";

import { ImageIcon, Users, X } from "lucide-react";
import { useLocale } from "@/components/providers/locale-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/avatar";
import { ChatImageLightbox } from "@/components/chat/chat-image-lightbox";
import { ChatAppearanceControls } from "@/components/chat/chat-appearance-controls";
import type { ActiveConversation } from "./chat-types";
import { fromNow } from "@/lib/utils";

export function UserProfilePanel({
  conversation,
  backgroundPreference,
  onBackgroundChange,
  onClose,
  showMobileClose = false,
}: {
  conversation: ActiveConversation;
  backgroundPreference: ActiveConversation["backgroundPreference"];
  onBackgroundChange: (value: ActiveConversation["backgroundPreference"]) => void;
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
          {conversation.type === "DIRECT" && primaryUser?.lastSeenAt && (
             <div className="mt-2 flex items-center justify-center gap-1.5 text-xs font-medium">
               <span className="relative flex h-2 w-2">
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-40"></span>
                 <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
               </span>
               <span className="text-slate-600 dark:text-slate-400">В мережі</span>
               {/* Note: This mocks 'Online' since we just added the field and don't track 'Offline' states yet. */}
             </div>
          )}
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

        <ChatAppearanceControls value={backgroundPreference} onPreviewChange={onBackgroundChange} />
      </div>
    </aside>
  );
}
