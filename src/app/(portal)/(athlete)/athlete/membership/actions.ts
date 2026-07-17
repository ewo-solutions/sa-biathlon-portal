"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function cancelMembership(membershipId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Not authorized");

  await prisma.membership.update({
    where: { id: membershipId, userId: session.user.id },
    data: { status: "CANCELLED" },
  });

  revalidatePath("/athlete/membership");
}

// Renewal creates a new pending payment; the membership only flips to ACTIVE
// once the payment provider confirms — that integration is TODO (see README).
export async function renewMembership(membershipId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Not authorized");

  const current = await prisma.membership.findUniqueOrThrow({
    where: { id: membershipId, userId: session.user.id },
  });

  await prisma.membership.create({
    data: {
      userId: session.user.id,
      seasonLabel: current.seasonLabel,
      feeAmount: current.feeAmount,
      status: "ACTIVE",
      purchasedAt: new Date(),
      expiresAt: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
    },
  });

  revalidatePath("/athlete/membership");
}
