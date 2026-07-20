import Link from "next/link";
import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { deleteGroup } from "./actions";

export default async function AdminGroupsPage() {
  const groups = await prisma.group.findMany({ orderBy: [{ order: "asc" }, { name: "asc" }] });

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="tracked-caps text-2xl font-black text-white">Groups</h1>
        <Link
          href="/admin/setup/groups/new"
          className="tracked-caps bg-gold px-6 py-3 text-sm font-black text-panel-alt transition hover:bg-gold-light"
        >
          Add Group
        </Link>
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="tracked-caps border-b border-white/10 text-muted">
              <th className="py-2 pr-4 font-black">Name</th>
              <th className="py-2 pr-4 font-black">Gender</th>
              <th className="py-2 pr-4 font-black">Ages</th>
              <th className="py-2 pr-4 font-black">Disability</th>
              <th className="py-2 font-black">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {groups.map((group) => (
              <tr key={group.id}>
                <td className="py-3 pr-4 font-bold text-white">{group.name}</td>
                <td className="py-3 pr-4 text-white/80">{group.gender ?? "—"}</td>
                <td className="py-3 pr-4 text-white/80">
                  {group.ageStart}–{group.ageEnd}
                </td>
                <td className="py-3 pr-4 text-white/80">{group.disabilityGroup ? "Yes" : "No"}</td>
                <td className="py-3">
                  <div className="flex gap-3">
                    <Link
                      href={`/admin/setup/groups/new?groupId=${group.id}`}
                      className="text-gold hover:underline"
                    >
                      Edit
                    </Link>
                    <form
                      action={async () => {
                        "use server";
                        await deleteGroup(group.id);
                      }}
                    >
                      <button type="submit" className="text-red-300 hover:underline">
                        Delete
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {groups.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-muted">
                  No groups yet — click &ldquo;Add Group&rdquo; to create the first one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
