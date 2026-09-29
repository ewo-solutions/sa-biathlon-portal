import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { EventThumbList } from "@/components/ui/event-thumb-list";
import { ProfilePictureForm } from "@/components/ui/profile-picture-form";
import { ConfirmOnChangeForm } from "@/components/ui/confirm-on-change-form";
import { CitizenshipFields } from "@/components/ui/citizenship-fields";
import { SeasonSelect } from "@/components/ui/season-select";
import { getCurrentAgeGroup } from "@/lib/current-age-group";
import { updateProfile, uploadProfilePicture } from "./actions";

const inputClass = "w-full bg-sage px-4 py-3.5 text-sm text-white placeholder-white/70 outline-none";
const readOnlyClass =
  "w-full cursor-not-allowed bg-panel-alt px-4 py-3.5 text-sm text-white/70 outline-none";
const labelClass = "mb-1 block text-sm text-white";
const required = <span className="text-red-400">*</span>;

export default async function AthleteProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ season?: string }>;
}) {
  const session = await auth();
  const userId = session!.user.id;
  const { season: seasonFilter } = await searchParams;

  const [user, membership, registrations, schools, seasons] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { athleteProfile: { include: { province: true, school: true } } },
    }),
    prisma.membership.findFirst({
      where: { userId, status: "ACTIVE", expiresAt: { gte: new Date() } },
      orderBy: { expiresAt: "desc" },
    }),
    prisma.eventRegistration.findMany({
      where: { userId, status: { not: "CANCELLED" } },
      include: { event: { include: { season: true } }, group: true },
      orderBy: { event: { eventDate: "desc" } },
    }),
    prisma.school.findMany({ orderBy: { name: "asc" } }),
    prisma.season.findMany({ orderBy: { startDate: "desc" } }),
  ]);

  const profile = user.athleteProfile;
  const isSaCitizen = profile?.isSaCitizen ?? true;

  const currentAgeGroup = await getCurrentAgeGroup(prisma, {
    dateOfBirth: profile?.dateOfBirth ?? null,
    gender: profile?.gender ?? null,
    disability: profile?.disability ?? false,
  });

  const now = new Date();
  const upcoming = registrations.filter((r) => r.event.eventDate >= now);
  const past = registrations
    .filter((r) => r.event.eventDate < now)
    .filter((r) => !seasonFilter || r.event.seasonId === seasonFilter);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="tracked-caps text-2xl font-black text-white">My Profile</h1>
        {profile?.athleteNumber && (
          <span className="tracked-caps bg-gold px-3 py-1 text-xs font-black text-panel-alt">
            SA No {profile.athleteNumber}
          </span>
        )}
      </div>
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

          <Card
            title="Past events"
            headerExtra={seasons.length > 0 ? <SeasonSelect seasons={seasons} /> : undefined}
          >
            {past.length === 0 && <p className="text-sm text-muted">No past events yet.</p>}
            <ul className="space-y-3 text-sm">
              {past.map((r) => {
                const eitherDnf = r.runningDnf || r.swimmingDnf;
                const total =
                  Number(r.runningPoints ?? 0) +
                  Number(r.runningBonusPoints ?? 0) +
                  Number(r.swimmingPoints ?? 0) +
                  Number(r.swimmingBonusPoints ?? 0);
                return (
                  <li key={r.id} className="border-b border-white/10 pb-2 last:border-0">
                    <p className="font-bold text-white">{r.event.name}</p>
                    <p className="text-xs text-muted">
                      {r.event.eventDate.toLocaleDateString("en-ZA", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                      {" — "}
                      {r.group?.name ?? "Age group not yet assigned"}
                      {" — "}
                      {r.dns ? "DNS" : eitherDnf ? "DNF" : `${total.toFixed(2)} pts`}
                    </p>
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Personal information">
            <ConfirmOnChangeForm
              action={updateProfile}
              className="space-y-4"
              watchField="idNumber"
              originalValue={profile?.idNumber ?? ""}
              confirmMessage="Are you sure you want to change your ID number? Your date of birth and gender will be recalculated from the new number."
            >
              <div>
                <label className={labelClass}>Name {required}</label>
                <input name="name" defaultValue={user.name} className={inputClass} required />
              </div>
              <div>
                <label className={labelClass}>Surname {required}</label>
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
                <label className={labelClass}>Login email {required}</label>
                <input
                  name="email"
                  type="email"
                  defaultValue={user.email}
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Contact email</label>
                <input
                  name="contactEmail"
                  type="email"
                  defaultValue={profile?.contactEmail ?? ""}
                  placeholder="Your (or a parent/guardian) email, if different from login"
                  className={inputClass}
                />
              </div>

              <CitizenshipFields
                defaultIsSaCitizen={isSaCitizen}
                defaultIdNumber={profile?.idNumber ?? ""}
                defaultDateOfBirth={
                  profile?.dateOfBirth ? profile.dateOfBirth.toISOString().slice(0, 10) : ""
                }
                defaultGender={profile?.gender ?? ""}
                idRequired={false}
              />

              <label className="flex items-center gap-2 text-sm text-white">
                <input
                  type="checkbox"
                  name="disability"
                  defaultChecked={profile?.disability ?? false}
                />
                Disability
              </label>

              <p className="text-xs text-muted">
                {currentAgeGroup.season ? (
                  <>
                    Current Season {currentAgeGroup.season.label} Age Group:{" "}
                    <span className="text-white">{currentAgeGroup.group?.name ?? "Not yet assigned"}</span>
                  </>
                ) : (
                  "Age group not available — no active season configured."
                )}
              </p>

              <div>
                <label className={labelClass}>Province</label>
                <input
                  value={profile?.province?.name ?? "Not set"}
                  readOnly
                  className={readOnlyClass}
                />
                <p className="mt-1 text-xs text-muted">
                  Province can only be changed by an administrator.
                </p>
              </div>

              <div>
                <label className={labelClass}>School / Club</label>
                <select
                  name="schoolId"
                  defaultValue={profile?.schoolId ?? ""}
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

              <div>
                <label className={labelClass}>Address</label>
                <div className="space-y-2">
                  <input
                    name="addressLine1"
                    placeholder="Address line 1"
                    defaultValue={profile?.addressLine1 ?? ""}
                    className={inputClass}
                  />
                  <input
                    name="addressLine2"
                    placeholder="Address line 2"
                    defaultValue={profile?.addressLine2 ?? ""}
                    className={inputClass}
                  />
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <input
                      name="addressLine3"
                      placeholder="Town / City"
                      defaultValue={profile?.addressLine3 ?? ""}
                      className={inputClass}
                    />
                    <input
                      name="postalCode"
                      placeholder="Postal code"
                      defaultValue={profile?.postalCode ?? ""}
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="tracked-caps bg-gold px-6 py-3 text-sm font-black text-panel-alt transition hover:bg-gold-light"
              >
                Save changes
              </button>
            </ConfirmOnChangeForm>
          </Card>

          <Card title="Athlete Affiliation">
            {!membership && (
              <p className="tracked-caps mb-4 bg-red-900/40 px-4 py-3 text-sm font-black text-red-200">
                Affiliation Fees Outstanding
              </p>
            )}
            {membership ? (
              <div className="space-y-4 text-sm">
                <div>
                  <p className="text-white/80">Season:</p>
                  <p className="tracked-caps font-black text-gold">{membership.seasonLabel}</p>
                </div>
                <div>
                  <p className="text-white/80">Affiliation fee:</p>
                  <p className="tracked-caps font-black text-gold">
                    R{membership.feeAmount.toString()}
                    {membership.sponsoredOverride ? " (sponsored)" : "/y"}
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
                  Manage affiliation
                </a>
              </div>
            ) : (
              <a
                href="/athlete/membership"
                className="tracked-caps inline-block bg-gold px-6 py-3 text-sm font-black text-panel-alt transition hover:bg-gold-light"
              >
                Pay affiliation
              </a>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
