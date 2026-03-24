import { redirect } from "next/navigation";
import { BrandMark } from "@/components/brand-mark";
import { RegisterForm } from "@/components/auth/register-form";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { getServerTranslator } from "@/lib/locale-server";
import { getCurrentUser } from "@/lib/session";

export default async function RegisterPage() {
  const user = await getCurrentUser();
  const { t } = await getServerTranslator();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="page-shell flex min-h-screen items-center py-8">
      <div className="mx-auto w-full max-w-[38rem] space-y-4">
        <div className="flex items-center justify-between">
          <BrandMark />
          <LocaleSwitcher />
        </div>

        <section className="card p-8 sm:p-10">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">{t("Create workspace access")}</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{t("Register")}</h1>
          <p className="mt-3 text-sm leading-7 text-slate-500">
            {t("Start with a manager account and expand into full admin controls inside the dashboard settings panel.")}
          </p>
          <RegisterForm />
        </section>

        <section className="card p-5">
          <p className="text-sm font-medium text-slate-950">{t("Included")}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {[
              "Protected App Router dashboard",
              "Promo usage tracking and auditability",
              "Search, filters, sorting, and pagination",
              "Responsive premium admin layout",
            ].map((line) => (
              <div key={line} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                {t(line)}
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
