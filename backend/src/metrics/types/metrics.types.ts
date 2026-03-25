export type MetricIntensityLevel =
  | 'recovery'
  | 'easy'
  | 'medium'
  | 'hard'
  | 'allOut';

export type IntensityScale = 1 | 2 | 3 | 4 | 5;

export type ScheduleDuration = {
  hours?: string | number | null;
  minutes?: string | number | null;
};

export type ScheduleCalendarExerciseEntry = {
  id: string;
  exerciseId: string;
  name: string;
  notes?: string;
  intensity?: string | null;
  duration?: ScheduleDuration | null;
};

export type ScheduleCalendarExercises = Record<
  string,
  ScheduleCalendarExerciseEntry[]
>;

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

export type ScheduleMetricsComparison = {
  left: {
    scheduleId: string;
    metrics: ScheduleMetrics;
  };
  right: {
    scheduleId: string;
    metrics: ScheduleMetrics;
  };
};
