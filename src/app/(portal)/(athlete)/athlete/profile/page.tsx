import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { updateProfile } from "./actions";

const inputClass =
  "w-full rounded-xl border border-ink-200 px-4 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100";

export default async function AthleteProfilePage() {
  const session = await auth();
  const userId = session!.user.id;

  const [user, membership, registrations] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: userId } }),
    prisma.membership.findFirst({
      where: { userId, status: "ACTIVE" },
      orderBy: { expiresAt: "desc" },
    }),
    prisma.eventRegistration.findMany({
      where: { userId },
      include: { event: true },
      orderBy: { event: { eventDate: "desc" } },
      take: 6,
    }),
  ]);

  const now = new Date();
  const upcoming = registrations.filter((r) => r.event.eventDate >= now);
  const past = registrations.filter((r) => r.event.eventDate < now);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-ink-950">My Profile</h1>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.7fr]">
        <div className="space-y-6">
          <Card title="Upcoming events">
            <ul className="space-y-3 text-sm">
              {upcoming.length === 0 && <li className="text-ink-500">No upcoming sign-ups.</li>}
              {upcoming.map((r) => (
                <li key={r.id} className="flex flex-col">
                  <span className="font-medium text-ink-800">{r.event.name}</span>
                  <span className="text-xs text-ink-500">
                    {r.event.eventDate.toLocaleDateString("en-ZA", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </li>
              ))}
            </ul>
          </Card>

          <Card title="Past events">
            <ul className="space-y-3 text-sm">
              {past.length === 0 && <li className="text-ink-500">No past events yet.</li>}
              {past.map((r) => (
                <li key={r.id} className="flex flex-col">
                  <span className="font-medium text-ink-800">{r.event.name}</span>
                  <span className="text-xs text-ink-500">
                    {r.event.eventDate.toLocaleDateString("en-ZA", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Personal information">
            <form action={updateProfile} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-ink-700">Name</label>
                <input name="name" defaultValue={user.name} className={inputClass} required />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-ink-700">Surname</label>
                <input name="surname" defaultValue={user.surname} className={inputClass} required />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-ink-700">
                  Cellphone number
                </label>
                <input
                  name="cellphone"
                  defaultValue={user.cellphone ?? ""}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-ink-700">Email</label>
                <input
                  name="email"
                  type="email"
                  defaultValue={user.email}
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-ink-700">Province</label>
                <input name="province" defaultValue={user.province ?? ""} className={inputClass} />
              </div>
              <button
                type="submit"
                className="rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700"
              >
                Save changes
              </button>
            </form>
          </Card>

          <Card title="Membership information">
            {membership ? (
              <div className="space-y-4 text-sm">
                <div>
                  <p className="text-ink-500">Current Membership:</p>
                  <p className="font-medium text-ink-800">{membership.seasonLabel}</p>
                </div>
                <div>
                  <p className="text-ink-500">Yearly Membership:</p>
                  <p className="font-medium text-ink-800">
                    R{membership.feeAmount.toString()}/y
                  </p>
                </div>
                <div className="flex gap-8">
                  <div>
                    <p className="text-ink-500">Purchased:</p>
                    <p className="font-medium text-ink-800">
                      {membership.purchasedAt.toLocaleDateString("en-ZA", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-ink-500">Expiration Date:</p>
                    <p className="font-medium text-ink-800">
                      {membership.expiresAt.toLocaleDateString("en-ZA", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <a
                  href="/athlete/membership"
                  className="inline-block rounded-xl bg-brand-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-brand-700"
                >
                  Manage membership
                </a>
              </div>
            ) : (
              <p className="text-sm text-ink-500">No active membership on file.</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
