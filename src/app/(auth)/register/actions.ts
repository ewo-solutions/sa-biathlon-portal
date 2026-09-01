"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { resolveGroupId } from "@/lib/group-assignment";
import { generateAthleteNumber } from "@/lib/athlete-number";
import { parseSaIdNumber } from "@/lib/sa-id";
import { isShadowEmail } from "@/lib/shadow-account";

export async function registerAthlete(formData: FormData) {
  const name = formData.get("name") as string;
  const surname = formData.get("surname") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const cellphone = formData.get("cellphone") as string;
  const isSaCitizen = formData.get("isSaCitizen") !== "false";
  const idNumberInput = (formData.get("idNumber") as string)?.replace(/\s/g, "");
  const provinceId = formData.get("provinceId") as string;
  const schoolId = formData.get("schoolId") as string;
  const disability = formData.get("disability") === "on";
  const addressLine1 = (formData.get("addressLine1") as string) || null;
  const addressLine2 = (formData.get("addressLine2") as string) || null;
  const addressLine3 = (formData.get("addressLine3") as string) || null;
  const postalCode = (formData.get("postalCode") as string) || null;

  if (!name || !surname || !email || !password || !provinceId) {
    redirect("/register?error=missing");
  }

  let dateOfBirth: Date;
  let gender: string | null;
  let idNumber: string | null = null;

  if (isSaCitizen) {
    // ID-number-driven profile: date of birth and gender are derived from
    // the SA ID number itself, not entered separately, so they can't drift
    // from it. It's also the key used to match against an existing (e.g.
    // imported) profile below.
    if (!idNumberInput) {
      redirect("/register?error=missing");
    }
    const parsedId = parseSaIdNumber(idNumberInput);
    if (!parsedId) {
      redirect("/register?error=invalidId");
    }
    dateOfBirth = parsedId.dateOfBirth;
    gender = parsedId.gender;
    idNumber = idNumberInput;
  } else {
    // Non-SA citizens don't have an SA ID — DOB and gender are entered
    // manually, and there's no ID number to match/claim against.
    const dobInput = formData.get("dateOfBirth") as string;
    const genderInput = formData.get("gender") as string;
    if (!dobInput || !genderInput) {
      redirect("/register?error=missing");
    }
    dateOfBirth = new Date(dobInput);
    gender = genderInput;
  }

  const existingEmail = await prisma.user.findUnique({ where: { email } });
  if (existingEmail) {
    redirect("/register?error=exists");
  }

  const province = await prisma.province.findUnique({ where: { id: provinceId } });
  const groupId = await resolveGroupId(prisma, {
    dateOfBirth,
    gender,
    disability,
    asOf: province?.ageDate ?? undefined,
  });

  const passwordHash = await bcrypt.hash(password, 10);

  const profileFields = {
    dateOfBirth,
    gender,
    disability,
    isSaCitizen,
    provinceId,
    schoolId: schoolId || null,
    groupId,
    addressLine1,
    addressLine2,
    addressLine3,
    postalCode,
  };

  // Does this ID number already exist — e.g. an athlete imported from the
  // legacy system who never had a website login? If so, claim that profile
  // (keep its lifetime SA Biathlon number and history) instead of creating
  // a duplicate. Non-SA registrations (no idNumber) always create fresh.
  const existingProfile = idNumber
    ? await prisma.athleteProfile.findUnique({ where: { idNumber }, include: { user: true } })
    : null;

  if (existingProfile) {
    if (!isShadowEmail(existingProfile.user.email)) {
      // Already claimed by a real login — send them to log in instead.
      redirect("/register?error=idClaimed");
    }

    await prisma.user.update({
      where: { id: existingProfile.userId },
      data: {
        name,
        surname,
        email,
        passwordHash,
        cellphone: cellphone || null,
      },
    });
    await prisma.athleteProfile.update({
      where: { id: existingProfile.id },
      data: profileFields,
      // athleteNumber and idNumber are untouched — this is the whole point
      // of claiming rather than creating a new profile.
    });
  } else {
    const athleteNumber = await generateAthleteNumber(prisma, provinceId);

    await prisma.user.create({
      data: {
        name,
        surname,
        email,
        passwordHash,
        role: "ATHLETE",
        cellphone: cellphone || null,
        athleteProfile: {
          create: { athleteNumber, idNumber, ...profileFields },
        },
      },
    });
  }

  try {
    await signIn("credentials", { email, password, redirectTo: "/athlete" });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect("/login");
    }
    throw error;
  }
}
