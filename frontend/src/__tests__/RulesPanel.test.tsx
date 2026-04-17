import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

const sampleRules = [
  {
    id: "rule-1",
    userId: "test-user-123",
    name: "No hard running after cycling",
    ifExercise: "Hard",
    ifActivityType: "Cycling",
    ifTiming: "The day before",
    thenExercise: "Hard",
    thenActivityType: "Running",
    thenRestriction: "Not allowed",
  },
  {
    id: "rule-2",
    userId: "test-user-123",
    name: "Easy swim recovery",
    ifExercise: "Hard",
    ifActivityType: "Swimming",
    ifTiming: "Same day",
    thenExercise: "Easy",
    thenActivityType: "Swimming",
    thenRestriction: "Not allowed",
  },
];

describe("Rules Panel", () => {
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

  it("renders rules with checkboxes and names", async () => {
    vi.mocked(fetchRules).mockResolvedValue(sampleRules);

    render(<SchedulePage />);

    expect(await screen.findByText("No hard running after cycling")).toBeInTheDocument();
    expect(screen.getByText("Easy swim recovery")).toBeInTheDocument();

    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes.length).toBeGreaterThanOrEqual(2);
  });

  it("toggles rule selection on checkbox click", async () => {
    vi.mocked(fetchRules).mockResolvedValue(sampleRules);

    const user = userEvent.setup();
    render(<SchedulePage />);

    await screen.findByText("No hard running after cycling");

    const checkboxes = screen.getAllByRole("checkbox");
    const firstCheckbox = checkboxes[0];

    expect(firstCheckbox).not.toBeChecked();

    await user.click(firstCheckbox);
    expect(firstCheckbox).toBeChecked();

    await user.click(firstCheckbox);
    expect(firstCheckbox).not.toBeChecked();
  });

  it("shows placeholder message when no rules exist", async () => {
    vi.mocked(fetchRules).mockResolvedValue([]);

    render(<SchedulePage />);

    expect(await screen.findByText("No rules yet. Add one to get started.")).toBeInTheDocument();
  });

  it("toggles multiple rules independently", async () => {
    vi.mocked(fetchRules).mockResolvedValue(sampleRules);

    const user = userEvent.setup();
    render(<SchedulePage />);

    await screen.findByText("No hard running after cycling");

    const checkboxes = screen.getAllByRole("checkbox");
    const firstCheckbox = checkboxes[0];
    const secondCheckbox = checkboxes[1];

    await user.click(firstCheckbox);
    expect(firstCheckbox).toBeChecked();
    expect(secondCheckbox).not.toBeChecked();

    await user.click(secondCheckbox);
    expect(firstCheckbox).toBeChecked();
    expect(secondCheckbox).toBeChecked();
  });
});