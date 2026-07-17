import { redirect } from "next/navigation";
import { auth, signIn } from "@/lib/auth";
import { AuthError } from "next-auth";
import { Crest } from "@/components/crest";

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
    <main className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-md bg-panel p-10 shadow-[0_0_34px_rgba(0,0,0,0.5)]">
        <div className="mb-6 flex justify-center">
          <Crest className="h-24 w-24" />
        </div>
        <p className="tracked-caps mb-6 text-center text-sm font-black text-muted">
          Sign in to your account
        </p>

        {params.error && (
          <p className="mb-4 bg-red-950/60 px-3 py-2 text-sm text-red-300">
            Invalid email or password.
          </p>
        )}

        <form action={loginAction} className="space-y-4">
          <input type="hidden" name="callbackUrl" value={params.callbackUrl ?? "/"} />
          <div>
            <label htmlFor="email" className="mb-1 block text-sm text-white">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full bg-sage px-4 py-3.5 text-sm text-white placeholder-white/70 outline-none"
              placeholder="you@sabiathlon.co.za"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-sm text-white">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full bg-sage px-4 py-3.5 text-sm text-white placeholder-white/70 outline-none"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            className="tracked-caps w-full bg-gold px-4 py-3.5 text-sm font-black text-panel-alt transition hover:bg-gold-light"
          >
            Log in
          </button>
        </form>
      </div>
    </main>
  );
}
