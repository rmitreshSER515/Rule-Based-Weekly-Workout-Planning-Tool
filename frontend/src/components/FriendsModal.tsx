import { useEffect, useMemo, useState } from "react";
import {
  deleteFriend,
  fetchFriends,
  sendFriendRequestByEmail,
  type UserSummary,
} from "../api/users";

interface FriendsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FriendsModal({
  isOpen,
  onClose,
}: FriendsModalProps) {
  const [friends, setFriends] = useState<UserSummary[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [friendsError, setFriendsError] = useState("");
  const [friendEmail, setFriendEmail] = useState("");
  const [friendRequestMessage, setFriendRequestMessage] = useState("");
  const [friendRequestError, setFriendRequestError] = useState("");
  const [isSendingRequest, setIsSendingRequest] = useState(false);
  const [removingFriendId, setRemovingFriendId] = useState<string | null>(null);

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

    setFriends([]);
    setFriendsError("");
    setFriendEmail("");
    setFriendRequestMessage("");
    setFriendRequestError("");

    if (!senderId) {
      setFriendsError("Please sign in again to manage friends.");
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

  const handleAddFriend = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!senderId) {
      setFriendRequestError("Please sign in again.");
      return;
    }

    const email = friendEmail.trim().toLowerCase();
    if (!email) {
      setFriendRequestError("Enter a full email address.");
      return;
    }

    setIsSendingRequest(true);
    setFriendRequestError("");
    setFriendRequestMessage("");

    try {
      const result = await sendFriendRequestByEmail(senderId, email);
      setFriendRequestMessage(result?.message ?? "Request sent.");
      setFriendEmail("");
    } catch (err: any) {
      console.error("Failed to send friend request", err);
      setFriendRequestError(err?.message ?? "Failed to send friend request");
    } finally {
      setIsSendingRequest(false);
    }
  };

  const handleRemoveFriend = async (friend: UserSummary) => {
    if (!senderId) {
      setFriendRequestError("Please sign in again.");
      return;
    }

    const friendName = `${friend.firstName} ${friend.lastName}`.trim() || friend.email;
    setRemovingFriendId(friend.id);
    setFriendRequestError("");
    setFriendRequestMessage("");

    try {
      const result = await deleteFriend(senderId, friend.id);
      setFriends((prev) => prev.filter((item) => item.id !== friend.id));
      setFriendRequestMessage(
        result?.message ?? `Removed "${friendName}" from your friends`,
      );
    } catch (err: any) {
      console.error("Failed to remove friend", err);
      setFriendRequestError(err?.message ?? "Failed to remove friend");
    } finally {
      setRemovingFriendId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        className="relative z-10 w-full max-w-3xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="friends-modal-heading"
      >
        <div className="overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950" />
          <div className="absolute -top-32 -left-32 h-[520px] w-[520px] rounded-full bg-fuchsia-500/20 blur-[90px]" />
          <div className="absolute -bottom-40 -right-40 h-[620px] w-[620px] rounded-full bg-cyan-400/15 blur-[110px]" />

          <div className="relative z-10 p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-cyan-200/80">
                  Friends
                </p>
                <h2
                  id="friends-modal-heading"
                  className="mt-3 text-3xl font-bold text-white"
                >
                  Manage Friends
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65">
                  Add friends using their full email address. They can accept your request from notifications.
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="shrink-0 rounded-xl border border-white/15 bg-white/5 p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Close friends modal"
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

            <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_1.2fr]">
              <div className="rounded-2xl border border-white/12 bg-white/5 p-4">
                <h3 className="text-sm font-semibold text-white">Add friend</h3>
                <form onSubmit={handleAddFriend} className="mt-4 space-y-3">
                  <input
                    type="email"
                    value={friendEmail}
                    onChange={(e) => setFriendEmail(e.target.value)}
                    placeholder="Enter a friend's full email"
                    className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-400/40 focus:border-cyan-400/40"
                  />
                  <button
                    type="submit"
                    disabled={isSendingRequest || !friendEmail.trim()}
                    className="w-full rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2.5 text-sm font-semibold text-cyan-100 transition-colors hover:bg-cyan-400/15 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSendingRequest ? "Sending..." : "Send Friend Request"}
                  </button>
                </form>

                {friendRequestMessage ? (
                  <p className="mt-3 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
                    {friendRequestMessage}
                  </p>
                ) : null}

                {friendRequestError ? (
                  <p className="mt-3 rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                    {friendRequestError}
                  </p>
                ) : null}
              </div>

              <div className="rounded-2xl border border-white/12 bg-white/5 p-4">
                <h3 className="text-sm font-semibold text-white">Your friends</h3>
                <p className="mt-1 text-xs leading-5 text-white/55">
                  Only accepted friends can receive shared schedules.
                </p>

                <div className="mt-4 max-h-72 overflow-y-auto rounded-2xl border border-white/12 bg-white/5 p-3">
                  {loadingFriends ? (
                    <p className="px-2 py-3 text-sm text-white/50">Loading friends...</p>
                  ) : friendsError ? (
                    <p className="px-2 py-3 text-sm text-red-300/80">{friendsError}</p>
                  ) : friends.length === 0 ? (
                    <p className="px-2 py-3 text-sm text-white/50">
                      No accepted friends yet.
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {friends.map((friend) => {
                        const name = `${friend.firstName} ${friend.lastName}`.trim() || friend.email;
                        return (
                          <li
                            key={friend.id}
                            className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-sm text-white/85">{name}</p>
                              <p className="text-xs text-white/40">{friend.email}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => void handleRemoveFriend(friend)}
                              disabled={removingFriendId === friend.id}
                              className="rounded-lg border border-red-400/25 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-200 transition-colors hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {removingFriendId === friend.id ? "Removing..." : "Remove"}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-sm font-medium text-white/90 transition-colors hover:bg-white/10 hover:text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
