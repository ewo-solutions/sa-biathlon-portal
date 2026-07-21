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

export async function saveSchool(formData: FormData) {
  await requireAdmin();

  const id = formData.get("id") as string | null;
  const name = formData.get("name") as string;
  const abbreviation = formData.get("abbreviation") as string;
  const provinceId = formData.get("provinceId") as string;
  const type = formData.get("type") as string;
  const contactName = formData.get("contactName") as string;
  const contactPhone = formData.get("contactPhone") as string;
  const contactEmail = formData.get("contactEmail") as string;

  const data = {
    name,
    abbreviation: abbreviation || null,
    provinceId,
    type: type || null,
    contactName: contactName || null,
    contactPhone: contactPhone || null,
    contactEmail: contactEmail || null,
  };

  if (id) {
    await prisma.school.update({ where: { id }, data });
  } else {
    await prisma.school.create({ data });
  }

  revalidatePath("/admin/setup/schools");
}

export async function deleteSchool(id: string) {
  await requireAdmin();
  await prisma.school.delete({ where: { id } });
  revalidatePath("/admin/setup/schools");
}
