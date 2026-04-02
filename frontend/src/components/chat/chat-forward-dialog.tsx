"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { forwardMessageAction } from "@/actions/chat";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/providers/locale-provider";
import type { ChatConversationListItem, ChatMessageItem } from "./chat-types";
import { UserAvatar } from "@/components/ui/avatar";

export function ChatForwardDialog({
  isOpen,
  onClose,
  message,
  conversations,
}: {
  isOpen: boolean;
  onClose: () => void;
  message: ChatMessageItem | null;
  conversations: ChatConversationListItem[];
}) {
  const { t } = useLocale();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  if (!message) return null;

  async function handleForward() {
    if (!selectedId) return;

    setIsPending(true);
    startTransition(async () => {
      await forwardMessageAction(selectedId, message!.id);
      setIsPending(false);
      onClose();
      router.push(`/dashboard/chat?conversation=${selectedId}`);
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("Forward Message")}</DialogTitle>
          <DialogDescription>
            {t("Choose a conversation to forward this message to.")}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-60 overflow-y-auto rounded-xl border p-2 space-y-1">
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => setSelectedId(conv.id)}
              className={`flex w-full items-center gap-3 rounded-lg p-2 text-left transition ${
                selectedId === conv.id ? "bg-primary/10 ring-1 ring-primary" : "hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <UserAvatar name={conv.title} />
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-medium">{conv.title}</p>
                <p className="truncate text-xs text-slate-500">{conv.subtitle}</p>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-4 flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>
            {t("Cancel")}
          </Button>
          <Button onClick={handleForward} disabled={!selectedId || isPending}>
            {isPending ? t("Forwarding...") : t("Forward")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
