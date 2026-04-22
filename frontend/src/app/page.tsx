import Link from "next/link";
import { ArrowRight, BadgePercent, BriefcaseBusiness, Users2 } from "lucide-react";
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
    <main className="page-shell min-h-screen py-4 sm:py-6">
      <section className="card px-6 py-6 sm:px-8 sm:py-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
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

        <div className="mt-14 grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <div>
            <h1 className="max-w-4xl text-5xl font-semibold tracking-tight text-slate-950 sm:text-6xl">
              {t("Minimal revenue operations for premium teams.")}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-500">
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
                <Link href="/login">{t("Sign in")}</Link>
              </Button>
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-3">
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
                <div key={item.title} className="rounded-xl border border-slate-200 bg-white p-4">
                  <item.icon className="h-4 w-4 text-slate-500" />
                  <h3 className="mt-3 text-sm font-semibold text-slate-950">{t(item.title)}</h3>
                  <p className="mt-1.5 text-sm leading-6 text-slate-500">{t(item.text)}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6">
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { label: "Lead win rate", value: "34%" },
                  { label: "Revenue tracked", value: "$378K" },
                  { label: "Active promo codes", value: "12" },
                  { label: "Response SLA", value: "< 2h" },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">{t(item.label)}</p>
                    <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{item.value}</p>
                  </div>
                ))}
              </div>
              <p className="mt-5 text-sm leading-6 text-slate-500">
                {t(
                  "The project ships with demo admin and manager accounts so Git push, database seed, and Vercel deployment are straightforward.",
                )}
              </p>
          </div>
        </div>
      </section>
    </main>
  );
}
