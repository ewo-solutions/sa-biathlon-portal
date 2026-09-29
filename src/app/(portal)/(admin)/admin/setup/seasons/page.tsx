import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { createSeason, deleteSeason, recalculateAllAges, resetAllFees } from "./actions";

const inputClass = "w-full bg-sage px-4 py-3 text-sm text-white placeholder-white/70 outline-none";
const labelClass = "mb-1 block text-sm text-white";

export default async function AdminSeasonsPage() {
  const seasons = await prisma.season.findMany({ orderBy: { startDate: "desc" } });

  return (
    <div>
      <h1 className="tracked-caps mb-6 text-2xl font-black text-white">Seasons</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.7fr]">
        <Card title="Add season">
          <form action={createSeason} className="space-y-4">
            <div>
              <label className={labelClass}>Label</label>
              <input
                name="label"
                placeholder="e.g. 2027/28"
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Start date</label>
              <input type="date" name="startDate" required className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>End date</label>
              <input type="date" name="endDate" required className={inputClass} />
            </div>
            <p className="text-xs text-muted">
              Creating a season automatically resets every athlete&rsquo;s affiliation fees for
              the new season and recalculates every athlete&rsquo;s age group — system-wide, not
              per province.
            </p>
            <button
              type="submit"
              className="tracked-caps bg-gold px-6 py-3 text-sm font-black text-panel-alt transition hover:bg-gold-light"
            >
              Create season
            </button>
          </form>

          <div className="mt-6 space-y-3 border-t border-white/10 pt-6">
            <p className="text-xs text-muted">
              These normally run automatically when a season is created. Use them here only to
              re-run manually (e.g. after a bulk data fix).
            </p>
            <form action={recalculateAllAges}>
              <button
                type="submit"
                className="tracked-caps w-full bg-panel-alt px-4 py-3 text-xs font-black text-white transition hover:bg-sage/60"
              >
                Recalculate all ages (global)
              </button>
            </form>
            <form action={resetAllFees}>
              <button
                type="submit"
                className="tracked-caps w-full bg-panel-alt px-4 py-3 text-xs font-black text-white transition hover:bg-sage/60"
              >
                Reset all affiliation fees (global)
              </button>
            </form>
          </div>
        </Card>

        <Card className="overflow-x-auto">
          <table className="w-full min-w-[420px] text-left text-sm">
            <thead>
              <tr className="tracked-caps border-b border-white/10 text-muted">
                <th className="py-2 pr-4 font-black">Label</th>
                <th className="py-2 pr-4 font-black">Start</th>
                <th className="py-2 pr-4 font-black">End</th>
                <th className="py-2 font-black">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {seasons.map((season) => (
                <tr key={season.id}>
                  <td className="py-3 pr-4 font-bold text-white">{season.label}</td>
                  <td className="py-3 pr-4 text-white/80">
                    {season.startDate.toLocaleDateString("en-ZA")}
                  </td>
                  <td className="py-3 pr-4 text-white/80">
                    {season.endDate.toLocaleDateString("en-ZA")}
                  </td>
                  <td className="py-3">
                    <form
                      action={async () => {
                        "use server";
                        await deleteSeason(season.id);
                      }}
                    >
                      <button type="submit" className="text-red-300 hover:underline">
                        Delete
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
              {seasons.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-muted">
                    No seasons yet.
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
