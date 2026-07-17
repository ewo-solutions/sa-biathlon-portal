import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { RegistrationsChart } from "./registrations-chart";

export default async function AdminStatisticsPage() {
  const events = await prisma.event.findMany({
    orderBy: { eventDate: "asc" },
    include: { _count: { select: { registrations: true } } },
    take: 8,
  });

  const chartData = events.map((event) => ({
    name: event.name.length > 18 ? `${event.name.slice(0, 18)}…` : event.name,
    registrations: event._count.registrations,
  }));

  const membershipsByStatus = await prisma.membership.groupBy({
    by: ["status"],
    _count: { _all: true },
  });

  return (
    <div>
      <h1 className="tracked-caps mb-6 text-2xl font-black text-white">Statistics</h1>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[2fr_1fr]">
        <Card title="Sign-ups per event">
          <RegistrationsChart data={chartData} />
        </Card>
        <Card title="Memberships by status">
          <ul className="space-y-3 text-sm">
            {membershipsByStatus.map((row) => (
              <li key={row.status} className="flex items-center justify-between">
                <span className="tracked-caps text-white/80">{row.status}</span>
                <span className="font-black text-gold">{row._count._all}</span>
              </li>
            ))}
            {membershipsByStatus.length === 0 && (
              <li className="text-muted">No membership data yet.</li>
            )}
          </ul>
        </Card>
      </div>
    </div>
  );
}
