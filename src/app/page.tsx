import Link from "next/link";
import { ArrowRight, BadgePercent, BriefcaseBusiness, ShieldCheck, Users2 } from "lucide-react";
import { redirect } from "next/navigation";
import { BrandMark } from "@/components/brand-mark";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { Button } from "@/components/ui/button";
import { getServerTranslator } from "@/lib/locale-server";
import { getCurrentUser } from "@/lib/session";

export default async function LandingPage() {
  const user = await getCurrentUser();
  const { t } = await getServerTranslator();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="page-shell min-h-screen py-6">
      <section className="card overflow-hidden rounded-[2.5rem] px-6 py-6 sm:px-8 sm:py-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <BrandMark />
          <div className="flex items-center gap-3">
            <LocaleSwitcher />
            <Button asChild variant="ghost">
              <Link href="/login">{t("Sign in")}</Link>
            </Button>
            <Button asChild>
              <Link href="/register">{t("Start free")}</Link>
            </Button>
          </div>
        </div>

        <div className="mt-16 grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/75 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              <ShieldCheck className="h-4 w-4 text-blue-500" />
              {t("Production-ready CRM on Next.js + Prisma")}
            </div>
            <h1 className="mt-6 max-w-4xl text-5xl font-semibold tracking-tight text-slate-950 sm:text-6xl">
              {t("Minimal revenue operations for premium teams.")}
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-500">
              {t(
                "Manage clients, leads, deals, promo codes, tasks, notes, and admin activity in one polished workspace. Built for Vercel deployment with secure auth, typed validation, and a clean full-stack architecture.",
              )}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild size="lg">
                <Link href="/register">
                  {t("Launch workspace")}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="secondary" size="lg">
                <Link href="/login">{t("Use demo account")}</Link>
              </Button>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {[
                {
                  icon: Users2,
                  title: "Client intelligence",
                  text: "Accounts, contact history, notes, tasks, and ownership in one clean timeline.",
                },
                {
                  icon: BriefcaseBusiness,
                  title: "Deal pipeline",
                  text: "Track gross to net revenue, stage movement, and promo-adjusted values.",
                },
                {
                  icon: BadgePercent,
                  title: "Promo governance",
                  text: "Server-side validation with usage caps, expiration rules, and audit history.",
                },
              ].map((item) => (
                <div key={item.title} className="rounded-[1.75rem] border border-white/75 bg-white/70 p-5">
                  <item.icon className="h-5 w-5 text-slate-500" />
                  <h3 className="mt-4 text-base font-semibold text-slate-950">{t(item.title)}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{t(item.text)}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="card rounded-[2.25rem] bg-slate-950 p-6 text-white shadow-[0_30px_100px_rgba(15,23,40,0.24)]">
            <div className="grid gap-4 md:grid-cols-2">
              {[
                { label: "Lead win rate", value: "34%" },
                { label: "Revenue tracked", value: "$378K" },
                { label: "Active promo codes", value: "12" },
                { label: "Response SLA", value: "< 2h" },
              ].map((item) => (
                <div key={item.label} className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5">
                  <p className="text-sm text-white/60">{t(item.label)}</p>
                  <p className="mt-3 text-3xl font-semibold tracking-tight">{item.value}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-[1.75rem] border border-white/10 bg-white/5 p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-white/65">{t("Admin demo")}</p>
                <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-white/55">
                  {t("Seeded")}
                </span>
              </div>
              <p className="mt-4 text-base font-medium">admin@vercelcrm.dev</p>
              <p className="mt-2 font-mono text-sm text-white/65">Admin@12345</p>
              <p className="mt-4 text-sm leading-6 text-white/60">
                {t(
                  "The project ships with demo admin and manager accounts so Git push, database seed, and Vercel deployment are straightforward.",
                )}
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
