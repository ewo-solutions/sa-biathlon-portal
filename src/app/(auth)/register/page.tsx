import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Crest } from "@/components/crest";
import { registerAthlete } from "./actions";

const inputClass = "w-full bg-sage px-4 py-3.5 text-sm text-white placeholder-white/70 outline-none";
const labelClass = "mb-1 block text-sm text-white";

const errorMessages: Record<string, string> = {
  missing: "Please fill in all required fields.",
  exists: "An account with that email already exists.",
  invalidId: "That doesn't look like a valid 13-digit SA ID number.",
  idClaimed: "An account already exists for that ID number — log in instead.",
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (session?.user) {
    redirect(session.user.role === "ADMIN" ? "/admin" : "/athlete");
  }

  const params = await searchParams;
  const [provinces, schools] = await Promise.all([
    prisma.province.findMany({ orderBy: { name: "asc" } }),
    prisma.school.findMany({ orderBy: { name: "asc" }, include: { province: true } }),
  ]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-4 py-10">
      <div className="w-full max-w-lg bg-panel p-6 shadow-[0_0_34px_rgba(0,0,0,0.5)] sm:p-10">
        <div className="mb-6 flex justify-center">
          <Crest className="h-20 w-20" />
        </div>
        <p className="tracked-caps mb-6 text-center text-sm font-black text-muted">
          Register as an athlete
        </p>

        {params.error && (
          <p className="mb-4 bg-red-950/60 px-3 py-2 text-sm text-red-300">
            {errorMessages[params.error] ?? "Something went wrong. Please try again."}
          </p>
        )}

        <form action={registerAthlete} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Name</label>
              <input name="name" required className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Surname</label>
              <input name="surname" required className={inputClass} />
            </div>
          </div>

          <div>
            <label className={labelClass}>Email</label>
            <input name="email" type="email" required className={inputClass} />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Password</label>
              <input name="password" type="password" required minLength={8} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Cellphone</label>
              <input name="cellphone" className={inputClass} />
            </div>
          </div>

          <div>
            <label className={labelClass}>SA ID number</label>
            <input
              name="idNumber"
              required
              inputMode="numeric"
              pattern="\d{13}"
              maxLength={13}
              placeholder="13 digits, no spaces"
              className={inputClass}
            />
            <p className="mt-1 text-xs text-white/60">
              Your date of birth and gender are read directly from your ID number — if you already
              have an SA Biathlon athlete number, this links your account to it automatically.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Province</label>
              <select name="provinceId" required className={inputClass}>
                <option value="">Select…</option>
                {provinces.map((province) => (
                  <option key={province.id} value={province.id}>
                    {province.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>School / Club</label>
              <select name="schoolId" className={inputClass}>
                <option value="">Not yet known</option>
                {schools.map((school) => (
                  <option key={school.id} value={school.id}>
                    {school.name} — {school.province.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <label className="flex items-center gap-3 text-sm text-white">
            <input type="checkbox" name="disability" className="size-4" />
            I have a disability that should be considered for grouping
          </label>

          <button
            type="submit"
            className="tracked-caps w-full bg-gold px-4 py-3.5 text-sm font-black text-panel-alt transition hover:bg-gold-light"
          >
            Create account
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-white/70">
          Already have an account?{" "}
          <Link href="/login" className="text-gold hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
