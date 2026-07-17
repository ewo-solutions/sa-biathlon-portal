import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
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

  const athlete = await prisma.user.upsert({
    where: { email: "athlete@sabiathlon.co.za" },
    update: {},
    create: {
      email: "athlete@sabiathlon.co.za",
      passwordHash,
      role: "ATHLETE",
      name: "Jane",
      surname: "Athlete",
      cellphone: "0821234567",
      province: "Western Cape",
      athleteProfile: {
        create: {
          club: "Cape Town Biathlon Club",
          discipline: "Sprint",
        },
      },
    },
    include: { athleteProfile: true },
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
    },
  });

  if (athlete.athleteProfile) {
    await prisma.result.upsert({
      where: { id: "seed-result-1" },
      update: {},
      create: {
        id: "seed-result-1",
        eventId: event.id,
        athleteProfileId: athlete.athleteProfile.id,
        season: 2024,
        position: 4,
        timeSeconds: 3120,
      },
    });
  }

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
