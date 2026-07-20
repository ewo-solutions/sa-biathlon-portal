import type { PrismaClient } from "@prisma/client";
import athleteFeesData from "./athletefees.json";
import seasonsData from "./seasons.json";

type LegacyAthleteFee = {
  Id: string;
  SeasonId: string;
  AthleteId: string;
  PaymentDate: string;
  Amount: string;
  ProcessedBy: string | null;
  PaymentGateway: string;
  NationalFeesPayed: string;
  ProvinceId: string | null;
};

type LegacySeason = {
  Id: string;
  Description: string;
  StartDate: string;
  EndDate: string;
};

function parseLegacyBool(value: string | null | undefined): boolean {
  return value === "True" || value === "true";
}

export async function importLegacyFees(prisma: PrismaClient) {
  const fees = athleteFeesData as LegacyAthleteFee[];
  const seasons = new Map((seasonsData as LegacySeason[]).map((s) => [s.Id, s]));

  const athleteIds = [...new Set(fees.map((f) => f.AthleteId))];
  const profiles = await prisma.athleteProfile.findMany({
    where: { id: { in: athleteIds } },
    select: { id: true, userId: true },
  });
  const userIdByAthleteId = new Map(profiles.map((p) => [p.id, p.userId]));

  const now = new Date();
  let imported = 0;
  let skippedNoAthlete = 0;

  for (const fee of fees) {
    const userId = userIdByAthleteId.get(fee.AthleteId);
    const season = seasons.get(fee.SeasonId);
    if (!userId || !season) {
      skippedNoAthlete += 1;
      continue;
    }

    const expiresAt = new Date(season.EndDate);
    const data = {
      userId,
      seasonId: fee.SeasonId,
      seasonLabel: season.Description,
      feeAmount: fee.Amount,
      status: (expiresAt >= now ? "ACTIVE" : "EXPIRED") as "ACTIVE" | "EXPIRED",
      purchasedAt: new Date(fee.PaymentDate),
      expiresAt,
      provinceId: fee.ProvinceId,
      processedBy: fee.ProcessedBy,
      paidViaGateway: parseLegacyBool(fee.PaymentGateway),
      nationalFeesPaid: parseLegacyBool(fee.NationalFeesPayed),
    };

    await prisma.membership.upsert({
      where: { id: fee.Id },
      update: data,
      create: { id: fee.Id, ...data },
    });
    imported += 1;
  }

  console.log(
    `Legacy fee import: ${imported} memberships imported, ${skippedNoAthlete} skipped (no matching athlete/season)`,
  );
}
