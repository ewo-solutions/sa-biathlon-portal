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
      <h1 className="tracked-caps mb-6 text-2xl font-black text-white">Upcoming Events</h1>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {events.length === 0 && (
          <p className="text-sm text-muted">No upcoming events scheduled.</p>
        )}
        {events.map((event) => {
          const isRegistered = event.registrations.length > 0;
          return (
            <Card key={event.id}>
              <h3 className="text-base font-bold uppercase text-white">{event.name}</h3>
              <p className="mt-1 text-xs text-muted">
                {event.eventDate.toLocaleDateString("en-ZA", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
              <p className="mt-3 line-clamp-4 text-sm text-white/80">{event.description}</p>
              <form
                action={async () => {
                  "use server";
                  await registerForEvent(event.id);
                }}
              >
                <button
                  type="submit"
                  disabled={isRegistered}
                  className="tracked-caps mt-4 w-full bg-gold px-4 py-3 text-sm font-black text-panel-alt transition hover:bg-gold-light disabled:cursor-not-allowed disabled:bg-panel-alt disabled:text-muted"
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
