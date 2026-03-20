import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
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

    vi.mocked(fetchRules).mockResolvedValue([]);
    vi.mocked(fetchSchedule).mockResolvedValue(null);

    vi.spyOn(Storage.prototype, "getItem").mockImplementation((key: string) => {
      if (key === "user") return JSON.stringify({ id: "test-user-123" });
      return null;
    });
  });

  it("renders exercises in the sidebar with names and notes", async () => {
    vi.mocked(fetchExercises).mockResolvedValue([
      { id: "ex-1", userId: "test-user-123", name: "Running", notes: "Morning run" },
      { id: "ex-2", userId: "test-user-123", name: "Swimming", notes: "Pool laps" },
    ]);

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
});
