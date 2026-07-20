import Link from "next/link";
import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { saveProvince, deleteProvince } from "./actions";

const inputClass = "w-full bg-sage px-4 py-3 text-sm text-white placeholder-white/70 outline-none";
const labelClass = "mb-1 block text-sm text-white";

export default async function AdminProvincesPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const { edit } = await searchParams;

  const [provinces, editing] = await Promise.all([
    prisma.province.findMany({ orderBy: { name: "asc" } }),
    edit ? prisma.province.findUnique({ where: { id: edit } }) : null,
  ]);

  return (
    <div>
      <h1 className="tracked-caps mb-6 text-2xl font-black text-white">Provinces</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.7fr]">
        <Card title={editing ? "Edit province" : "Add province"}>
          <form action={saveProvince} className="space-y-4" key={editing?.id ?? "new"}>
            {editing && <input type="hidden" name="id" value={editing.id} />}
            <div>
              <label className={labelClass}>Name</label>
              <input name="name" defaultValue={editing?.name} required className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Abbreviation</label>
              <input
                name="abbreviation"
                defaultValue={editing?.abbreviation}
                required
                maxLength={10}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Description</label>
              <textarea
                name="description"
                defaultValue={editing?.description ?? ""}
                rows={3}
                className={inputClass}
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className="tracked-caps bg-gold px-6 py-3 text-sm font-black text-panel-alt transition hover:bg-gold-light"
              >
                {editing ? "Save changes" : "Add province"}
              </button>
              {editing && (
                <Link
                  href="/admin/setup/provinces"
                  className="tracked-caps bg-panel-alt px-6 py-3 text-sm font-black text-white transition hover:bg-sage/60"
                >
                  Cancel
                </Link>
              )}
            </div>
          </form>
        </Card>

        <Card className="overflow-x-auto">
          <table className="w-full min-w-[420px] text-left text-sm">
            <thead>
              <tr className="tracked-caps border-b border-white/10 text-muted">
                <th className="py-2 pr-4 font-black">Name</th>
                <th className="py-2 pr-4 font-black">Abbr.</th>
                <th className="py-2 font-black">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {provinces.map((province) => (
                <tr key={province.id}>
                  <td className="py-3 pr-4 font-bold text-white">{province.name}</td>
                  <td className="py-3 pr-4 text-white/80">{province.abbreviation}</td>
                  <td className="py-3">
                    <div className="flex gap-3">
                      <Link
                        href={`/admin/setup/provinces?edit=${province.id}`}
                        className="text-gold hover:underline"
                      >
                        Edit
                      </Link>
                      <form
                        action={async () => {
                          "use server";
                          await deleteProvince(province.id);
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
              {provinces.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-6 text-center text-muted">
                    No provinces yet.
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
