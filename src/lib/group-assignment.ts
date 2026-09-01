import type { PrismaClient } from "@prisma/client";
import { getCurrentAgeGroup } from "./current-age-group";

export function calculateAge(dateOfBirth: Date, asOf: Date = new Date()): number {
  let age = asOf.getFullYear() - dateOfBirth.getFullYear();
  const hasHadBirthday =
    asOf.getMonth() > dateOfBirth.getMonth() ||
    (asOf.getMonth() === dateOfBirth.getMonth() && asOf.getDate() >= dateOfBirth.getDate());
  if (!hasHadBirthday) age -= 1;
  return age;
}

// Assigns a group by age/gender/disability. Without an explicit `asOf`
// (e.g. a province's configured age-date override), this defaults to the
// season-based calculation confirmed by the legacy source code — age in
// the year the current season ends — not literal calendar age today.
export async function resolveGroupId(
  prisma: PrismaClient,
  params: {
    dateOfBirth: Date | null;
    gender: string | null;
    disability: boolean;
    asOf?: Date;
  },
): Promise<string | null> {
  if (!params.dateOfBirth) return null;

  if (!params.asOf) {
    const { group } = await getCurrentAgeGroup(prisma, params);
    return group?.id ?? null;
  }

  const age = calculateAge(params.dateOfBirth, params.asOf);

  const group = await prisma.group.findFirst({
    where: {
      ageStart: { lte: age },
      ageEnd: { gte: age },
      disabilityGroup: params.disability,
      OR: [{ gender: null }, { gender: params.gender }],
    },
    orderBy: { order: "asc" },
  });

  return group?.id ?? null;
}
