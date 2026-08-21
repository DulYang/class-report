"use client";

import { useFormStatus } from "react-dom";

type Props = {
  action: (formData: FormData) => Promise<void>;
  hidden: Record<string, string>;
  label?: string;
  confirmMessage: string;
  className?: string;
};

/** Destructive submit with a confirm step, since deletes cascade. */
export default function DeleteButton({
  action,
  hidden,
  label = "Delete",
  confirmMessage,
  className,
}: Props) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(confirmMessage)) e.preventDefault();
      }}
      className="inline"
    >
      {Object.entries(hidden).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <Submit label={label} className={className} />
    </form>
  );
}

function Submit({ label, className }: { label: string; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={
        className ??
        "rounded-md border border-red-300 px-2.5 py-1 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
      }
    >
      {pending ? "Deleting…" : label}
    </button>
  );
}
