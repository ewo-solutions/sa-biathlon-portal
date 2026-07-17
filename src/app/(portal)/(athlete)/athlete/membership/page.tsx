import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { cancelMembership, renewMembership } from "./actions";

export default async function AthleteMembershipPage() {
  const session = await auth();
  const userId = session!.user.id;

  const membership = await prisma.membership.findFirst({
    where: { userId },
    orderBy: { expiresAt: "desc" },
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-ink-950">Membership</h1>
      <Card title="Current membership">
        {membership ? (
          <div className="space-y-4 text-sm">
            <div>
              <p className="text-ink-500">Current Membership:</p>
              <p className="font-medium text-ink-800">{membership.seasonLabel}</p>
            </div>
            <div>
              <p className="text-ink-500">Yearly Membership:</p>
              <p className="font-medium text-ink-800">R{membership.feeAmount.toString()}/y</p>
            </div>
            <div className="flex gap-8">
              <div>
                <p className="text-ink-500">Purchased:</p>
                <p className="font-medium text-ink-800">
                  {membership.purchasedAt.toLocaleDateString("en-ZA", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
              <div>
                <p className="text-ink-500">Expiration Date:</p>
                <p className="font-medium text-ink-800">
                  {membership.expiresAt.toLocaleDateString("en-ZA", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
            <div className="flex gap-4 pt-2">
              {membership.status !== "CANCELLED" && (
                <form
                  action={async () => {
                    "use server";
                    await cancelMembership(membership.id);
                  }}
                >
                  <button
                    type="submit"
                    className="rounded-xl border border-ink-200 px-6 py-3 text-sm font-medium text-ink-700 transition hover:bg-ink-50"
                  >
                    Cancel membership
                  </button>
                </form>
              )}
              <form
                action={async () => {
                  "use server";
                  await renewMembership(membership.id);
                }}
              >
                <button
                  type="submit"
                  className="rounded-xl bg-brand-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-brand-700"
                >
                  Renew membership
                </button>
              </form>
            </div>
          </div>
        ) : (
          <p className="text-sm text-ink-500">No membership on file yet.</p>
        )}
      </Card>
    </div>
  );
}
