import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { EventThumbList } from "@/components/ui/event-thumb-list";
import { ProfilePictureForm } from "@/components/ui/profile-picture-form";
import { updateProfile, uploadProfilePicture } from "./actions";

const inputClass = "w-full bg-sage px-4 py-3.5 text-sm text-white placeholder-white/70 outline-none";
const labelClass = "mb-1 block text-sm text-white";

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
      <h1 className="tracked-caps mb-6 text-2xl font-black text-white">My Profile</h1>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.7fr]">
        <div className="space-y-6">
          <Card title="Profile Picture">
            <ProfilePictureForm action={uploadProfilePicture} currentImageUrl={user.profileImageUrl} />
          </Card>

          <Card title="Upcoming events">
            <EventThumbList
              events={upcoming.map((r) => r.event)}
              emptyLabel="No upcoming sign-ups."
            />
          </Card>

          <Card title="Past events">
            <EventThumbList events={past.map((r) => r.event)} emptyLabel="No past events yet." />
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Personal information">
            <form action={updateProfile} className="space-y-4">
              <div>
                <label className={labelClass}>Name</label>
                <input name="name" defaultValue={user.name} className={inputClass} required />
              </div>
              <div>
                <label className={labelClass}>Surname</label>
                <input name="surname" defaultValue={user.surname} className={inputClass} required />
              </div>
              <div>
                <label className={labelClass}>Cellphone number</label>
                <input
                  name="cellphone"
                  defaultValue={user.cellphone ?? ""}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Email</label>
                <input
                  name="email"
                  type="email"
                  defaultValue={user.email}
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Province</label>
                <input name="province" defaultValue={user.province ?? ""} className={inputClass} />
              </div>
              <button
                type="submit"
                className="tracked-caps bg-gold px-6 py-3 text-sm font-black text-panel-alt transition hover:bg-gold-light"
              >
                Save changes
              </button>
            </form>
          </Card>

          <Card title="Membership information">
            {membership ? (
              <div className="space-y-4 text-sm">
                <div>
                  <p className="text-white/80">Current Membership:</p>
                  <p className="tracked-caps font-black text-gold">{membership.seasonLabel}</p>
                </div>
                <div>
                  <p className="text-white/80">Yearly Membership:</p>
                  <p className="tracked-caps font-black text-gold">
                    R{membership.feeAmount.toString()}/y
                  </p>
                </div>
                <div className="flex flex-wrap gap-6 sm:gap-8">
                  <div>
                    <p className="text-white/80">Purchased:</p>
                    <p className="tracked-caps font-black text-gold">
                      {membership.purchasedAt.toLocaleDateString("en-ZA", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-white/80">Expiration Date:</p>
                    <p className="tracked-caps font-black text-gold">
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
                  className="tracked-caps inline-block bg-gold px-6 py-3 text-sm font-black text-panel-alt transition hover:bg-gold-light"
                >
                  Manage membership
                </a>
              </div>
            ) : (
              <p className="text-sm text-muted">No active membership on file.</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
