"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { Coach } from "@/lib/types";

/**
 * Who a coach is here is self-reported, not a login — picking a name just
 * scopes the weekly view to that coach's own sessions and labels the audit
 * trail. It is not a security boundary.
 */
export default function CoachPicker({
  coaches,
  selectedId,
}: {
  coaches: Coach[];
  selectedId: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function onChange(id: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (id) params.set("coach", id);
    else params.delete("coach");
    router.push(`/weekly?${params.toString()}`);
  }

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="font-medium text-neutral-700">I am</span>
      <select
        aria-label="Select your name"
        value={selectedId}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-neutral-300 bg-white px-3 py-2 font-medium focus:border-neutral-500 focus:outline-none"
      >
        <option value="">Select your name…</option>
        {coaches.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
    </label>
  );
}
