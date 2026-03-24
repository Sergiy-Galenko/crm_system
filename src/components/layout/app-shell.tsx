"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import { Bell, Menu, Search, Sparkles } from "lucide-react";
import { dashboardNavigation } from "@/lib/constants";
import { cn, fromNow } from "@/lib/utils";
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
  title?: string | null;
  avatarColor?: string | null;
};

type NotificationItem = {
  id: string;
  label: string;
  meta: string;
  createdAt: Date;
};

export function AppShell({
  user,
  notifications,
  children,
}: {
  user: UserSummary;
  notifications: NotificationItem[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);

  return (
    <div className="page-shell flex min-h-screen gap-6 py-6">
      <aside
        className={cn(
          "card fixed inset-y-6 left-4 z-40 w-[292px] p-5 transition duration-300 lg:static lg:flex lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-[120%] lg:translate-x-0",
        )}
      >
        <div className="flex h-full flex-col">
          <BrandMark href="/dashboard" />
          <div className="mt-8 rounded-[1.75rem] border border-white/70 bg-slate-950 px-4 py-4 text-white">
            <p className="text-xs uppercase tracking-[0.18em] text-white/55">Workspace</p>
            <p className="mt-3 text-lg font-semibold">Revenue cockpit</p>
            <p className="mt-2 text-sm leading-6 text-white/65">
              Clean pipeline visibility, promo performance, and account execution in one place.
            </p>
          </div>
          <nav className="mt-6 grid gap-1.5">
            {dashboardNavigation.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
                    active
                      ? "bg-slate-950 text-white shadow-[0_20px_50px_rgba(15,23,40,0.16)]"
                      : "text-slate-500 hover:bg-white/70 hover:text-slate-900",
                  )}
                  onClick={() => setOpen(false)}
                >
                  <item.icon className="h-4 w-4" />
                  {item.title}
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto rounded-[1.5rem] border border-white/70 bg-white/80 p-4">
            <div className="flex items-center gap-3">
              <UserAvatar name={user.name} color={user.avatarColor} />
              <div>
                <p className="text-sm font-semibold text-slate-950">{user.name}</p>
                <p className="text-xs text-slate-500">{user.role.toLowerCase()}</p>
              </div>
            </div>
            {user.title ? <p className="mt-3 text-sm text-slate-500">{user.title}</p> : null}
          </div>
        </div>
      </aside>

      {open ? (
        <button
          aria-label="Close sidebar"
          className="fixed inset-0 z-30 bg-slate-950/20 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col gap-6 lg:pl-0">
        <header className="card sticky top-6 z-20 flex items-center gap-3 px-4 py-4 sm:px-5">
          <Button variant="secondary" size="icon" className="lg:hidden" onClick={() => setOpen(true)}>
            <Menu className="h-4 w-4" />
          </Button>

          <form action="/dashboard/clients" className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/80 px-4">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              aria-label="Search CRM records"
              className="h-11 min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
              name="q"
              placeholder="Search clients, leads, or companies"
            />
          </form>

          <div className="hidden rounded-2xl border border-white/80 bg-white/80 px-4 py-3 text-sm text-slate-500 xl:flex xl:items-center xl:gap-2">
            <Sparkles className="h-4 w-4 text-blue-500" />
            Premium workflow system
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon">
                <Bell className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[22rem]">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notifications.length ? (
                notifications.map((item) => (
                  <DropdownMenuItem key={item.id} className="block rounded-2xl px-3 py-3">
                    <p className="font-medium text-slate-900">{item.label}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{item.meta}</p>
                    <p className="mt-2 text-[11px] uppercase tracking-[0.16em] text-slate-400">{fromNow(item.createdAt)}</p>
                  </DropdownMenuItem>
                ))
              ) : (
                <DropdownMenuItem className="py-4 text-slate-500">No new notifications.</DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 rounded-2xl border border-white/80 bg-white/80 px-3 py-2 transition hover:bg-white">
                <UserAvatar name={user.name} color={user.avatarColor} className="h-9 w-9" />
                <div className="hidden text-left sm:block">
                  <p className="text-sm font-semibold text-slate-950">{user.name}</p>
                  <p className="text-xs text-slate-500">{user.title ?? user.email}</p>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings">Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <form action={logoutAction}>
                <button className="w-full">
                  <DropdownMenuItem>Log out</DropdownMenuItem>
                </button>
              </form>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="min-w-0 pb-6">{children}</main>
      </div>
    </div>
  );
}
