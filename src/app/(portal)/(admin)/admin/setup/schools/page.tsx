import Link from "next/link";
import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { saveSchool, deleteSchool } from "./actions";

const inputClass = "w-full bg-sage px-4 py-3 text-sm text-white placeholder-white/70 outline-none";
const labelClass = "mb-1 block text-sm text-white";

export default async function AdminSchoolsPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const { edit } = await searchParams;

  const [schools, provinces, editing] = await Promise.all([
    prisma.school.findMany({ orderBy: { name: "asc" }, include: { province: true } }),
    prisma.province.findMany({ orderBy: { name: "asc" } }),
    edit ? prisma.school.findUnique({ where: { id: edit } }) : null,
  ]);

  return (
    <div>
      <h1 className="tracked-caps mb-6 text-2xl font-black text-white">Schools / Clubs</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.7fr]">
        <Card title={editing ? "Edit school / club" : "Add school / club"}>
          {provinces.length === 0 ? (
            <p className="text-sm text-muted">
              Add a province first — schools/clubs belong to one.
            </p>
          ) : (
            <form action={saveSchool} className="space-y-4" key={editing?.id ?? "new"}>
              {editing && <input type="hidden" name="id" value={editing.id} />}
              <div>
                <label className={labelClass}>Name</label>
                <input name="name" defaultValue={editing?.name} required className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Abbreviation</label>
                <input
                  name="abbreviation"
                  defaultValue={editing?.abbreviation ?? ""}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Province</label>
                <select
                  name="provinceId"
                  defaultValue={editing?.provinceId}
                  required
                  className={inputClass}
                >
                  {provinces.map((province) => (
                    <option key={province.id} value={province.id}>
                      {province.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Type</label>
                <input
                  name="type"
                  placeholder="e.g. School, Club"
                  defaultValue={editing?.type ?? ""}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Contact person</label>
                <input
                  name="contactName"
                  defaultValue={editing?.contactName ?? ""}
                  className={inputClass}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Contact phone</label>
                  <input
                    name="contactPhone"
                    defaultValue={editing?.contactPhone ?? ""}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Contact email</label>
                  <input
                    type="email"
                    name="contactEmail"
                    defaultValue={editing?.contactEmail ?? ""}
                    className={inputClass}
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="tracked-caps bg-gold px-6 py-3 text-sm font-black text-panel-alt transition hover:bg-gold-light"
                >
                  {editing ? "Save changes" : "Add school / club"}
                </button>
                {editing && (
                  <Link
                    href="/admin/setup/schools"
                    className="tracked-caps bg-panel-alt px-6 py-3 text-sm font-black text-white transition hover:bg-sage/60"
                  >
                    Cancel
                  </Link>
                )}
              </div>
            </form>
          )}
        </Card>

        <Card className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="tracked-caps border-b border-white/10 text-muted">
                <th className="py-2 pr-4 font-black">Name</th>
                <th className="py-2 pr-4 font-black">Province</th>
                <th className="py-2 pr-4 font-black">Contact</th>
                <th className="py-2 font-black">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {schools.map((school) => (
                <tr key={school.id}>
                  <td className="py-3 pr-4 font-bold text-white">{school.name}</td>
                  <td className="py-3 pr-4 text-white/80">{school.province.name}</td>
                  <td className="py-3 pr-4 text-white/80">
                    {school.contactName || school.contactEmail || school.contactPhone ? (
                      <div className="text-xs">
                        {school.contactName && <p>{school.contactName}</p>}
                        {school.contactPhone && <p className="text-muted">{school.contactPhone}</p>}
                        {school.contactEmail && <p className="text-muted">{school.contactEmail}</p>}
                      </div>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td className="py-3">
                    <div className="flex gap-3">
                      <Link
                        href={`/admin/setup/schools?edit=${school.id}`}
                        className="text-gold hover:underline"
                      >
                        Edit
                      </Link>
                      <form
                        action={async () => {
                          "use server";
                          await deleteSchool(school.id);
                        }}
                      >
                        <button type="submit" className="text-red-300 hover:underline">
                          Delete
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
              {schools.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-muted">
                    No schools/clubs yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}
