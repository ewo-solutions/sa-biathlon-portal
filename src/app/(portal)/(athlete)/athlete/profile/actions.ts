"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fileToDataUri } from "@/lib/uploads";
import { resolveGroupId } from "@/lib/group-assignment";
import { parseSaIdNumber } from "@/lib/sa-id";

export async function updateProfile(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Not authorized");

  const name = formData.get("name") as string;
  const surname = formData.get("surname") as string;
  const cellphone = formData.get("cellphone") as string;
  const email = formData.get("email") as string;
  const contactEmail = (formData.get("contactEmail") as string)?.trim() || null;
  const isSaCitizen = formData.get("isSaCitizen") !== "false";
  const idNumberInput = (formData.get("idNumber") as string)?.trim().replace(/\s/g, "") || null;
  const disability = formData.get("disability") === "on";
  const schoolId = (formData.get("schoolId") as string) || null;
  const addressLine1 = (formData.get("addressLine1") as string) || null;
  const addressLine2 = (formData.get("addressLine2") as string) || null;
  const addressLine3 = (formData.get("addressLine3") as string) || null;
  const postalCode = (formData.get("postalCode") as string) || null;

  await prisma.user.update({
    where: { id: session.user.id },
    data: { name, surname, cellphone, email },
  });

  const existing = await prisma.athleteProfile.findUnique({ where: { userId: session.user.id } });

  let dateOfBirth = existing?.dateOfBirth ?? null;
  let gender = existing?.gender ?? null;
  let idNumber = existing?.idNumber ?? null;

  if (isSaCitizen) {
    if (idNumberInput) {
      const parsed = parseSaIdNumber(idNumberInput);
      if (parsed) {
        dateOfBirth = parsed.dateOfBirth;
        gender = parsed.gender;
        idNumber = idNumberInput;
      }
      // An unparseable ID is silently ignored rather than blocking the rest
      // of the save — the athlete portal has no error-message surface yet.
    }
  } else {
    const dobInput = formData.get("dateOfBirth") as string;
    const genderInput = (formData.get("gender") as string) || null;
    dateOfBirth = dobInput ? new Date(dobInput) : dateOfBirth;
    gender = genderInput ?? gender;
    idNumber = null;
  }

  // Note: province is deliberately NOT accepted from this form — it can
  // only be changed by an administrator.
  const groupId = await resolveGroupId(prisma, { dateOfBirth, gender, disability });

  const profileFields = {
    contactEmail,
    isSaCitizen,
    idNumber,
    dateOfBirth,
    gender,
    disability,
    schoolId,
    groupId,
    addressLine1,
    addressLine2,
    addressLine3,
    postalCode,
  };

  try {
    await prisma.athleteProfile.upsert({
      where: { userId: session.user.id },
      update: profileFields,
      create: { userId: session.user.id, ...profileFields },
    });
  } catch {
    // Most likely idNumber collided with a different athlete's — retry
    // without changing it rather than losing the rest of the edit. (The
    // athlete portal has no error-message surface yet to explain why.)
    await prisma.athleteProfile.upsert({
      where: { userId: session.user.id },
      update: { ...profileFields, idNumber: existing?.idNumber ?? null },
      create: { userId: session.user.id, ...profileFields, idNumber: existing?.idNumber ?? null },
    });
  }

  revalidatePath("/athlete/profile");
}

export async function uploadProfilePicture(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Not authorized");

  const file = formData.get("profilePicture") as File | null;
  if (!file || file.size === 0) return;

  const dataUri = await fileToDataUri(file);

  await prisma.user.update({
    where: { id: session.user.id },
    data: { profileImageUrl: dataUri },
  });

  revalidatePath("/athlete/profile");
}
