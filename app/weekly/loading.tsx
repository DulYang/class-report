export default function Loading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading weekly view">
      <div className="h-8 w-48 animate-pulse rounded bg-neutral-200" />
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="space-y-3 rounded-lg border border-neutral-200 bg-white p-4"
        >
          <div className="h-5 w-56 animate-pulse rounded bg-neutral-200" />
          <div className="h-4 w-72 animate-pulse rounded bg-neutral-100" />
          <div className="h-4 w-64 animate-pulse rounded bg-neutral-100" />
        </div>
      ))}
    </div>
  );
}
