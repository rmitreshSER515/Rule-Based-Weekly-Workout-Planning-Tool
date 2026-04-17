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

describe("Exercise Panel", () => {
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

    vi.mocked(fetchRules).mockResolvedValue([]);
    vi.mocked(fetchSchedule).mockResolvedValue(null);
    vi.mocked(fetchExercises).mockResolvedValue([]);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders exercises in the sidebar with names and notes", async () => {
    vi.mocked(fetchExercises).mockResolvedValue([
      {
        id: "ex-1",
        userId: "test-user-123",
        name: "Running",
        notes: "Morning run",
      },
      {
        id: "ex-2",
        userId: "test-user-123",
        name: "Swimming",
        notes: "Pool laps",
      },
    ] as any);

    render(<SchedulePage />);

    expect(await screen.findByText("Running")).toBeInTheDocument();
    expect(screen.getByText("Morning run")).toBeInTheDocument();
    expect(screen.getByText("Swimming")).toBeInTheDocument();
    expect(screen.getByText("Pool laps")).toBeInTheDocument();
  });

  it("shows placeholder message when no exercises exist", async () => {
    vi.mocked(fetchExercises).mockResolvedValue([]);

    render(<SchedulePage />);

    expect(
      await screen.findByText("No exercises yet. Add one to get started.")
    ).toBeInTheDocument();
  });

  it("renders exercise names even when notes are missing", async () => {
    vi.mocked(fetchExercises).mockResolvedValue([
      {
        id: "ex-1",
        userId: "test-user-123",
        name: "Cycling",
        notes: "",
      },
    ] as any);

    render(<SchedulePage />);

    expect(await screen.findByText("Cycling")).toBeInTheDocument();
  });
});