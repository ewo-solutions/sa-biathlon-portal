// South African ID number: YYMMDD SSSS C A Z (13 digits).
// - YYMMDD (positions 1-6): date of birth
// - SSSS (positions 7-10): gender — 0000-4999 female, 5000-9999 male
// (Citizenship/checksum digits aren't needed for what we use this for.)

export type ParsedSaId = {
  dateOfBirth: Date;
  gender: "MALE" | "FEMALE";
};

export function parseSaIdNumber(idNumber: string, asOf: Date = new Date()): ParsedSaId | null {
  const digits = idNumber.replace(/\s/g, "");
  if (!/^\d{13}$/.test(digits)) return null;

  const yy = Number(digits.slice(0, 2));
  const mm = Number(digits.slice(2, 4));
  const dd = Number(digits.slice(4, 6));
  const genderDigits = Number(digits.slice(6, 10));

  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return null;

  // No century digit in the ID itself — assume whichever century puts the
  // birthdate in the past relative to `asOf` and closest to it (i.e. not
  // more than ~100 years ago). This matches the common convention of
  // treating a two-digit year <= the current two-digit year as 20YY.
  const currentYY = asOf.getFullYear() % 100;
  const century = yy <= currentYY ? 2000 : 1900;

  const dateOfBirth = new Date(Date.UTC(century + yy, mm - 1, dd));
  // Reject invalid calendar dates (e.g. 31 Feb) — Date.UTC silently rolls
  // them over into the next month, so check it round-trips.
  if (
    dateOfBirth.getUTCFullYear() !== century + yy ||
    dateOfBirth.getUTCMonth() !== mm - 1 ||
    dateOfBirth.getUTCDate() !== dd
  ) {
    return null;
  }

  const gender = genderDigits < 5000 ? "FEMALE" : "MALE";

  return { dateOfBirth, gender };
}
