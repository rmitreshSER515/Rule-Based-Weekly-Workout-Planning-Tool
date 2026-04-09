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
