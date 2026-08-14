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

export async function saveSponsor(formData: FormData) {
  await requireAdmin();

  const id = formData.get("id") as string | null;
  const name = formData.get("name") as string;
  const websiteUrl = formData.get("websiteUrl") as string;
  const logoUrl = formData.get("logoUrl") as string;

  const data = {
    name,
    websiteUrl: websiteUrl || null,
    logoUrl: logoUrl || null,
  };

  if (id) {
    await prisma.sponsor.update({ where: { id }, data });
  } else {
    await prisma.sponsor.create({ data });
  }

  revalidatePath("/admin/setup/sponsors");
}

export async function deleteSponsor(id: string) {
  await requireAdmin();
  await prisma.sponsor.delete({ where: { id } });
  revalidatePath("/admin/setup/sponsors");
}
