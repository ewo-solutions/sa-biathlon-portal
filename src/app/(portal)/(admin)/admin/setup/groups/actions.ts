"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

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
    runningPointsPerSecond: numOrNull(formData.get("runningPointsPerSecond")),
    swimmingDistanceMeters: numOrNull(formData.get("swimmingDistanceMeters")),
    swimmingPointsPerSecond: numOrNull(formData.get("swimmingPointsPerSecond")),
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
