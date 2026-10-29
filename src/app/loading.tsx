export default function Loading() {
  return (
    <div role="status" aria-label="Loading dashboard">
      <span className="sr-only">Loading dashboard…</span>
      <div className="skeleton mb-6 h-8 w-48" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-28" />
        ))}
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[3fr_2fr]">
        <div className="skeleton h-96" />
        <div className="skeleton h-96" />
      </div>
    </div>
  );
}
