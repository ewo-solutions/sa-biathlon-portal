"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  AthleteSearchResult,
  ScoreEntryState,
} from "@/app/(portal)/(admin)/admin/events/scores/actions";

const inputClass = "w-full bg-sage px-4 py-3 text-sm text-white placeholder-white/70 outline-none";
const SEARCH_DEBOUNCE_MS = 200;

export function ScoreEntryForm({
  action,
  searchAthletes,
}: {
  action: (prevState: ScoreEntryState, formData: FormData) => Promise<ScoreEntryState>;
  searchAthletes: (query: string) => Promise<AthleteSearchResult[]>;
}) {
  const [state, formAction, pending] = useActionState<ScoreEntryState, FormData>(action, {
    status: "idle",
    message: "",
  });
  const [matches, setMatches] = useState<AthleteSearchResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [confirmedName, setConfirmedName] = useState<string | null>(null);
  const athleteInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchToken = useRef(0);
  const router = useRouter();

  useEffect(() => {
    if (state.status === "idle" || pending) return;
    formRef.current?.reset();
    athleteInputRef.current?.focus();
    if (state.status === "success") {
      router.refresh();
    }
  }, [state, pending, router]);

  function handleQueryChange(value: string) {
    setShowSuggestions(true);
    setConfirmedName(null);

    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!value.trim()) {
      setMatches([]);
      return;
    }

    const token = ++searchToken.current;
    searchTimeout.current = setTimeout(async () => {
      const results = await searchAthletes(value);
      if (searchToken.current !== token) return;
      setMatches(results);
      // Whether typed directly (e.g. reading off a result sheet) or picked
      // from the dropdown, an exact number match confirms whose time this
      // is before the admin captures it.
      const exact = results.find(
        (a) => a.athleteNumber.toLowerCase() === value.trim().toLowerCase(),
      );
      setConfirmedName(exact?.name ?? null);
    }, SEARCH_DEBOUNCE_MS);
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      onReset={() => {
        setMatches([]);
        setConfirmedName(null);
      }}
      className="space-y-4"
    >
      <div className="relative">
        <label className="mb-1 block text-sm text-white">Athlete number (SA No)</label>
        <input
          ref={athleteInputRef}
          name="athleteNumber"
          defaultValue=""
          onChange={(e) => handleQueryChange(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          autoComplete="off"
          autoFocus
          required
          className={inputClass}
        />
        {showSuggestions && matches.length > 0 && (
          <ul className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto bg-panel-alt shadow-[0_0_20px_rgba(0,0,0,0.4)]">
            {matches.map((athlete) => (
              <li key={athlete.athleteNumber}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    if (athleteInputRef.current) {
                      athleteInputRef.current.value = athlete.athleteNumber;
                    }
                    setShowSuggestions(false);
                    setConfirmedName(athlete.name);
                  }}
                  className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm text-white hover:bg-sage/60"
                >
                  <span className="font-bold">{athlete.athleteNumber}</span>
                  <span className="text-white/70">{athlete.name}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {confirmedName && (
          <p className="mt-1 text-sm font-bold text-gold">✓ {confirmedName}</p>
        )}
      </div>
      <div>
        <label className="mb-1 block text-sm text-white">Time (mm:ss.ss)</label>
        <input name="time" placeholder="0:54.20" autoComplete="off" className={inputClass} />
      </div>
      <div className="flex gap-6 text-sm text-white">
        <label className="flex items-center gap-2">
          <input type="checkbox" name="dnf" className="size-4" />
          DNF
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="falseStart" className="size-4" />
          False start
        </label>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="tracked-caps bg-gold px-6 py-3 text-sm font-black text-panel-alt transition hover:bg-gold-light disabled:opacity-60"
      >
        {pending ? "Saving…" : "Record time (Enter)"}
      </button>
      {state.status !== "idle" && (
        <p className={state.status === "error" ? "text-sm text-red-300" : "text-sm text-gold"}>
          {state.message}
        </p>
      )}
    </form>
  );
}
