const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export type ScheduleDto = {
  id: string;
  userId: string;
  title: string;
  startDate: string;
  endDate: string;
  selectedRuleIds: string[];
  calendarExercises: Record<
    string,
    {
      id: string;
      exerciseId: string;
      name: string;
      notes: string;
      // Backend may return older or newer intensity strings; normalize in UI.
      intensity: string;
      duration: { hours: string; minutes: string };
    }[]
  >;
};

export type SaveScheduleInput = {
  userId: string;
  title: string;
  startDate: string;
  endDate: string;
  selectedRuleIds: string[];
  calendarExercises: Record<string, any[]>;
};

export async function fetchSchedule(
  userId: string,
): Promise<ScheduleDto | null> {
  const items = await fetchSchedules(userId);
  return items[0] ?? null;
}

export async function fetchSchedules(
  userId: string,
): Promise<ScheduleDto[]> {
  const url = new URL("/schedules", API_URL);
  url.searchParams.set("userId", userId);

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    throw new Error("Failed to load schedules");
  }

  const data = await res.json();
  return (data ?? []) as ScheduleDto[];
}

export async function fetchScheduleById(
  id: string,
): Promise<ScheduleDto | null> {
  const res = await fetch(`${API_URL}/schedules/${encodeURIComponent(id)}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (res.status === 404) {
    return null;
  }

  if (!res.ok) {
    throw new Error("Failed to load schedule");
  }

  return (await res.json()) as ScheduleDto;
}

export async function saveSchedule(
  input: SaveScheduleInput,
  scheduleId?: string | null,
): Promise<ScheduleDto> {
  const updating = Boolean(scheduleId);
  const url = updating
    ? `${API_URL}/schedules/${encodeURIComponent(scheduleId as string)}`
    : `${API_URL}/schedules`;

  const res = await fetch(url, {
    method: updating ? "PUT" : "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.message ?? "Failed to save schedule");
  }

  return data as ScheduleDto;
}
