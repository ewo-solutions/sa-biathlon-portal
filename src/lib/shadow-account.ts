// Synthetic placeholder email domain assigned to legacy athletes imported
// without a real website login. An account still on this domain has never
// been claimed by its real owner.
export const PLACEHOLDER_EMAIL_DOMAIN = "@imported.sabiathlon.local";

export function isShadowEmail(email: string): boolean {
  return email.endsWith(PLACEHOLDER_EMAIL_DOMAIN);
}
