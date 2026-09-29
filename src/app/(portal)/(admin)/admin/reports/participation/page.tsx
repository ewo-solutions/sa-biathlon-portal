import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { PrintButton } from "@/components/ui/print-button";
import { getCurrentSeason } from "@/lib/season";

const MIN_VALID_COMPETITIONS = 2;

export default async function ParticipationReportPage({
  searchParams,
}: {
  searchParams: Promise<{ provinceId?: string; seasonId?: string }>;
}) {
  const { provinceId, seasonId } = await searchParams;

  const [provinces, seasons, currentSeason] = await Promise.all([
    prisma.province.findMany({ orderBy: { name: "asc" } }),
    prisma.season.findMany({ orderBy: { startDate: "desc" } }),
    getCurrentSeason(prisma),
  ]);

  const effectiveSeasonId = seasonId || currentSeason?.id;
  const season = seasons.find((s) => s.id === effectiveSeasonId) ?? currentSeason;

  const athletes = await prisma.athleteProfile.findMany({
    where: {
      status: true,
      ...(provinceId ? { provinceId } : {}),
    },
    include: {
      user: {
        include: {
          eventRegistrations: {
            where: season ? { event: { seasonId: season.id } } : undefined,
          },
        },
      },
      province: true,
    },
    orderBy: [{ province: { name: "asc" } }, { athleteNumber: "asc" }],
  });

  const userIds = athletes.map((a) => a.userId);
  const activeMemberships = await prisma.membership.findMany({
    where: {
      userId: { in: userIds },
      status: "ACTIVE",
      expiresAt: { gte: new Date() },
      ...(season ? { OR: [{ seasonId: season.id }, { seasonId: null }] } : {}),
    },
    select: { userId: true },
  });
  const affiliatedUserIds = new Set(activeMemberships.map((m) => m.userId));

  const rows = athletes.map((athlete) => {
    const validCount = athlete.user.eventRegistrations.filter(
      (r) => r.status !== "CANCELLED" && !r.dns && !r.runningDnf && !r.swimmingDnf,
    ).length;
    return {
      athlete,
      validCount,
      affiliated: affiliatedUserIds.has(athlete.userId),
      eligible: validCount >= MIN_VALID_COMPETITIONS,
    };
  });

  return (
    <div className="bg-panel p-5 text-white shadow-[0_0_34px_rgba(0,0,0,0.25)] print:bg-white print:text-black print:shadow-none sm:p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="tracked-caps text-2xl font-black">Participation &amp; Affiliation</h1>
          <p className="mt-1 text-sm text-white/70 print:text-black/70">
            {season ? season.label : "All seasons"} — {rows.length}{" "}
            {rows.length === 1 ? "athlete" : "athletes"}
          </p>
          <p className="mt-1 text-xs text-white/60 print:text-black/60">
            Athletes need at least {MIN_VALID_COMPETITIONS} valid (non-DNF, non-DNS) competitions
            this season to be eligible for SA Championship entry.
          </p>
        </div>
        <PrintButton />
      </div>

      <form className="mb-6 flex flex-wrap gap-3 print:hidden">
        <select
          name="provinceId"
          defaultValue={provinceId ?? ""}
          className="bg-sage px-3 py-2 text-sm text-white outline-none"
        >
          <option value="">All provinces</option>
          {provinces.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <select
          name="seasonId"
          defaultValue={effectiveSeasonId ?? ""}
          className="bg-sage px-3 py-2 text-sm text-white outline-none"
        >
          {seasons.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="tracked-caps bg-gold px-4 py-2 text-xs font-black text-panel-alt transition hover:bg-gold-light"
        >
          Apply
        </button>
      </form>

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="tracked-caps border-b border-white/10 text-xs text-muted">
              <th className="py-2 pr-4 font-black">SA No</th>
              <th className="py-2 pr-4 font-black">Athlete</th>
              <th className="py-2 pr-4 font-black">Province</th>
              <th className="py-2 pr-4 font-black">Valid Competitions</th>
              <th className="py-2 pr-4 font-black">Affiliation</th>
              <th className="py-2 font-black">SA Champs Eligible</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {rows.map(({ athlete, validCount, affiliated, eligible }) => (
              <tr key={athlete.id}>
                <td className="py-2 pr-4 font-bold">{athlete.athleteNumber ?? "—"}</td>
                <td className="py-2 pr-4">
                  {athlete.user.name} {athlete.user.surname}
                </td>
                <td className="py-2 pr-4 text-white/80 print:text-black/70">
                  {athlete.province?.name ?? "—"}
                </td>
                <td className="py-2 pr-4">{validCount}</td>
                <td className="py-2 pr-4">
                  {affiliated ? "Affiliated" : "Affiliation Fees Outstanding"}
                </td>
                <td className={`py-2 font-bold ${eligible ? "text-gold" : "text-red-300"}`}>
                  {eligible ? "Yes" : "No"}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-muted">
                  No athletes found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
