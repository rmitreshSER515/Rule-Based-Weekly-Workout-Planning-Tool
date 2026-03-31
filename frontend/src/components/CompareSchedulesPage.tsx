import { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { fetchSchedules, type ScheduleDto } from "../api/schedules";
import {
  fetchScheduleMetrics,
  type ScheduleMetrics,
  type ExerciseIntensitySummary,
} from "../api/metrics";


type IntensityLevel = "recovery" | "easy" | "medium" | "hard" | "allOut";

const INTENSITY_LEVELS: IntensityLevel[] = [
  "recovery",
  "easy",
  "medium",
  "hard",
  "allOut",
];

const intensityLabel: Record<IntensityLevel, string> = {
  recovery: "Recovery",
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
  allOut: "All-Out",
};

const intensityScale: Record<IntensityLevel, number> = {
  recovery: 1,
  easy: 2,
  medium: 3,
  hard: 4,
  allOut: 5,
};

const intensityPill: Record<IntensityLevel, string> = {
  recovery: "bg-emerald-500/20 text-emerald-200 ring-1 ring-emerald-400/30",
  easy: "bg-lime-500/20 text-lime-200 ring-1 ring-lime-400/30",
  medium: "bg-amber-500/20 text-amber-200 ring-1 ring-amber-400/30",
  hard: "bg-orange-500/20 text-orange-200 ring-1 ring-orange-400/30",
  allOut: "bg-red-500/20 text-red-200 ring-1 ring-red-400/30",
};

const normalizeIntensity = (value: string): IntensityLevel => {
  const n = value.trim().toLowerCase();
  if (n === "recovery") return "recovery";
  if (n === "easy") return "easy";
  if (n === "medium") return "medium";
  if (n === "hard") return "hard";
  if (
    n === "allout" ||
    n === "all-out" ||
    n === "all out" ||
    n === "all-out effort" ||
    n === "all out effort"
  )
    return "allOut";
  return "easy"; 
};


const parseDateLocal = (s: string): Date => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};

const dateKeyFromDate = (d: Date): string => {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];


interface ScheduleStats {
  exerciseCounts: Record<IntensityLevel, number>;
  totalExercises: number;
  totalMinutes: number;
  perDayMinutes: { label: string; minutes: number }[];
  averageIntensity: number; 
  averageIntensityLabel: string;
  restDays: number;
  intensityDays: number; 
}

function computeStats(schedule: ScheduleDto): ScheduleStats {
  const cal = schedule.calendarExercises ?? {};
  const counts: Record<IntensityLevel, number> = {
    recovery: 0,
    easy: 0,
    medium: 0,
    hard: 0,
    allOut: 0,
  };

  let totalMinutes = 0;
  let intensitySum = 0;
  let exerciseCount = 0;


  const start = parseDateLocal(schedule.startDate);
  const end = parseDateLocal(schedule.endDate);
  const perDayMap = new Map<string, number>();

  const cursor = new Date(start);
  while (cursor <= end) {
    perDayMap.set(dateKeyFromDate(cursor), 0);
    cursor.setDate(cursor.getDate() + 1);
  }

  for (const [dateKey, items] of Object.entries(cal)) {
    let dayTotal = 0;
    for (const item of items) {
      const level = normalizeIntensity(String(item.intensity));
      counts[level]++;
      exerciseCount++;
      intensitySum += intensityScale[level];

      const hrs = parseInt(item.duration?.hours || "0", 10) || 0;
      const mins = parseInt(item.duration?.minutes || "0", 10) || 0;
      const itemMins = hrs * 60 + mins;
      totalMinutes += itemMins;
      dayTotal += itemMins;
    }
    if (perDayMap.has(dateKey)) {
      perDayMap.set(dateKey, dayTotal);
    }
  }

  
  const perDayMinutes: { label: string; minutes: number }[] = [];
  for (const [key, mins] of perDayMap) {
    const d = parseDateLocal(key);
    perDayMinutes.push({
      label: `${DAY_NAMES[d.getDay()]} ${d.getDate()}`,
      minutes: mins,
    });
  }

  
  const avgNum = exerciseCount > 0 ? intensitySum / exerciseCount : 0;
  let avgLabel = "—";
  if (exerciseCount > 0) {
    const rounded = Math.round(avgNum);
    const found = INTENSITY_LEVELS.find(
      (l) => intensityScale[l] === rounded
    );
    avgLabel = found ? intensityLabel[found] : "—";
  }

 
  let restDays = 0;
  let intensityDays = 0; 
  
  for (const [dateKey] of perDayMap) {
    const items = cal[dateKey] ?? [];
    if (items.length === 0) {
      restDays++;
    } else {
      
      const hasHighIntensity = items.some((item) => {
        const level = normalizeIntensity(String(item.intensity));
        return level === "hard" || level === "allOut";
      });
      
      if (hasHighIntensity) {
        intensityDays++;
      }
    }
  }

  return {
    exerciseCounts: counts,
    totalExercises: exerciseCount,
    totalMinutes,
    perDayMinutes,
    averageIntensity: avgNum,
    averageIntensityLabel: avgLabel,
    restDays,
    intensityDays, 
  };
}

