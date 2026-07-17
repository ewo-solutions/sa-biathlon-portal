"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function updateProfile(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Not authorized");

  const name = formData.get("name") as string;
  const surname = formData.get("surname") as string;
  const cellphone = formData.get("cellphone") as string;
  const email = formData.get("email") as string;
  const province = formData.get("province") as string;

  await prisma.user.update({
    where: { id: session.user.id },
    data: { name, surname, cellphone, email, province },
  });

  revalidatePath("/athlete/profile");
}
