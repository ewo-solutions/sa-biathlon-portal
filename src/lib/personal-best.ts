import type { PrismaClient } from "@prisma/client";

// The client's "PB" is a SEASONAL best, not a lifetime one: it resets every
// season, an athlete's first valid result of a new season is automatically
// their PB, and it must be recalculated after every result entry — if a
// later competition in the same season scores higher, that one becomes the
// new PB. A DNF in either discipline makes the whole result invalid and it
// is excluded from PB consideration (same rule used for total points/DNF).
export async function recalculateSeasonBests(
  prisma: PrismaClient,
  athleteProfileId: string,
  seasonId: string,
): Promise<void> {
  const profile = await prisma.athleteProfile.findUnique({
    where: { id: athleteProfileId },
    select: { userId: true },
  });
  if (!profile) return;

  const registrations = await prisma.eventRegistration.findMany({
    where: {
      userId: profile.userId,
      dns: false,
      event: { seasonId },
    },
    select: {
      id: true,
      eventId: true,
      runningDnf: true,
      swimmingDnf: true,
      runningPoints: true,
      runningBonusPoints: true,
      swimmingPoints: true,
      swimmingBonusPoints: true,
    },
  });

  let bestTotal: { id: string; eventId: string; value: number } | null = null;
  let bestRunning: { eventId: string; value: number } | null = null;
  let bestSwimming: { eventId: string; value: number } | null = null;

  for (const r of registrations) {
    if (!r.runningDnf) {
      const runningValue = Number(r.runningPoints ?? 0) + Number(r.runningBonusPoints ?? 0);
      if (r.runningPoints !== null && (!bestRunning || runningValue > bestRunning.value)) {
        bestRunning = { eventId: r.eventId, value: runningValue };
      }
    }
    if (!r.swimmingDnf) {
      const swimmingValue = Number(r.swimmingPoints ?? 0) + Number(r.swimmingBonusPoints ?? 0);
      if (r.swimmingPoints !== null && (!bestSwimming || swimmingValue > bestSwimming.value)) {
        bestSwimming = { eventId: r.eventId, value: swimmingValue };
      }
    }
    // A DNF in either discipline invalidates the total for PB purposes.
    if (r.runningDnf || r.swimmingDnf) continue;
    if (r.runningPoints === null || r.swimmingPoints === null) continue;
    const total =
      Number(r.runningPoints ?? 0) +
      Number(r.runningBonusPoints ?? 0) +
      Number(r.swimmingPoints ?? 0) +
      Number(r.swimmingBonusPoints ?? 0);
    if (!bestTotal || total > bestTotal.value) {
      bestTotal = { id: r.id, eventId: r.eventId, value: total };
    }
  }

  await prisma.$transaction([
    prisma.athleteSeason.upsert({
      where: { athleteProfileId_seasonId: { athleteProfileId, seasonId } },
      update: {
        seasonBestRunning: bestRunning?.value ?? null,
        seasonBestRunningEventId: bestRunning?.eventId ?? null,
        seasonBestSwimming: bestSwimming?.value ?? null,
        seasonBestSwimmingEventId: bestSwimming?.eventId ?? null,
        seasonBestTotal: bestTotal?.value ?? null,
        seasonBestTotalEventId: bestTotal?.eventId ?? null,
      },
      create: {
        athleteProfileId,
        seasonId,
        seasonBestRunning: bestRunning?.value ?? null,
        seasonBestRunningEventId: bestRunning?.eventId ?? null,
        seasonBestSwimming: bestSwimming?.value ?? null,
        seasonBestSwimmingEventId: bestSwimming?.eventId ?? null,
        seasonBestTotal: bestTotal?.value ?? null,
        seasonBestTotalEventId: bestTotal?.eventId ?? null,
      },
    }),
    // Only the single best-total row for the season is flagged as the PB;
    // every other registration this athlete has in the season is cleared.
    prisma.eventRegistration.updateMany({
      where: { userId: profile.userId, event: { seasonId } },
      data: { personalBest: false, seasonalBest: false },
    }),
    ...(bestTotal
      ? [
          prisma.eventRegistration.update({
            where: { id: bestTotal.id },
            data: { personalBest: true, seasonalBest: true },
          }),
        ]
      : []),
  ]);
}
