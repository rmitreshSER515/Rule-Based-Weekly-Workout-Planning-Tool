import { useEffect, useMemo, useState } from "react";
import { createNotification } from "../api/notifications";
import { fetchFriends, type UserSummary } from "../api/users";

export type ShareableScheduleSummary = {
  id: string;
  title: string;
  startDate?: string;
  endDate?: string;
  exerciseCount?: number;
  selectedRuleCount?: number;
};

interface ShareSchedulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedules: ShareableScheduleSummary[];
  onManageFriends?: () => void;
  onShared?: () => void;
}

export default function ShareSchedulesModal({
  isOpen,
  onClose,
  schedules,
  onManageFriends,
  onShared,
}: ShareSchedulesModalProps) {
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [friends, setFriends] = useState<UserSummary[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [friendsError, setFriendsError] = useState("");
  const [isSharing, setIsSharing] = useState(false);

  const senderId = useMemo(() => {
    try {
      const stored = localStorage.getItem("user");
      if (!stored) return null;
      const parsed = JSON.parse(stored);
      return parsed?.id ?? parsed?._id ?? null;
    } catch {
      return null;
    }
  }, []);

  const toggleUserSelection = (id: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;

    setSelectedUserIds([]);
    setFriends([]);
    setFriendsError("");

    if (!senderId) {
      setFriendsError("Please sign in again to load your friends.");
      return;
    }

    let cancelled = false;

    const loadFriends = async () => {
      setLoadingFriends(true);
      try {
        const data = await fetchFriends(senderId);
        if (!cancelled) {
          setFriends(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Failed to load friends", err);
        if (!cancelled) {
          setFriendsError("Failed to load friends");
        }
      } finally {
        if (!cancelled) {
          setLoadingFriends(false);
        }
      }
    };

    void loadFriends();

    return () => {
      cancelled = true;
    };
  }, [isOpen, senderId]);

  if (!isOpen) return null;

  const heading = schedules.length === 1 ? "Share Schedule" : "Share Schedules";
  const summary =
    schedules.length === 1
      ? "Share this schedule with accepted friends only."
      : `Share ${schedules.length} schedules with accepted friends only.`;
  const shareButtonLabel = `Share ${schedules.length} schedule${schedules.length === 1 ? "" : "s"}`;

  const handleSend = async () => {
    if (!senderId) {
      onClose();
      return;
    }

    if (schedules.some((schedule) => !schedule.id || schedule.id === "draft-schedule")) {
      setFriendsError("Please save the schedule before sharing it.");
      return;
    }

    setIsSharing(true);
    setFriendsError("");

    try {
      await Promise.all(
        schedules.flatMap((schedule) =>
          selectedUserIds.map((userId) =>
            createNotification({
              userId,
              fromUserId: senderId,
              scheduleId: schedule.id,
              type: "schedule_share",
              message: `Schedule shared: ${schedule.title || "Untitled Schedule"}`,
            }),
          ),
        ),
      );
      onShared?.();
      onClose();
    } catch (err: any) {
      console.error("Failed to send notifications", err);
      setFriendsError(err?.message ?? "Failed to share schedule");
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        className="relative z-10 w-full max-w-4xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-schedules-heading"
      >
        <div className="overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 shadow-2xl">
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

          <div className="relative z-10 p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-cyan-200/80">
                  Friends Only
                </p>
                <h2
                  id="share-schedules-heading"
                  className="mt-3 text-3xl font-bold text-white"
                >
                  {heading}
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65">
                  {summary}
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="shrink-0 rounded-xl border border-white/15 bg-white/5 p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Close share preview"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.25"
                  strokeLinecap="round"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>

            <div className="mt-8 rounded-2xl border border-white/12 bg-white/5 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-white">Choose friends</h3>
                  <p className="mt-1 text-xs leading-5 text-white/55">
                    Select from your accepted friends to send this schedule.
                  </p>
                </div>
                {onManageFriends ? (
                  <button
                    type="button"
                    onClick={onManageFriends}
                    className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-3 py-2 text-xs font-semibold text-cyan-100 transition-colors hover:bg-cyan-400/15"
                  >
                    Manage Friends
                  </button>
                ) : null}
              </div>

              <div className="mt-4 max-h-72 overflow-y-auto rounded-2xl border border-white/12 bg-white/5 p-3">
                {loadingFriends ? (
                  <p className="px-2 py-3 text-sm text-white/50">Loading friends...</p>
                ) : friendsError ? (
                  <p className="px-2 py-3 text-sm text-red-300/80">{friendsError}</p>
                ) : friends.length === 0 ? (
                  <div className="px-2 py-3 text-sm text-white/50">
                    <p>No accepted friends yet.</p>
                    <p className="mt-2 text-white/40">
                      Add and manage friends from the Friends button first.
                    </p>
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {friends.map((user) => {
                      const name = `${user.firstName} ${user.lastName}`.trim() || user.email;
                      const checked = selectedUserIds.includes(user.id);

                      return (
                        <li key={user.id}>
                          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleUserSelection(user.id)}
                              className="h-4 w-4 rounded border-white/30 bg-white/10 accent-cyan-500"
                              aria-label={name}
                            />
                            <span className="text-sm text-white/85">{name}</span>
                            <span className="ml-auto text-xs text-white/40">{user.email}</span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>

            <div className="mt-8 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-sm font-medium text-white/90 transition-colors hover:bg-white/10 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSend}
                disabled={isSharing || selectedUserIds.length === 0}
                className="rounded-xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/30 transition-all hover:shadow-cyan-500/45 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSharing ? "Sharing..." : shareButtonLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
