import { redirect } from "next/navigation";
import { auth, signIn } from "@/lib/auth";
import { AuthError } from "next-auth";

async function loginAction(formData: FormData) {
  "use server";

  const email = formData.get("email");
  const password = formData.get("password");
  const callbackUrl = (formData.get("callbackUrl") as string) || "/";

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: callbackUrl,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect(`/login?error=1&callbackUrl=${encodeURIComponent(callbackUrl)}`);
    }
    throw error;
  }
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>;
}) {
  const session = await auth();
  if (session?.user) {
    redirect(session.user.role === "ADMIN" ? "/admin" : "/athlete");
  }

  const params = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-ink-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm ring-1 ring-ink-200">
        <h1 className="text-2xl font-semibold text-ink-950">SA Biathlon Portal</h1>
        <p className="mt-1 text-sm text-ink-500">Sign in to your athlete or admin account.</p>

        {params.error && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            Invalid email or password.
          </p>
        )}

        <form action={loginAction} className="mt-6 space-y-4">
          <input type="hidden" name="callbackUrl" value={params.callbackUrl ?? "/"} />
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-ink-700">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full rounded-xl border border-ink-200 px-4 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              placeholder="you@sabiathlon.co.za"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-ink-700">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full rounded-xl border border-ink-200 px-4 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700"
          >
            Log in
          </button>
        </form>
      </div>
    </main>
  );
}
