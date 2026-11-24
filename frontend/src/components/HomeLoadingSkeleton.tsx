export default function HomeLoadingSkeleton() {
  return (
    <div className="platform-layout animate-pulse" aria-busy="true" aria-label="Loading SIMS GATE Platform">
      {/* Skeleton Top Announcement Bar */}
      <div className="h-9 bg-[#0B192C] flex items-center justify-between px-6">
        <div className="h-3 w-48 bg-slate-700/60 rounded" />
        <div className="h-3 w-64 bg-slate-700/60 rounded hidden sm:block" />
        <div className="h-3 w-32 bg-slate-700/60 rounded hidden sm:block" />
      </div>

      {/* Skeleton Navbar */}
      <div className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-full bg-slate-200" />
          <div className="h-5 w-24 bg-slate-200 rounded" />
        </div>
        <div className="hidden md:flex items-center gap-6">
          <div className="h-4 w-16 bg-slate-200 rounded" />
          <div className="h-4 w-16 bg-slate-200 rounded" />
          <div className="h-4 w-16 bg-slate-200 rounded" />
          <div className="h-4 w-16 bg-slate-200 rounded" />
        </div>
        <div className="h-9 w-28 bg-[#C5A059]/30 rounded-xl" />
      </div>

      {/* Skeleton Hero */}
      <div className="max-w-6xl mx-auto px-6 py-14 space-y-6">
        <div className="h-7 w-52 bg-[#C5A059]/20 rounded-full" />
        <div className="h-12 w-3/4 max-w-xl bg-slate-200 rounded-xl" />
        <div className="h-5 w-full max-w-lg bg-slate-200/80 rounded" />
        <div className="h-5 w-2/3 max-w-md bg-slate-200/80 rounded" />

        <div className="flex gap-4 pt-4">
          <div className="h-12 w-44 bg-[#0B192C]/80 rounded-xl" />
          <div className="h-12 w-48 bg-slate-200 rounded-xl" />
        </div>

        {/* Skeleton Stream Chips */}
        <div className="flex gap-2 pt-6">
          <div className="h-8 w-24 bg-slate-200 rounded-lg" />
          <div className="h-8 w-24 bg-slate-200 rounded-lg" />
          <div className="h-8 w-24 bg-slate-200 rounded-lg" />
          <div className="h-8 w-24 bg-slate-200 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
