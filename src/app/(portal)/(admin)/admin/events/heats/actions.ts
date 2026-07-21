"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const DEFAULT_LANES = 8;

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Not authorized");
  }
}

// Legacy "Calc Lanes" tab: splits entrants for one discipline into heats of
// the competition's lane count, grouped and ordered by age category.
export async function calculateHeats(eventId: string, discipline: "RUNNING" | "SWIMMING") {
  await requireAdmin();

  const event = await prisma.event.findUniqueOrThrow({ where: { id: eventId } });
  const lanes = (discipline === "RUNNING" ? event.runningHeatLanes : event.swimmingLanes) || DEFAULT_LANES;

  const registrations = await prisma.eventRegistration.findMany({
    where: { eventId },
    include: {
      group: true,
      user: { include: { athleteProfile: { include: { group: true } } } },
    },
  });

  type Row = (typeof registrations)[number];
  const groupsById = new Map<string, { order: number; rows: Row[] }>();
  const ungrouped: Row[] = [];

  for (const registration of registrations) {
    const group = registration.group ?? registration.user.athleteProfile?.group ?? null;
    if (!group) {
      ungrouped.push(registration);
      continue;
    }
    const existing = groupsById.get(group.id);
    if (existing) existing.rows.push(registration);
    else groupsById.set(group.id, { order: group.order, rows: [registration] });
  }

  const orderedGroups = [...groupsById.values()].sort((a, b) => a.order - b.order);
  for (const group of orderedGroups) {
    group.rows.sort((a, b) =>
      (a.user.athleteProfile?.athleteNumber ?? "").localeCompare(
        b.user.athleteProfile?.athleteNumber ?? "",
      ),
    );
  }
  if (ungrouped.length > 0) orderedGroups.push({ order: Number.MAX_SAFE_INTEGER, rows: ungrouped });

  const isRunning = discipline === "RUNNING";

  // Clear any previous calculation for this discipline before recomputing.
  const previousHeats = await prisma.heat.findMany({
    where: { eventId, discipline },
    select: { id: true },
  });
  if (previousHeats.length > 0) {
    const heatIds = previousHeats.map((h) => h.id);
    if (isRunning) {
      await prisma.eventRegistration.updateMany({
        where: { eventId, runningHeatId: { in: heatIds } },
        data: { runningHeatId: null, runningLane: null },
      });
    } else {
      await prisma.eventRegistration.updateMany({
        where: { eventId, swimmingHeatId: { in: heatIds } },
        data: { swimmingHeatId: null, swimmingLane: null },
      });
    }
    await prisma.heat.deleteMany({ where: { eventId, discipline } });
  }

  let heatNumber = 1;
  for (const group of orderedGroups) {
    for (let i = 0; i < group.rows.length; i += lanes) {
      const chunk = group.rows.slice(i, i + lanes);
      const groupId = chunk[0].group?.id ?? chunk[0].user.athleteProfile?.group?.id ?? null;
      const heat = await prisma.heat.create({
        data: { eventId, discipline, heatNumber, groupId },
      });
      await Promise.all(
        chunk.map((registration, laneIndex) =>
          prisma.eventRegistration.update({
            where: { id: registration.id },
            data: isRunning
              ? { runningHeatId: heat.id, runningLane: laneIndex + 1 }
              : { swimmingHeatId: heat.id, swimmingLane: laneIndex + 1 },
          }),
        ),
      );
      heatNumber += 1;
    }
  }

  revalidatePath(`/admin/events/heats`);
}
