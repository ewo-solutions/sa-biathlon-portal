import Link from "next/link";
import { CalendarDays, ListOrdered } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/card";

export default async function AthleteHomePage() {
  const session = await auth();
  const userId = session!.user.id;

  const [upcomingEvents, recentResults] = await Promise.all([
    prisma.event.findMany({
      where: { eventDate: { gte: new Date() } },
      orderBy: { eventDate: "asc" },
      take: 4,
    }),
    prisma.result.findMany({
      where: { athleteProfile: { userId } },
      orderBy: { season: "desc" },
      take: 4,
      include: { event: true },
    }),
  ]);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card title="Upcoming Events">
        <div className="flex items-center gap-3 text-brand-600">
          <CalendarDays size={28} />
        </div>
        <ul className="mt-4 space-y-3">
          {upcomingEvents.length === 0 && (
            <li className="text-sm text-ink-500">No upcoming events yet.</li>
          )}
          {upcomingEvents.map((event) => (
            <li key={event.id} className="flex items-center justify-between text-sm">
              <span className="font-medium text-ink-800">{event.name}</span>
              <span className="text-ink-500">
                {event.eventDate.toLocaleDateString("en-ZA", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </li>
          ))}
        </ul>
        <Link
          href="/athlete/events"
          className="mt-4 inline-block text-sm font-medium text-brand-600 hover:underline"
        >
          View all events
        </Link>
      </Card>

      <Card title="Results">
        <div className="flex items-center gap-3 text-brand-600">
          <ListOrdered size={28} />
        </div>
        <ul className="mt-4 space-y-3">
          {recentResults.length === 0 && (
            <li className="text-sm text-ink-500">No results recorded yet.</li>
          )}
          {recentResults.map((result) => (
            <li key={result.id} className="flex items-center justify-between text-sm">
              <span className="font-medium text-ink-800">{result.event.name}</span>
              <span className="text-ink-500">
                {result.position ? `#${result.position}` : "—"} · {result.season}
              </span>
            </li>
          ))}
        </ul>
        <Link
          href="/athlete/results"
          className="mt-4 inline-block text-sm font-medium text-brand-600 hover:underline"
        >
          View all results
        </Link>
      </Card>
    </div>
  );
}
