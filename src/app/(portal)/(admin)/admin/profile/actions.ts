"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function updateAdminProfile(formData: FormData) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") throw new Error("Not authorized");

  const name = formData.get("name") as string;
  const surname = formData.get("surname") as string;
  const email = formData.get("email") as string;

  await prisma.user.update({
    where: { id: session.user.id },
    data: { name, surname, email },
  });

  revalidatePath("/admin/profile");
}
