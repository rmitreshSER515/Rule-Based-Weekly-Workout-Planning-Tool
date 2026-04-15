import { useEffect, useMemo, useState } from "react";
import { createNotification } from "../api/notifications";
import { fetchUsers, type UserSummary } from "../api/users";

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
}

export default function ShareSchedulesModal({
  isOpen,
  onClose,
  schedules,
}: ShareSchedulesModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [usersError, setUsersError] = useState("");

  const currentUserId = useMemo(() => {
    if (!isOpen) return null;
    try {
      const stored = localStorage.getItem("user");
      if (!stored) return null;
      const u = JSON.parse(stored) as { id?: string; _id?: string };
      const id = u.id ?? u._id;
      return typeof id === "string" ? id : null;
    } catch {
      return null;
    }
  }, [isOpen]);

  const filteredUsers = useMemo(
    () =>
      currentUserId
        ? users.filter((u) => u.id !== currentUserId)
        : users,
    [users, currentUserId],
  );

  const toggleUserSelection = (id: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSend = () => {
    const stored = localStorage.getItem("user");
    const senderId = stored ? (JSON.parse(stored)?.id ?? JSON.parse(stored)?._id) : null;
    if (!senderId) {
      onClose();
      return;
    }
    const notifications = [];
    for (const schedule of schedules) {
      for (const userId of selectedUserIds) {
        if (userId === senderId) continue;
        notifications.push(
          createNotification({
            userId,
            fromUserId: senderId,
            scheduleId: schedule.id,
            message: `Schedule shared: ${schedule.title || "Untitled Schedule"}`,
          })
        );
      }
    }
    Promise.all(notifications)
      .catch((err) => {
        console.error("Failed to send notifications", err);
      })
      .finally(() => onClose());
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
    setSearchQuery("");
    setSelectedUserIds([]);
    setUsers([]);
    setUsersError("");
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;

    const load = async () => {
      setLoadingUsers(true);
      setUsersError("");
      try {
        const data = await fetchUsers(searchQuery);
        if (!cancelled) setUsers(data);
      } catch (err) {
        console.error("Failed to load users", err);
        if (!cancelled) setUsersError("Failed to load users");
      } finally {
        if (!cancelled) setLoadingUsers(false);
      }
    };

    const timer = window.setTimeout(load, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [isOpen, searchQuery]);

  if (!isOpen) return null;

  const heading = schedules.length === 1 ? "Share Schedule" : "Share Schedules";
  const summary =
    schedules.length === 1
      ? "Select one or more users to share this schedule."
      : `Select users to share ${schedules.length} schedules.`;

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
                  Share Preview
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

            <div className="mt-8 space-y-4">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search users by name..."
                  className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 pr-12 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-400/40 focus:border-cyan-400/40"
                />
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white/50">
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </span>
              </div>

              <div className="max-h-72 overflow-y-auto rounded-2xl border border-white/12 bg-white/5 p-3">
                {loadingUsers ? (
                  <p className="text-sm text-white/50 px-2 py-3">
                    Loading users...
                  </p>
                ) : usersError ? (
                  <p className="text-sm text-red-300/80 px-2 py-3">
                    {usersError}
                  </p>
                ) : filteredUsers.length === 0 ? (
                  <p className="text-sm text-white/50 px-2 py-3">
                    No users found.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {filteredUsers.map((user) => {
                      const name = `${user.firstName} ${user.lastName}`.trim();
                      const checked = selectedUserIds.includes(user.id);
                      return (
                        <li
                          key={user.id}
                          className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleUserSelection(user.id)}
                            className="h-4 w-4 rounded border-white/30 bg-white/10 accent-cyan-500"
                          />
                          <span className="text-sm text-white/80">
                            {name || user.email}
                          </span>
                          <span className="ml-auto text-xs text-white/40">
                            {user.email}
                          </span>
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
                disabled={selectedUserIds.length === 0}
                className="rounded-xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/30 transition-all hover:shadow-cyan-500/45 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
