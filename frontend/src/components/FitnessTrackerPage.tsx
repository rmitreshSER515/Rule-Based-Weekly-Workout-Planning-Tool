export default function FitnessTrackerPage() {
  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-slate-950 flex items-center justify-center px-5 py-10">
      {/* Background gradient (same as LoginPage) */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950" />

      {/* Fitness “energy” glows (same as LoginPage) */}
      <div className="absolute -top-32 -left-32 h-[520px] w-[520px] rounded-full bg-fuchsia-500/20 blur-[90px]" />
      <div className="absolute -bottom-40 -right-40 h-[620px] w-[620px] rounded-full bg-cyan-400/15 blur-[110px]" />

      {/* Subtle dotted texture (same as LoginPage) */}
      <div
        className="absolute inset-0 opacity-[0.10]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.35) 1px, transparent 0)",
          backgroundSize: "26px 26px",
        }}
      />

      {/* Glass panel (same style as LoginPage card) */}
      <div className="relative z-10 w-full max-w-5xl rounded-2xl border border-white/15 bg-white/10 backdrop-blur-xl shadow-[0_18px_60px_rgba(0,0,0,0.45)] overflow-hidden">
        {/* Header */}
        <div className="py-10 text-center border-b border-white/15">
          <h1 className="text-6xl font-extrabold tracking-wide text-white drop-shadow">
            Fitness Tracker
          </h1>
          <p className="mt-2 text-white/70 text-sm">
            Choose an option to continue
          </p>
        </div>

        {/* Body */}
        <div className="p-16">
          <div className="space-y-6 text-3xl text-white flex flex-col items-center">
            <button
              type="button"
              onClick={() => console.log("View Schedules clicked")}
              className="w-full sm:w-fit flex items-center gap-4 rounded-xl px-5 py-4 bg-white/5 hover:bg-white/10 active:bg-white/15 border border-white/10 focus:outline-none focus:ring-2 focus:ring-white/30"
            >
              <span aria-hidden="true" className="text-white/80">
                
              </span>
              <span className="underline-offset-4 hover:underline">
                View Schedules
              </span>
            </button>

            <button
              type="button"
              onClick={() => console.log("Compare Schedules clicked")}
              className="w-full sm:w-fit flex items-center gap-4 rounded-xl px-5 py-4 bg-white/5 hover:bg-white/10 active:bg-white/15 border border-white/10 focus:outline-none focus:ring-2 focus:ring-white/30"
            >
              <span aria-hidden="true" className="text-white/80">
                
              </span>
              <span className="underline-offset-4 hover:underline">
                Compare Schedules
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}