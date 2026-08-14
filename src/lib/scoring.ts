import type { Group } from "@prisma/client";

// Direct port of the legacy ASP.NET PointsCalculationService
// (Services/Points/PointsCalculationService.cs), retrieved from the
// original Azure app source and cross-checked against the SA Biathlon
// "Points Table Revised 2020" reference document.

// The legacy service computes an athlete's "seasonAthleteAge" for bonus
// points via DateTime arithmetic that — because it rebuilds a date using
// the athlete's own month/day in the season's end year — always reduces to
// a plain calendar-year difference, regardless of exact birthday timing.
export function seasonAge(dateOfBirth: Date, seasonEndDate: Date): number {
  return seasonEndDate.getFullYear() - dateOfBirth.getFullYear();
}

function n(value: unknown): number {
  return value === null || value === undefined ? 0 : Number(value);
}

type RunningGroup = Pick<Group, "runningGoalTimeSeconds" | "runningPoints" | "runningPointsPerSecond">;
type SwimmingGroup = Pick<
  Group,
  "swimmingGoalTimeSeconds" | "swimmingPoints" | "swimmingPointsPerSecond" | "swimmingPenalty25" | "swimmingPenalty50"
>;
type BonusGroup = Pick<Group, "bonusPoints" | "ageStart">;

// Returns null when the group isn't configured with enough scoring fields
// to compute a result (e.g. imported groups still missing goal times).
export function calculateRunningPoints(
  group: RunningGroup,
  timeSeconds: number | null,
  dnf: boolean,
): number | null {
  if (dnf || timeSeconds === null) return 0;
  if (group.runningGoalTimeSeconds === null || group.runningPoints === null || group.runningPointsPerSecond === null) {
    return null;
  }
  const dif = group.runningGoalTimeSeconds - timeSeconds;
  return n(group.runningPoints) + dif * n(group.runningPointsPerSecond);
}

// Note: unlike swimming, the legacy service applies no false-start penalty
// to running — replicated faithfully here even though it looks asymmetric.
export function calculateSwimmingPoints(
  group: SwimmingGroup,
  timeSeconds: number | null,
  dnf: boolean,
  poolSize: number | null,
  falseStart: boolean,
): number | null {
  if (dnf || timeSeconds === null) return 0;
  if (
    group.swimmingGoalTimeSeconds === null ||
    group.swimmingPoints === null ||
    group.swimmingPointsPerSecond === null
  ) {
    return null;
  }
  const dif = group.swimmingGoalTimeSeconds - timeSeconds;
  const pointsPerSecond = n(group.swimmingPointsPerSecond);
  const penalty = poolSize === 25 ? n(group.swimmingPenalty25) : n(group.swimmingPenalty50);
  const falseStartPenalty = falseStart ? 2 * pointsPerSecond : 0;
  return n(group.swimmingPoints) + dif * pointsPerSecond - penalty - falseStartPenalty;
}

// Bonus is per year of age over the group's minimum age, split evenly
// between running and swimming — the legacy service applies the identical
// (Bonus / 2) * (age - AgeStart) formula to both disciplines separately.
export function calculateBonusPoints(
  group: BonusGroup,
  dateOfBirth: Date | null,
  seasonEndDate: Date | null,
): number {
  const bonus = n(group.bonusPoints);
  if (bonus <= 0 || !dateOfBirth || !seasonEndDate) return 0;
  const age = seasonAge(dateOfBirth, seasonEndDate);
  if (age < group.ageStart) return 0;
  return (bonus / 2) * (age - group.ageStart);
}
