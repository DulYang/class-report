"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import type { ActionResult } from "@/lib/types";

type Props = {
  action: (
    prev: ActionResult | null,
    formData: FormData,
  ) => Promise<ActionResult>;
  submitLabel: string;
  pendingLabel?: string;
  successMessage?: string;
  /** Clear the inputs after a successful submit — right for "create" forms. */
  resetOnSuccess?: boolean;
  className?: string;
  children: React.ReactNode;
};

/**
 * Shared shell for every create/edit form: runs a server action, surfaces the
 * error string it returns, and shows a transient confirmation on success.
 */
export default function ActionForm({
  action,
  submitLabel,
  pendingLabel = "Saving…",
  successMessage = "Saved.",
  resetOnSuccess = false,
  className = "",
  children,
}: Props) {
  const [state, formAction] = useActionState(action, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (resetOnSuccess && state?.ok) formRef.current?.reset();
  }, [state, resetOnSuccess]);

  return (
    <form ref={formRef} action={formAction} className={`space-y-3 ${className}`}>
      {children}

      {state && !state.ok && (
        <p role="alert" className="text-sm font-medium text-red-700">
          {state.error}
        </p>
      )}
      {state?.ok && (
        <p className="text-sm font-medium text-emerald-700">{successMessage}</p>
      )}

      <Submit label={submitLabel} pendingLabel={pendingLabel} />
    </form>
  );
}

function Submit({
  label,
  pendingLabel,
}: {
  label: string;
  pendingLabel: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="min-h-11 w-full rounded-md bg-neutral-900 px-4 py-2 text-sm font-semibold text-white disabled:bg-neutral-300 sm:min-h-0 sm:w-auto"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
        {label}
      </span>
      {children}
    </label>
  );
}

/**
 * `text-base` on mobile is deliberate: iOS Safari zooms the page whenever a
 * focused input's font-size is under 16px. Drops back to `text-sm` on larger
 * screens, where that isn't a concern.
 */
export const inputClass =
  "w-full min-h-11 rounded-md border border-neutral-300 px-3 py-2 text-base focus:border-neutral-500 focus:outline-none sm:min-h-0 sm:text-sm";
