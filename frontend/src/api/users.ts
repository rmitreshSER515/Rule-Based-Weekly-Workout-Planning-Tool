const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export type UserSummary = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role?: string;
};

export async function fetchUsers(search: string): Promise<UserSummary[]> {
  const url = new URL("/users", API_URL);
  if (search.trim()) {
    url.searchParams.set("search", search.trim());
  }

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    throw new Error("Failed to load users");
  }

  return (await res.json()) as UserSummary[];
}

export async function fetchFriends(userId: string): Promise<UserSummary[]> {
  const res = await fetch(`${API_URL}/users/${userId}/friends`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  const data = await res.json().catch(() => []);
  if (!res.ok) {
    throw new Error(data?.message ?? "Failed to load friends");
  }

  return Array.isArray(data) ? (data as UserSummary[]) : [];
}

export async function sendFriendRequestByEmail(userId: string, email: string) {
  const res = await fetch(`${API_URL}/users/friends/request`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, email: email.trim().toLowerCase() }),
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.message ?? "Failed to send friend request");
  }

  return data;
}

export async function deleteFriend(userId: string, friendId: string) {
  const res = await fetch(`${API_URL}/users/${userId}/friends/${friendId}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.message ?? "Failed to remove friend");
  }

  return data;
}
