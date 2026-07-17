"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function saveEvent(formData: FormData) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Not authorized");
  }

  const eventId = formData.get("eventId") as string | null;
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const location = formData.get("location") as string;
  const eventDate = new Date(formData.get("eventDate") as string);
  const registrationFee = formData.get("registrationFee") as string;
  const capacity = formData.get("capacity") as string;

  const data = {
    name,
    description,
    location: location || null,
    eventDate,
    registrationFee: registrationFee ? registrationFee : null,
    capacity: capacity ? Number(capacity) : null,
    createdById: session.user.id,
  };

  if (eventId) {
    await prisma.event.update({ where: { id: eventId }, data });
  } else {
    await prisma.event.create({ data });
  }

  revalidatePath("/admin/events");
  redirect("/admin/events");
}
