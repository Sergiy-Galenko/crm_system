import { redirect } from "next/navigation";
import { BrandMark } from "@/components/brand-mark";
import { LoginForm } from "@/components/auth/login-form";
import { getCurrentUser } from "@/lib/session";

export default async function LoginPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="page-shell flex min-h-screen items-center py-10">
      <div className="grid w-full gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="card hidden rounded-[2.5rem] p-8 lg:flex lg:flex-col lg:justify-between">
          <BrandMark />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Revenue workspace</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950">
              Sign in to manage the full CRM lifecycle.
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-500">
              Secure cookie-based auth, role-aware access, Prisma-backed analytics, and production-ready Vercel setup.
            </p>
          </div>
          <div className="rounded-[2rem] border border-white/80 bg-white/75 p-6">
            <p className="text-sm font-semibold text-slate-950">Demo credentials</p>
            <div className="mt-4 space-y-4 text-sm text-slate-500">
              <div>
                <p className="font-medium text-slate-900">Admin</p>
                <p>admin@vercelcrm.dev</p>
                <p className="font-mono">Admin@12345</p>
              </div>
              <div>
                <p className="font-medium text-slate-900">Manager</p>
                <p>manager@vercelcrm.dev</p>
                <p className="font-mono">Manager@12345</p>
              </div>
            </div>
          </div>
        </section>

        <section className="card mx-auto w-full max-w-xl rounded-[2.5rem] p-8 sm:p-10">
          <BrandMark className="lg:hidden" />
          <div className="mt-8 lg:mt-0">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Welcome back</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Sign in</h1>
            <p className="mt-3 text-sm leading-7 text-slate-500">
              Continue with your existing CRM workspace and keep activity, deals, and promo performance in sync.
            </p>
          </div>
          <LoginForm />
        </section>
      </div>
    </main>
  );
}
