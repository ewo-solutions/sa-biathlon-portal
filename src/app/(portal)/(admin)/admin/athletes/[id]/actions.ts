"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fileToDataUri } from "@/lib/uploads";
import { resolveGroupId } from "@/lib/group-assignment";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Not authorized");
  }
}

export async function updateAthlete(athleteId: string, formData: FormData) {
  await requireAdmin();

  const name = formData.get("name") as string;
  const surname = formData.get("surname") as string;
  const cellphone = formData.get("cellphone") as string;
  const email = formData.get("email") as string;
  const athleteNumber = (formData.get("athleteNumber") as string)?.trim();
  const contactEmail = (formData.get("contactEmail") as string)?.trim();
  const provinceId = (formData.get("provinceId") as string) || null;
  const schoolId = (formData.get("schoolId") as string) || null;
  const dateOfBirthInput = formData.get("dateOfBirth") as string;
  const gender = (formData.get("gender") as string) || null;
  const disability = formData.get("disability") === "on";

  const dateOfBirth = dateOfBirthInput ? new Date(dateOfBirthInput) : null;
  const province = provinceId ? await prisma.province.findUnique({ where: { id: provinceId } }) : null;
  const groupId = await resolveGroupId(prisma, {
    dateOfBirth,
    gender,
    disability,
    asOf: province?.ageDate ?? undefined,
  });

  const profileFields = {
    athleteNumber: athleteNumber || null,
    contactEmail: contactEmail || null,
    provinceId,
    schoolId,
    dateOfBirth,
    gender,
    disability,
    groupId,
  };

  await prisma.user.update({
    where: { id: athleteId, role: "ATHLETE" },
    data: {
      name,
      surname,
      cellphone,
      email,
      athleteProfile: {
        upsert: { update: profileFields, create: profileFields },
      },
    },
  });

  revalidatePath(`/admin/athletes/${athleteId}`);
}

export async function uploadAthletePicture(athleteId: string, formData: FormData) {
  await requireAdmin();

  const file = formData.get("profilePicture") as File | null;
  if (!file || file.size === 0) return;

  const dataUri = await fileToDataUri(file);

  await prisma.user.update({
    where: { id: athleteId, role: "ATHLETE" },
    data: { profileImageUrl: dataUri },
  });

  revalidatePath(`/admin/athletes/${athleteId}`);
}
