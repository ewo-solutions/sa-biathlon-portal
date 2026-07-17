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
        <h1 className="text-2xl font-semibold text-ink-950">Events</h1>
        <Link
          href="/admin/events/new"
          className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700"
        >
          Create event
        </Link>
      </div>
      <Card>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-ink-200 text-ink-500">
              <th className="py-2 pr-4 font-medium">Event</th>
              <th className="py-2 pr-4 font-medium">Date</th>
              <th className="py-2 pr-4 font-medium">Sign-ups</th>
              <th className="py-2 pr-4 font-medium">Fee</th>
              <th className="py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {events.map((event) => (
              <tr key={event.id}>
                <td className="py-3 pr-4 font-medium text-ink-800">{event.name}</td>
                <td className="py-3 pr-4 text-ink-600">
                  {event.eventDate.toLocaleDateString("en-ZA", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </td>
                <td className="py-3 pr-4 text-ink-600">
                  {event._count.registrations}
                  {event.capacity ? ` / ${event.capacity}` : ""}
                </td>
                <td className="py-3 pr-4 text-ink-600">
                  {event.registrationFee ? `R${event.registrationFee.toString()}` : "Free"}
                </td>
                <td className="py-3 text-right">
                  <Link
                    href={`/admin/events/new?eventId=${event.id}`}
                    className="text-brand-600 hover:underline"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
            {events.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-ink-500">
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
