"use client";

import * as React from "react";
import { Bell } from "lucide-react";
import { useLocale } from "@/components/providers/locale-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { SsePayload } from "@/lib/notification-stream";

type Notification = {
  id: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
};

type ApiResponse = {
  notifications: Notification[];
  unreadCount: number;
};

function BadgeCount({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="absolute -right-1.5 -top-1.5 inline-flex min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 py-0.5 text-[11px] font-semibold leading-none text-white shadow-sm">
      {count > 9 ? "9+" : count}
    </span>
  );
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function NotificationBell() {
  const { t } = useLocale();
  const [open, setOpen] = React.useState(false);
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [loaded, setLoaded] = React.useState(false);

  // --- Initial fetch ---
  React.useEffect(() => {
    fetch("/api/notifications")
      .then((r) => r.json() as Promise<ApiResponse>)
      .then((data) => {
        setNotifications(data.notifications ?? []);
        setUnreadCount(data.unreadCount ?? 0);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  // --- SSE subscription ---
  React.useEffect(() => {
    const es = new EventSource("/api/notifications/stream");

    es.addEventListener("connected", () => {
      // Connection confirmed — nothing to do
    });

    es.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as SsePayload;
        const newNotif: Notification = {
          id: payload.id,
          title: payload.title,
          body: payload.body,
          read: false,
          createdAt: payload.createdAt,
        };
        setNotifications((prev) => [newNotif, ...prev].slice(0, 20));
        setUnreadCount((c) => c + 1);
      } catch {
        // ignore malformed events
      }
    };

    es.onerror = () => {
      // Browser will auto-reconnect after a delay — no action needed
    };

    return () => {
      es.close();
    };
  }, []);

  // --- Mark all as read when opening the panel ---
  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);

    if (nextOpen && unreadCount > 0) {
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      fetch("/api/notifications", { method: "DELETE" }).catch(() => {});
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" size="icon" className="relative" aria-label={t("Notifications")}>
          <Bell className="h-4 w-4" />
          <BadgeCount count={unreadCount} />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-[22rem]">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>{t("Notifications")}</span>
          {notifications.length > 0 && (
            <span className="text-xs font-normal text-slate-400">{notifications.length} total</span>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {!loaded ? (
          <DropdownMenuItem className="py-4 text-slate-400">{t("Loading…")}</DropdownMenuItem>
        ) : notifications.length === 0 ? (
          <DropdownMenuItem className="py-4 text-slate-500">{t("No new notifications.")}</DropdownMenuItem>
        ) : (
          notifications.map((item) => (
            <DropdownMenuItem
              key={item.id}
              className="flex items-start gap-3 rounded-2xl px-3 py-3"
            >
              <div
                className={`mt-0.5 h-2 w-2 shrink-0 rounded-full transition-colors ${
                  item.read ? "bg-transparent" : "bg-rose-500"
                }`}
              />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-slate-900 dark:text-slate-100">{item.title}</p>
                <p className="mt-0.5 truncate text-xs leading-5 text-slate-500">{item.body}</p>
                <p className="mt-1.5 text-[11px] uppercase tracking-[0.16em] text-slate-400">
                  {relativeTime(item.createdAt)}
                </p>
              </div>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
