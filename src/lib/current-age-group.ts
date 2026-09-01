import type { PrismaClient, Group, Season } from "@prisma/client";
import { seasonAge } from "./scoring";
import { getCurrentSeason } from "./season";

export type CurrentAgeGroup = {
  season: Season | null;
  group: Group | null;
  age: number | null;
};

// The athlete's age category for the season currently in progress — the
// same "age in the year the season ends" formula the confirmed legacy
// PointsCalculationService uses for bonus points, applied here to group
// membership too. This is what changes an athlete's displayed age group
// each season without touching their stored DOB/gender.
export async function getCurrentAgeGroup(
  prisma: PrismaClient,
  params: { dateOfBirth: Date | null; gender: string | null; disability: boolean },
): Promise<CurrentAgeGroup> {
  const season = await getCurrentSeason(prisma);
  if (!season || !params.dateOfBirth) {
    return { season, group: null, age: null };
  }

  const age = seasonAge(params.dateOfBirth, season.endDate);
  const group = await prisma.group.findFirst({
    where: {
      ageStart: { lte: age },
      ageEnd: { gte: age },
      disabilityGroup: params.disability,
      OR: [{ gender: null }, { gender: params.gender }],
    },
    orderBy: { order: "asc" },
  });

  return { season, group, age };
}
