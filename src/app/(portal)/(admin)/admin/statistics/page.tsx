import { Users } from "lucide-react";
import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { RegistrationsChart } from "./registrations-chart";

export default async function AdminStatisticsPage() {
  const currentYear = new Date().getFullYear();
  const yearStart = new Date(`${currentYear}-01-01`);
  const yearEnd = new Date(`${currentYear + 1}-01-01`);

  const [events, membershipsByStatus, totalEvents, signUpsThisYear, participantsThisYear, totalAffiliations] =
    await Promise.all([
      prisma.event.findMany({
        orderBy: { eventDate: "asc" },
        include: { _count: { select: { registrations: true } } },
        take: 8,
      }),
      prisma.membership.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.event.count(),
      // Athletes signed up for an event this year — entries a registrant
      // later withdrew from (status CANCELLED) don't count.
      prisma.eventRegistration.count({
        where: { createdAt: { gte: yearStart, lt: yearEnd }, status: { not: "CANCELLED" } },
      }),
      prisma.eventRegistration
        .findMany({
          where: { createdAt: { gte: yearStart, lt: yearEnd }, status: { not: "CANCELLED" } },
          distinct: ["userId"],
          select: { userId: true },
        })
        .then((rows) => rows.length),
      // "Affiliated" means a currently-active, not-yet-expired membership —
      // matches the season-based affiliation status shown on athlete profiles.
      prisma.membership.count({ where: { status: "ACTIVE", expiresAt: { gte: new Date() } } }),
    ]);

  const chartData = events.map((event) => ({
    name: event.name.length > 18 ? `${event.name.slice(0, 18)}…` : event.name,
    registrations: event._count.registrations,
  }));

  const stats = [
    {
      label: `Athletes Who Entered an Event in ${currentYear}`,
      value: participantsThisYear,
      hint: "Distinct athletes with at least one active (non-withdrawn) event entry this calendar year.",
    },
    {
      label: `Event Sign-Ups in ${currentYear}`,
      value: signUpsThisYear,
      hint: "Total event entries submitted this calendar year, across all events (excludes withdrawn entries).",
    },
    {
      label: "Total Events (All-Time)",
      value: totalEvents,
      hint: "All competitions ever created on the system, past and upcoming.",
    },
    {
      label: "Currently Affiliated Athletes",
      value: totalAffiliations,
      hint: "Athletes with a paid (or sponsored) affiliation for the current season that hasn't expired yet.",
    },
  ];

  return (
    <div>
      <h1 className="tracked-caps mb-6 text-2xl font-black text-white">Statistics</h1>

      <div className="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="flex items-center gap-4">
            <span className="flex size-16 shrink-0 items-center justify-center bg-panel-alt text-gold">
              <Users size={28} />
            </span>
            <span>
              <p className="text-3xl font-bold text-gold">{stat.value}</p>
              <p className="text-sm text-white">{stat.label}</p>
              <p className="mt-1 text-xs text-muted">{stat.hint}</p>
            </span>
          </Card>
        ))}
      </div>

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
