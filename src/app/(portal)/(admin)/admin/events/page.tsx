import Link from "next/link";
import { prisma } from "@/lib/db";

export default async function AdminEventsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

  const events = await prisma.event.findMany({
    where: q ? { name: { contains: q, mode: "insensitive" } } : undefined,
    orderBy: { eventDate: "desc" },
  });

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center gap-4">
        <Link
          href="/admin/events/new"
          className="tracked-caps bg-gold px-6 py-4 text-sm font-black text-panel-alt transition hover:bg-gold-light"
        >
          Add Event
        </Link>
        <form action="/admin/events" className="flex-1">
          <input
            type="text"
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search Events"
            className="w-full max-w-xl bg-sage px-4 py-4 text-sm text-white placeholder-white/80 outline-none"
          />
        </form>
        <button
          type="button"
          className="tracked-caps bg-gold px-6 py-4 text-sm font-black text-panel-alt transition hover:bg-gold-light"
        >
          Filter
        </button>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
        {events.map((event) => (
          <div key={event.id} className="bg-panel shadow-[0_0_36px_rgba(0,0,0,0.25)]">
            {event.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={event.imageUrl}
                alt=""
                className="h-[220px] w-full object-cover"
              />
            ) : (
              <div className="h-[220px] w-full bg-sage/40" />
            )}
            <div className="p-5">
              <h3 className="text-base font-bold uppercase leading-tight text-white">
                {event.name}
              </h3>
              <p className="mt-1 text-xs text-muted">
                {event.eventDate.toLocaleDateString("en-ZA", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
              <p className="mt-3 line-clamp-4 text-sm text-white/80">{event.description}</p>
              <Link
                href={`/admin/events/new?eventId=${event.id}`}
                className="tracked-caps mt-4 block bg-white py-2.5 text-center text-xs font-bold text-panel-alt transition hover:bg-white/90"
              >
                Edit
              </Link>
            </div>
          </div>
        ))}
        {events.length === 0 && (
          <p className="col-span-full text-sm text-muted">
            No events yet — click &ldquo;Add Event&rdquo; to create the first one.
          </p>
        )}
      </div>

      <div className="mt-10 flex justify-end">
        <button
          type="button"
          className="tracked-caps bg-gold px-6 py-4 text-sm font-black text-panel-alt transition hover:bg-gold-light"
        >
          Load more
        </button>
      </div>
    </div>
  );
}
