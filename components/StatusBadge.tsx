import type { FillStatus } from "@/lib/types";

const TONES: Record<FillStatus, string> = {
  empty: "bg-neutral-100 text-neutral-600",
  partial: "bg-amber-100 text-amber-800",
  complete: "bg-emerald-100 text-emerald-800",
};

const LABELS: Record<FillStatus, string> = {
  empty: "Empty",
  partial: "Partial",
  complete: "Complete",
};

export default function StatusBadge({ status }: { status: FillStatus }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${TONES[status]}`}
    >
      {LABELS[status]}
    </span>
  );
}
