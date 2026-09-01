import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isShadowEmail } from "@/lib/shadow-account";

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function displayEmail(contactEmail: string | null | undefined, loginEmail: string) {
  if (contactEmail) return contactEmail;
  if (isShadowEmail(loginEmail)) return "";
  return loginEmail;
}

// Full CSV export of the (optionally filtered) athlete roster — opens
// straight in Excel. Not paginated: streams every matching row, not just
// the current page.
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return new NextResponse("Not authorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? undefined;
  const sort = searchParams.get("sort");

  const where = q
    ? {
        role: "ATHLETE" as const,
        OR: [
          { name: { contains: q, mode: "insensitive" as const } },
          { surname: { contains: q, mode: "insensitive" as const } },
          { email: { contains: q, mode: "insensitive" as const } },
          { athleteProfile: { athleteNumber: { contains: q, mode: "insensitive" as const } } },
        ],
      }
    : { role: "ATHLETE" as const };

  const orderBy =
    sort === "province"
      ? { athleteProfile: { province: { name: "asc" as const } } }
      : sort === "school"
        ? { athleteProfile: { school: { name: "asc" as const } } }
        : { surname: "asc" as const };

  const athletes = await prisma.user.findMany({
    where,
    orderBy,
    include: {
      memberships: {
        where: { status: "ACTIVE", expiresAt: { gte: new Date() } },
        take: 1,
        orderBy: { expiresAt: "desc" },
      },
      athleteProfile: { include: { province: true, school: true, group: true } },
    },
  });

  const header = [
    "SA No",
    "Name",
    "Surname",
    "Email",
    "Province",
    "School/Club",
    "Group",
    "Date of Birth",
    "Gender",
    "Membership Status",
  ];

  const rows = athletes.map((a) =>
    [
      a.athleteProfile?.athleteNumber ?? "",
      a.name,
      a.surname,
      displayEmail(a.athleteProfile?.contactEmail, a.email),
      a.athleteProfile?.province?.name ?? "",
      a.athleteProfile?.school?.name ?? "",
      a.athleteProfile?.group?.name ?? "",
      a.athleteProfile?.dateOfBirth ? a.athleteProfile.dateOfBirth.toISOString().slice(0, 10) : "",
      a.athleteProfile?.gender ?? "",
      a.memberships[0] ? a.memberships[0].seasonLabel : "No active membership",
    ]
      .map((v) => csvEscape(String(v)))
      .join(","),
  );

  const csv = [header.join(","), ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="athletes-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
