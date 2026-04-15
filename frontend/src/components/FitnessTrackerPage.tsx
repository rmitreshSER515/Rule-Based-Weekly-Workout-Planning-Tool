import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "../utils/auth";
import { fetchSchedules, deleteSchedule } from "../api/schedules";
import {
  fetchNotifications,
  updateNotificationStatus,
  type NotificationDto,
} from "../api/notifications";
import ShareSchedulesModal, {
  type ShareableScheduleSummary,
} from "./ShareSchedulesModal";
import FriendsModal from "./FriendsModal";

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
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isFriendsModalOpen, setIsFriendsModalOpen] = useState(false);
  const [shareSuccessMessage, setShareSuccessMessage] = useState("");
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [confirmDeleteSchedule, setConfirmDeleteSchedule] = useState<{
    id: string;
    title: string;
  } | null>(null);

  const [selectedScheduleIds, setSelectedScheduleIds] = useState<string[]>([]);
  const canCompare = selectedScheduleIds.length >= 2;
  const canShare = selectedScheduleIds.length >= 1;
  const hasPendingNotifications = notifications.some(
    (n) => n.status === "pending"
  );

  
  const [searchQuery, setSearchQuery] = useState("");

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
    if (!userId) return;
    let cancelled = false;
    fetchNotifications(userId)
      .then((items) => {
        if (!cancelled) setNotifications(items);
      })
      .catch(() => {
        if (!cancelled) setNotifications([]);
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
  const handleDeleteSchedule = (schedule: ScheduleCard) => {
    setConfirmDeleteSchedule({
      id: schedule.id,
      title: schedule.title || "Untitled Schedule",
    });
  };

  const confirmDeleteScheduleAction = async () => {
    if (!confirmDeleteSchedule || !userId) return;
    const target = confirmDeleteSchedule;
    setConfirmDeleteSchedule(null);
    try {
      await deleteSchedule(target.id, userId);
      setSchedules((prev) => prev.filter((s) => s.id !== target.id));
      setSelectedScheduleIds((prev) => prev.filter((id) => id !== target.id));
    } catch (err) {
      console.error("Failed to delete schedule", err);
    }
  };
  const handleNotificationAction = async (
    notificationId: string,
    status: "accepted" | "declined"
  ) => {
    if (!userId) return;
    try {
      const updated = await updateNotificationStatus(notificationId, {
        userId,
        status,
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === updated.id ? updated : n))
      );
      if (status === "accepted") {
        const items = await fetchSchedules(userId);
        setSchedules(
          items.map((item) => ({
            id: item.id,
            title: item.title,
            startDate: item.startDate,
            endDate: item.endDate,
          }))
        );
      }
    } catch (err) {
      console.error("Failed to update notification", err);
    }
  };

  const handleCreateSchedule = () => {
    navigate("/schedules", { state: { mode: "create" } });
  };

  const handleShareSuccess = () => {
    setShareSuccessMessage(
      selectedScheduleIds.length > 1
        ? "Schedules shared successfully"
        : "Schedule shared successfully",
    );
    window.setTimeout(() => setShareSuccessMessage(""), 2500);
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

  
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const visibleSchedules = schedules
    .filter((s) => {
      if (!normalizedQuery) return true;
      const title = (s.title || "Untitled Schedule").toLowerCase();
      return title.includes(normalizedQuery);
    })
    .sort((a, b) => {
      const ta = (a.title || "Untitled Schedule").toLowerCase();
      const tb = (b.title || "Untitled Schedule").toLowerCase();
      return ta.localeCompare(tb);
    });

  const selectedSchedulePreviews: ShareableScheduleSummary[] = schedules
    .filter((schedule) => selectedScheduleIds.includes(schedule.id))
    .map((schedule) => ({
      id: schedule.id,
      title: schedule.title || "Untitled Schedule",
      startDate: schedule.startDate,
      endDate: schedule.endDate,
      exerciseCount: schedule.exerciseCount,
    }));

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
            <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
              <div className="w-full xl:flex-1 xl:pr-6">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-wide text-white drop-shadow">
                  Workout Planner
                </h1>
                <p className="mt-3 text-sm sm:text-base text-white/65 xl:max-w-xl">
                  Create, view, and compare your schedules
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-start gap-3 xl:max-w-[48rem] xl:justify-end">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() =>
                      setIsNotificationsOpen((prev) => !prev)
                    }
                    className="relative rounded-xl border border-white/20 bg-white/5 p-2.5 text-white/80 hover:bg-white/10 transition-colors"
                    aria-label="Notifications"
                  >
                    <svg
                      className="h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>
                    {hasPendingNotifications && (
                      <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-slate-950" />
                    )}
                  </button>

                  {isNotificationsOpen && (
                    <div className="absolute right-0 mt-3 w-80 max-h-96 overflow-y-auto rounded-2xl border border-white/15 bg-slate-900/95 backdrop-blur-xl shadow-2xl z-50">
                      <div className="px-4 py-3 border-b border-white/10 text-sm font-semibold text-white/80">
                        Notifications
                      </div>
                      {notifications.length === 0 ? (
                        <div className="px-4 py-6 text-sm text-white/50">
                          No notifications yet.
                        </div>
                      ) : (
                        <div className="p-3 space-y-3">
                          {notifications.map((n) => (
                            <div
                              key={n.id}
                              className="rounded-xl border border-white/10 bg-white/5 px-3 py-3"
                            >
                              <p className="text-sm text-white/80">
                                {n.message}
                              </p>
                              <div className="mt-2 flex items-center justify-end gap-2">
                                {n.status === "pending" ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleNotificationAction(
                                          n.id,
                                          "declined"
                                        )
                                      }
                                      className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white/70 hover:bg-white/10"
                                    >
                                      Decline
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleNotificationAction(
                                          n.id,
                                          "accepted"
                                        )
                                      }
                                      className="rounded-lg bg-emerald-500/20 border border-emerald-400/30 px-3 py-1.5 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/30"
                                    >
                                      Accept
                                    </button>
                                  </>
                                ) : (
                                  <span className="text-xs text-white/40">
                                    {n.status === "accepted"
                                      ? "Accepted"
                                      : "Declined"}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setIsFriendsModalOpen(true)}
                  className="rounded-xl border border-violet-400/30 bg-violet-400/10 px-5 py-2.5 text-sm font-semibold text-violet-100 backdrop-blur-xl transition-all hover:bg-violet-400/15 hover:text-white"
                >
                  Friends
                </button>

                <button
                  type="button"
                  disabled={!canShare}
                  onClick={() => setIsShareModalOpen(true)}
                  title={
                    canShare
                      ? "Preview selected schedules for sharing"
                      : "Select at least 1 schedule to share"
                  }
                  className={`rounded-xl border px-5 py-2.5 text-sm font-semibold backdrop-blur-xl transition-all
                    ${
                      canShare
                        ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-100 hover:bg-cyan-400/15 hover:text-white hover:shadow-lg hover:shadow-cyan-500/10"
                        : "border-white/10 bg-white/5 text-white/40 opacity-60 cursor-not-allowed"
                    }`}
                >
                  Share Schedules
                </button>

                <button
                  type="button"
                  disabled={!canCompare}
                  onClick={() => {
                    navigate("/compare", { state: { selectedScheduleIds } });
                  }}
                  title={
                    canCompare
                      ? "Compare selected schedules"
                      : "Select at least 2 schedules to compare"
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
                  className="rounded-xl border border-white/20 bg-white/5 p-2.5 text-white/80 backdrop-blur-xl transition-colors hover:bg-white/10 hover:text-white"
                  aria-label="Log out"
                  title="Log out"
                >
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3 text-sm text-white/50">
                <span>
                  Selected for actions:{" "}
                  <span className="text-white/80 font-medium">
                    {selectedScheduleIds.length}
                  </span>{" "}
                  (share 1+, compare 2+)
                </span>
                {shareSuccessMessage ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 px-3 py-1.5 text-xs font-medium text-emerald-300">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    {shareSuccessMessage}
                  </span>
                ) : null}
              </div>
              
              <div className="flex items-center gap-3">
                <div className="text-sm text-white/50">
                  Showing{" "}
                  <span className="text-white/80 font-medium">
                    {visibleSchedules.length}
                  </span>{" "}
                  of{" "}
                  <span className="text-white/80 font-medium">
                    {schedules.length}
                  </span>
                </div>

                <div className="relative">
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search schedules..."
                    className="w-[280px] rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 pr-11 text-sm text-white placeholder-white/40 outline-none backdrop-blur-xl focus:border-white/30 focus:ring-2 focus:ring-white/10"
                  />

                  {searchQuery.trim() ? (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg border border-white/15 bg-white/5 px-2 py-1 text-xs text-white/70 hover:bg-white/10 hover:text-white"
                      aria-label="Clear search"
                      title="Clear"
                    >
                      ×
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
           
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

                <h2 className="text-2xl font-bold text-white">
                  Create New Schedule
                </h2>
                <p className="mt-3 max-w-[200px] text-sm leading-6 text-white/60">
                  Start building a new fitness schedule from scratch.
                </p>

                <div className="absolute bottom-0 right-0 h-10 w-10 overflow-hidden">
                  <div className="absolute bottom-0 right-0 h-10 w-10 border-l border-t border-white/10 bg-white/10 [clip-path:polygon(100%_0,0_100%,100%_100%)]" />
                </div>
              </button>

              {visibleSchedules.length > 0 ? (
                visibleSchedules.map((schedule) => {
                  const isSelected = selectedScheduleIds.includes(schedule.id);

                  return (
                    <article
                      key={schedule.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleOpenSchedule(schedule)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          handleOpenSchedule(schedule);
                        }
                      }}
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
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDeleteSchedule(schedule);
                        }}
                        className="absolute right-4 bottom-4 z-10 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-white/50 transition-colors hover:bg-red-500/20 hover:text-red-200"
                        aria-label={`Delete ${schedule.title ?? "schedule"}`}
                        title="Delete schedule"
                      >
                        <svg
                          className="h-4 w-4"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                          <line x1="10" y1="11" x2="10" y2="17" />
                          <line x1="14" y1="11" x2="14" y2="17" />
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
                        ) : (
                          <p className="text-white/50">No details available yet.</p>
                        )}
                      </div>

                      <div className="mt-5 border-t border-white/10 pt-4 text-sm font-medium text-cyan-200 transition-colors group-hover:text-white">
                        Open Schedule
                      </div>

                      <div className="absolute bottom-0 right-0 h-10 w-10 overflow-hidden">
                        <div className="absolute bottom-0 right-0 h-10 w-10 border-l border-t border-white/10 bg-white/10 [clip-path:polygon(100%_0,0_100%,100%_100%)]" />
                      </div>
                    </article>
                  );
                })
              ) : (
                <div className="flex h-[320px] w-[280px] shrink-0 items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-8 text-center">
                  <div>
                    <p className="text-lg font-semibold text-white/75">
                      No matching schedules
                    </p>
                    <p className="mt-2 text-sm text-white/50">
                      Try a different title search.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ShareSchedulesModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        onManageFriends={() => {
          setIsShareModalOpen(false);
          setIsFriendsModalOpen(true);
        }}
        onShared={handleShareSuccess}
        schedules={selectedSchedulePreviews}
      />

      <FriendsModal
        isOpen={isFriendsModalOpen}
        onClose={() => setIsFriendsModalOpen(false)}
      />

      {confirmDeleteSchedule && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setConfirmDeleteSchedule(null)}
        >
          <div
            className="relative w-full max-w-sm rounded-2xl border border-red-400/20 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 shadow-2xl shadow-black/60"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-red-500/10 pointer-events-none" />
            <div className="relative p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="shrink-0 rounded-full bg-red-500/10 p-2.5 ring-1 ring-red-400/20">
                  <svg className="h-5 w-5 text-red-400/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    <line x1="10" y1="11" x2="10" y2="17" />
                    <line x1="14" y1="11" x2="14" y2="17" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white/90">Delete schedule</h3>
                  <p className="mt-1.5 text-sm text-white/40 leading-relaxed">
                    Are you sure you want to delete{" "}
                    <span className="font-medium text-white/70">
                      "{confirmDeleteSchedule.title}"
                    </span>
                    ? This action cannot be undone.
                  </p>
                </div>
              </div>
              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setConfirmDeleteSchedule(null)}
                  className="flex-1 rounded-xl border border-white/10 bg-white/5 text-white/70 py-2.5 text-sm font-medium hover:bg-white/8 hover:text-white/90 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteScheduleAction}
                  className="flex-1 rounded-xl bg-red-500/20 border border-red-400/20 py-2.5 text-sm font-semibold text-red-300 hover:bg-red-500/30 hover:border-red-400/30 hover:text-red-200 transition-all duration-200"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
