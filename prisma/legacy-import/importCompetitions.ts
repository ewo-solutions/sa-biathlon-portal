import type { PrismaClient } from "@prisma/client";
import competitionsData from "./competitions.json";

type LegacyCompetition = {
  Id: string;
  Name: string;
  RegistrationOpenDate: string | null;
  RegistrationCloseDate: string | null;
  EventDate: string;
  UserId: string | null;
  PoolSize: string | null;
  ResultsApprovedBy: string | null;
  ResultApproved: string;
  CompetitionType: string | null;
  ProvincialId: string | null;
  SeasonId: string | null;
  RunningHeatLanes: string | null;
  SwimmingLanes: string | null;
};

const NULL_GUID = "00000000-0000-0000-0000-000000000000";

function parseLegacyBool(value: string | null | undefined): boolean {
  return value === "True" || value === "true";
}

function orNull(id: string | null | undefined): string | null {
  return id && id !== NULL_GUID ? id : null;
}

export async function importLegacyCompetitions(prisma: PrismaClient) {
  const competitions = competitionsData as LegacyCompetition[];

  const fallbackAdmin = await prisma.user.findFirst({
    where: { role: "ADMIN" },
    orderBy: { createdAt: "asc" },
  });
  if (!fallbackAdmin) {
    console.log("Legacy competition import: skipped — no admin user to attribute competitions to");
    return;
  }

  const legacyUserIds = [...new Set(competitions.map((c) => orNull(c.UserId)).filter(Boolean))];
  const knownUsers = await prisma.user.findMany({
    where: { id: { in: legacyUserIds as string[] } },
    select: { id: true },
  });
  const knownUserIds = new Set(knownUsers.map((u) => u.id));

  let imported = 0;
  for (const c of competitions) {
    const createdById =
      c.UserId && c.UserId !== NULL_GUID && knownUserIds.has(c.UserId)
        ? c.UserId
        : fallbackAdmin.id;

    const data = {
      name: c.Name,
      description: "",
      eventDate: new Date(c.EventDate),
      registrationOpenDate: c.RegistrationOpenDate ? new Date(c.RegistrationOpenDate) : null,
      registrationCloseDate: c.RegistrationCloseDate ? new Date(c.RegistrationCloseDate) : null,
      competitionType: c.CompetitionType,
      poolSize: c.PoolSize ? Number(c.PoolSize) : null,
      runningHeatLanes: c.RunningHeatLanes ? Number(c.RunningHeatLanes) : null,
      swimmingLanes: c.SwimmingLanes ? Number(c.SwimmingLanes) : null,
      resultsApproved: parseLegacyBool(c.ResultApproved),
      resultsApprovedBy: orNull(c.ResultsApprovedBy),
      hostProvinceId: orNull(c.ProvincialId),
      seasonId: orNull(c.SeasonId),
      createdById,
    };

    await prisma.event.upsert({
      where: { id: c.Id },
      update: data,
      create: { id: c.Id, ...data },
    });
    imported += 1;
  }

  console.log(`Legacy competition import: ${imported} competitions imported`);
}
