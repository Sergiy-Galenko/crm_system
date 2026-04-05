"use client";

import { Clock3, ImageIcon, Sparkles, Users, X } from "lucide-react";
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
  const { t, locale } = useLocale();
  const primaryUser = conversation.participants[0] ?? conversation.participantDirectory[0];
  const lastActiveLabel =
    conversation.type === "DIRECT" && primaryUser?.lastSeenAt
      ? t("Last active {time}", { time: fromNow(primaryUser.lastSeenAt, locale) })
      : conversation.statusLabel;

  return (
    <aside className="flex h-full min-h-0 flex-col bg-[linear-gradient(180deg,rgba(6,11,25,0.98),rgba(15,23,42,0.92))] text-white">
      <div className="border-b border-white/10 px-5 py-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/38">{t("Conversation details")}</p>
            <p className="mt-1 text-sm text-white/55">{t("Profile, media, and quick actions in one place.")}</p>
          </div>
          {showMobileClose ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="rounded-[1rem] border border-white/10 bg-white/[0.04] text-white/70 hover:bg-white/[0.08] hover:text-white"
              onClick={onClose}
              aria-label={t("Close details")}
            >
              <X className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5">
        <section className="relative overflow-hidden rounded-[1.85rem] border border-white/10 bg-[linear-gradient(155deg,rgba(30,41,59,0.94),rgba(15,23,42,0.82))] p-5 shadow-[0_26px_70px_rgba(2,6,23,0.34)]">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.16),transparent_60%)]" />
          <div className="pointer-events-none absolute -right-10 bottom-0 h-32 w-32 rounded-full bg-emerald-400/10 blur-3xl" />

          <div className="relative flex flex-col items-center text-center">
            {primaryUser ? (
              <UserAvatar
                name={primaryUser.name}
                color={primaryUser.avatarColor}
                imageUrl={primaryUser.companyLogoUrl}
                className="h-24 w-24 rounded-[2rem] border border-white/10 shadow-[0_20px_50px_rgba(2,6,23,0.34)]"
                imageClassName="h-full w-full bg-transparent object-cover p-0"
              />
            ) : null}
            <h3 className="mt-4 text-[1.4rem] font-semibold tracking-[-0.03em] text-white">{conversation.title}</h3>
            <p className="mt-1 max-w-xs text-sm text-white/55">{conversation.subtitle}</p>

            <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/68">
              <Clock3 className="h-3.5 w-3.5" />
              {lastActiveLabel}
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <Badge variant="info">{conversation.statusLabel}</Badge>
              <Badge>{conversation.type === "GROUP" ? t("Group") : t("Direct")}</Badge>
            </div>
          </div>

          <div className="relative mt-5 grid grid-cols-3 gap-2.5">
            <div className="rounded-[1.15rem] border border-white/10 bg-white/[0.04] px-3 py-3 text-left">
              <p className="text-[10px] uppercase tracking-[0.18em] text-white/36">{t("People")}</p>
              <p className="mt-1 text-lg font-semibold tracking-tight text-white">{conversation.participantDirectory.length}</p>
            </div>
            <div className="rounded-[1.15rem] border border-white/10 bg-white/[0.04] px-3 py-3 text-left">
              <p className="text-[10px] uppercase tracking-[0.18em] text-white/36">{t("Media")}</p>
              <p className="mt-1 text-lg font-semibold tracking-tight text-white">{conversation.sharedMedia.length}</p>
            </div>
            <div className="rounded-[1.15rem] border border-white/10 bg-white/[0.04] px-3 py-3 text-left">
              <p className="text-[10px] uppercase tracking-[0.18em] text-white/36">{t("Mode")}</p>
              <p className="mt-1 text-sm font-semibold tracking-wide text-white">
                {conversation.type === "GROUP" ? t("Group") : t("Direct")}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-4 shadow-[0_20px_44px_rgba(2,6,23,0.16)]">
          <div className="flex items-center justify-between gap-3 text-white">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <h4 className="text-sm font-semibold">{t("Participants")}</h4>
            </div>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-white/48">
              {conversation.participantDirectory.length}
            </span>
          </div>
          <div className="mt-4 space-y-2.5">
            {conversation.participantDirectory.map((participant) => (
              <div key={participant.id} className="flex items-center gap-3 rounded-[1.25rem] border border-white/10 bg-black/12 px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                <UserAvatar
                  name={participant.name}
                  color={participant.avatarColor}
                  imageUrl={participant.companyLogoUrl}
                  className="h-11 w-11 rounded-[1rem]"
                  imageClassName="h-full w-full bg-transparent object-cover p-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">{participant.name}</p>
                  <p className="truncate text-xs text-white/55">
                    {participant.nickname ? `@${participant.nickname}` : participant.title || participant.email}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-4 shadow-[0_20px_44px_rgba(2,6,23,0.16)]">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-white">
              <ImageIcon className="h-4 w-4" />
              <h4 className="text-sm font-semibold">{t("Shared media")}</h4>
            </div>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-white/48">
              {conversation.sharedMedia.length}
            </span>
          </div>

          {conversation.sharedMedia.length ? (
            <div className="mt-4 grid grid-cols-2 gap-3">
              {conversation.sharedMedia.map((item) => (
                <div key={item.id} className="overflow-hidden rounded-[1.2rem] border border-white/10 bg-black/20 shadow-[0_14px_28px_rgba(2,6,23,0.2)]">
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
            <div className="mt-4 rounded-[1.2rem] border border-dashed border-white/10 bg-black/10 px-4 py-5 text-sm leading-6 text-white/52">
              {t("No shared media in this conversation yet.")}
            </div>
          )}
        </section>

        <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-1">
          <div className="flex items-center gap-2 px-3 pt-3 text-white/62">
            <Sparkles className="h-4 w-4" />
            <p className="text-xs font-medium uppercase tracking-[0.18em]">{t("Thread style")}</p>
          </div>
          <div className="mt-2">
            <ChatAppearanceControls value={backgroundPreference} onPreviewChange={onBackgroundChange} />
          </div>
        </div>
      </div>
    </aside>
  );
}
