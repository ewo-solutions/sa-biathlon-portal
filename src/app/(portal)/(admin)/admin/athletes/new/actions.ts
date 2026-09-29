"use server";

import { redirect } from "next/navigation";
import crypto from "crypto";
import { auth } from "@/lib/auth";
import { registerOrClaimAthlete } from "@/lib/athlete-registration";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Not authorized");
  }
}

// Lets an admin register an athlete who's having trouble self-registering —
// same validation and legacy-profile-claiming logic as public sign-up, but
// the admin sets things up on the athlete's behalf with a temporary
// password instead of signing in as them.
export async function adminRegisterAthlete(formData: FormData) {
  await requireAdmin();

  const tempPassword = crypto.randomBytes(6).toString("hex");

  const result = await registerOrClaimAthlete({
    name: formData.get("name") as string,
    surname: formData.get("surname") as string,
    email: formData.get("email") as string,
    password: tempPassword,
    cellphone: (formData.get("cellphone") as string) || null,
    isSaCitizen: formData.get("isSaCitizen") !== "false",
    idNumberInput: ((formData.get("idNumber") as string) || "").replace(/\s/g, "") || null,
    dateOfBirthInput: (formData.get("dateOfBirth") as string) || null,
    genderInput: (formData.get("gender") as string) || null,
    provinceId: formData.get("provinceId") as string,
    schoolId: (formData.get("schoolId") as string) || null,
    disability: formData.get("disability") === "on",
    addressLine1: (formData.get("addressLine1") as string) || null,
    addressLine2: (formData.get("addressLine2") as string) || null,
    addressLine3: (formData.get("addressLine3") as string) || null,
    postalCode: (formData.get("postalCode") as string) || null,
  });

  if ("error" in result) {
    redirect(`/admin/athletes/new?error=${result.error}`);
  }

  redirect(`/admin/athletes/${result.userId}?created=1&tempPassword=${tempPassword}`);
}
