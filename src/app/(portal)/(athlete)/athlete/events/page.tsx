import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { EventEntryForm } from "@/components/ui/event-entry-form";
import { registerForEvent, withdrawFromEvent } from "./actions";

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
          const registration = event.registrations[0];
          const isRegistered = registration && registration.status !== "CANCELLED";
          const cutoffPassed =
            event.registrationCloseDate && new Date() > event.registrationCloseDate;
          const boundRegister = registerForEvent.bind(null, event.id);
          const boundWithdraw = withdrawFromEvent.bind(null, event.id);

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
              {event.registrationCloseDate && (
                <p className="mt-1 text-xs text-muted">
                  Entries/withdrawals close{" "}
                  {event.registrationCloseDate.toLocaleString("en-ZA", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              )}
              <p className="mt-3 whitespace-pre-wrap text-sm text-white/80">
                {event.description}
              </p>
              {isRegistered && (
                <p className="mt-3 text-xs text-muted">
                  No refund is given after withdrawal from an event.
                </p>
              )}
              <div className="mt-4">
                {isRegistered ? (
                  cutoffPassed ? (
                    <p className="tracked-caps bg-panel-alt px-4 py-3 text-center text-xs font-black text-white/70">
                      Withdrawals are closed — contact your province admin
                    </p>
                  ) : (
                    <EventEntryForm
                      action={boundWithdraw}
                      label="Withdraw"
                      pendingLabel="Withdrawing…"
                      variant="secondary"
                    />
                  )
                ) : cutoffPassed ? (
                  <p className="tracked-caps bg-panel-alt px-4 py-3 text-center text-xs font-black text-white/70">
                    Entries are closed — contact your province admin
                  </p>
                ) : (
                  <EventEntryForm action={boundRegister} label="Sign up" pendingLabel="Signing up…" />
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
