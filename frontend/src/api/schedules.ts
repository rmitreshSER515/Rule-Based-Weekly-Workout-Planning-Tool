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
      intensity: "low" | "moderate" | "high";
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
  const url = new URL("/schedules", API_URL);
  url.searchParams.set("userId", userId);

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    throw new Error("Failed to load schedule");
  }

  const data = await res.json();
  return data ?? null;
}

export async function saveSchedule(
  input: SaveScheduleInput,
): Promise<ScheduleDto> {
  const res = await fetch(`${API_URL}/schedules`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.message ?? "Failed to save schedule");
  }

  return data as ScheduleDto;
}
