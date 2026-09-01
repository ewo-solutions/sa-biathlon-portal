"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fileToDataUri } from "@/lib/uploads";
import { resolveGroupId } from "@/lib/group-assignment";
import { parseSaIdNumber } from "@/lib/sa-id";

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
  const isSaCitizen = formData.get("isSaCitizen") !== "false";
  const idNumberInput = (formData.get("idNumber") as string)?.trim().replace(/\s/g, "");
  const disability = formData.get("disability") === "on";
  const addressLine1 = (formData.get("addressLine1") as string) || null;
  const addressLine2 = (formData.get("addressLine2") as string) || null;
  const addressLine3 = (formData.get("addressLine3") as string) || null;
  const postalCode = (formData.get("postalCode") as string) || null;

  let dateOfBirth: Date | null = null;
  let gender: string | null = null;
  let idNumber: string | null = null;

  if (isSaCitizen) {
    idNumber = idNumberInput || null;
    // ID number drives date of birth/gender when it parses; otherwise fall
    // back to whatever manual fields were also submitted.
    const parsedId = idNumber ? parseSaIdNumber(idNumber) : null;
    const dateOfBirthInput = formData.get("dateOfBirth") as string;
    const manualGender = (formData.get("gender") as string) || null;
    dateOfBirth = parsedId?.dateOfBirth ?? (dateOfBirthInput ? new Date(dateOfBirthInput) : null);
    gender = parsedId?.gender ?? manualGender;
  } else {
    const dateOfBirthInput = formData.get("dateOfBirth") as string;
    gender = (formData.get("gender") as string) || null;
    dateOfBirth = dateOfBirthInput ? new Date(dateOfBirthInput) : null;
    idNumber = null;
  }

  if (idNumber) {
    const conflict = await prisma.athleteProfile.findUnique({
      where: { idNumber },
      select: { userId: true },
    });
    if (conflict && conflict.userId !== athleteId) {
      throw new Error(`ID number ${idNumber} is already linked to a different athlete profile.`);
    }
  }

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
    isSaCitizen,
    idNumber,
    provinceId,
    schoolId,
    dateOfBirth,
    gender,
    disability,
    groupId,
    addressLine1,
    addressLine2,
    addressLine3,
    postalCode,
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
