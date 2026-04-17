import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import CompareSchedulesPage from "../components/CompareSchedulesPage";
import { fetchSchedules } from "../api/schedules";
import { fetchScheduleMetrics } from "../api/metrics";

const mockNavigate = vi.fn();
const mockUseLocation = vi.fn();

vi.mock("react-router-dom", () => ({
  useLocation: () => mockUseLocation(),
  useNavigate: () => mockNavigate,
}));

vi.mock("../api/schedules", () => ({
  fetchSchedules: vi.fn(),
}));

vi.mock("../api/metrics", () => ({
  fetchScheduleMetrics: vi.fn(),
}));

const mockSchedules = [
  {
    id: "schedule-1",
    title: "Week 1 Plan",
    startDate: "2025-04-01",
    endDate: "2025-04-03",
    calendarExercises: {
      "2025-04-01": [
        {
          name: "Run",
          intensity: "hard",
          duration: { hours: "1", minutes: "0" },
        },
      ],
      "2025-04-02": [
        {
          name: "Swim",
          intensity: "easy",
          duration: { hours: "0", minutes: "30" },
        },
      ],
      "2025-04-03": [],
    },
  },
  {
    id: "schedule-2",
    title: "Week 2 Plan",
    startDate: "2025-04-01",
    endDate: "2025-04-03",
    calendarExercises: {
      "2025-04-01": [
        {
          name: "Bike",
          intensity: "medium",
          duration: { hours: "0", minutes: "45" },
        },
      ],
      "2025-04-02": [
        {
          name: "Swim",
          intensity: "easy",
          duration: { hours: "0", minutes: "20" },
        },
      ],
      "2025-04-03": [],
    },
  },
];

describe("CompareSchedulesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockUseLocation.mockReturnValue({
      pathname: "/compare-schedules",
      state: null,
    });

    vi.stubGlobal("localStorage", {
      getItem: vi.fn((key: string) => {
        if (key === "user") {
          return JSON.stringify({ id: "test-user-123" });
        }
        return null;
      }),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    });

    vi.mocked(fetchSchedules).mockResolvedValue(mockSchedules as any);
    vi.mocked(fetchScheduleMetrics).mockResolvedValue({
      metrics: {
        exerciseIntensityBreakdown: [
          { name: "Run", intensity: "hard", count: 1 },
          { name: "Swim", intensity: "easy", count: 1 },
        ],
      },
    } as any);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders page heading", async () => {
    render(<CompareSchedulesPage />);

    expect(await screen.findByText("Compare Schedules")).toBeInTheDocument();
  });

  it("shows empty state when no schedule is selected", async () => {
    render(<CompareSchedulesPage />);

    expect(
      await screen.findByText("Select schedules from the sidebar to compare")
    ).toBeInTheDocument();
  });

  it("loads and displays schedules in sidebar", async () => {
    render(<CompareSchedulesPage />);

    expect(await screen.findByText("Week 1 Plan")).toBeInTheDocument();
    expect(screen.getByText("Week 2 Plan")).toBeInTheDocument();
  });

  it("selects a schedule and shows comparison details", async () => {
    const user = userEvent.setup();
    render(<CompareSchedulesPage />);

    const scheduleText = await screen.findByText("Week 1 Plan");
    const scheduleButton = scheduleText.closest("button");

    expect(scheduleButton).not.toBeNull();

    await user.click(scheduleButton!);

    expect(await screen.findByText("Number of Exercises")).toBeInTheDocument();
    expect(screen.getByText("Average Intensity")).toBeInTheDocument();
    expect(screen.getByText("Rest Days")).toBeInTheDocument();
  });

  it("deselects a schedule when clicked again", async () => {
    const user = userEvent.setup();
    render(<CompareSchedulesPage />);

    const scheduleText = await screen.findByText("Week 1 Plan");
    const scheduleButton = scheduleText.closest("button");

    expect(scheduleButton).not.toBeNull();

    await user.click(scheduleButton!);
    expect(await screen.findByText("Number of Exercises")).toBeInTheDocument();

    await user.click(scheduleButton!);
    expect(
      await screen.findByText("Select schedules from the sidebar to compare")
    ).toBeInTheDocument();
  });

  it("shows no schedules found when API returns empty list", async () => {
    vi.mocked(fetchSchedules).mockResolvedValue([]);

    render(<CompareSchedulesPage />);

    expect(await screen.findByText("No schedules found.")).toBeInTheDocument();
  });

  it("navigates back when Back button is clicked", async () => {
    const user = userEvent.setup();
    render(<CompareSchedulesPage />);

    const backButton = await screen.findByRole("button", { name: /back/i });
    await user.click(backButton);

    expect(mockNavigate).toHaveBeenCalledWith("/fitness");
  });
});