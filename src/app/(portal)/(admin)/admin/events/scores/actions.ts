"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { HeatDiscipline } from "@prisma/client";
import { calculateBonusPoints, calculateRunningPoints, calculateSwimmingPoints } from "@/lib/scoring";
import { parseTimeToSeconds } from "@/lib/time-format";

export type ScoreEntryState = {
  status: "idle" | "success" | "error";
  message: string;
};

export type AthleteSearchResult = { athleteNumber: string; name: string };

export async function searchAthletes(query: string): Promise<AthleteSearchResult[]> {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") return [];

  const trimmed = query.trim();
  if (!trimmed) return [];

  const athletes = await prisma.athleteProfile.findMany({
    where: {
      athleteNumber: { not: null },
      OR: [
        { athleteNumber: { contains: trimmed, mode: "insensitive" } },
        { user: { name: { contains: trimmed, mode: "insensitive" } } },
        { user: { surname: { contains: trimmed, mode: "insensitive" } } },
      ],
    },
    select: { athleteNumber: true, user: { select: { name: true, surname: true } } },
    orderBy: { athleteNumber: "asc" },
    take: 8,
  });

  return athletes.map((a) => ({
    athleteNumber: a.athleteNumber as string,
    name: `${a.user.name} ${a.user.surname}`,
  }));
}

export async function recordTime(
  eventId: string,
  discipline: HeatDiscipline,
  _prevState: ScoreEntryState,
  formData: FormData,
): Promise<ScoreEntryState> {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return { status: "error", message: "Not authorized" };
  }

  const athleteNumber = (formData.get("athleteNumber") as string)?.trim();
  const timeInput = formData.get("time") as string;
  const dnf = formData.get("dnf") === "on";
  const falseStart = formData.get("falseStart") === "on";

  if (!athleteNumber) {
    return { status: "error", message: "Enter an athlete number" };
  }

  const [athleteProfile, event] = await Promise.all([
    prisma.athleteProfile.findUnique({ where: { athleteNumber } }),
    prisma.event.findUnique({ where: { id: eventId }, include: { season: true } }),
  ]);

  if (!athleteProfile) {
    return { status: "error", message: `No athlete found with number "${athleteNumber}"` };
  }
  if (!event) {
    return { status: "error", message: "Event not found" };
  }

  const timeSeconds = dnf ? null : parseTimeToSeconds(timeInput);
  if (!dnf && timeInput && timeSeconds === null) {
    return { status: "error", message: `Could not read time "${timeInput}" — use mm:ss.ss` };
  }

  const isRunning = discipline === "RUNNING";

  // A per-competition group override (set on the registration itself) beats
  // the athlete's default group, matching the legacy Athletes Detail tab.
  const existing = await prisma.eventRegistration.findUnique({
    where: { eventId_userId: { eventId, userId: athleteProfile.userId } },
    select: { groupId: true },
  });
  const effectiveGroupId = existing?.groupId ?? athleteProfile.groupId;
  const group = effectiveGroupId ? await prisma.group.findUnique({ where: { id: effectiveGroupId } }) : null;

  let points: number | null = null;
  let bonusPoints: number | null = null;
  if (group) {
    points = isRunning
      ? calculateRunningPoints(group, timeSeconds, dnf)
      : calculateSwimmingPoints(group, timeSeconds, dnf, event.poolSize, falseStart);
    bonusPoints = calculateBonusPoints(group, athleteProfile.dateOfBirth, event.season?.endDate ?? null);
  }

  await prisma.eventRegistration.upsert({
    where: { eventId_userId: { eventId, userId: athleteProfile.userId } },
    update: isRunning
      ? {
          runningTimeSeconds: timeSeconds,
          runningDnf: dnf,
          runningFalseStart: falseStart,
          runningPoints: points,
          runningBonusPoints: bonusPoints,
        }
      : {
          swimmingTimeSeconds: timeSeconds,
          swimmingDnf: dnf,
          swimmingFalseStart: falseStart,
          swimmingPoints: points,
          swimmingBonusPoints: bonusPoints,
        },
    create: {
      eventId,
      userId: athleteProfile.userId,
      status: "ATTENDED",
      ...(isRunning
        ? {
            runningTimeSeconds: timeSeconds,
            runningDnf: dnf,
            runningFalseStart: falseStart,
            runningPoints: points,
            runningBonusPoints: bonusPoints,
          }
        : {
            swimmingTimeSeconds: timeSeconds,
            swimmingDnf: dnf,
            swimmingFalseStart: falseStart,
            swimmingPoints: points,
            swimmingBonusPoints: bonusPoints,
          }),
    },
  });

  revalidatePath("/admin/events/scores");
  revalidatePath("/admin/events/report");

  const pointsNote = group
    ? points === null
      ? " (group scoring not fully configured — no points calculated)"
      : ` — ${points.toFixed(1)} points`
    : " (no group assigned — no points calculated)";

  return {
    status: "success",
    message: `${athleteProfile.athleteNumber} — ${dnf ? "DNF" : timeInput} recorded${pointsNote}`,
  };
}

// Toggles "Did Not Start" — registered for the competition but never
// started either discipline, distinct from a per-discipline DNF. Excludes
// the entry from ranking entirely (legacy CompetitionAthletes.Dns).
export async function toggleDns(eventId: string, registrationId: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Not authorized");
  }

  const registration = await prisma.eventRegistration.findUniqueOrThrow({
    where: { id: registrationId },
  });

  await prisma.eventRegistration.update({
    where: { id: registrationId },
    data: { dns: !registration.dns },
  });

  revalidatePath("/admin/events/scores");
  revalidatePath("/admin/events/report");
}
