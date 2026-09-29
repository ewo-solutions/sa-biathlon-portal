"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isAffiliated } from "@/lib/affiliation";

export type EventActionState = { status: "idle" | "success" | "error"; message: string };

export async function registerForEvent(
  eventId: string,
  _prevState: EventActionState,
): Promise<EventActionState> {
  const session = await auth();
  if (!session?.user || session.user.role !== "ATHLETE") {
    return { status: "error", message: "Not authorized" };
  }

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) return { status: "error", message: "Event not found" };

  if (event.registrationCloseDate && new Date() > event.registrationCloseDate) {
    return {
      status: "error",
      message: "Entries for this event have closed — please contact your province admin.",
    };
  }

  // National championships require a current, paid (or sponsored) affiliation.
  if (event.competitionType === "3" && !(await isAffiliated(prisma, session.user.id))) {
    return {
      status: "error",
      message:
        "You need a current affiliation to enter a national championship. Please pay your affiliation fees first.",
    };
  }

  await prisma.eventRegistration.upsert({
    where: { eventId_userId: { eventId, userId: session.user.id } },
    update: { status: "REGISTERED" },
    create: { eventId, userId: session.user.id },
  });

  revalidatePath("/athlete/events");
  revalidatePath("/athlete");
  return { status: "success", message: "You're signed up." };
}

export async function withdrawFromEvent(
  eventId: string,
  _prevState: EventActionState,
): Promise<EventActionState> {
  const session = await auth();
  if (!session?.user || session.user.role !== "ATHLETE") {
    return { status: "error", message: "Not authorized" };
  }

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) return { status: "error", message: "Event not found" };

  if (event.registrationCloseDate && new Date() > event.registrationCloseDate) {
    return {
      status: "error",
      message:
        "The withdrawal cutoff for this event has passed — please contact your province admin.",
    };
  }

  await prisma.eventRegistration.updateMany({
    where: { eventId, userId: session.user.id },
    data: { status: "CANCELLED" },
  });

  revalidatePath("/athlete/events");
  revalidatePath("/athlete");
  return {
    status: "success",
    message: "You've withdrawn from this event. Entry fees are not refunded after withdrawal.",
  };
}
