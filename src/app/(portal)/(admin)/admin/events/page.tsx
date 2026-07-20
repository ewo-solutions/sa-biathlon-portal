import Link from "next/link";
import { prisma } from "@/lib/db";

const PAGE_SIZE = 24;

export default async function AdminEventsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q, page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const where = q ? { name: { contains: q, mode: "insensitive" as const } } : undefined;

  const [events, total] = await Promise.all([
    prisma.event.findMany({
      where,
      orderBy: { eventDate: "desc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
    }),
    prisma.event.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageLink = (p: number) =>
    `/admin/events?${new URLSearchParams({ ...(q ? { q } : {}), page: String(p) })}`;

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
        <p className="text-sm text-muted">{total.toLocaleString()} events</p>
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
              {event.description && (
                <p className="mt-3 line-clamp-4 text-sm text-white/80">{event.description}</p>
              )}
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Link
                  href={`/admin/events/new?eventId=${event.id}`}
                  className="tracked-caps block bg-white py-2.5 text-center text-xs font-bold text-panel-alt transition hover:bg-white/90"
                >
                  Edit
                </Link>
                <Link
                  href={`/admin/events/report?eventId=${event.id}`}
                  className="tracked-caps block bg-gold py-2.5 text-center text-xs font-bold text-panel-alt transition hover:bg-gold-light"
                >
                  Report
                </Link>
              </div>
            </div>
          </div>
        ))}
        {events.length === 0 && (
          <p className="col-span-full text-sm text-muted">
            No events yet — click &ldquo;Add Event&rdquo; to create the first one.
          </p>
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-10 flex items-center justify-between gap-4">
          <Link
            href={pageLink(Math.max(1, page - 1))}
            aria-disabled={page <= 1}
            className={`tracked-caps px-4 py-2 text-xs font-black transition ${
              page <= 1
                ? "pointer-events-none bg-panel-alt text-muted"
                : "bg-gold text-panel-alt hover:bg-gold-light"
            }`}
          >
            Previous
          </Link>
          <p className="text-sm text-muted">
            Page {page} of {totalPages}
          </p>
          <Link
            href={pageLink(Math.min(totalPages, page + 1))}
            aria-disabled={page >= totalPages}
            className={`tracked-caps px-4 py-2 text-xs font-black transition ${
              page >= totalPages
                ? "pointer-events-none bg-panel-alt text-muted"
                : "bg-gold text-panel-alt hover:bg-gold-light"
            }`}
          >
            Next
          </Link>
        </div>
      )}
    </div>
  );
}
