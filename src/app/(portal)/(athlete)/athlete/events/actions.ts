"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function registerForEvent(eventId: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ATHLETE") {
    throw new Error("Not authorized");
  }

  await prisma.eventRegistration.upsert({
    where: { eventId_userId: { eventId, userId: session.user.id } },
    update: {},
    create: { eventId, userId: session.user.id },
  });

  revalidatePath("/athlete/events");
  revalidatePath("/athlete");
}
