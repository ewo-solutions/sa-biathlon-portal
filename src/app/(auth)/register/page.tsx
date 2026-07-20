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

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Date of birth</label>
              <input name="dateOfBirth" type="date" required className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Gender</label>
              <select name="gender" required className={inputClass}>
                <option value="">Select…</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>SA ID number</label>
            <input name="idNumber" className={inputClass} />
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
