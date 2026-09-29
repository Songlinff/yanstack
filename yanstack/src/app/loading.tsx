export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-20">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-line/60" />
      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="surface h-64 animate-pulse rounded-2xl bg-white/50" />
        ))}
      </div>
    </div>
  );
}
