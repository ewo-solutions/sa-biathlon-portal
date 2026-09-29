import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { renewMembership } from "./actions";

export default async function AthleteMembershipPage() {
  const session = await auth();
  const userId = session!.user.id;

  const membership = await prisma.membership.findFirst({
    where: { userId },
    orderBy: { expiresAt: "desc" },
  });

  const isCurrentlyAffiliated =
    membership?.status === "ACTIVE" && membership.expiresAt >= new Date();

  return (
    <div>
      <h1 className="tracked-caps mb-6 text-2xl font-black text-white">Athlete Affiliation</h1>
      <Card title="Current affiliation">
        {!isCurrentlyAffiliated && (
          <p className="tracked-caps mb-4 bg-red-900/40 px-4 py-3 text-sm font-black text-red-200">
            Affiliation Fees Outstanding
          </p>
        )}
        {membership ? (
          <div className="space-y-4 text-sm">
            <div>
              <p className="text-white/80">Season:</p>
              <p className="tracked-caps font-black text-gold">{membership.seasonLabel}</p>
            </div>
            <div>
              <p className="text-white/80">Affiliation fee:</p>
              <p className="tracked-caps font-black text-gold">
                R{membership.feeAmount.toString()}
                {membership.sponsoredOverride ? " (sponsored — no payment required)" : "/y"}
              </p>
            </div>
            <div className="flex flex-wrap gap-6 sm:gap-8">
              <div>
                <p className="text-white/80">Purchased:</p>
                <p className="tracked-caps font-black text-gold">
                  {membership.purchasedAt.toLocaleDateString("en-ZA", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
              <div>
                <p className="text-white/80">Expiration Date:</p>
                <p className="tracked-caps font-black text-gold">
                  {membership.expiresAt.toLocaleDateString("en-ZA", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:gap-4">
              <form
                action={async () => {
                  "use server";
                  await renewMembership(membership.id);
                }}
              >
                <button
                  type="submit"
                  className="tracked-caps w-full bg-gold px-6 py-3 text-sm font-black text-panel-alt transition hover:bg-gold-light sm:w-auto"
                >
                  Pay / renew affiliation
                </button>
              </form>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted">
            No affiliation on file yet — Affiliation Fees Outstanding.
          </p>
        )}
      </Card>
    </div>
  );
}
