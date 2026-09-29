import type { PrismaClient, Membership } from "@prisma/client";

// "Affiliated" is the client's term for a paid (or admin-activated,
// sponsored) current-season membership — distinct from simply being a
// registered athlete. Used both for the "Affiliation Fees Outstanding"
// message and to gate entries that require affiliation (e.g. national
// championships).
export async function getCurrentAffiliation(
  prisma: PrismaClient,
  userId: string,
): Promise<Membership | null> {
  return prisma.membership.findFirst({
    where: { userId, status: "ACTIVE", expiresAt: { gte: new Date() } },
    orderBy: { expiresAt: "desc" },
  });
}

export async function isAffiliated(prisma: PrismaClient, userId: string): Promise<boolean> {
  const membership = await getCurrentAffiliation(prisma, userId);
  return membership !== null;
}
