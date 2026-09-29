"use client";

import { useActionState } from "react";
import type { EventActionState } from "@/app/(portal)/(athlete)/athlete/events/actions";

export function EventEntryForm({
  action,
  label,
  pendingLabel,
  variant = "primary",
}: {
  action: (prevState: EventActionState, formData: FormData) => Promise<EventActionState>;
  label: string;
  pendingLabel: string;
  variant?: "primary" | "secondary";
}) {
  const [state, formAction, pending] = useActionState<EventActionState, FormData>(action, {
    status: "idle",
    message: "",
  });

  const buttonClass =
    variant === "primary"
      ? "tracked-caps w-full bg-gold px-4 py-3 text-sm font-black text-panel-alt transition hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-60"
      : "tracked-caps w-full bg-panel-alt px-4 py-3 text-sm font-black text-white transition hover:bg-sage/60 disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <form action={formAction}>
      <button type="submit" disabled={pending} className={buttonClass}>
        {pending ? pendingLabel : label}
      </button>
      {state.status !== "idle" && (
        <p
          className={`mt-2 text-xs ${state.status === "error" ? "text-red-300" : "text-gold"}`}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
