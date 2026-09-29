import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { resolveGroupId } from "@/lib/group-assignment";
import { generateAthleteNumber } from "@/lib/athlete-number";
import { parseSaIdNumber } from "@/lib/sa-id";
import { isShadowEmail } from "@/lib/shadow-account";

export type RegistrationError =
  | "missing"
  | "invalidId"
  | "exists"
  | "idClaimed";

export type RegisterAthleteParams = {
  name: string;
  surname: string;
  email: string;
  password: string;
  cellphone: string | null;
  isSaCitizen: boolean;
  idNumberInput: string | null;
  dateOfBirthInput: string | null;
  genderInput: string | null;
  provinceId: string;
  schoolId: string | null;
  disability: boolean;
  addressLine1: string | null;
  addressLine2: string | null;
  addressLine3: string | null;
  postalCode: string | null;
};

// Shared by both the public self-registration flow and the admin
// "register an athlete on their behalf" flow — same validation, ID-driven
// DOB/gender derivation, and legacy-profile claiming logic either way.
export async function registerOrClaimAthlete(
  params: RegisterAthleteParams,
): Promise<{ error: RegistrationError } | { userId: string }> {
  if (!params.name || !params.surname || !params.email || !params.password || !params.provinceId) {
    return { error: "missing" };
  }

  let dateOfBirth: Date;
  let gender: string | null;
  let idNumber: string | null = null;

  if (params.isSaCitizen) {
    if (!params.idNumberInput) return { error: "missing" };
    const parsedId = parseSaIdNumber(params.idNumberInput);
    if (!parsedId) return { error: "invalidId" };
    dateOfBirth = parsedId.dateOfBirth;
    gender = parsedId.gender;
    idNumber = params.idNumberInput;
  } else {
    if (!params.dateOfBirthInput || !params.genderInput) return { error: "missing" };
    dateOfBirth = new Date(params.dateOfBirthInput);
    gender = params.genderInput;
  }

  const existingEmail = await prisma.user.findUnique({ where: { email: params.email } });
  if (existingEmail) return { error: "exists" };

  const groupId = await resolveGroupId(prisma, {
    dateOfBirth,
    gender,
    disability: params.disability,
  });

  const passwordHash = await bcrypt.hash(params.password, 10);

  const profileFields = {
    dateOfBirth,
    gender,
    disability: params.disability,
    isSaCitizen: params.isSaCitizen,
    provinceId: params.provinceId,
    schoolId: params.schoolId || null,
    groupId,
    addressLine1: params.addressLine1,
    addressLine2: params.addressLine2,
    addressLine3: params.addressLine3,
    postalCode: params.postalCode,
  };

  const existingProfile = idNumber
    ? await prisma.athleteProfile.findUnique({ where: { idNumber }, include: { user: true } })
    : null;

  if (existingProfile) {
    if (!isShadowEmail(existingProfile.user.email)) {
      return { error: "idClaimed" };
    }

    await prisma.user.update({
      where: { id: existingProfile.userId },
      data: {
        name: params.name,
        surname: params.surname,
        email: params.email,
        passwordHash,
        cellphone: params.cellphone || null,
      },
    });
    await prisma.athleteProfile.update({
      where: { id: existingProfile.id },
      data: profileFields,
    });
    return { userId: existingProfile.userId };
  }

  const athleteNumber = await generateAthleteNumber(prisma, params.provinceId);

  const user = await prisma.user.create({
    data: {
      name: params.name,
      surname: params.surname,
      email: params.email,
      passwordHash,
      role: "ATHLETE",
      cellphone: params.cellphone || null,
      athleteProfile: {
        create: { athleteNumber, idNumber, ...profileFields },
      },
    },
  });
  return { userId: user.id };
}
