import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { saveEvent } from "./actions";

const inputClass = "w-full bg-sage px-4 py-3.5 text-sm text-white placeholder-white/70 outline-none";
const labelClass = "mb-1 block text-sm text-white";

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
      <h1 className="tracked-caps mb-6 text-2xl font-black text-white">
        {event ? "Edit Event" : "Create Event"}
      </h1>
      <Card className="max-w-2xl">
        <form action={saveEvent} className="space-y-4">
          {event && <input type="hidden" name="eventId" value={event.id} />}
          <div>
            <label className={labelClass}>Event name</label>
            <input name="name" defaultValue={event?.name} required className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Description</label>
            <textarea
              name="description"
              defaultValue={event?.description}
              rows={4}
              required
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Location</label>
            <input name="location" defaultValue={event?.location ?? ""} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Date &amp; time</label>
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
              <label className={labelClass}>Registration fee (R)</label>
              <input
                name="registrationFee"
                type="number"
                step="0.01"
                defaultValue={event?.registrationFee?.toString() ?? ""}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Capacity</label>
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
            className="tracked-caps bg-gold px-6 py-3 text-sm font-black text-panel-alt transition hover:bg-gold-light"
          >
            {event ? "Save changes" : "Create event"}
          </button>
        </form>
      </Card>
    </div>
  );
}
