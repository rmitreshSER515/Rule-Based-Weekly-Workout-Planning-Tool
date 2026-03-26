const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export type MetricIntensityLevel =
  | "recovery"
  | "easy"
  | "medium"
  | "hard"
  | "allOut";

export type ExerciseIntensitySummary = {
  name: string;
  intensity: MetricIntensityLevel;
  count: number;
};

export type ScheduleMetrics = {
  totalExercises: number;
  totalWorkoutMinutes: number;
  averageIntensity: number;
  exerciseIntensityBreakdown: ExerciseIntensitySummary[];
};

export type ScheduleMetricsResponse = {
  scheduleId: string;
  metrics: ScheduleMetrics;
};

export async function fetchScheduleMetrics(
  scheduleId: string
): Promise<ScheduleMetricsResponse> {
  const res = await fetch(`${API_URL}/metrics/schedules/${scheduleId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    throw new Error("Failed to load schedule metrics");
  }

  return (await res.json()) as ScheduleMetricsResponse;
}
