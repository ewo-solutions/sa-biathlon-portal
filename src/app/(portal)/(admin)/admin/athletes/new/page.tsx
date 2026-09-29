import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { CitizenshipFields } from "@/components/ui/citizenship-fields";
import { adminRegisterAthlete } from "./actions";

const inputClass = "w-full bg-sage px-4 py-3.5 text-sm text-white placeholder-white/70 outline-none";
const labelClass = "mb-1 block text-sm text-white";
const required = <span className="text-red-400">*</span>;

const errorMessages: Record<string, string> = {
  missing: "Please fill in all required fields.",
  exists: "An account with that email already exists.",
  invalidId: "That doesn't look like a valid 13-digit SA ID number.",
  idClaimed: "An account already exists for that ID number.",
};

export default async function AdminNewAthletePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const [provinces, schools] = await Promise.all([
    prisma.province.findMany({ orderBy: { name: "asc" } }),
    prisma.school.findMany({ orderBy: { name: "asc" }, include: { province: true } }),
  ]);

  return (
    <div>
      <h1 className="tracked-caps mb-2 text-2xl font-black text-white">Register Athlete</h1>
      <p className="mb-6 text-sm text-muted">
        For athletes who are struggling to self-register — an account is created with a
        temporary password, which you can pass on to them.
      </p>

      <Card className="max-w-lg">
        {error && (
          <p className="mb-4 bg-red-950/60 px-3 py-2 text-sm text-red-300">
            {errorMessages[error] ?? "Something went wrong. Please try again."}
          </p>
        )}

        <form action={adminRegisterAthlete} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Name {required}</label>
              <input name="name" required className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Surname {required}</label>
              <input name="surname" required className={inputClass} />
            </div>
          </div>

          <div>
            <label className={labelClass}>Login email {required}</label>
            <input name="email" type="email" required className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>Cellphone number</label>
            <input name="cellphone" className={inputClass} />
          </div>

          <CitizenshipFields />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Province {required}</label>
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

          <div>
            <label className={labelClass}>Address</label>
            <div className="space-y-2">
              <input name="addressLine1" placeholder="Address line 1" className={inputClass} />
              <input name="addressLine2" placeholder="Address line 2" className={inputClass} />
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <input name="addressLine3" placeholder="Town / City" className={inputClass} />
                <input name="postalCode" placeholder="Postal code" className={inputClass} />
              </div>
            </div>
          </div>

          <label className="flex items-center gap-3 text-sm text-white">
            <input type="checkbox" name="disability" className="size-4" />
            Disability that should be considered for grouping
          </label>

          <button
            type="submit"
            className="tracked-caps w-full bg-gold px-4 py-3.5 text-sm font-black text-panel-alt transition hover:bg-gold-light"
          >
            Create athlete account
          </button>
        </form>
      </Card>
    </div>
  );
}
