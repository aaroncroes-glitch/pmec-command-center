/** Canonical work-email form for lookups and uniqueness (NFKC + casefold). */
export function normalizeWorkEmail(email: string): string {
  return email.trim().normalize("NFKC").toLowerCase();
}