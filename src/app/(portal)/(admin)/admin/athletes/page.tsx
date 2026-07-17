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
      <h1 className="mb-6 text-2xl font-semibold text-ink-950">Athletes Profiles</h1>
      <Card>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-ink-200 text-ink-500">
              <th className="py-2 pr-4 font-medium">Name</th>
              <th className="py-2 pr-4 font-medium">Email</th>
              <th className="py-2 pr-4 font-medium">Province</th>
              <th className="py-2 pr-4 font-medium">Club</th>
              <th className="py-2 font-medium">Membership</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {athletes.map((athlete) => (
              <tr key={athlete.id}>
                <td className="py-3 pr-4 font-medium text-ink-800">
                  {athlete.name} {athlete.surname}
                </td>
                <td className="py-3 pr-4 text-ink-600">{athlete.email}</td>
                <td className="py-3 pr-4 text-ink-600">{athlete.province ?? "—"}</td>
                <td className="py-3 pr-4 text-ink-600">{athlete.athleteProfile?.club ?? "—"}</td>
                <td className="py-3 text-ink-600">
                  {athlete.memberships[0] ? (
                    <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                      {athlete.memberships[0].seasonLabel}
                    </span>
                  ) : (
                    <span className="rounded-full bg-ink-100 px-3 py-1 text-xs font-medium text-ink-500">
                      No active membership
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {athletes.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-ink-500">
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
