import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { ProfilePictureForm } from "@/components/ui/profile-picture-form";
import { saveEvent, uploadEventPicture } from "./actions";

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
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.7fr]">
        <Card title="Event Picture">
          {event ? (
            <ProfilePictureForm
              action={uploadEventPicture.bind(null, event.id)}
              currentImageUrl={event.imageUrl}
            />
          ) : (
            <p className="text-sm text-muted">
              Save the event first, then come back here to add a photo.
            </p>
          )}
        </Card>

        <Card title="Event information">
          <form action={saveEvent} className="space-y-4">
            {event && <input type="hidden" name="eventId" value={event.id} />}
            <div>
              <label className={labelClass}>Name</label>
              <input name="name" defaultValue={event?.name} required className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Date</label>
              <input
                type="datetime-local"
                name="eventDate"
                defaultValue={event ? toDateInputValue(event.eventDate) : ""}
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Location</label>
              <div className="space-y-2">
                <input
                  name="location"
                  placeholder="Running location"
                  defaultValue={event?.location ?? ""}
                  className={inputClass}
                />
                <input
                  name="swimmingLocation"
                  placeholder="Swimming location"
                  defaultValue={event?.swimmingLocation ?? ""}
                  className={inputClass}
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>Registration</label>
              <input
                name="registrationInfo"
                placeholder="Registration time"
                defaultValue={event?.registrationInfo ?? ""}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Entry Fee</label>
              <input
                name="registrationFee"
                type="number"
                step="0.01"
                placeholder="Entry fee"
                defaultValue={event?.registrationFee?.toString() ?? ""}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Description/Notes</label>
              <textarea
                name="description"
                placeholder="Description/Notes"
                defaultValue={event?.description}
                rows={4}
                required
                className={inputClass}
              />
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
    </div>
  );
}
