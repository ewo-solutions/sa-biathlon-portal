"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { resolveGroupId } from "@/lib/group-assignment";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Not authorized");
  }
}

// Re-derives every athlete's group from their date of birth, gender and
// disability using the current-season formula. This used to be a manual,
// per-province button; the client asked for it to be a global action, run
// automatically whenever a new season is created (and available here to
// re-run manually if needed).
export async function recalculateAllAges() {
  await requireAdmin();

  const athletes = await prisma.athleteProfile.findMany({
    select: { id: true, dateOfBirth: true, gender: true, disability: true, groupId: true },
  });

  const CHUNK_SIZE = 250;
  for (let i = 0; i < athletes.length; i += CHUNK_SIZE) {
    const chunk = athletes.slice(i, i + CHUNK_SIZE);
    await Promise.all(
      chunk.map(async (athlete) => {
        const groupId = await resolveGroupId(prisma, {
          dateOfBirth: athlete.dateOfBirth,
          gender: athlete.gender,
          disability: athlete.disability,
        });
        if (groupId !== athlete.groupId) {
          await prisma.athleteProfile.update({ where: { id: athlete.id }, data: { groupId } });
        }
      }),
    );
  }

  revalidatePath("/admin/setup/seasons");
  revalidatePath("/admin/athletes");
}

// Clears the paid tick at season rollover by expiring every currently-active
// membership/affiliation, system-wide. Also a global action now, run
// automatically on season creation.
export async function resetAllFees() {
  await requireAdmin();
  await prisma.membership.updateMany({
    where: { status: "ACTIVE" },
    data: { status: "EXPIRED" },
  });
  revalidatePath("/admin/setup/seasons");
  revalidatePath("/admin/athletes");
}

export async function createSeason(formData: FormData) {
  await requireAdmin();

  const label = formData.get("label") as string;
  const startDate = formData.get("startDate") as string;
  const endDate = formData.get("endDate") as string;

  if (!label || !startDate || !endDate) {
    throw new Error("Label, start date and end date are required");
  }

  await prisma.season.create({
    data: { label, startDate: new Date(startDate), endDate: new Date(endDate) },
  });

  // A new season starting means: last season's affiliation fees are no
  // longer current (reset), and every athlete's age group needs
  // recalculating against the new season's end year — both automatically,
  // system-wide, per the client's request.
  await resetAllFees();
  await recalculateAllAges();

  revalidatePath("/admin/setup/seasons");
}

export async function deleteSeason(id: string) {
  await requireAdmin();
  await prisma.season.delete({ where: { id } });
  revalidatePath("/admin/setup/seasons");
}
