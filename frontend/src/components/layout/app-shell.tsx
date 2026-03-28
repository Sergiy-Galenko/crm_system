"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import * as React from "react";
import { AlertTriangle, Bell, CalendarClock, Menu, Search } from "lucide-react";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { useLocale } from "@/components/providers/locale-provider";
import { dashboardNavigation } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logoutAction } from "@/actions/auth";
import { BrandMark } from "@/components/brand-mark";

type UserSummary = {
  id: string;
  name: string;
  email: string;
  role: string;
  roleLabel?: string | null;
  title?: string | null;
  statusMessage?: string | null;
  phone?: string | null;
  location?: string | null;
  bio?: string | null;
  companyLogoUrl?: string | null;
  avatarColor?: string | null;
};

type NotificationItem = {
  id: string;
  label: string;
  meta: string;
  createdAtLabel: string;
};

type MeetingReminder = {
  title: string;
  description: string;
  href: string;
};

type SystemNotice = {
  title: string;
  description: string;
};

function BadgeCount({ count }: { count: number }) {
  if (count <= 0) {
    return null;
  }

  return (
    <span className="absolute -right-1.5 -top-1.5 inline-flex min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 py-0.5 text-[11px] font-semibold leading-none text-white shadow-sm">
      {count > 9 ? "9+" : count}
    </span>
  );
}

export function AppShell({
  user,
  notifications,
  notificationIndicatorCount = 0,
  chatIndicatorCount = 0,
  meetingReminder,
  systemNotice,
  children,
}: {
  user: UserSummary;
  notifications: NotificationItem[];
  notificationIndicatorCount?: number;
  chatIndicatorCount?: number;
  meetingReminder?: MeetingReminder;
  systemNotice?: SystemNotice;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [notificationsOpen, setNotificationsOpen] = React.useState(false);
  const [visibleNotificationCount, setVisibleNotificationCount] = React.useState(notificationIndicatorCount);
  const [isLoggingOut, startLogoutTransition] = React.useTransition();
  const { t } = useLocale();
  const secondaryLine = user.statusMessage || user.title || user.email;
  const sidebarMeta = user.statusMessage || user.location || null;

  React.useEffect(() => {
    setVisibleNotificationCount(notificationIndicatorCount);
  }, [notificationIndicatorCount]);

  function handleLogout() {
    startLogoutTransition(async () => {
      await logoutAction();
      router.replace("/login");
    });
  }

  return (
    <div className="page-shell flex min-h-screen gap-5 py-4 md:py-5">
      <aside
        className={cn(
          "fixed inset-y-4 left-4 z-40 w-[272px] rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_18px_48px_rgba(15,23,42,0.08)] transition duration-300 lg:static lg:flex lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-[120%] lg:translate-x-0",
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between gap-3">
            <BrandMark href="/dashboard" />
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(false)}>
              <Menu className="h-4 w-4" />
            </Button>
          </div>
          <nav className="mt-8 grid gap-1">
            {dashboardNavigation.map((item) => {
              const active =
                item.href === "/dashboard"
                  ? pathname === item.href
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href as never}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition",
                    active
                      ? "bg-slate-950 text-white"
                      : "text-slate-500 hover:bg-slate-100 hover:text-slate-900",
                  )}
                  onClick={() => setOpen(false)}
                >
                  <item.icon className="h-4 w-4" />
                  <span className="flex min-w-0 items-center gap-2 truncate">
                    <span className="truncate">{t(item.title)}</span>
                    {item.href === "/dashboard/chat" && !active && chatIndicatorCount > 0 ? (
                      <span
                        className={cn(
                          "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold leading-none",
                          active ? "bg-white/20 text-white" : "bg-rose-100 text-rose-600",
                        )}
                      >
                        {chatIndicatorCount > 9 ? "9+" : chatIndicatorCount}
                      </span>
                    ) : null}
                  </span>
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto border-t border-slate-100 pt-4">
            <div className="flex items-center gap-3">
              <UserAvatar name={user.name} color={user.avatarColor} imageUrl={user.companyLogoUrl} />
              <div>
                <p className="text-sm font-semibold text-slate-950">{user.name}</p>
                <p className="text-xs text-slate-500">{user.roleLabel ?? t(user.role)}</p>
              </div>
            </div>
            {user.title ? <p className="mt-2 text-sm text-slate-600">{user.title}</p> : null}
            {sidebarMeta ? <p className="mt-1 text-sm text-slate-500">{sidebarMeta}</p> : null}
          </div>
        </div>
      </aside>

      {open ? (
        <button
          aria-label={t("Close sidebar")}
          className="fixed inset-0 z-30 bg-slate-950/20 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col gap-4 lg:pl-0">
        <header className="sticky top-4 z-20 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
          <Button variant="secondary" size="icon" className="lg:hidden" onClick={() => setOpen(true)}>
            <Menu className="h-4 w-4" />
          </Button>

          <form action="/dashboard/clients" className="flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3.5">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              aria-label={t("Search CRM records")}
              className="h-10 min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
              name="q"
              placeholder={t("Search clients, leads, or companies")}
            />
          </form>

          <LocaleSwitcher />

          <DropdownMenu
            open={notificationsOpen}
            onOpenChange={(nextOpen) => {
              setNotificationsOpen(nextOpen);

              if (nextOpen) {
                setVisibleNotificationCount(0);
              }
            }}
          >
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="relative">
                <Bell className="h-4 w-4" />
                <BadgeCount count={visibleNotificationCount} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[22rem]">
              <DropdownMenuLabel>{t("Notifications")}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notifications.length ? (
                notifications.map((item) => (
                  <DropdownMenuItem key={item.id} className="block rounded-2xl px-3 py-3">
                    <p className="font-medium text-slate-900">{item.label}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{item.meta}</p>
                    <p className="mt-2 text-[11px] uppercase tracking-[0.16em] text-slate-400">{item.createdAtLabel}</p>
                  </DropdownMenuItem>
                ))
              ) : (
                <DropdownMenuItem className="py-4 text-slate-500">{t("No new notifications.")}</DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 transition hover:bg-slate-50">
                <UserAvatar name={user.name} color={user.avatarColor} imageUrl={user.companyLogoUrl} className="h-9 w-9" />
                <div className="hidden text-left sm:block">
                  <p className="text-sm font-semibold text-slate-950">{user.name}</p>
                  <p className="text-xs text-slate-500">{secondaryLine}</p>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings">{t("Settings")}</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="w-full"
                disabled={isLoggingOut}
                onSelect={(event) => {
                  event.preventDefault();
                  handleLogout();
                }}
              >
                {t("Log out")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {systemNotice ? (
          <div className="flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-amber-900 shadow-sm">
            <div className="rounded-xl bg-amber-100 p-2 text-amber-700">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold">{systemNotice.title}</p>
              <p className="mt-1 text-sm leading-6 text-amber-800">{systemNotice.description}</p>
            </div>
          </div>
        ) : null}

        {meetingReminder ? (
          <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-slate-100 p-2.5 text-slate-700">
                <CalendarClock className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-950">{meetingReminder.title}</p>
                <p className="mt-1 text-sm text-slate-500">{meetingReminder.description}</p>
              </div>
            </div>
            <Button asChild variant="secondary" size="sm">
              <Link href={meetingReminder.href as never}>{t("Open meetings")}</Link>
            </Button>
          </div>
        ) : null}

        <main className="min-w-0 pb-6">{children}</main>
      </div>
    </div>
  );
}
