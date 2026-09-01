import type { PrismaClient, Season } from "@prisma/client";

// The season currently in progress (startDate <= now <= endDate). Falls
// back to the most recently ended season if none is active right now (a
// gap between seasons), and finally to the earliest upcoming season if
// there's no past season either.
export async function getCurrentSeason(prisma: PrismaClient): Promise<Season | null> {
  const now = new Date();

  const active = await prisma.season.findFirst({
    where: { startDate: { lte: now }, endDate: { gte: now } },
    orderBy: { endDate: "desc" },
  });
  if (active) return active;

  const mostRecent = await prisma.season.findFirst({
    where: { endDate: { lt: now } },
    orderBy: { endDate: "desc" },
  });
  if (mostRecent) return mostRecent;

  return prisma.season.findFirst({ orderBy: { endDate: "asc" } });
}
