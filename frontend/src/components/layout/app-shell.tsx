"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import * as React from "react";
import { AlertTriangle, BadgeCheck, CalendarClock, Menu, Search } from "lucide-react";
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
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationBell } from "@/components/notifications/notification-bell";

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

type MeetingReminder = {
  title: string;
  description: string;
  href: string;
};

type SystemNotice = {
  title: string;
  description: string;
};

function SidebarSectionTitle({
  title,
  className,
}: {
  title: string;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2.5", className)}>
      <p className="text-[0.76rem] font-semibold uppercase tracking-[0.24em] text-white/50">{title}</p>
      <div className="h-px bg-white/14" />
    </div>
  );
}

function SidebarNavLink({
  href,
  title,
  active,
  indicator = 0,
  children,
  onNavigate,
}: {
  href: string;
  title: string;
  active: boolean;
  indicator?: number;
  children: React.ReactNode;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href as never}
      className={cn(
        "group flex items-center gap-3 rounded-[1.45rem] border px-3.5 py-3.5 text-[1.02rem] font-medium transition duration-200",
        active
          ? "border-white/10 bg-[linear-gradient(135deg,rgba(10,15,37,0.96),rgba(17,24,48,0.9))] text-white shadow-[0_22px_48px_rgba(6,6,22,0.34)]"
          : "border-transparent text-white/84 hover:border-white/8 hover:bg-white/[0.055] hover:text-white",
      )}
      onClick={onNavigate}
    >
      <span
        className={cn(
          "grid h-10 w-10 shrink-0 place-items-center rounded-[1rem] transition",
          active
            ? "bg-white/[0.08] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
            : "bg-white/[0.055] text-white/74 group-hover:bg-white/[0.09] group-hover:text-white",
        )}
      >
        {children}
      </span>
      <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
        <span className="truncate">{title}</span>
        {indicator > 0 ? (
          <span
            className={cn(
              "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold leading-none",
              active ? "bg-white/[0.1] text-white" : "bg-rose-500 text-white",
            )}
          >
            {indicator > 9 ? "9+" : indicator}
          </span>
        ) : null}
      </span>
    </Link>
  );
}

