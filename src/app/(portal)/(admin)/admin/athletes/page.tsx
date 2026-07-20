import Link from "next/link";
import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/card";

const PAGE_SIZE = 50;

export default async function AdminAthletesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q, page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const where = q
    ? {
        role: "ATHLETE" as const,
        OR: [
          { name: { contains: q, mode: "insensitive" as const } },
          { surname: { contains: q, mode: "insensitive" as const } },
          { email: { contains: q, mode: "insensitive" as const } },
          { athleteProfile: { athleteNumber: { contains: q, mode: "insensitive" as const } } },
        ],
      }
    : { role: "ATHLETE" as const };

  const [athletes, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { surname: "asc" },
      include: {
        memberships: { where: { status: "ACTIVE" }, take: 1, orderBy: { expiresAt: "desc" } },
        athleteProfile: true,
      },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
    }),
    prisma.user.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageLink = (p: number) =>
    `/admin/athletes?${new URLSearchParams({ ...(q ? { q } : {}), page: String(p) })}`;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="tracked-caps text-2xl font-black text-white">Athletes Profiles</h1>
        <p className="text-sm text-muted">{total.toLocaleString()} athletes</p>
      </div>

      <form action="/admin/athletes" className="mb-6">
        <input
          type="text"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search by name, email, or SA No"
          className="w-full max-w-xl bg-sage px-4 py-3.5 text-sm text-white placeholder-white/80 outline-none"
        />
      </form>

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="tracked-caps border-b border-white/10 text-muted">
              <th className="py-2 pr-4 font-black">SA No</th>
              <th className="py-2 pr-4 font-black">Name</th>
              <th className="py-2 pr-4 font-black">Email</th>
              <th className="py-2 pr-4 font-black">Province</th>
              <th className="py-2 pr-4 font-black">Club</th>
              <th className="py-2 font-black">Membership</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {athletes.map((athlete) => (
              <tr key={athlete.id} className="cursor-pointer hover:bg-white/5">
                <td className="py-3 pr-4 text-white/80">
                  <Link href={`/admin/athletes/${athlete.id}`} className="block">
                    {athlete.athleteProfile?.athleteNumber ?? "—"}
                  </Link>
                </td>
                <td className="py-3 pr-4 font-bold text-white">
                  <Link href={`/admin/athletes/${athlete.id}`} className="block">
                    {athlete.name} {athlete.surname}
                  </Link>
                </td>
                <td className="py-3 pr-4 text-white/80">
                  <Link href={`/admin/athletes/${athlete.id}`} className="block">
                    {athlete.email}
                  </Link>
                </td>
                <td className="py-3 pr-4 text-white/80">{athlete.province ?? "—"}</td>
                <td className="py-3 pr-4 text-white/80">{athlete.athleteProfile?.club ?? "—"}</td>
                <td className="py-3 text-white/80">
                  {athlete.memberships[0] ? (
                    <span className="bg-sage px-3 py-1 text-xs font-bold text-white">
                      {athlete.memberships[0].seasonLabel}
                    </span>
                  ) : (
                    <span className="bg-panel-alt px-3 py-1 text-xs font-bold text-muted">
                      No active membership
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {athletes.length === 0 && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-muted">
                  No athletes found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between gap-4">
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
