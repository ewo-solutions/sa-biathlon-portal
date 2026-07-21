import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PrintButton } from "@/components/ui/print-button";

function formatSeconds(seconds: number | null) {
  if (seconds === null) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}:${s.toString().padStart(2, "0")}` : `${s}`;
}

export default async function AdminCompetitionReportPage({
  searchParams,
}: {
  searchParams: Promise<{ eventId?: string }>;
}) {
  const { eventId } = await searchParams;
  if (!eventId) notFound();

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { hostProvince: true, season: true },
  });
  if (!event) notFound();

  const registrations = await prisma.eventRegistration.findMany({
    where: {
      eventId,
      user: { athleteProfile: { status: true } },
    },
    include: {
      user: {
        include: { athleteProfile: { include: { school: true, province: true, group: true } } },
      },
      group: true,
    },
  });

  type Row = (typeof registrations)[number];

  const groupsById = new Map<string, { order: number; name: string; rows: Row[] }>();
  const ungrouped: Row[] = [];

  for (const registration of registrations) {
    const group = registration.group ?? registration.user.athleteProfile?.group ?? null;
    if (!group) {
      ungrouped.push(registration);
      continue;
    }
    const existing = groupsById.get(group.id);
    if (existing) {
      existing.rows.push(registration);
    } else {
      groupsById.set(group.id, { order: group.order, name: group.name, rows: [registration] });
    }
  }

  const sections = [...groupsById.values()].sort((a, b) => a.order - b.order);
  if (ungrouped.length > 0) {
    sections.push({ order: Number.MAX_SAFE_INTEGER, name: "Ungrouped", rows: ungrouped });
  }

  for (const section of sections) {
    section.rows.sort((a, b) =>
      (a.user.athleteProfile?.athleteNumber ?? "").localeCompare(
        b.user.athleteProfile?.athleteNumber ?? "",
      ),
    );
  }

  return (
    <div className="bg-panel p-5 text-white shadow-[0_0_34px_rgba(0,0,0,0.25)] print:bg-white print:text-black print:shadow-none sm:p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="tracked-caps text-2xl font-black">{event.name}</h1>
          <p className="mt-1 text-sm text-white/70 print:text-black/70">
            {event.eventDate.toLocaleDateString("en-ZA", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
            {event.hostProvince ? ` — ${event.hostProvince.name}` : ""}
            {event.season ? ` — ${event.season.label}` : ""}
          </p>
          <p className="mt-1 text-sm text-white/70 print:text-black/70">
            {registrations.length} {registrations.length === 1 ? "entry" : "entries"}
          </p>
        </div>
        <PrintButton />
      </div>

      {sections.length === 0 && (
        <p className="text-sm text-muted print:text-black/60">No entries recorded for this event.</p>
      )}

      <div className="space-y-8">
        {sections.map((section) => (
          <div key={section.name} className="break-inside-avoid">
            <h2 className="tracked-caps mb-2 border-b border-white/10 pb-2 text-sm font-black text-gold print:border-black/20 print:text-black">
              {section.name}
            </h2>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="tracked-caps text-xs text-muted print:text-black/60">
                  <th className="py-1 pr-3 font-black">SA No</th>
                  <th className="py-1 pr-3 font-black">Athlete</th>
                  <th className="py-1 pr-3 font-black">School / Club</th>
                  <th className="py-1 pr-3 font-black">Running</th>
                  <th className="py-1 font-black">Swimming</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 print:divide-black/10">
                {section.rows.map((registration) => (
                  <tr key={registration.id}>
                    <td className="py-2 pr-3 font-bold">
                      {registration.user.athleteProfile?.athleteNumber ?? "—"}
                    </td>
                    <td className="py-2 pr-3">
                      {registration.user.name} {registration.user.surname}
                    </td>
                    <td className="py-2 pr-3 text-white/80 print:text-black/70">
                      {registration.user.athleteProfile?.school?.name ?? "—"}
                    </td>
                    <td className="py-2 pr-3">
                      {registration.runningDnf
                        ? "DNF"
                        : registration.runningFalseStart
                          ? "False start"
                          : formatSeconds(registration.runningTimeSeconds)}
                    </td>
                    <td className="py-2">
                      {registration.swimmingDnf
                        ? "DNF"
                        : registration.swimmingFalseStart
                          ? "False start"
                          : formatSeconds(registration.swimmingTimeSeconds)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}
