// Shared parsing/formatting for competition times, captured to hundredths
// of a second to match the legacy system (and the scoring formula, which is
// sensitive to fractional seconds: 5pts/sec running, 10pts/sec swimming).

// Accepts "ss", "ss.ss", "mm:ss", "mm:ss.ss", or "h:mm:ss.ss" and returns
// seconds rounded to hundredths. Matches the legacy "Enter Run/Swim Times"
// forms, which took a single time text box per athlete.
export function parseTimeToSeconds(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const parts = trimmed.split(":");
  if (parts.some((part) => part.trim() === "")) return null;

  const numbers = parts.map((part) => Number(part));
  if (numbers.some((n) => Number.isNaN(n))) return null;

  let seconds = 0;
  for (const n of numbers) {
    seconds = seconds * 60 + n;
  }
  return Math.round(seconds * 100) / 100;
}

// Auto-formats raw numeric keystrokes into "mm:ss.ss" as the admin types,
// so a hand-timer reading off a stopwatch only ever types digits (e.g.
// "021768") and the colon/period appear automatically — matching how the
// legacy manual capture screens behaved. Strips anything non-numeric and
// caps at 6 digits (mm + ss + hundredths).
export function maskTimeDigits(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 6);
  if (digits.length <= 2) return digits;
  const minutes = digits.slice(0, 2);
  const rest = digits.slice(2);
  if (rest.length <= 2) return `${minutes}:${rest}`;
  const seconds = rest.slice(0, 2);
  const hundredths = rest.slice(2);
  return `${minutes}:${seconds}.${hundredths}`;
}

// Formats seconds (whole or with hundredths) as "m:ss.ss" (or "ss.ss" under
// a minute). Accepts a Prisma Decimal, a plain number, or null.
export function formatSeconds(seconds: { toString(): string } | number | null): string {
  if (seconds === null || seconds === undefined) return "—";
  const total = typeof seconds === "number" ? seconds : Number(seconds.toString());
  if (Number.isNaN(total)) return "—";

  const minutes = Math.floor(total / 60);
  const remainder = total - minutes * 60;
  const secondsStr = remainder.toFixed(2).padStart(5, "0");
  return minutes > 0 ? `${minutes}:${secondsStr}` : secondsStr;
}
