import { redirect } from "next/navigation";
import { BrandMark } from "@/components/brand-mark";
import { RegisterForm } from "@/components/auth/register-form";
import { getCurrentUser } from "@/lib/session";

export default async function RegisterPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="page-shell flex min-h-screen items-center py-10">
      <div className="grid w-full gap-8 lg:grid-cols-[1fr_1fr]">
        <section className="card mx-auto w-full max-w-xl rounded-[2.5rem] p-8 sm:p-10">
          <BrandMark className="lg:hidden" />
          <div className="mt-8 lg:mt-0">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Create workspace access</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Register</h1>
            <p className="mt-3 text-sm leading-7 text-slate-500">
              Start with a manager account and expand into full admin controls inside the dashboard settings panel.
            </p>
          </div>
          <RegisterForm />
        </section>

        <section className="card hidden rounded-[2.5rem] bg-slate-950 p-8 text-white lg:flex lg:flex-col lg:justify-between">
          <BrandMark />
          <div className="space-y-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/45">Included</p>
              <h2 className="mt-4 text-4xl font-semibold tracking-tight">Modern full-stack CRM foundation.</h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-white/65">
                Auth, analytics, seeded demo data, server-side promo code validation, reusable dialogs, and Prisma
                migrations ready for GitHub and Vercel.
              </p>
            </div>
            <div className="grid gap-4">
              {[
                "Protected App Router dashboard",
                "Promo usage tracking and auditability",
                "Search, filters, sorting, and pagination",
                "Responsive premium admin layout",
              ].map((line) => (
                <div key={line} className="rounded-[1.5rem] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75">
                  {line}
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
