"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parseTimeToSeconds } from "@/lib/time-format";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Not authorized");
  }
}

function numOrNull(value: FormDataEntryValue | null) {
  if (!value || value === "") return null;
  return Number(value);
}

// Goal times are stored as whole seconds (Group.*GoalTimeSeconds is Int) —
// unlike captured competition times, the legacy reference times never carry
// hundredths.
function timeOrNull(value: FormDataEntryValue | null) {
  if (!value || value === "") return null;
  const seconds = parseTimeToSeconds(value.toString());
  return seconds === null ? null : Math.round(seconds);
}

export async function saveGroup(formData: FormData) {
  await requireAdmin();

  const id = formData.get("id") as string | null;
  const name = formData.get("name") as string;
  const gender = formData.get("gender") as string;
  const ageStart = Number(formData.get("ageStart"));
  const ageEnd = Number(formData.get("ageEnd"));
  const disabilityGroup = formData.get("disabilityGroup") === "on";

  const data = {
    name,
    gender: gender || null,
    ageStart,
    ageEnd,
    disabilityGroup,
    runningDistanceMeters: numOrNull(formData.get("runningDistanceMeters")),
    runningGoalTimeSeconds: timeOrNull(formData.get("runningGoalTime")),
    runningPoints: numOrNull(formData.get("runningPoints")),
    runningPointsPerSecond: numOrNull(formData.get("runningPointsPerSecond")),
    swimmingDistanceMeters: numOrNull(formData.get("swimmingDistanceMeters")),
    swimmingGoalTimeSeconds: timeOrNull(formData.get("swimmingGoalTime")),
    swimmingPoints: numOrNull(formData.get("swimmingPoints")),
    swimmingPointsPerSecond: numOrNull(formData.get("swimmingPointsPerSecond")),
    swimmingPenalty25: numOrNull(formData.get("swimmingPenalty25")),
    swimmingPenalty50: numOrNull(formData.get("swimmingPenalty50")),
    bonusPoints: numOrNull(formData.get("bonusPoints")),
  };

  if (id) {
    await prisma.group.update({ where: { id }, data });
  } else {
    await prisma.group.create({ data });
  }

  revalidatePath("/admin/setup/groups");
  redirect("/admin/setup/groups");
}

export async function deleteGroup(id: string) {
  await requireAdmin();
  await prisma.group.delete({ where: { id } });
  revalidatePath("/admin/setup/groups");
}
