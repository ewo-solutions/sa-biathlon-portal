import type { PrismaClient, Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import aspNetUsersData from "./aspnetusers.json";
import athletesData from "./athletes.json";

type LegacyAspNetUser = {
  Id: string;
  Email: string;
  PasswordHash: string;
  PhoneNumber: string | null;
  AthleteId: string;
  FirstName: string | null;
  Surname: string | null;
};

type LegacyAthlete = {
  Id: string;
  FirstName: string | null;
  Surname: string | null;
  AthleteNumber: string;
  DateOfBirth: string;
  IdentityNumber: string | null;
  Gender: string | null;
  Disability: string;
  GroupId: string | null;
  SchoolId: string | null;
  ProvinceId: string | null;
  Email: string | null;
  PhoneNumber: string | null;
  Status: string;
  OutOfSchool: string;
};

const NULL_GUID = "00000000-0000-0000-0000-000000000000";

function parseLegacyBool(value: string | null | undefined): boolean {
  return value === "True" || value === "true";
}

function normalizeGender(value: string | null | undefined): string | null {
  if (value === "M") return "MALE";
  if (value === "F") return "FEMALE";
  return value ?? null;
}

function orNull(id: string | null | undefined): string | null {
  return id && id !== NULL_GUID ? id : null;
}

function athleteProfileFields(athlete: LegacyAthlete) {
  return {
    athleteNumber: athlete.AthleteNumber,
    dateOfBirth: new Date(athlete.DateOfBirth),
    idNumber: athlete.IdentityNumber,
    gender: normalizeGender(athlete.Gender),
    disability: parseLegacyBool(athlete.Disability),
    status: parseLegacyBool(athlete.Status),
    outOfSchool: parseLegacyBool(athlete.OutOfSchool),
    contactEmail: athlete.Email,
    provinceId: orNull(athlete.ProvinceId),
    schoolId: orNull(athlete.SchoolId),
    groupId: orNull(athlete.GroupId),
  } satisfies Partial<Prisma.AthleteProfileUncheckedCreateInput>;
}

export async function importLegacyAthletes(prisma: PrismaClient) {
  const users = aspNetUsersData as LegacyAspNetUser[];
  const athletes = athletesData as LegacyAthlete[];

  const linkedUsers = users.filter((u) => u.AthleteId && u.AthleteId !== NULL_GUID);
  const linkedAthleteIds = new Set(linkedUsers.map((u) => u.AthleteId));
  const athleteById = new Map(athletes.map((a) => [a.Id, a]));

  // Accounts with a real Azure login: keep their email + existing password
  // hash (verified via the legacy ASP.NET Identity format at login time).
  for (const u of linkedUsers) {
    const athlete = athleteById.get(u.AthleteId);
    if (!athlete) continue;

    await prisma.user.upsert({
      where: { id: u.Id },
      update: {
        email: u.Email,
        passwordHash: u.PasswordHash,
        name: u.FirstName || athlete.FirstName || "Unknown",
        surname: u.Surname || athlete.Surname || "Athlete",
        cellphone: u.PhoneNumber ?? athlete.PhoneNumber,
      },
      create: {
        id: u.Id,
        email: u.Email,
        passwordHash: u.PasswordHash,
        role: "ATHLETE",
        name: u.FirstName || athlete.FirstName || "Unknown",
        surname: u.Surname || athlete.Surname || "Athlete",
        cellphone: u.PhoneNumber ?? athlete.PhoneNumber,
      },
    });

    const fields = athleteProfileFields(athlete);
    await prisma.athleteProfile.upsert({
      where: { id: athlete.Id },
      update: fields,
      create: { id: athlete.Id, userId: u.Id, ...fields },
    });
  }

  // Everyone else never had a website login in the legacy system — create a
  // disabled placeholder account so they exist in the roster (scoreable,
  // manageable by admins) until they self-register/claim their profile.
  // Sharing one precomputed bcrypt hash across all of them is safe: it's not
  // a real credential, just a bcrypt-shaped value nobody can produce the
  // plaintext for (a random UUID that was immediately discarded).
  const shadowAthletes = athletes.filter((a) => !linkedAthleteIds.has(a.Id));
  const placeholderHash = bcrypt.hashSync(crypto.randomUUID(), 10);

  const existing = await prisma.user.findMany({
    where: { id: { in: shadowAthletes.map((a) => a.Id) } },
    select: { id: true },
  });
  const existingIds = new Set(existing.map((u) => u.id));
  const newShadowAthletes = shadowAthletes.filter((a) => !existingIds.has(a.Id));

  await prisma.user.createMany({
    data: newShadowAthletes.map((a) => ({
      id: a.Id,
      email: `athlete-${a.AthleteNumber}@imported.sabiathlon.local`,
      passwordHash: placeholderHash,
      role: "ATHLETE" as const,
      name: a.FirstName || "Unknown",
      surname: a.Surname || "Athlete",
      cellphone: a.PhoneNumber,
    })),
    skipDuplicates: true,
  });

  await prisma.athleteProfile.createMany({
    data: newShadowAthletes.map((a) => ({
      id: a.Id,
      userId: a.Id,
      ...athleteProfileFields(a),
    })),
    skipDuplicates: true,
  });

  // One-time backfill for rows created before contactEmail existed.
  // createMany above only inserts brand-new rows, so anything imported in an
  // earlier deploy needs its contactEmail filled in separately. Guarded by a
  // count check so this is a single cheap query on every later deploy once
  // the backfill has actually run.
  const athletesWithEmail = shadowAthletes.filter((a) => a.Email);
  const idsWithEmail = athletesWithEmail.map((a) => a.Id);
  const pendingBackfill = await prisma.athleteProfile.count({
    where: { id: { in: idsWithEmail }, contactEmail: null },
  });

  if (pendingBackfill > 0) {
    const CHUNK_SIZE = 250;
    for (let i = 0; i < athletesWithEmail.length; i += CHUNK_SIZE) {
      const chunk = athletesWithEmail.slice(i, i + CHUNK_SIZE);
      await Promise.all(
        chunk.map((a) =>
          prisma.athleteProfile.update({
            where: { id: a.Id },
            data: { contactEmail: a.Email },
          }),
        ),
      );
    }
    console.log(`Legacy athlete import: backfilled contactEmail on ${pendingBackfill} rows`);
  }

  console.log(
    `Legacy athlete import: ${linkedUsers.length} real logins kept, ${newShadowAthletes.length} shadow accounts created (${shadowAthletes.length - newShadowAthletes.length} already existed), ${athletes.length} athletes total`,
  );
}
