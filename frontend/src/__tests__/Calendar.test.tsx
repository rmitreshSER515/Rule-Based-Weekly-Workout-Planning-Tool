import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import SchedulePage from "../components/SchedulePage";
import { fetchExercises } from "../api/exercises";
import { fetchRules } from "../api/rules";
import { fetchSchedule } from "../api/schedules";

vi.mock("react-router-dom", () => ({
  useLocation: vi.fn(() => ({ pathname: "/schedule", state: null })),
  useNavigate: vi.fn(() => vi.fn()),
}));

vi.mock("../api/exercises", () => ({
  fetchExercises: vi.fn(),
  createExercise: vi.fn(),
}));

vi.mock("../api/rules", () => ({
  fetchRules: vi.fn(),
  createRule: vi.fn(),
}));

vi.mock("../api/schedules", () => ({
  fetchSchedule: vi.fn(),
  saveSchedule: vi.fn(),
}));

vi.mock("../utils/exerciseIcons", () => ({
  getExerciseIcon: () => null,
}));

const dateKey = (offsetDays: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const dayHeader = (offsetDays: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayName = days[d.getDay()];
  const month = d.toLocaleDateString("en-US", { month: "short" });
  const dayNum = d.getDate();
  return `${dayName} ${dayNum} ${month}`;
};

describe("Calendar", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.stubGlobal("localStorage", {
      getItem: vi.fn((key: string) => {
        if (key === "user") return JSON.stringify({ id: "test-user-123" });
        return null;
      }),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    });

    vi.mocked(fetchExercises).mockResolvedValue([]);
    vi.mocked(fetchRules).mockResolvedValue([]);
    vi.mocked(fetchSchedule).mockResolvedValue(null);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders calendar days with correct date headers", async () => {
    render(<SchedulePage />);

    const firstDayText = dayHeader(0);
    const lastDayText = dayHeader(6);

    expect(await screen.findByText(firstDayText)).toBeInTheDocument();
    expect(screen.getByText(lastDayText)).toBeInTheDocument();
  });

  it("displays exercise cards on calendar days with intensity badges", async () => {
    const todayKey = dateKey(0);

    vi.mocked(fetchSchedule).mockResolvedValue({
      id: "sched-1",
      userId: "test-user-123",
      title: "Test Week",
      startDate: dateKey(0),
      endDate: dateKey(6),
      selectedRuleIds: [],
      calendarExercises: {
        [todayKey]: [
          {
            id: "cal-item-1",
            exerciseId: "ex-1",
            name: "Running",
            notes: "Tempo run",
            intensity: "hard",
            duration: { hours: "1", minutes: "30" },
          },
        ],
      },
    } as any);

    render(<SchedulePage />);

    expect(await screen.findByText("Running")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("1h 30m")).toBeInTheDocument();
  });

  it("renders multiple exercises on the same calendar day", async () => {
    const todayKey = dateKey(0);

    vi.mocked(fetchSchedule).mockResolvedValue({
      id: "sched-2",
      userId: "test-user-123",
      title: "Busy Week",
      startDate: dateKey(0),
      endDate: dateKey(6),
      selectedRuleIds: [],
      calendarExercises: {
        [todayKey]: [
          {
            id: "cal-item-1",
            exerciseId: "ex-1",
            name: "Running",
            notes: "Morning session",
            intensity: "hard",
            duration: { hours: "1", minutes: "0" },
          },
          {
            id: "cal-item-2",
            exerciseId: "ex-2",
            name: "Swimming",
            notes: "Evening laps",
            intensity: "easy",
            duration: { hours: "0", minutes: "45" },
          },
        ],
      },
    } as any);

    render(<SchedulePage />);

    expect(await screen.findByText("Running")).toBeInTheDocument();
    expect(screen.getByText("Swimming")).toBeInTheDocument();
    expect(screen.getByText(/45m/i)).toBeInTheDocument();
  });
});