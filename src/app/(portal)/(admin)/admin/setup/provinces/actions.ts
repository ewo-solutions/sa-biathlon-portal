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

export async function saveProvince(formData: FormData) {
  await requireAdmin();

  const id = formData.get("id") as string | null;
  const name = formData.get("name") as string;
  const abbreviation = (formData.get("abbreviation") as string).toUpperCase();
  const description = formData.get("description") as string;
  const contactName = formData.get("contactName") as string;
  const contactPhone = formData.get("contactPhone") as string;
  const contactEmail = formData.get("contactEmail") as string;
  const ageDate = formData.get("ageDate") as string;

  const data = {
    name,
    abbreviation,
    description: description || null,
    contactName: contactName || null,
    contactPhone: contactPhone || null,
    contactEmail: contactEmail || null,
    ageDate: ageDate ? new Date(ageDate) : null,
  };

  if (id) {
    await prisma.province.update({ where: { id }, data });
  } else {
    await prisma.province.create({ data });
  }

  revalidatePath("/admin/setup/provinces");
}

export async function deleteProvince(id: string) {
  await requireAdmin();
  await prisma.province.delete({ where: { id } });
  revalidatePath("/admin/setup/provinces");
}

// Legacy "Recalculate All Ages" button: re-derives every athlete's group in
// this province from their date of birth, gender and disability, as of the
// province's age date (or today if unset).
export async function recalculateProvinceGroups(id: string) {
  await requireAdmin();

  const province = await prisma.province.findUniqueOrThrow({ where: { id } });
  const athletes = await prisma.athleteProfile.findMany({
    where: { provinceId: id },
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
          asOf: province.ageDate ?? undefined,
        });
        if (groupId !== athlete.groupId) {
          await prisma.athleteProfile.update({ where: { id: athlete.id }, data: { groupId } });
        }
      }),
    );
  }

  revalidatePath("/admin/setup/provinces");
  revalidatePath("/admin/athletes");
}

// Legacy "Reset SA Fees" button: clears the paid tick at season rollover by
// expiring every currently-active membership for this province.
export async function resetProvinceFees(id: string) {
  await requireAdmin();
  await prisma.membership.updateMany({
    where: { provinceId: id, status: "ACTIVE" },
    data: { status: "EXPIRED" },
  });
  revalidatePath("/admin/setup/provinces");
  revalidatePath("/admin/athletes");
}
