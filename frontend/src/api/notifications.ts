const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export type NotificationStatus = "pending" | "accepted" | "declined";
export type NotificationType = "schedule_share";

export type NotificationDto = {
  id: string;
  userId: string;
  fromUserId: string;
  scheduleId: string;
  message: string;
  status: NotificationStatus;
  type: NotificationType;
  createdAt?: string;
  updatedAt?: string;
};

export async function fetchNotifications(
  userId: string,
  status?: NotificationStatus
): Promise<NotificationDto[]> {
  const url = new URL("/notifications", API_URL);
  url.searchParams.set("userId", userId);
  if (status) url.searchParams.set("status", status);

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    throw new Error("Failed to load notifications");
  }

  return (await res.json()) as NotificationDto[];
}

export async function createNotification(input: {
  userId: string;
  fromUserId: string;
  scheduleId: string;
  message: string;
}): Promise<NotificationDto> {
  const res = await fetch(`${API_URL}/notifications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message ?? "Failed to create notification");
  }
  return data as NotificationDto;
}

export async function updateNotificationStatus(
  id: string,
  input: { userId: string; status: NotificationStatus }
): Promise<NotificationDto> {
  const res = await fetch(`${API_URL}/notifications/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message ?? "Failed to update notification");
  }
  return data as NotificationDto;
}
