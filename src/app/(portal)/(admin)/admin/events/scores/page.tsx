import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { ScoreEntryForm } from "@/components/ui/score-entry-form";
import { recordTime, searchAthletes } from "./actions";

function formatSeconds(seconds: number | null) {
  if (seconds === null) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}:${s.toString().padStart(2, "0")}` : `${s}`;
}

export default async function AdminScoreEntryPage({
  searchParams,
}: {
  searchParams: Promise<{ eventId?: string; discipline?: string }>;
}) {
  const { eventId, discipline: disciplineParam } = await searchParams;
  const discipline = disciplineParam === "SWIMMING" ? "SWIMMING" : "RUNNING";

  if (!eventId) notFound();

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) notFound();

  const registrations = await prisma.eventRegistration.findMany({
    where: { eventId },
    include: { user: { include: { athleteProfile: true } } },
    orderBy: { user: { athleteProfile: { athleteNumber: "asc" } } },
  });

  const entered = registrations.filter((r) =>
    discipline === "RUNNING"
      ? r.runningTimeSeconds !== null || r.runningDnf
      : r.swimmingTimeSeconds !== null || r.swimmingDnf,
  );

  const boundAction = recordTime.bind(null, eventId, discipline);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="tracked-caps text-2xl font-black text-white">
          Enter {discipline === "RUNNING" ? "Run" : "Swim"} Times — {event.name}
        </h1>
        <div className="flex gap-3">
          <Link
            href={`/admin/events/scores?eventId=${eventId}&discipline=RUNNING`}
            className={`tracked-caps px-4 py-2 text-xs font-black transition ${
              discipline === "RUNNING" ? "bg-gold text-panel-alt" : "bg-panel-alt text-white"
            }`}
          >
            Running
          </Link>
          <Link
            href={`/admin/events/scores?eventId=${eventId}&discipline=SWIMMING`}
            className={`tracked-caps px-4 py-2 text-xs font-black transition ${
              discipline === "SWIMMING" ? "bg-gold text-panel-alt" : "bg-panel-alt text-white"
            }`}
          >
            Swimming
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.7fr]">
        <Card title="Enter time">
          <ScoreEntryForm action={boundAction} searchAthletes={searchAthletes} />
        </Card>

        <Card title={`Recorded (${entered.length})`} className="overflow-x-auto">
          <table className="w-full min-w-[420px] text-left text-sm">
            <thead>
              <tr className="tracked-caps border-b border-white/10 text-muted">
                <th className="py-2 pr-4 font-black">SA No</th>
                <th className="py-2 pr-4 font-black">Athlete</th>
                <th className="py-2 font-black">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {entered.map((registration) => (
                <tr key={registration.id}>
                  <td className="py-3 pr-4 font-bold text-white">
                    {registration.user.athleteProfile?.athleteNumber ?? "—"}
                  </td>
                  <td className="py-3 pr-4 text-white/80">
                    {registration.user.name} {registration.user.surname}
                  </td>
                  <td className="py-3 text-white/80">
                    {discipline === "RUNNING"
                      ? registration.runningDnf
                        ? "DNF"
                        : formatSeconds(registration.runningTimeSeconds)
                      : registration.swimmingDnf
                        ? "DNF"
                        : formatSeconds(registration.swimmingTimeSeconds)}
                  </td>
                </tr>
              ))}
              {entered.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-6 text-center text-muted">
                    No times recorded yet.
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
