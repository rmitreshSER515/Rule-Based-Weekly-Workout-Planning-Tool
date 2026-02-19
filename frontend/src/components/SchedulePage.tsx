import { useState, useMemo } from "react";

const getDaysInRange = (startDate: Date, endDate: Date): Date[] => {
  const days: Date[] = [];
  const current = new Date(startDate);
  while (current <= endDate) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return days;
};

const formatDayName = (date: Date): string => {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const dayName = days[date.getDay()];
  const month = date.toLocaleDateString("en-US", { month: "short" });
  const day = date.getDate();
  return `${dayName} ${day} ${month}`;
};

export default function SchedulePage() {
  // Initialize dates for current week
  const today = new Date();
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 6);

  const [startDate, setStartDate] = useState<string>(
    today.toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState<string>(
    nextWeek.toISOString().split("T")[0]
  );
  const [scheduleTitle] = useState<string>("Triathlon Schedule");

  const days = useMemo(() => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return getDaysInRange(start, end);
  }, [startDate, endDate]);

  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-slate-950 flex">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950" />
      <div className="absolute -top-32 -left-32 h-[520px] w-[520px] rounded-full bg-fuchsia-500/20 blur-[90px]" />
      <div className="absolute -bottom-40 -right-40 h-[620px] w-[620px] rounded-full bg-cyan-400/15 blur-[110px]" />
      <div
        className="absolute inset-0 opacity-[0.10]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.35) 1px, transparent 0)",
          backgroundSize: "26px 26px",
        }}
      />

      {/* Left Sidebar */}
      <div className="relative z-10 w-[300px] flex flex-col border-r border-white/15 bg-white/5 backdrop-blur-xl">
        {/* Exercises Panel */}
        <div className="flex flex-col h-1/2 border-b border-white/15">
          <div className="p-4">
            <button className="w-full rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 text-center">
              Exercises
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            {/* Exercises list will go here */}
          </div>
          <div className="shrink-0 p-4 pt-0">
            <button
              type="button"
              className="w-full rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 text-center flex items-center justify-center gap-2"
              aria-label="Add exercise"
            >
              <span aria-hidden>+</span>
              <span>Add exercise</span>
            </button>
          </div>
        </div>

        {/* Rules Panel */}
        <div className="flex flex-col h-1/2">
          <div className="p-4">
            <button className="w-full rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 px-4 text-center">
              Rules
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            {/* Rules list will go here */}
          </div>
        </div>
      </div>

      {/* Right Side - Calendar */}
      <div className="relative z-10 flex-1 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-white/15 bg-white/5 backdrop-blur-xl">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white">{scheduleTitle}</h1>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-white/70 text-sm">Start:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-lg bg-white/10 border border-white/15 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/30"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-white/70 text-sm">End:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="rounded-lg bg-white/10 border border-white/15 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/30"
              />
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden">
          <div className="flex h-full min-w-fit">
            {days.map((day, dayIndex) => (
              <div
                key={dayIndex}
                className="w-[180px] flex flex-col border-r border-white/15 bg-white/5 backdrop-blur-xl"
              >
                {/* Day Header */}
                <div className="p-3 border-b border-white/15">
                  <button className="w-full rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-3 text-center text-sm">
                    {formatDayName(day)}
                  </button>
                </div>
                {/* Day Body - Scrollable */}
                <div className="flex-1 overflow-y-auto p-2 min-h-[400px]">
                  {/* Activities will go here */}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
