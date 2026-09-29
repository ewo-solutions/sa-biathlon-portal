import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatSeconds } from "@/lib/time-format";

export default async function AthleteResultsPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [registrations, documents] = await Promise.all([
    prisma.eventRegistration.findMany({
      where: { userId, status: { not: "CANCELLED" } },
      orderBy: [{ event: { eventDate: "desc" } }],
      include: { event: { include: { season: true } }, group: true },
    }),
    prisma.result.findMany({
      where: { athleteProfile: { userId } },
      select: { eventId: true, documentUrl: true },
    }),
  ]);

  const documentByEvent = new Map(documents.map((d) => [d.eventId, d.documentUrl]));

  type Row = (typeof registrations)[number];
  const bySeason = new Map<string, { order: number; rows: Row[] }>();
  for (const registration of registrations) {
    const label = registration.event.season?.label ?? "No season";
    const order = registration.event.season?.startDate.getTime() ?? 0;
    const existing = bySeason.get(label);
    if (existing) existing.rows.push(registration);
    else bySeason.set(label, { order, rows: [registration] });
  }
  const seasonLabels = [...bySeason.keys()].sort(
    (a, b) => bySeason.get(b)!.order - bySeason.get(a)!.order,
  );

  return (
    <div className="bg-panel shadow-[0_0_34px_rgba(0,0,0,0.25)]">
      <div className="bg-gold px-5 py-6 sm:px-8 sm:py-8">
        <h1 className="tracked-caps text-xl font-black text-panel-alt sm:text-2xl">My Results</h1>
      </div>
      <div className="p-5 sm:p-8">
        {seasonLabels.length === 0 && <p className="text-sm text-muted">No results on file yet.</p>}
        <div className="space-y-2">
          {seasonLabels.map((label, i) => {
            const rows = bySeason.get(label)!.rows;
            return (
              <details key={label} className="group" open={i === 0}>
                <summary
                  className={`tracked-caps flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-4 text-sm font-black text-white sm:px-6 sm:py-5 ${
                    i === 0 ? "bg-sage" : "bg-panel-alt"
                  }`}
                >
                  {label} Results
                  <span className="group-open:hidden">+</span>
                  <span className="hidden group-open:inline">−</span>
                </summary>
                <div className="space-y-3 overflow-x-auto px-4 py-4 sm:px-6">
                  <table className="w-full min-w-[640px] text-left text-sm text-white/80">
                    <thead>
                      <tr className="tracked-caps border-b border-white/10 text-xs text-muted">
                        <th className="py-2 pr-3 font-black">Date</th>
                        <th className="py-2 pr-3 font-black">Competition</th>
                        <th className="py-2 pr-3 font-black">Age Group</th>
                        <th className="py-2 pr-3 font-black">Run Time</th>
                        <th className="py-2 pr-3 font-black">Run Pts</th>
                        <th className="py-2 pr-3 font-black">Swim Time</th>
                        <th className="py-2 pr-3 font-black">Swim Pts</th>
                        <th className="py-2 pr-3 font-black">Bonus Pts</th>
                        <th className="py-2 pr-3 font-black">Total Pts</th>
                        <th className="py-2 font-black">Document</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {rows.map((r) => {
                        const eitherDnf = r.runningDnf || r.swimmingDnf;
                        const bonus =
                          Number(r.runningBonusPoints ?? 0) + Number(r.swimmingBonusPoints ?? 0);
                        const total =
                          Number(r.runningPoints ?? 0) +
                          Number(r.runningBonusPoints ?? 0) +
                          Number(r.swimmingPoints ?? 0) +
                          Number(r.swimmingBonusPoints ?? 0);
                        return (
                          <tr key={r.id}>
                            <td className="py-2 pr-3">
                              {r.event.eventDate.toLocaleDateString("en-ZA", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </td>
                            <td className="py-2 pr-3">{r.event.name}</td>
                            <td className="py-2 pr-3">{r.group?.name ?? "—"}</td>
                            <td className="py-2 pr-3">
                              {r.runningDnf ? "DNF" : formatSeconds(r.runningTimeSeconds)}
                            </td>
                            <td className="py-2 pr-3">
                              {r.runningDnf ? "—" : Number(r.runningPoints ?? 0).toFixed(2)}
                            </td>
                            <td className="py-2 pr-3">
                              {r.swimmingDnf ? "DNF" : formatSeconds(r.swimmingTimeSeconds)}
                            </td>
                            <td className="py-2 pr-3">
                              {r.swimmingDnf ? "—" : Number(r.swimmingPoints ?? 0).toFixed(2)}
                            </td>
                            <td className="py-2 pr-3">{eitherDnf ? "—" : bonus.toFixed(2)}</td>
                            <td className="py-2 pr-3 font-bold text-gold">
                              {eitherDnf ? "DNF" : total.toFixed(2)}
                              {r.personalBest && !eitherDnf && (
                                <span className="tracked-caps ml-2 bg-gold px-2 py-0.5 text-[10px] text-panel-alt">
                                  PB
                                </span>
                              )}
                            </td>
                            <td className="py-2">
                              {documentByEvent.get(r.eventId) ? (
                                <a
                                  href={documentByEvent.get(r.eventId)!}
                                  className="text-gold hover:underline"
                                >
                                  Download
                                </a>
                              ) : (
                                "—"
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      {rows.length === 0 && (
                        <tr>
                          <td colSpan={10} className="py-4 text-center text-muted">
                            No results recorded for this season yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </details>
            );
          })}
        </div>
      </div>
    </div>
  );
}
