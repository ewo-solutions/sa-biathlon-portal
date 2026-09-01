"use client";

import { useRef, type ReactNode } from "react";

// Wraps a server-action form and asks for confirmation before submitting if
// a specific field's value has changed from what it started as — used for
// the SA ID number, since changing it recomputes date of birth/gender and
// (via a self-claim lookup elsewhere) could affect which athlete record
// this account is linked to.
export function ConfirmOnChangeForm({
  action,
  className,
  watchField,
  originalValue,
  confirmMessage,
  children,
}: {
  action: (formData: FormData) => void;
  className?: string;
  watchField: string;
  originalValue: string;
  confirmMessage: string;
  children: ReactNode;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={action}
      className={className}
      onSubmit={(event) => {
        const formEl = formRef.current;
        if (!formEl) return;
        const value = (new FormData(formEl).get(watchField) as string | null)?.trim() ?? "";
        if (value !== originalValue.trim() && !window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
    >
      {children}
    </form>
  );
}
