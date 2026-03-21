import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "../utils/auth";
import { fetchSchedules } from "../api/schedules";

type ScheduleCard = {
  id: string;
  title?: string;
  startDate?: string;
  endDate?: string;
  notes?: string;
  exerciseCount?: number;
};

export default function FitnessTrackerPage() {
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState<ScheduleCard[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  const [selectedScheduleIds, setSelectedScheduleIds] = useState<string[]>([]);
  const canCompare = selectedScheduleIds.length >= 3;

  const toggleScheduleSelection = (id: string) => {
    setSelectedScheduleIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (!stored) {
        setUserId(null);
        return;
      }
      const user = JSON.parse(stored);
      const id = user?.id ?? user?._id ?? null;
      setUserId(typeof id === "string" ? id : null);
    } catch {
      setUserId(null);
    }
  }, []);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    fetchSchedules(userId)
      .then((items) => {
        if (cancelled) return;
        setSchedules(
          items.map((item) => ({
            id: item.id,
            title: item.title,
            startDate: item.startDate,
            endDate: item.endDate,
          }))
        );
      })
      .catch(() => {
        if (!cancelled) setSchedules([]);
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    const ids = new Set(schedules.map((s) => s.id));
    setSelectedScheduleIds((prev) => prev.filter((id) => ids.has(id)));
  }, [schedules]);

  const handleLogout = () => logout(navigate);

  const handleCreateSchedule = () => {
    navigate("/schedules", { state: { mode: "create" } });
  };

  const handleOpenSchedule = (schedule: ScheduleCard) => {
    navigate("/schedules", {
      state: {
        mode: "view",
        scheduleId: schedule.id,
        schedule,
      },
    });
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-slate-950">
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

      <div className="relative z-10 min-h-screen px-6 py-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 border-b border-white/15 pb-6">
            <div className="flex items-center justify-between gap-4">
              <div className="w-full text-center">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-wide text-white drop-shadow">
                  Fitness Page
                </h1>
                <p className="mt-3 text-sm sm:text-base text-white/65">
                  Create, view, and compare your schedules
                </p>
              </div>

              <div className="absolute right-6 top-8 flex items-center gap-3">
                <button
                  type="button"
                  disabled={!canCompare}
                  onClick={() => {
                    console.log("Compare schedules clicked:", selectedScheduleIds);
                  }}
                  title={
                    canCompare
                      ? "Compare selected schedules"
                      : "Select at least 3 schedules to compare"
                  }
                  className={`rounded-xl border px-5 py-2.5 text-sm font-semibold backdrop-blur-xl transition-all
                    ${
                      canCompare
                        ? "border-blue-400/30 bg-white/10 text-blue-200 hover:bg-white/15 hover:text-white hover:shadow-lg hover:shadow-blue-500/10"
                        : "border-white/10 bg-white/5 text-white/40 opacity-60 cursor-not-allowed"
                    }`}
                >
                  Compare Schedules
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-sm font-medium text-white/90 backdrop-blur-xl transition-colors hover:bg-white/10 hover:text-white"
                >
                  Log out
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
            <div className="flex flex-wrap gap-6">
              <button
                type="button"
                onClick={handleCreateSchedule}
                className="group relative flex h-[320px] w-[280px] shrink-0 flex-col items-center justify-center rounded-2xl border border-white/15 bg-white/10 p-6 text-center shadow-[0_12px_30px_rgba(0,0,0,0.25)] transition-all duration-300 hover:-translate-y-1 hover:border-blue-400/40 hover:bg-white/15 hover:shadow-[0_18px_40px_rgba(37,99,235,0.18)]"
              >
                <div className="mb-6 flex h-28 w-28 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/60 transition-colors group-hover:text-blue-300">
                  <svg
                    width="62"
                    height="62"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 5v14" />
                    <path d="M5 12h14" />
                  </svg>
                </div>

                <h2 className="text-2xl font-bold text-white">Create New Schedule</h2>
                <p className="mt-3 max-w-[200px] text-sm leading-6 text-white/60">
                  Start building a new fitness schedule from scratch.
                </p>

                <div className="absolute bottom-0 right-0 h-10 w-10 overflow-hidden">
                  <div className="absolute bottom-0 right-0 h-10 w-10 border-l border-t border-white/10 bg-white/10 [clip-path:polygon(100%_0,0_100%,100%_100%)]" />
                </div>
              </button>

              {schedules.length > 0 ? (
                schedules.map((schedule) => {
                  const isSelected = selectedScheduleIds.includes(schedule.id);

                  return (
                    <button
                      key={schedule.id}
                      type="button"
                      onClick={() => handleOpenSchedule(schedule)}
                      className={`group relative flex h-[320px] w-[280px] shrink-0 flex-col rounded-2xl border bg-white/10 p-5 text-left shadow-[0_12px_30px_rgba(0,0,0,0.25)] transition-all duration-300 hover:-translate-y-1 hover:bg-white/15
                        ${
                          isSelected
                            ? "border-blue-400/50 ring-2 ring-blue-400/30"
                            : "border-white/15 hover:border-cyan-400/40 hover:shadow-[0_18px_40px_rgba(34,211,238,0.16)]"
                        }`}
                    >
                     
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleScheduleSelection(schedule.id);
                        }}
                        className={`absolute right-4 top-4 z-10 inline-flex h-10 w-10 items-center justify-center rounded-xl border backdrop-blur-xl transition-colors
                          ${
                            isSelected
                              ? "border-blue-400/50 bg-blue-500/25 text-white"
                              : "border-white/15 bg-white/5 text-white/60 hover:bg-white/10"
                          }`}
                        aria-label={`Select ${schedule.title ?? "schedule"} for compare`}
                        title={isSelected ? "Selected" : "Select for compare"}
                      >
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                      </button>

                      
                      <div className="mb-4 border-b border-white/10 pb-4 pr-12">
                        <h3 className="line-clamp-2 text-2xl font-bold leading-tight text-white">
                          {schedule.title || "Untitled Schedule"}
                        </h3>
                      </div>

                      <div className="flex-1 space-y-3 text-sm text-white/75">
                        {schedule.startDate || schedule.endDate ? (
                          <div>
                            <p className="text-white/50">Date Range</p>
                            <p className="mt-1 font-medium text-white">
                              {schedule.startDate || "—"}{" "}
                              <span className="text-white/50">to</span>{" "}
                              {schedule.endDate || "—"}
                            </p>
                          </div>
                        ) : null}

                        {!schedule.startDate && !schedule.endDate && (
                          <p className="text-white/50">No details available yet.</p>
                        )}
                      </div>

                      <div className="mt-5 border-t border-white/10 pt-4 text-sm font-medium text-cyan-200 transition-colors group-hover:text-white">
                        Open Schedule
                      </div>

                      <div className="absolute bottom-0 right-0 h-10 w-10 overflow-hidden">
                        <div className="absolute bottom-0 right-0 h-10 w-10 border-l border-t border-white/10 bg-white/10 [clip-path:polygon(100%_0,0_100%,100%_100%)]" />
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="flex h-[320px] min-w-[280px] flex-1 items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-8 text-center">
                  <div>
                    <p className="text-lg font-semibold text-white/75">
                      No schedules created yet
                    </p>
                    <p className="mt-2 text-sm text-white/50">
                      Your saved schedules will appear here once they are available.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 text-sm text-white/50">
              Selected for compare:{" "}
              <span className="text-white/80 font-medium">{selectedScheduleIds.length}</span>{" "}
              (need 3+)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}