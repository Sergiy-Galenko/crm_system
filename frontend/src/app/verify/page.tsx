import { redirect } from "next/navigation";
import { BrandMark } from "@/components/brand-mark";
import { VerifyForm } from "@/components/auth/verify-form";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { getServerTranslator } from "@/lib/locale-server";
import { getParam, type SearchParamsRecord } from "@/lib/query-params";
import { getCurrentUser } from "@/lib/session";

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<SearchParamsRecord>;
}) {
  const user = await getCurrentUser();
  const { t } = await getServerTranslator();
  const resolvedSearchParams = await searchParams;
  const email = getParam(resolvedSearchParams, "email");
  const inviteToken = getParam(resolvedSearchParams, "invite");

  if (user) {
    redirect(inviteToken ? `/dashboard/settings?invite=${encodeURIComponent(inviteToken)}` : "/dashboard");
  }

  if (!email) {
    redirect("/login");
  }

  return (
    <main className="page-shell flex min-h-screen items-center py-8">
      <div className="mx-auto w-full max-w-[34rem] space-y-4">
        <div className="flex items-center justify-between">
          <BrandMark />
          <LocaleSwitcher />
        </div>

        <section className="card p-8 sm:p-10">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">{t("Verification")}</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{t("Verify your email")}</h1>
          <p className="mt-3 text-sm leading-7 text-slate-500">
            {t("We've sent a one-time verification code to")} <span className="font-medium text-slate-950">{email}</span>. {t("Please enter it below to activate your account.")}
          </p>
          <VerifyForm email={email} inviteToken={inviteToken} />
        </section>
      </div>
    </main>
  );
}
