import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { EventThumbList } from "@/components/ui/event-thumb-list";
import { ProfilePictureForm } from "@/components/ui/profile-picture-form";
import { updateAthlete, uploadAthletePicture } from "./actions";

const inputClass = "w-full bg-sage px-4 py-3.5 text-sm text-white placeholder-white/70 outline-none";
const labelClass = "mb-1 block text-sm text-white";

export default async function AdminAthleteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const athlete = await prisma.user.findUnique({
    where: { id, role: "ATHLETE" },
    include: { athleteProfile: { include: { province: true, school: true, group: true } } },
  });
  if (!athlete) notFound();

  const [membership, registrations, provinces, schools] = await Promise.all([
    prisma.membership.findFirst({
      where: { userId: id, status: "ACTIVE", expiresAt: { gte: new Date() } },
      orderBy: { expiresAt: "desc" },
    }),
    prisma.eventRegistration.findMany({
      where: { userId: id },
      include: { event: true },
      orderBy: { event: { eventDate: "desc" } },
      take: 6,
    }),
    prisma.province.findMany({ orderBy: { name: "asc" } }),
    prisma.school.findMany({ orderBy: { name: "asc" } }),
  ]);

  const now = new Date();
  const upcoming = registrations.filter((r) => r.event.eventDate >= now);
  const past = registrations.filter((r) => r.event.eventDate < now);

  const boundUpdate = updateAthlete.bind(null, id);
  const boundUpload = uploadAthletePicture.bind(null, id);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="tracked-caps text-2xl font-black text-white">
          {athlete.name} {athlete.surname}
        </h1>
        {athlete.athleteProfile?.athleteNumber && (
          <span className="tracked-caps bg-gold px-3 py-1 text-xs font-black text-panel-alt">
            SA No {athlete.athleteProfile.athleteNumber}
          </span>
        )}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.7fr]">
        <div className="space-y-6">
          <Card title="Profile Picture">
            <ProfilePictureForm action={boundUpload} currentImageUrl={athlete.profileImageUrl} />
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
            <form action={boundUpdate} className="space-y-4">
              <div>
                <label className={labelClass}>Athlete number (SA No)</label>
                <input
                  name="athleteNumber"
                  defaultValue={athlete.athleteProfile?.athleteNumber ?? ""}
                  placeholder="e.g. WC0007"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Name</label>
                <input name="name" defaultValue={athlete.name} className={inputClass} required />
              </div>
              <div>
                <label className={labelClass}>Surname</label>
                <input
                  name="surname"
                  defaultValue={athlete.surname}
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Cellphone number</label>
                <input
                  name="cellphone"
                  defaultValue={athlete.cellphone ?? ""}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Login email</label>
                <input
                  name="email"
                  type="email"
                  defaultValue={athlete.email}
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Contact email</label>
                <input
                  name="contactEmail"
                  type="email"
                  defaultValue={athlete.athleteProfile?.contactEmail ?? ""}
                  placeholder="Athlete or parent/guardian email"
                  className={inputClass}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Date of birth</label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    defaultValue={
                      athlete.athleteProfile?.dateOfBirth
                        ? athlete.athleteProfile.dateOfBirth.toISOString().slice(0, 10)
                        : ""
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Gender</label>
                  <select
                    name="gender"
                    defaultValue={athlete.athleteProfile?.gender ?? ""}
                    className={inputClass}
                  >
                    <option value="">Not set</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                  </select>
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-white">
                <input
                  type="checkbox"
                  name="disability"
                  defaultChecked={athlete.athleteProfile?.disability ?? false}
                />
                Disability
              </label>
              <p className="text-xs text-muted">
                Group: {athlete.athleteProfile?.group?.name ?? "—"} (auto-assigned from date of
                birth, gender and disability on save)
              </p>
              <div>
                <label className={labelClass}>Province</label>
                <select
                  name="provinceId"
                  defaultValue={athlete.athleteProfile?.provinceId ?? ""}
                  className={inputClass}
                >
                  <option value="">Not set</option>
                  {provinces.map((province) => (
                    <option key={province.id} value={province.id}>
                      {province.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>School / Club</label>
                <select
                  name="schoolId"
                  defaultValue={athlete.athleteProfile?.schoolId ?? ""}
                  className={inputClass}
                >
                  <option value="">Not set</option>
                  {schools.map((school) => (
                    <option key={school.id} value={school.id}>
                      {school.name}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                className="tracked-caps bg-sage px-6 py-3 text-sm font-black text-white transition hover:bg-sage-light"
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
              </div>
            ) : (
              <p className="text-sm text-muted">No active membership on file.</p>
            )}
          </Card>

          <a
            href={`mailto:${athlete.email}`}
            className="tracked-caps block bg-gold px-6 py-4 text-center text-sm font-black text-panel-alt transition hover:bg-gold-light"
          >
            Contact Athlete
          </a>
        </div>
      </div>
    </div>
  );
}
