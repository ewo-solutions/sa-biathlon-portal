type ThumbEvent = {
  id: string;
  name: string;
  eventDate: Date;
  imageUrl: string | null;
};

export function EventThumbList({
  events,
  emptyLabel,
}: {
  events: ThumbEvent[];
  emptyLabel: string;
}) {
  if (events.length === 0) {
    return <p className="text-sm text-muted">{emptyLabel}</p>;
  }

  return (
    <ul className="space-y-3">
      {events.map((event) => (
        <li key={event.id} className="flex items-center gap-4">
          {event.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={event.imageUrl}
              alt=""
              className="h-[54px] w-[102px] shrink-0 object-cover"
            />
          ) : (
            <div className="h-[54px] w-[102px] shrink-0 bg-sage/50" />
          )}
          <div>
            <p className="text-sm font-bold uppercase leading-tight text-white">{event.name}</p>
            <p className="text-xs text-muted">
              {event.eventDate.toLocaleDateString("en-ZA", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
