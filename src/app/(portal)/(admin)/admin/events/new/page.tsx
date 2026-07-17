import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { saveEvent } from "./actions";

const inputClass =
  "w-full rounded-xl border border-ink-200 px-4 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100";

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 16);
}

export default async function EditCreateEventPage({
  searchParams,
}: {
  searchParams: Promise<{ eventId?: string }>;
}) {
  const { eventId } = await searchParams;
  const event = eventId ? await prisma.event.findUnique({ where: { id: eventId } }) : null;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-ink-950">
        {event ? "Edit Event" : "Create Event"}
      </h1>
      <Card className="max-w-2xl">
        <form action={saveEvent} className="space-y-4">
          {event && <input type="hidden" name="eventId" value={event.id} />}
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-700">Event name</label>
            <input name="name" defaultValue={event?.name} required className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-700">Description</label>
            <textarea
              name="description"
              defaultValue={event?.description}
              rows={4}
              required
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-700">Location</label>
            <input name="location" defaultValue={event?.location ?? ""} className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-700">Date &amp; time</label>
            <input
              type="datetime-local"
              name="eventDate"
              defaultValue={event ? toDateInputValue(event.eventDate) : ""}
              required
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-ink-700">
                Registration fee (R)
              </label>
              <input
                name="registrationFee"
                type="number"
                step="0.01"
                defaultValue={event?.registrationFee?.toString() ?? ""}
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink-700">Capacity</label>
              <input
                name="capacity"
                type="number"
                defaultValue={event?.capacity ?? ""}
                className={inputClass}
              />
            </div>
          </div>
          <button
            type="submit"
            className="rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700"
          >
            {event ? "Save changes" : "Create event"}
          </button>
        </form>
      </Card>
    </div>
  );
}
