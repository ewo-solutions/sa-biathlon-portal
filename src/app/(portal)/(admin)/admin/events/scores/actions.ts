"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { HeatDiscipline } from "@prisma/client";

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

// Accepts "ss", "mm:ss", or "h:mm:ss" (fractional seconds allowed) and
// returns whole seconds. Matches the legacy "Enter Run/Swim Times" forms,
// which took a single time text box per athlete.
function parseTimeToSeconds(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const parts = trimmed.split(":").map((part) => Number(part));
  if (parts.some((part) => Number.isNaN(part))) return null;

  let seconds = 0;
  for (const part of parts) {
    seconds = seconds * 60 + part;
  }
  return Math.round(seconds);
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

  const athleteProfile = await prisma.athleteProfile.findUnique({
    where: { athleteNumber },
  });

  if (!athleteProfile) {
    return { status: "error", message: `No athlete found with number "${athleteNumber}"` };
  }

  const timeSeconds = dnf ? null : parseTimeToSeconds(timeInput);
  if (!dnf && timeInput && timeSeconds === null) {
    return { status: "error", message: `Could not read time "${timeInput}" — use mm:ss` };
  }

  const isRunning = discipline === "RUNNING";

  await prisma.eventRegistration.upsert({
    where: { eventId_userId: { eventId, userId: athleteProfile.userId } },
    update: isRunning
      ? { runningTimeSeconds: timeSeconds, runningDnf: dnf, runningFalseStart: falseStart }
      : { swimmingTimeSeconds: timeSeconds, swimmingDnf: dnf, swimmingFalseStart: falseStart },
    create: {
      eventId,
      userId: athleteProfile.userId,
      status: "ATTENDED",
      ...(isRunning
        ? { runningTimeSeconds: timeSeconds, runningDnf: dnf, runningFalseStart: falseStart }
        : { swimmingTimeSeconds: timeSeconds, swimmingDnf: dnf, swimmingFalseStart: falseStart }),
    },
  });

  revalidatePath("/admin/events/scores");

  return {
    status: "success",
    message: `${athleteProfile.athleteNumber} — ${dnf ? "DNF" : timeInput} recorded`,
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
