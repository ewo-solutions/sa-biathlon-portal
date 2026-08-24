import { PrismaClient } from "@prisma/client";

// Runs BEFORE `prisma db push`, against whatever the live schema currently
// is (raw SQL, so it doesn't depend on the not-yet-applied Prisma Client
// types). Needed because this deploy adds a unique constraint on
// AthleteProfile.idNumber — a hard constraint push fails outright if the
// live data already has duplicates, and it does: a handful of legacy rows
// share an ID number under two different AthleteNumbers (genuine duplicate
// registrations in the old system), plus a couple of blank-string values
// that collide with each other as literal "" = "". This normalizes blanks
// to NULL and keeps only the lowest AthleteNumber's idNumber per
// duplicate group (nulling the rest) so the constraint can apply cleanly.
// Idempotent — safe to run on every deploy even once there's nothing left
// to clean.

const prisma = new PrismaClient();

async function main() {
  try {
    const blanked = await prisma.$executeRawUnsafe(
      `UPDATE "AthleteProfile" SET "idNumber" = NULL WHERE "idNumber" = ''`,
    );

    const deduped = await prisma.$executeRawUnsafe(`
      WITH ranked AS (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY "idNumber" ORDER BY "athleteNumber") AS rn
        FROM "AthleteProfile"
        WHERE "idNumber" IS NOT NULL
      )
      UPDATE "AthleteProfile" a
      SET "idNumber" = NULL
      FROM ranked r
      WHERE a.id = r.id AND r.rn > 1
    `);

    if (blanked > 0 || deduped > 0) {
      console.log(
        `Pre-push cleanup: blanked ${blanked} empty idNumber value(s), nulled ${deduped} duplicate idNumber row(s)`,
      );
    }
  } catch (error) {
    // A brand-new database (table doesn't exist yet) has nothing to clean —
    // `prisma db push` will create it correctly from scratch either way.
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("does not exist")) {
      console.log("Pre-push cleanup: skipped (AthleteProfile table not yet created)");
      return;
    }
    throw error;
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
