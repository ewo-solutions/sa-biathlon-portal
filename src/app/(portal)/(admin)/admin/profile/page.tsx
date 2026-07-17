import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { updateAdminProfile } from "./actions";

const inputClass =
  "w-full rounded-xl border border-ink-200 px-4 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100";

export default async function AdminProfilePage() {
  const session = await auth();
  const user = await prisma.user.findUniqueOrThrow({ where: { id: session!.user.id } });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-ink-950">My Profile</h1>
      <Card className="max-w-xl" title="Personal information">
        <form action={updateAdminProfile} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-700">Name</label>
            <input name="name" defaultValue={user.name} required className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-700">Surname</label>
            <input name="surname" defaultValue={user.surname} required className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-700">Email</label>
            <input
              name="email"
              type="email"
              defaultValue={user.email}
              required
              className={inputClass}
            />
          </div>
          <button
            type="submit"
            className="rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700"
          >
            Save changes
          </button>
        </form>
      </Card>
    </div>
  );
}
