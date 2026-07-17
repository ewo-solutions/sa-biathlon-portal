import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { registerForEvent } from "./actions";

export default async function AthleteEventsPage() {
  const session = await auth();
  const userId = session!.user.id;

  const events = await prisma.event.findMany({
    where: { eventDate: { gte: new Date() } },
    orderBy: { eventDate: "asc" },
    include: {
      registrations: { where: { userId } },
    },
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-ink-950">Upcoming Events</h1>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {events.length === 0 && (
          <p className="text-sm text-ink-500">No upcoming events scheduled.</p>
        )}
        {events.map((event) => {
          const isRegistered = event.registrations.length > 0;
          return (
            <Card key={event.id}>
              <h3 className="text-base font-semibold text-ink-950">{event.name}</h3>
              <p className="mt-1 text-xs text-ink-500">
                {event.eventDate.toLocaleDateString("en-ZA", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
              <p className="mt-3 line-clamp-4 text-sm text-ink-600">{event.description}</p>
              <form
                action={async () => {
                  "use server";
                  await registerForEvent(event.id);
                }}
              >
                <button
                  type="submit"
                  disabled={isRegistered}
                  className="mt-4 w-full rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-ink-200 disabled:text-ink-500"
                >
                  {isRegistered ? "Signed up" : "Sign up"}
                </button>
              </form>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
