export default function Loading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading report card">
      <div className="space-y-2">
        <div className="h-8 w-64 animate-pulse rounded bg-neutral-200" />
        <div className="h-4 w-80 animate-pulse rounded bg-neutral-100" />
      </div>
      <div className="h-20 animate-pulse rounded-lg bg-neutral-100" />
      <div className="space-y-2 rounded-lg border border-neutral-200 bg-white p-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-10 animate-pulse rounded bg-neutral-100" />
        ))}
      </div>
    </div>
  );
}
