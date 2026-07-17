import Link from "next/link";
import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/card";

export default async function AdminEventsPage() {
  const events = await prisma.event.findMany({
    orderBy: { eventDate: "desc" },
    include: { _count: { select: { registrations: true } } },
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="tracked-caps text-2xl font-black text-white">Events</h1>
        <Link
          href="/admin/events/new"
          className="tracked-caps bg-gold px-5 py-3 text-sm font-black text-panel-alt transition hover:bg-gold-light"
        >
          Create event
        </Link>
      </div>
      <Card>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="tracked-caps border-b border-white/10 text-muted">
              <th className="py-2 pr-4 font-black">Event</th>
              <th className="py-2 pr-4 font-black">Date</th>
              <th className="py-2 pr-4 font-black">Sign-ups</th>
              <th className="py-2 pr-4 font-black">Fee</th>
              <th className="py-2 font-black"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {events.map((event) => (
              <tr key={event.id}>
                <td className="py-3 pr-4 font-bold uppercase text-white">{event.name}</td>
                <td className="py-3 pr-4 text-white/80">
                  {event.eventDate.toLocaleDateString("en-ZA", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </td>
                <td className="py-3 pr-4 text-white/80">
                  {event._count.registrations}
                  {event.capacity ? ` / ${event.capacity}` : ""}
                </td>
                <td className="py-3 pr-4 text-white/80">
                  {event.registrationFee ? `R${event.registrationFee.toString()}` : "Free"}
                </td>
                <td className="py-3 text-right">
                  <Link
                    href={`/admin/events/new?eventId=${event.id}`}
                    className="text-gold hover:underline"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
            {events.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-muted">
                  No events yet — create the first one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
