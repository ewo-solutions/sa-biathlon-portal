import type { PrismaClient } from "@prisma/client";
import provincesData from "./provinces.json";
import schoolsData from "./schools.json";
import groupsData from "./groups.json";
import seasonsData from "./seasons.json";

type LegacyProvince = {
  Id: string;
  Name: string;
  Description: string | null;
  AddressLine1: string | null;
  AddressLine2: string | null;
  AddressLine3: string | null;
  PostalCode: string | null;
  Abbreviation: string;
};

type LegacySchool = {
  Id: string;
  Name: string;
  Description: string | null;
  AddressLine1: string | null;
  AddressLine2: string | null;
  AddressLine3: string | null;
  PostalCode: string | null;
  Abbreviation: string | null;
  ProvinceId: string;
  Registered: string;
  Type: string | null;
};

type LegacyGroup = {
  Id: string;
  GroupName: string;
  Description: string | null;
  RunningDistance: string | null;
  RunningPoints: string | null;
  RunningPointsPerSecond: string | null;
  RunningTime: string | null;
  SwimmingDistance: string | null;
  SwimmingPoints: string | null;
  SwimmingPointsPenalty50: string | null;
  SwimmingPointsPerSecond: string | null;
  SwimmingTime: string | null;
  Gender: string | null;
  AgeStart: string;
  AgeEnd: string;
  Bonus: string | null;
  Order: string;
  DisabilityGroup: string;
  SwimmingPointsPenalty25: string | null;
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

function parseSqlTimeToSeconds(value: string | null | undefined): number | null {
  if (!value) return null;
  const match = value.match(/T(\d{2}):(\d{2}):(\d{2})/);
  if (!match) return null;
  const [, h, m, s] = match;
  return Number(h) * 3600 + Number(m) * 60 + Number(s);
}

function normalizeGender(value: string | null | undefined): string | null {
  if (value === "M") return "MALE";
  if (value === "F") return "FEMALE";
  return value ?? null;
}

export async function importLegacyReferenceData(prisma: PrismaClient) {
  const provinces = provincesData as LegacyProvince[];
  const schools = schoolsData as LegacySchool[];
  const groups = groupsData as LegacyGroup[];
  const seasons = seasonsData as LegacySeason[];

  for (const p of provinces) {
    await prisma.province.upsert({
      where: { id: p.Id },
      update: {
        name: p.Name,
        abbreviation: p.Abbreviation,
        description: p.Description,
        addressLine1: p.AddressLine1,
        addressLine2: p.AddressLine2,
        addressLine3: p.AddressLine3,
        postalCode: p.PostalCode,
      },
      create: {
        id: p.Id,
        name: p.Name,
        abbreviation: p.Abbreviation,
        description: p.Description,
        addressLine1: p.AddressLine1,
        addressLine2: p.AddressLine2,
        addressLine3: p.AddressLine3,
        postalCode: p.PostalCode,
      },
    });
  }

  for (const s of seasons) {
    await prisma.season.upsert({
      where: { id: s.Id },
      update: {
        label: s.Description,
        startDate: new Date(s.StartDate),
        endDate: new Date(s.EndDate),
      },
      create: {
        id: s.Id,
        label: s.Description,
        startDate: new Date(s.StartDate),
        endDate: new Date(s.EndDate),
      },
    });
  }

  for (const school of schools) {
    await prisma.school.upsert({
      where: { id: school.Id },
      update: {
        name: school.Name,
        abbreviation: school.Abbreviation,
        description: school.Description,
        addressLine1: school.AddressLine1,
        addressLine2: school.AddressLine2,
        addressLine3: school.AddressLine3,
        postalCode: school.PostalCode,
        type: school.Type,
        registered: parseLegacyBool(school.Registered),
        provinceId: school.ProvinceId,
      },
      create: {
        id: school.Id,
        name: school.Name,
        abbreviation: school.Abbreviation,
        description: school.Description,
        addressLine1: school.AddressLine1,
        addressLine2: school.AddressLine2,
        addressLine3: school.AddressLine3,
        postalCode: school.PostalCode,
        type: school.Type,
        registered: parseLegacyBool(school.Registered),
        provinceId: school.ProvinceId,
      },
    });
  }

  for (const g of groups) {
    const data = {
      name: g.GroupName,
      description: g.Description,
      gender: normalizeGender(g.Gender),
      ageStart: Number(g.AgeStart),
      ageEnd: Number(g.AgeEnd),
      disabilityGroup: parseLegacyBool(g.DisabilityGroup),
      order: Number(g.Order),
      runningDistanceMeters: g.RunningDistance ? Number(g.RunningDistance) : null,
      runningGoalTimeSeconds: parseSqlTimeToSeconds(g.RunningTime),
      runningPoints: g.RunningPoints,
      runningPointsPerSecond: g.RunningPointsPerSecond,
      swimmingDistanceMeters: g.SwimmingDistance ? Number(g.SwimmingDistance) : null,
      swimmingGoalTimeSeconds: parseSqlTimeToSeconds(g.SwimmingTime),
      swimmingPoints: g.SwimmingPoints,
      swimmingPointsPerSecond: g.SwimmingPointsPerSecond,
      swimmingPenalty25: g.SwimmingPointsPenalty25,
      swimmingPenalty50: g.SwimmingPointsPenalty50,
      bonusPoints: g.Bonus,
    };

    await prisma.group.upsert({
      where: { id: g.Id },
      update: data,
      create: { id: g.Id, ...data },
    });
  }

  console.log(
    `Legacy import: ${provinces.length} provinces, ${seasons.length} seasons, ${schools.length} schools, ${groups.length} groups`,
  );
}
