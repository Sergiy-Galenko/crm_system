import { redirect } from "next/navigation";
import { BrandMark } from "@/components/brand-mark";
import { LoginForm } from "@/components/auth/login-form";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { getServerTranslator } from "@/lib/locale-server";
import { getCurrentUser } from "@/lib/session";

export default async function LoginPage() {
  const user = await getCurrentUser();
  const { t } = await getServerTranslator();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="page-shell flex min-h-screen items-center py-8">
      <div className="mx-auto w-full max-w-[34rem] space-y-4">
        <div className="flex items-center justify-between">
          <BrandMark />
          <LocaleSwitcher />
        </div>

        <section className="card p-8 sm:p-10">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">{t("Welcome back")}</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{t("Sign in")}</h1>
          <p className="mt-3 text-sm leading-7 text-slate-500">
            {t("Continue with your existing CRM workspace and keep activity, deals, and promo performance in sync.")}
          </p>
          <LoginForm />
        </section>
      </div>
    </main>
  );
}
