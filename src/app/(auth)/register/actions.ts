"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { resolveGroupId } from "@/lib/group-assignment";

// Province code + running sequence, matching the legacy athlete numbering
// scheme (e.g. "WC0007").
async function generateAthleteNumber(provinceId: string): Promise<string> {
  const province = await prisma.province.findUniqueOrThrow({ where: { id: provinceId } });
  const count = await prisma.athleteProfile.count({ where: { provinceId } });
  return `${province.abbreviation}${String(count + 1).padStart(4, "0")}`;
}

export async function registerAthlete(formData: FormData) {
  const name = formData.get("name") as string;
  const surname = formData.get("surname") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const cellphone = formData.get("cellphone") as string;
  const dateOfBirthInput = formData.get("dateOfBirth") as string;
  const idNumber = formData.get("idNumber") as string;
  const gender = formData.get("gender") as string;
  const provinceId = formData.get("provinceId") as string;
  const schoolId = formData.get("schoolId") as string;
  const disability = formData.get("disability") === "on";

  if (!name || !surname || !email || !password || !dateOfBirthInput || !provinceId) {
    redirect("/register?error=missing");
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    redirect("/register?error=exists");
  }

  const dateOfBirth = new Date(dateOfBirthInput);
  const province = await prisma.province.findUnique({ where: { id: provinceId } });
  const groupId = await resolveGroupId(prisma, {
    dateOfBirth,
    gender: gender || null,
    disability,
    asOf: province?.ageDate ?? undefined,
  });

  const athleteNumber = await generateAthleteNumber(provinceId);
  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      name,
      surname,
      email,
      passwordHash,
      role: "ATHLETE",
      cellphone: cellphone || null,
      athleteProfile: {
        create: {
          athleteNumber,
          dateOfBirth,
          idNumber: idNumber || null,
          gender: gender || null,
          disability,
          provinceId,
          schoolId: schoolId || null,
          groupId,
        },
      },
    },
  });

  try {
    await signIn("credentials", { email, password, redirectTo: "/athlete" });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect("/login");
    }
    throw error;
  }
}
