export default function VideosLoading() {
  return (
    <main className="min-h-screen bg-background" aria-busy="true">
      <div className="mx-auto w-full max-w-7xl animate-pulse px-4 py-8 sm:px-6 sm:py-12">
        <div className="h-8 w-52 rounded-lg bg-muted" />
        <div className="mt-5 h-56 rounded-2xl border border-border/60 bg-card" />
        <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <div
              key={index}
              className="aspect-[4/3] rounded-2xl border border-border/60 bg-card"
            />
          ))}
        </div>
      </div>
    </main>
  );
}
