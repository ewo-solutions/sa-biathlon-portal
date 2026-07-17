import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/card";

export default async function AdminHomePage() {
  const [athleteCount, upcomingEventCount, activeMemberships, registrationsThisSeason] =
    await Promise.all([
      prisma.user.count({ where: { role: "ATHLETE" } }),
      prisma.event.count({ where: { eventDate: { gte: new Date() } } }),
      prisma.membership.count({ where: { status: "ACTIVE" } }),
      prisma.eventRegistration.count(),
    ]);

  const stats = [
    { label: "Registered athletes", value: athleteCount },
    { label: "Upcoming events", value: upcomingEventCount },
    { label: "Active memberships", value: activeMemberships },
    { label: "Total event sign-ups", value: registrationsThisSeason },
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-ink-950">Admin Overview</h1>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <p className="text-sm text-ink-500">{stat.label}</p>
            <p className="mt-2 text-3xl font-semibold text-ink-950">{stat.value}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
