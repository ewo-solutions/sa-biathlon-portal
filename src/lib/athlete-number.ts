import type { PrismaClient } from "@prisma/client";

// Province code + persistent per-province sequence (e.g. "WC0007"),
// matching the legacy athlete numbering scheme. Uses an atomic increment on
// Province.nextAthleteSeq rather than counting existing rows, so a number is
// never reused or collided even as athletes move provinces or profiles are
// edited/deleted — the client's requirement is that this number is unique
// and permanent for the athlete's lifetime.
export async function generateAthleteNumber(prisma: PrismaClient, provinceId: string): Promise<string> {
  const province = await prisma.province.update({
    where: { id: provinceId },
    data: { nextAthleteSeq: { increment: 1 } },
    select: { abbreviation: true, nextAthleteSeq: true },
  });
  // nextAthleteSeq now holds the value *after* incrementing, so the number
  // we hand out is one less than that.
  const seq = province.nextAthleteSeq - 1;
  return `${province.abbreviation}${String(seq).padStart(4, "0")}`;
}
