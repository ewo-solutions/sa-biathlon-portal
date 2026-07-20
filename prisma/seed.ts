import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { importLegacyReferenceData } from "./legacy-import/import";
import { importLegacyAthletes } from "./legacy-import/importAthletes";
import { importLegacyFees } from "./legacy-import/importFees";

const prisma = new PrismaClient();

async function main() {
  await importLegacyReferenceData(prisma);
  await importLegacyAthletes(prisma);
  await importLegacyFees(prisma);

  const passwordHash = await bcrypt.hash("password123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@sabiathlon.co.za" },
    update: {},
    create: {
      email: "admin@sabiathlon.co.za",
      passwordHash,
      role: "ADMIN",
      name: "Federation",
      surname: "Admin",
    },
  });

  const westernCape = await prisma.province.upsert({
    where: { abbreviation: "WC" },
    update: {},
    create: {
      id: "seed-province-wc",
      name: "Western Cape",
      abbreviation: "WC",
    },
  });

  const capeTownClub = await prisma.school.upsert({
    where: { id: "seed-school-1" },
    update: {},
    create: {
      id: "seed-school-1",
      name: "Cape Town Biathlon Club",
      abbreviation: "CTBC",
      provinceId: westernCape.id,
    },
  });

  const u14Boys = await prisma.group.upsert({
    where: { id: "seed-group-1" },
    update: {},
    create: {
      id: "seed-group-1",
      name: "U14 Boys",
      gender: "MALE",
      ageStart: 12,
      ageEnd: 14,
      runningDistanceMeters: 2500,
      runningPointsPerSecond: "0.5",
      swimmingDistanceMeters: 200,
      swimmingPointsPerSecond: "1.2",
      bonusPoints: "10",
    },
  });

  const athlete = await prisma.user.upsert({
    where: { email: "athlete@sabiathlon.co.za" },
    update: {
      name: "Jane",
      surname: "Athlete",
      cellphone: "0821234567",
      province: "Western Cape",
    },
    create: {
      email: "athlete@sabiathlon.co.za",
      passwordHash,
      role: "ATHLETE",
      name: "Jane",
      surname: "Athlete",
      cellphone: "0821234567",
      province: "Western Cape",
    },
  });

  const athleteProfileData = {
    athleteNumber: "WC0001",
    club: "Cape Town Biathlon Club",
    discipline: "Sprint",
    provinceId: westernCape.id,
    schoolId: capeTownClub.id,
    groupId: u14Boys.id,
    dateOfBirth: new Date("2013-05-14"),
  };

  const athleteProfile = await prisma.athleteProfile.upsert({
    where: { userId: athlete.id },
    update: athleteProfileData,
    create: { userId: athlete.id, ...athleteProfileData },
  });

  const event = await prisma.event.upsert({
    where: { id: "seed-event-1" },
    update: {},
    create: {
      id: "seed-event-1",
      name: "Sportmans Warehouse SA Biathlon Champs",
      description:
        "Annual national championship event, open to all registered SA Biathlon members.",
      location: "Bloemfontein",
      eventDate: new Date(new Date().setMonth(new Date().getMonth() + 2)),
      registrationFee: "350.00",
      capacity: 200,
      createdById: admin.id,
    },
  });

  await prisma.membership.upsert({
    where: { id: "seed-membership-1" },
    update: {},
    create: {
      id: "seed-membership-1",
      userId: athlete.id,
      seasonLabel: "SA Biathlon 2024/2025 Season Affiliation",
      feeAmount: "300.00",
      status: "ACTIVE",
      purchasedAt: new Date("2024-02-24"),
      expiresAt: new Date("2025-02-24"),
      provinceId: westernCape.id,
      nationalFeesPaid: true,
    },
  });

  await prisma.result.upsert({
    where: { id: "seed-result-1" },
    update: {},
    create: {
      id: "seed-result-1",
      eventId: event.id,
      athleteProfileId: athleteProfile.id,
      season: 2024,
      position: 4,
      timeSeconds: 3120,
    },
  });

  console.log("Seed complete:");
  console.log("  admin:   admin@sabiathlon.co.za / password123");
  console.log("  athlete: athlete@sabiathlon.co.za / password123");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
