import { useState, useMemo } from "react";
import { useLocation } from "react-router-dom";
import RuleSelector from "./RuleSelector";

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
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayName = days[date.getDay()];
  const month = date.toLocaleDateString("en-US", { month: "short" });
  const day = date.getDate();
  return `${dayName} ${day} ${month}`;
};

export default function SchedulePage() {
  const location = useLocation();
  const isCreateMode = (location.state as { mode?: string } | null)?.mode === "create";
  const [isRuleSelectorOpen, setIsRuleSelectorOpen] = useState(false);
  const [selectedRules, setSelectedRules] = useState<any[]>([]);

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

  const [showAddExerciseModal, setShowAddExerciseModal] = useState(false);
  const [exerciseName, setExerciseName] = useState("");
  const [exerciseNotes, setExerciseNotes] = useState("");
  const [exercises, setExercises] = useState<{ id: string; name: string; notes: string }[]>([]);

  const openAddExerciseModal = () => {
    setExerciseName("");
    setExerciseNotes("");
    setShowAddExerciseModal(true);
  };

  const closeAddExerciseModal = () => {
    setShowAddExerciseModal(false);
    setExerciseName("");
    setExerciseNotes("");
  };

  const handleAddExerciseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!exerciseName.trim()) return;
    setExercises((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name: exerciseName.trim(), notes: exerciseNotes.trim() },
    ]);
    closeAddExerciseModal();
  };

  const days = useMemo(() => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return getDaysInRange(start, end);
  }, [startDate, endDate]);

  const weeks = useMemo(() => {
    const result: Date[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      result.push(days.slice(i, i + 7));
    }
    return result;
  }, [days]);

  const handleApplyRules = (rules: any[]) => {
    setSelectedRules(rules);
  };

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
          <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
            {exercises.map((ex) => (
              <div
                key={ex.id}
                className="rounded-lg bg-blue-500/20 border border-blue-400/30 px-3 py-2"
              >
                <p className="text-white font-medium text-sm">{ex.name}</p>
                {ex.notes ? (
                  <p className="text-white/70 text-xs mt-1">{ex.notes}</p>
                ) : null}
              </div>
            ))}
          </div>
          <div className="shrink-0 p-4 pt-0">
            <button
              type="button"
              onClick={openAddExerciseModal}
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
            <button 
              className="w-full rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 px-4 text-center"
            >
              Rules
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            {selectedRules.length > 0 ? (
              <div className="space-y-2">
                {selectedRules.map((rule, index) => (
                  <div key={rule.id} className="p-2 rounded-lg bg-white/5 border border-white/10">
                    <p className="text-white font-medium text-sm truncate">{rule.name}</p>
                    <p className="text-white/50 text-xs truncate">
                      If {rule.ifExercise} then {rule.thenActivityType} is {rule.thenRestriction}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-white/50 text-sm">No rules selected</p>
            )}
          </div>
          <div className="shrink-0 p-4 pt-0">
            <button
              type="button"
              onClick={() => setIsRuleSelectorOpen(true)}
              className="w-full rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 px-4 text-center flex items-center justify-center gap-2"
              aria-label="Add rule"
            >
              <span aria-hidden>+</span>
              <span>Add rule</span>
            </button>
          </div>
        </div>
      </div>

      {/* Right Side - Calendar */}
      <div className="relative z-10 flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header - shrink-0 so it never disappears */}
        <div className="shrink-0 p-4 border-b border-white/15 bg-white/5 backdrop-blur-xl">
          <div className="flex flex-nowrap items-center justify-between gap-4 mb-4">
            <div className="flex min-w-0 shrink items-center gap-2">
              <h1 className="truncate text-2xl font-bold text-white">
                {isCreateMode ? "New Schedule" : scheduleTitle}
              </h1>
              {isCreateMode && (
                <span className="rounded-full bg-emerald-500/30 text-emerald-300 text-xs font-medium px-2 py-0.5">
                  Create new
                </span>
              )}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </div>
            <button
              type="button"
              className="shrink-0 group relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 px-6 py-3 font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-slate-950"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" />
                <polyline points="7 3 7 8 15 8" />
              </svg>
              <span>Save Changes</span>
            </button>
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

        {/* Calendar Grid - one week visible per scroll, 7 days fit equally */}
        <div className="flex flex-1 flex-col min-h-0 overflow-hidden">
          <div
            className="schedule-calendar-scroll mx-auto flex-1 min-h-0 w-full max-w-[1280px] overflow-x-auto overflow-y-hidden scroll-smooth [container-type:inline-size]"
            style={{
              scrollSnapType: weeks.length > 1 ? "x mandatory" : undefined,
              scrollbarGutter: "stable",
            }}
          >
            <div className="flex h-full min-w-fit">
              {weeks.map((weekDays, weekIndex) => (
                <div
                  key={weekIndex}
                  className="flex shrink-0 w-[100cqw]"
                  style={{ scrollSnapAlign: "start" }}
                >
                  {weekDays.map((day, dayIndex) => (
                    <div
                      key={dayIndex}
                      className="min-w-0 flex-1 flex flex-col border-r border-white/15 bg-white/5 backdrop-blur-xl"
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
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Add Exercise Modal */}
      {showAddExerciseModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={closeAddExerciseModal}
        >
          <div
            className="relative w-full max-w-md rounded-2xl border border-white/15 bg-slate-900 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <h2 className="text-xl font-bold text-white mb-4">Add exercise</h2>
              <form onSubmit={handleAddExerciseSubmit} className="space-y-4">
                <div>
                  <label htmlFor="exercise-name" className="block text-sm font-medium text-white/80 mb-1">
                    Name
                  </label>
                  <input
                    id="exercise-name"
                    type="text"
                    value={exerciseName}
                    onChange={(e) => setExerciseName(e.target.value)}
                    placeholder="e.g. Running"
                    className="w-full rounded-lg bg-white/10 border border-white/15 text-white placeholder-white/40 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                </div>
                <div>
                  <label htmlFor="exercise-notes" className="block text-sm font-medium text-white/80 mb-1">
                    Notes
                  </label>
                  <textarea
                    id="exercise-notes"
                    value={exerciseNotes}
                    onChange={(e) => setExerciseNotes(e.target.value)}
                    placeholder="Optional notes..."
                    rows={3}
                    className="w-full rounded-lg bg-white/10 border border-white/15 text-white placeholder-white/40 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={closeAddExerciseModal}
                    className="flex-1 rounded-lg border border-white/20 bg-white/5 text-white py-2.5 font-medium hover:bg-white/10"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!exerciseName.trim()}
                    className="flex-1 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2.5 font-medium"
                  >
                    Add
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {/* Rule Selector Modal */}
      <RuleSelector
        isOpen={isRuleSelectorOpen}
        onClose={() => setIsRuleSelectorOpen(false)}
        onApplyRules={handleApplyRules}
      />
    </div>
  );
}
