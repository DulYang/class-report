/** Formatting helpers shared by server and client components. */

/** Render a `YYYY-MM-DD` date column without dragging it through a timezone. */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

/** `YYYY-MM-DD` in local time — safe to hand to Postgres `date` columns. */
export function toDateInput(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Monday-to-Sunday window containing `date`, as date-input strings. */
export function weekRange(date: Date): { from: string; to: string } {
  const start = new Date(date);
  const dayOfWeek = start.getDay(); // 0 = Sunday
  const daysSinceMonday = (dayOfWeek + 6) % 7;
  start.setDate(start.getDate() - daysSinceMonday);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { from: toDateInput(start), to: toDateInput(end) };
}

export function addWeeks(iso: string, weeks: number): string {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + weeks * 7);
  return toDateInput(date);
}

export function formatRange(from: string, to: string): string {
  return `${formatDate(from)} – ${formatDate(to)}`;
}
