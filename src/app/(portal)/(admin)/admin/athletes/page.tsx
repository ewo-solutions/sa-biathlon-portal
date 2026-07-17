import Link from "next/link";
import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/card";

export default async function AdminAthletesPage() {
  const athletes = await prisma.user.findMany({
    where: { role: "ATHLETE" },
    orderBy: { surname: "asc" },
    include: {
      memberships: { where: { status: "ACTIVE" }, take: 1, orderBy: { expiresAt: "desc" } },
      athleteProfile: true,
    },
  });

  return (
    <div>
      <h1 className="tracked-caps mb-6 text-2xl font-black text-white">Athletes Profiles</h1>
      <Card>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="tracked-caps border-b border-white/10 text-muted">
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
                <td colSpan={5} className="py-6 text-center text-muted">
                  No athletes registered yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
