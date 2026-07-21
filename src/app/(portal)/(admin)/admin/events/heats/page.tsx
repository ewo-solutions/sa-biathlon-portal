import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PrintButton } from "@/components/ui/print-button";
import { calculateHeats } from "./actions";

type HeatEntry = {
  lane: number | null;
  athleteNumber: string | null;
  name: string;
  surname: string;
};

type HeatRow = {
  id: string;
  heatNumber: number;
  groupName: string | null;
  entries: HeatEntry[];
};

function HeatTable({ title, heats }: { title: string; heats: HeatRow[] }) {
  if (heats.length === 0) {
    return (
      <div>
        <h2 className="tracked-caps mb-2 text-sm font-black text-gold print:text-black">
          {title}
        </h2>
        <p className="text-sm text-muted print:text-black/60">No heats calculated yet.</p>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <h2 className="tracked-caps text-sm font-black text-gold print:text-black">{title}</h2>
      {heats.map((heat) => (
        <div key={heat.id} className="break-inside-avoid">
          <h3 className="tracked-caps mb-2 border-b border-white/10 pb-2 text-xs font-black text-white print:border-black/20 print:text-black">
            Heat {heat.heatNumber} {heat.groupName ? `— ${heat.groupName}` : ""}
          </h3>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="tracked-caps text-xs text-muted print:text-black/60">
                <th className="py-1 pr-3 font-black">Lane</th>
                <th className="py-1 pr-3 font-black">SA No</th>
                <th className="py-1 font-black">Athlete</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 print:divide-black/10">
              {heat.entries
                .slice()
                .sort((a, b) => (a.lane ?? 0) - (b.lane ?? 0))
                .map((entry, idx) => (
                  <tr key={idx}>
                    <td className="py-2 pr-3 font-bold">{entry.lane ?? "—"}</td>
                    <td className="py-2 pr-3">{entry.athleteNumber ?? "—"}</td>
                    <td className="py-2">
                      {entry.name} {entry.surname}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

export default async function AdminHeatsPage({
  searchParams,
}: {
  searchParams: Promise<{ eventId?: string }>;
}) {
  const { eventId } = await searchParams;
  if (!eventId) notFound();

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) notFound();

  const entryInclude = {
    user: { include: { athleteProfile: { select: { athleteNumber: true } } } },
  } as const;

  const [runningHeats, swimmingHeats] = await Promise.all([
    prisma.heat.findMany({
      where: { eventId, discipline: "RUNNING" },
      include: { group: true, runningEntries: { include: entryInclude } },
      orderBy: { heatNumber: "asc" },
    }),
    prisma.heat.findMany({
      where: { eventId, discipline: "SWIMMING" },
      include: { group: true, swimmingEntries: { include: entryInclude } },
      orderBy: { heatNumber: "asc" },
    }),
  ]);

  const runningRows: HeatRow[] = runningHeats.map((heat) => ({
    id: heat.id,
    heatNumber: heat.heatNumber,
    groupName: heat.group?.name ?? null,
    entries: heat.runningEntries.map((entry) => ({
      lane: entry.runningLane,
      athleteNumber: entry.user.athleteProfile?.athleteNumber ?? null,
      name: entry.user.name,
      surname: entry.user.surname,
    })),
  }));

  const swimmingRows: HeatRow[] = swimmingHeats.map((heat) => ({
    id: heat.id,
    heatNumber: heat.heatNumber,
    groupName: heat.group?.name ?? null,
    entries: heat.swimmingEntries.map((entry) => ({
      lane: entry.swimmingLane,
      athleteNumber: entry.user.athleteProfile?.athleteNumber ?? null,
      name: entry.user.name,
      surname: entry.user.surname,
    })),
  }));

  const calcRunning = calculateHeats.bind(null, eventId, "RUNNING");
  const calcSwimming = calculateHeats.bind(null, eventId, "SWIMMING");

  return (
    <div className="bg-panel p-5 text-white shadow-[0_0_34px_rgba(0,0,0,0.25)] print:bg-white print:text-black print:shadow-none sm:p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="tracked-caps text-2xl font-black">{event.name}</h1>
          <p className="mt-1 text-sm text-white/70 print:text-black/70">Lane / Heat Calculation</p>
        </div>
        <div className="flex flex-wrap gap-3 print:hidden">
          <form action={calcRunning}>
            <button
              type="submit"
              className="tracked-caps bg-sage px-4 py-2.5 text-xs font-black text-white transition hover:bg-sage-light"
            >
              Calc Running Heats
            </button>
          </form>
          <form action={calcSwimming}>
            <button
              type="submit"
              className="tracked-caps bg-sage px-4 py-2.5 text-xs font-black text-white transition hover:bg-sage-light"
            >
              Calc Swimming Heats
            </button>
          </form>
          <PrintButton />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        <HeatTable title="Running" heats={runningRows} />
        <HeatTable title="Swimming" heats={swimmingRows} />
      </div>
    </div>
  );
}
