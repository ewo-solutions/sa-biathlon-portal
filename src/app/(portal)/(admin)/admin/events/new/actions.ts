"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fileToDataUri } from "@/lib/uploads";

export async function saveEvent(formData: FormData) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Not authorized");
  }

  const eventId = formData.get("eventId") as string | null;
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const location = formData.get("location") as string;
  const swimmingLocation = formData.get("swimmingLocation") as string;
  const registrationInfo = formData.get("registrationInfo") as string;
  const eventDate = new Date(formData.get("eventDate") as string);
  const registrationFee = formData.get("registrationFee") as string;

  const data = {
    name,
    description,
    location: location || null,
    swimmingLocation: swimmingLocation || null,
    registrationInfo: registrationInfo || null,
    eventDate,
    registrationFee: registrationFee ? registrationFee : null,
    createdById: session.user.id,
  };

  let event;
  if (eventId) {
    event = await prisma.event.update({ where: { id: eventId }, data });
  } else {
    event = await prisma.event.create({ data });
  }

  revalidatePath("/admin/events");
  redirect(`/admin/events/new?eventId=${event.id}`);
}

export async function uploadEventPicture(eventId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Not authorized");
  }

  const file = formData.get("profilePicture") as File | null;
  if (!file || file.size === 0) return;

  const dataUri = await fileToDataUri(file);

  await prisma.event.update({
    where: { id: eventId },
    data: { imageUrl: dataUri },
  });

  revalidatePath(`/admin/events/new`);
}