const formatTime = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};


export default function CompareSchedulesPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const passedIds: string[] =
    (location.state as { selectedScheduleIds?: string[] })
      ?.selectedScheduleIds ?? [];

  const [allSchedules, setAllSchedules] = useState<ScheduleDto[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>(passedIds);
  const [loading, setLoading] = useState(true);
  const [metricsByScheduleId, setMetricsByScheduleId] =
  useState<Record<string, ScheduleMetrics>>({});
  const [openIntensityKeys, setOpenIntensityKeys] = useState<Set<string>>(
    () => new Set()
  );

  
  const [exercisesExpanded, setExercisesExpanded] = useState(true);
  const [timeExpanded, setTimeExpanded] = useState(false);

 
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const stored = localStorage.getItem("user");
        if (!stored) return;
        const user = JSON.parse(stored);
        const userId = user?.id ?? user?._id;
        if (!userId) return;
        const items = await fetchSchedules(userId);
        if (!cancelled) setAllSchedules(items);
      } catch (err) {
        console.error("Failed to load schedules", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectedSchedules = useMemo(
    () => allSchedules.filter((s) => selectedIds.includes(s.id)),
    [allSchedules, selectedIds]
  );

  
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (selectedSchedules.length === 0) {
        setMetricsByScheduleId({});
        return;
      }

      const entries = await Promise.all(
        selectedSchedules.map(async (schedule) => {
          try {
            const data = await fetchScheduleMetrics(schedule.id);
            return [schedule.id, data.metrics] as const;
          } catch (err) {
            console.error("Failed to load metrics for schedule", schedule.id, err);
            return null;
          }
        })
      );

      if (cancelled) return;

      const next: Record<string, ScheduleMetrics> = {};
      for (const entry of entries) {
        if (entry) {
          next[entry[0]] = entry[1];
        }
      }
      setMetricsByScheduleId(next);
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [selectedSchedules]);

  const statsMap = useMemo(() => {
    const map = new Map<string, ScheduleStats>();
    for (const s of selectedSchedules) {
      map.set(s.id, computeStats(s));
    }
    return map;
  }, [selectedSchedules]);

  const intensityBreakdownBySchedule = useMemo(() => {
  const map = new Map<
    string,
    Record<IntensityLevel, ExerciseIntensitySummary[]>
  >();

    for (const schedule of selectedSchedules) {
      const metrics = metricsByScheduleId[schedule.id];
      const buckets: Record<IntensityLevel, ExerciseIntensitySummary[]> = {
        recovery: [],
        easy: [],
        medium: [],
        hard: [],
        allOut: [],
      };

      if (metrics?.exerciseIntensityBreakdown) {
        for (const entry of metrics.exerciseIntensityBreakdown) {
          const level = entry.intensity as IntensityLevel;
          if (buckets[level]) {
            buckets[level].push(entry);
          }
        }
      }

      for (const level of INTENSITY_LEVELS) {
        buckets[level].sort((a, b) => {
          if (b.count !== a.count) return b.count - a.count;
          return a.name.localeCompare(b.name);
        });
      }

      map.set(schedule.id, buckets);
    }

    return map;
  }, [metricsByScheduleId, selectedSchedules]);

  const toggleIntensityDropdown = (key: string) => {
    setOpenIntensityKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  /* ── Row rendering helpers ── */
  const renderLabelRow = (
    label: string,
    getValue: (stats: ScheduleStats) => string | number,
    bold = false
  ) => (
    <div className="contents" key={label}>
      <div
        className={`flex items-center px-4 py-3 border-b border-white/5 ${
          bold ? "font-semibold text-white" : "text-white/70 pl-8"
        }`}
      >
        {label}
      </div>
      {selectedSchedules.map((s) => {
        const stats = statsMap.get(s.id);
        return (
          <div
            key={s.id}
            className={`flex items-center justify-center px-4 py-3 border-b border-white/5 ${
              bold ? "font-semibold text-white" : "text-white/80"
            }`}
          >
            {stats ? getValue(stats) : "—"}
          </div>
        );
      })}
    </div>
  );


  const gridCols = `minmax(220px, 260px) repeat(${selectedSchedules.length}, minmax(140px, 1fr))`;

  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-slate-950">
      {/* Background effects — same as FitnessTrackerPage */}
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
          {/* Header */}
          <div className="mb-8 border-b border-white/15 pb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl sm:text-5xl font-extrabold tracking-wide text-white drop-shadow">
                  Compare Schedules
                </h1>
                <p className="mt-3 text-sm sm:text-base text-white/65">
                  Side-by-side statistics for your selected schedules
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate("/fitness")}
                className="rounded-xl border border-white/20 bg-white/5 px-5 py-2.5 text-sm font-medium text-white/90 backdrop-blur-xl transition-colors hover:bg-white/10 hover:text-white"
              >
                ← Back
              </button>
            </div>
          </div>

          {/* Main layout */}
          <div className="flex gap-6">
            {/* Left sidebar — schedule selection */}
            <div className="w-[240px] shrink-0 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 self-start">
              <h2 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-4">
                Schedules
              </h2>
              {loading ? (
                <p className="text-sm text-white/40 animate-pulse">
                  Loading…
                </p>
              ) : allSchedules.length === 0 ? (
                <p className="text-sm text-white/40">No schedules found.</p>
              ) : (
                <ul className="space-y-1.5">
                  {allSchedules.map((s) => {
                    const checked = selectedIds.includes(s.id);
                    return (
                      <li key={s.id}>
                        <button
                          type="button"
                          onClick={() => toggleSelection(s.id)}
                          className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                            checked
                              ? "bg-blue-500/15 text-white border border-blue-400/30"
                              : "text-white/70 hover:bg-white/5 border border-transparent"
                          }`}
                        >
                          {/* Checkbox */}
                          <span
                            className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
                              checked
                                ? "border-blue-400/60 bg-blue-500/30"
                                : "border-white/25 bg-white/5"
                            }`}
                          >
                            {checked && (
                              <svg
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M20 6 9 17l-5-5" />
                              </svg>
                            )}
                          </span>
                          <span className="truncate">
                            {s.title || "Untitled Schedule"}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Right — comparison table */}
            <div className="flex-1 min-w-0 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden">
              {selectedSchedules.length === 0 ? (
                <div className="flex items-center justify-center h-64 text-white/40 text-lg">
                  Select schedules from the sidebar to compare
                </div>
              ) : (
                <div className="overflow-x-auto compare-table-scroll">
                  {/* Column headers */}
                  <div
                    className="grid border-b border-white/10"
                    style={{ gridTemplateColumns: gridCols }}
                  >
                    <div className="px-4 py-4" />
                    {selectedSchedules.map((s) => (
                      <div
                        key={s.id}
                        className="px-4 py-4 text-center border-l border-white/5"
                      >
                        <h3 className="text-sm font-bold text-white truncate">
                          {s.title || "Untitled"}
                        </h3>
                        <p className="text-xs text-white/40 mt-1">
                          {s.startDate} — {s.endDate}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Data rows */}
                  <div
                    className="grid"
                    style={{ gridTemplateColumns: gridCols }}
                  >
                    {/* ─── Number of Exercises (collapsible) ─── */}
                    <div className="contents">
                      <button
                        type="button"
                        onClick={() =>
                          setExercisesExpanded((v) => !v)
                        }
                        className="flex items-center gap-2 px-4 py-3 font-semibold text-white border-b border-white/5 hover:bg-white/5 transition-colors text-left"
                      >
                        Number of Exercises
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className={`transition-transform ${
                            exercisesExpanded ? "" : "rotate-180"
                          }`}
                        >
                          <path d="m18 15-6-6-6 6" />
                        </svg>
                      </button>
                      {selectedSchedules.map((s) => {
                        const stats = statsMap.get(s.id);
                        return (
                          <div
                            key={s.id}
                            className="flex items-center justify-center px-4 py-3 font-semibold text-white border-b border-white/5 border-l border-l-white/5"
                          >
                            {stats?.totalExercises ?? 0}
                          </div>
                        );
                      })}
                    </div>

                    {/* Intensity sub-rows */}
                    {exercisesExpanded &&
                      INTENSITY_LEVELS.map((level) => (
                        <div className="contents" key={level}>
                          <div className="flex items-center gap-2 pl-8 pr-4 py-2.5 text-sm text-white/70 border-b border-white/5">
                            <span
                              className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold leading-none ${intensityPill[level]}`}
                            >
                              {intensityScale[level]}
                            </span>
                            {intensityLabel[level]} Exercises
                          </div>
                          {selectedSchedules.map((s) => {
                            const stats = statsMap.get(s.id);
                            const breakdown =
                              intensityBreakdownBySchedule.get(s.id)?.[level] ?? [];
                            const dropdownKey = `${s.id}:${level}`;
                            const isOpen = openIntensityKeys.has(dropdownKey);
                            return (
                              <div
                                key={s.id}
                                className="flex flex-col items-center justify-center gap-2 px-4 py-2.5 text-sm text-white/80 border-b border-white/5 border-l border-l-white/5"
                              >
                                <span className="text-sm font-semibold">
                                  {stats?.exerciseCounts[level] ?? 0}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => toggleIntensityDropdown(dropdownKey)}
                                  className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-white/80 hover:bg-white/10 transition-colors"
                                >
                                  {isOpen ? "Hide exercises" : "Show exercises"}
                                </button>
                                {isOpen && (
                                  <div className="w-full rounded-lg border border-white/10 bg-white/5 px-2.5 py-2 text-[11px] text-white/80">
                                    {breakdown.length === 0 ? (
                                      <div className="text-white/50 text-xs">
                                        No exercises in this intensity
                                      </div>
                                    ) : (
                                      <ul className="space-y-1">
                                        {breakdown.map((item) => (
                                          <li
                                            key={`${item.name}-${item.intensity}`}
                                            className="flex items-center justify-between gap-2"
                                          >
                                            <span className="truncate">
                                              {item.name}
                                            </span>
                                            <span className="text-white/60">
                                              {item.count}
                                            </span>
                                          </li>
                                        ))}
                                      </ul>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ))}

                    {/* ─── Total Weekly Time (collapsible) ─── */}
                    <div className="contents">
                      <button
                        type="button"
                        onClick={() => setTimeExpanded((v) => !v)}
                        className="flex items-center gap-2 px-4 py-3 font-semibold text-white border-b border-white/5 hover:bg-white/5 transition-colors text-left"
                      >
                        Total Weekly Time
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className={`transition-transform ${
                            timeExpanded ? "" : "rotate-180"
                          }`}
                        >
                          <path d="m18 15-6-6-6 6" />
                        </svg>
                      </button>
                      {selectedSchedules.map((s) => {
                        const stats = statsMap.get(s.id);
                        return (
                          <div
                            key={s.id}
                            className="flex items-center justify-center px-4 py-3 font-semibold text-white border-b border-white/5 border-l border-l-white/5"
                          >
                            {stats ? formatTime(stats.totalMinutes) : "—"}
                          </div>
                        );
                      })}
                    </div>

                    {/* Per-day sub-rows */}
                    {timeExpanded &&
                      (() => {
                        
                        const firstStats = statsMap.get(
                          selectedSchedules[0]?.id
                        );
                        if (!firstStats) return null;
                        return firstStats.perDayMinutes.map(
                          (day, idx) => (
                            <div className="contents" key={day.label}>
                              <div className="pl-8 pr-4 py-2.5 text-sm text-white/70 border-b border-white/5">
                                {day.label}
                              </div>
                              {selectedSchedules.map((s) => {
                                const stats = statsMap.get(s.id);
                                const dayData =
                                  stats?.perDayMinutes[idx];
                                return (
                                  <div
                                    key={s.id}
                                    className="flex items-center justify-center px-4 py-2.5 text-sm text-white/80 border-b border-white/5 border-l border-l-white/5"
                                  >
                                    {dayData
                                      ? formatTime(dayData.minutes)
                                      : "—"}
                                  </div>
                                );
                              })}
                            </div>
                          )
                        );
                      })()}

                    {/* ─── Average Intensity ─── */}
                    {renderLabelRow(
                      "Average Intensity",
                      (s) => s.averageIntensityLabel,
                      true
                    )}

                    {/* ─── Rest Days ─── */}
                    {renderLabelRow(
                      "Rest Days",
                      (s) => s.restDays,
                      true
                    )}

                    {/* ─── Intensity Days ─── ADDED */}
                    {renderLabelRow(
                      "Intensity Days",
                      (s) => s.intensityDays,
                      true
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}