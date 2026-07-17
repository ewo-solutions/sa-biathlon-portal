import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { updateAdminProfile } from "./actions";

const inputClass = "w-full bg-sage px-4 py-3.5 text-sm text-white placeholder-white/70 outline-none";
const labelClass = "mb-1 block text-sm text-white";

export default async function AdminProfilePage() {
  const session = await auth();
  const user = await prisma.user.findUniqueOrThrow({ where: { id: session!.user.id } });

  return (
    <div>
      <h1 className="tracked-caps mb-6 text-2xl font-black text-white">My Profile</h1>
      <Card className="max-w-xl" title="Personal information">
        <form action={updateAdminProfile} className="space-y-4">
          <div>
            <label className={labelClass}>Name</label>
            <input name="name" defaultValue={user.name} required className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Surname</label>
            <input name="surname" defaultValue={user.surname} required className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Email</label>
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
            className="tracked-caps bg-gold px-6 py-3 text-sm font-black text-panel-alt transition hover:bg-gold-light"
          >
            Save changes
          </button>
        </form>
      </Card>
    </div>
  );
}
