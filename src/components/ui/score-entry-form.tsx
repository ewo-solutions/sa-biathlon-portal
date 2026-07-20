"use client";

import { useActionState, useEffect, useRef } from "react";
import type { ScoreEntryState } from "@/app/(portal)/(admin)/admin/events/scores/actions";

const inputClass = "w-full bg-sage px-4 py-3 text-sm text-white placeholder-white/70 outline-none";

export function ScoreEntryForm({
  action,
}: {
  action: (prevState: ScoreEntryState, formData: FormData) => Promise<ScoreEntryState>;
}) {
  const [state, formAction, pending] = useActionState<ScoreEntryState, FormData>(action, {
    status: "idle",
    message: "",
  });
  const athleteInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "idle" || pending) return;
    formRef.current?.reset();
    athleteInputRef.current?.focus();
  }, [state, pending]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm text-white">Athlete number (SA No)</label>
        <input
          ref={athleteInputRef}
          name="athleteNumber"
          autoComplete="off"
          autoFocus
          required
          className={inputClass}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm text-white">Time (mm:ss)</label>
        <input name="time" placeholder="0:54" autoComplete="off" className={inputClass} />
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
