// Legacy Competitions.CompetitionType numeric codes, confirmed from a code
// comment in the Azure SQL AthleteSeasonCompetitions stored procedure.
export const COMPETITION_TYPE_LABELS: Record<string, string> = {
  "1": "Inter-Provincial",
  "2": "Provincial",
  "3": "National",
};

export function competitionTypeLabel(code: string | null | undefined): string | null {
  if (!code) return null;
  return COMPETITION_TYPE_LABELS[code] ?? code;
}
