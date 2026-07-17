"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fileToDataUri } from "@/lib/uploads";

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
  const province = formData.get("province") as string;

  await prisma.user.update({
    where: { id: athleteId, role: "ATHLETE" },
    data: { name, surname, cellphone, email, province },
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