function isActivePath(pathname: string, href: string) {
  return href === "/dashboard"
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({
  user,
  chatIndicatorCount = 0,
  meetingReminder,
  systemNotice,
  children,
}: {
  user: UserSummary;
  chatIndicatorCount?: number;
  meetingReminder?: MeetingReminder;
  systemNotice?: SystemNotice;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [isLoggingOut, startLogoutTransition] = React.useTransition();
  const { t } = useLocale();
  const secondaryLine = user.statusMessage || user.title || user.email;
  const sidebarMeta = user.statusMessage || user.location || null;
  const primaryNavigation = dashboardNavigation.filter((item) => item.href !== "/dashboard/settings");
  const secondaryNavigation = dashboardNavigation.filter((item) => item.href === "/dashboard/settings");

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
          "fixed inset-y-4 left-4 z-40 w-[292px] overflow-hidden rounded-[2.35rem] border border-white/10 bg-[linear-gradient(180deg,#231e52_0%,#221d4d_42%,#19163a_100%)] p-4 shadow-[0_36px_120px_rgba(9,8,27,0.46)] transition duration-300 lg:static lg:flex lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-[120%] lg:translate-x-0",
        )}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),transparent_58%)]" />
        <div className="relative flex h-full flex-col">
          <div className="flex items-start justify-between gap-3">
            <BrandMark
              href="/dashboard"
              className="[&_p:first-of-type]:text-[1.02rem] [&_p:first-of-type]:tracking-[0.12em] [&_p:first-of-type]:text-white [&_p:last-of-type]:text-white/52 [&>div:first-child]:border-white/10 [&>div:first-child]:bg-white/8"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-white/72 hover:bg-white/8 hover:text-white lg:hidden"
              onClick={() => setOpen(false)}
            >
              <Menu className="h-4 w-4" />
            </Button>
          </div>

          <div className="mt-6 rounded-[1.9rem] border border-white/10 bg-[linear-gradient(180deg,rgba(167,164,190,0.98),rgba(147,144,173,0.94))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]">
            <div className="flex flex-col items-center text-center">
              <div className="relative">
                <div className="absolute inset-2 rounded-full bg-white/18 blur-xl" />
                <UserAvatar
                  name={user.name}
                  color={user.avatarColor}
                  imageUrl={user.companyLogoUrl}
                  className="relative h-24 w-24 rounded-full border border-white/30 bg-white/14 shadow-[0_16px_32px_rgba(15,23,42,0.12)]"
                />
                <div className="absolute -bottom-1 -right-1 rounded-xl border border-white/70 bg-[#f08a32] p-2 text-white shadow-[0_10px_24px_rgba(240,138,50,0.3)]">
                  <BadgeCheck className="h-3.5 w-3.5" />
                </div>
              </div>
              <p className="mt-4 max-w-[13rem] text-lg font-semibold leading-6 text-white">{user.name}</p>
              <p className="mt-1 text-sm text-white/78">{user.roleLabel ?? t(user.role)}</p>
            </div>

            <div className="mt-4 rounded-xl border border-white/14 bg-white/14 px-3 py-2 text-sm font-medium text-white/92">
              <p className="truncate">{user.email}</p>
            </div>

            {sidebarMeta ? (
              <p className="mt-3 text-sm leading-6 text-white/68">{sidebarMeta}</p>
            ) : null}
          </div>

          <div className="mt-6 min-h-0 flex-1 overflow-y-auto pr-1 pb-5 scrollbar-subtle">
            <SidebarSectionTitle title={t("Main menu")} />
            <nav className="mt-4 grid gap-2">
              {primaryNavigation.map((item) => (
                <SidebarNavLink
                  key={item.href}
                  href={item.href}
                  title={t(item.title)}
                  active={isActivePath(pathname, item.href)}
                  indicator={item.href === "/dashboard/chat" && !isActivePath(pathname, item.href) ? chatIndicatorCount : 0}
                  onNavigate={() => setOpen(false)}
                >
                  <item.icon className="h-4 w-4" />
                </SidebarNavLink>
              ))}
            </nav>

            {secondaryNavigation.length ? (
              <>
                <SidebarSectionTitle title={t("Settings")} className="mt-7" />
                <nav className="mt-4 grid gap-2">
                  {secondaryNavigation.map((item) => (
                    <SidebarNavLink
                      key={item.href}
                      href={item.href}
                      title={t(item.title)}
                      active={isActivePath(pathname, item.href)}
                      onNavigate={() => setOpen(false)}
                    >
                      <item.icon className="h-4 w-4" />
                    </SidebarNavLink>
                  ))}
                </nav>
              </>
            ) : null}
          </div>

          <div className="mt-4 rounded-[1.35rem] border border-white/10 bg-white/[0.055] px-4 py-3.5 text-white/74 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/42">{t("Workspace")}</p>
            <p className="mt-2 text-sm leading-6 text-white/78">{secondaryLine}</p>
          </div>
        </div>
      </aside>

      {open ? (
        <button
          aria-label={t("Close sidebar")}
          className="fixed inset-0 z-30 bg-[var(--ui-overlay)] backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col gap-4 lg:pl-0">
        <header className="sticky top-4 z-20 flex items-center gap-3 rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-solid)] px-4 py-3 shadow-[var(--ui-shadow-xs)] backdrop-blur-xl">
          <Button type="button" variant="secondary" size="icon" className="lg:hidden" onClick={() => setOpen(true)}>
            <Menu className="h-4 w-4" />
          </Button>

          <form
            action="/dashboard/clients"
            className="flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] px-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
          >
            <Search className="h-4 w-4 text-[var(--ui-text-soft)]" />
            <input
              aria-label={t("Search CRM records")}
              className="h-10 min-w-0 flex-1 bg-transparent text-sm text-[var(--ui-text-strong)] outline-none placeholder:text-[var(--ui-text-soft)]"
              name="q"
              placeholder={t("Search clients, leads, or companies")}
            />
          </form>

          <LocaleSwitcher />
          <ThemeToggle />

          <NotificationBell />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 rounded-xl border border-[var(--ui-border)] bg-[var(--ui-surface-solid)] px-3 py-2 shadow-[var(--ui-shadow-xs)] transition hover:bg-[var(--ui-surface-hover)]">
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
          <div className="flex items-start gap-3 rounded-2xl border border-amber-300/70 bg-amber-50/90 px-4 py-3 text-amber-900 shadow-[var(--ui-shadow-xs)] backdrop-blur-xl">
            <div className="rounded-xl bg-amber-100/90 p-2 text-amber-700">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold">{systemNotice.title}</p>
              <p className="mt-1 text-sm leading-6 text-amber-800">{systemNotice.description}</p>
            </div>
          </div>
        ) : null}

        {meetingReminder ? (
          <div className="flex flex-col gap-4 rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-solid)] px-4 py-3 shadow-[var(--ui-shadow-xs)] md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-[var(--ui-surface-muted)] p-2.5 text-[var(--ui-text)]">
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

        <main className={cn("min-w-0", pathname.startsWith("/dashboard/chat") ? "overflow-hidden" : "pb-6")}>{children}</main>
      </div>
    </div>
  );
}
