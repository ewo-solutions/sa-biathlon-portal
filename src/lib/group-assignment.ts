import type { PrismaClient } from "@prisma/client";

export function calculateAge(dateOfBirth: Date, asOf: Date = new Date()): number {
  let age = asOf.getFullYear() - dateOfBirth.getFullYear();
  const hasHadBirthday =
    asOf.getMonth() > dateOfBirth.getMonth() ||
    (asOf.getMonth() === dateOfBirth.getMonth() && asOf.getDate() >= dateOfBirth.getDate());
  if (!hasHadBirthday) age -= 1;
  return age;
}

// Mirrors the legacy Groups form: an athlete's age (as of the province's
// "age date", or today if unset) plus gender/disability decides the group.
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
