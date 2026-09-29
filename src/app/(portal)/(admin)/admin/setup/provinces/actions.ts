"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

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
