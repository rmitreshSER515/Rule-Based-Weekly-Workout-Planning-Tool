import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import FitnessTrackerPage from "../components/FitnessTrackerPage";
import { fetchSchedules, deleteSchedule } from "../api/schedules";
import { fetchNotifications } from "../api/notifications";
import { logout } from "../utils/auth";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock("../utils/auth", () => ({
  logout: vi.fn(),
}));

vi.mock("../api/schedules", () => ({
  fetchSchedules: vi.fn(),
  deleteSchedule: vi.fn(),
}));

vi.mock("../api/notifications", () => ({
  fetchNotifications: vi.fn(),
  updateNotificationStatus: vi.fn(),
}));

vi.mock("../components/ShareSchedulesModal", () => ({
  default: ({
    isOpen,
    onClose,
  }: {
    isOpen: boolean;
    onClose: () => void;
  }) =>
    isOpen ? (
      <div>
        <p>Share Schedules Modal</p>
        <button onClick={onClose}>Close Share Modal</button>
      </div>
    ) : null,
}));

vi.mock("../components/FriendsModal", () => ({
  default: ({
    isOpen,
    onClose,
  }: {
    isOpen: boolean;
    onClose: () => void;
  }) =>
    isOpen ? (
      <div>
        <p>Friends Modal</p>
        <button onClick={onClose}>Close Friends Modal</button>
      </div>
    ) : null,
}));

describe("FitnessTrackerPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

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

    vi.mocked(fetchSchedules).mockResolvedValue([
      {
        id: "schedule-1",
        title: "Week 1 Plan",
        startDate: "2025-04-01",
        endDate: "2025-04-07",
      },
      {
        id: "schedule-2",
        title: "Week 2 Plan",
        startDate: "2025-04-08",
        endDate: "2025-04-14",
      },
    ] as any);

    vi.mocked(fetchNotifications).mockResolvedValue([]);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders page heading and main actions", async () => {
    render(<FitnessTrackerPage />);

    expect(await screen.findByText("Workout Planner")).toBeInTheDocument();
    expect(screen.getByText("Create, view, and compare your schedules")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /friends/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /share schedules/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /compare schedules/i })).toBeInTheDocument();
  });

  it("loads and displays schedule cards", async () => {
    render(<FitnessTrackerPage />);

    expect(await screen.findByText("Week 1 Plan")).toBeInTheDocument();
    expect(screen.getByText("Week 2 Plan")).toBeInTheDocument();
  });

  it("shows create new schedule card", async () => {
    render(<FitnessTrackerPage />);

    expect(await screen.findByText("Create New Schedule")).toBeInTheDocument();
  });

  it("navigates to create schedule page when create new schedule is clicked", async () => {
    render(<FitnessTrackerPage />);

    fireEvent.click(await screen.findByText("Create New Schedule"));

    expect(mockNavigate).toHaveBeenCalledWith("/schedules", {
      state: { mode: "create" },
    });
  });

  it("opens schedule when a schedule card is clicked", async () => {
    render(<FitnessTrackerPage />);

    fireEvent.click(await screen.findByText("Week 1 Plan"));

    expect(mockNavigate).toHaveBeenCalledWith("/schedules", {
      state: {
        mode: "view",
        scheduleId: "schedule-1",
        schedule: {
          id: "schedule-1",
          title: "Week 1 Plan",
          startDate: "2025-04-01",
          endDate: "2025-04-07",
        },
      },
    });
  });

  it("filters schedules by search query", async () => {
    render(<FitnessTrackerPage />);

    expect(await screen.findByText("Week 1 Plan")).toBeInTheDocument();
    expect(screen.getByText("Week 2 Plan")).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("Search schedules..."), {
      target: { value: "Week 1" },
    });

    expect(screen.getByText("Week 1 Plan")).toBeInTheDocument();
    expect(screen.queryByText("Week 2 Plan")).not.toBeInTheDocument();
  });

  it("shows empty search state when no schedules match", async () => {
    render(<FitnessTrackerPage />);

    await screen.findByText("Week 1 Plan");

    fireEvent.change(screen.getByPlaceholderText("Search schedules..."), {
      target: { value: "No Match" },
    });

    expect(screen.getByText("No matching schedules")).toBeInTheDocument();
  });

  it("enables compare button after selecting two schedules", async () => {
    render(<FitnessTrackerPage />);

    await screen.findByText("Week 1 Plan");

    const selectButtons = screen.getAllByTitle(/select for compare|selected/i);
    fireEvent.click(selectButtons[0]);
    fireEvent.click(selectButtons[1]);

    const compareButton = screen.getByRole("button", {
      name: /compare schedules/i,
    });

    expect(compareButton).toBeEnabled();
  });

  it("navigates to compare page with selected schedules", async () => {
    render(<FitnessTrackerPage />);

    await screen.findByText("Week 1 Plan");

    const selectButtons = screen.getAllByTitle(/select for compare|selected/i);
    fireEvent.click(selectButtons[0]);
    fireEvent.click(selectButtons[1]);

    fireEvent.click(screen.getByRole("button", { name: /compare schedules/i }));

    expect(mockNavigate).toHaveBeenCalledWith("/compare", {
      state: { selectedScheduleIds: ["schedule-1", "schedule-2"] },
    });
  });

  it("opens friends modal when Friends button is clicked", async () => {
    render(<FitnessTrackerPage />);

    fireEvent.click(await screen.findByRole("button", { name: /friends/i }));

    expect(screen.getByText("Friends Modal")).toBeInTheDocument();
  });

  it("opens share modal when a schedule is selected and Share Schedules is clicked", async () => {
    render(<FitnessTrackerPage />);

    await screen.findByText("Week 1 Plan");

    const selectButtons = screen.getAllByTitle(/select for compare|selected/i);
    fireEvent.click(selectButtons[0]);

    fireEvent.click(screen.getByRole("button", { name: /share schedules/i }));

    expect(screen.getByText("Share Schedules Modal")).toBeInTheDocument();
  });

  it("calls logout when logout button is clicked", async () => {
    render(<FitnessTrackerPage />);

    fireEvent.click(await screen.findByRole("button", { name: /log out/i }));

    expect(logout).toHaveBeenCalledWith(mockNavigate);
  });

  it("shows notifications when notification button is clicked", async () => {
    vi.mocked(fetchNotifications).mockResolvedValue([
      {
        id: "notif-1",
        message: "John shared a schedule with you",
        status: "pending",
      },
    ] as any);

    render(<FitnessTrackerPage />);

    const notificationButton = await screen.findByRole("button", {
      name: /notifications/i,
    });

    fireEvent.click(notificationButton);

    expect(await screen.findByText("Notifications")).toBeInTheDocument();
    expect(screen.getByText("John shared a schedule with you")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /accept/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /decline/i })).toBeInTheDocument();
  });

  it("deletes a schedule after confirmation", async () => {
    vi.mocked(deleteSchedule).mockResolvedValue(undefined as any);

    render(<FitnessTrackerPage />);

    await screen.findByText("Week 1 Plan");

    const deleteButtons = screen.getAllByTitle("Delete schedule");
    fireEvent.click(deleteButtons[0]);

    expect(screen.getByText(/delete schedule/i)).toBeInTheDocument();

    const confirmDeleteButton = screen.getAllByRole("button", {
      name: /^delete$/i,
    })[0];
    fireEvent.click(confirmDeleteButton);

    await waitFor(() => {
      expect(deleteSchedule).toHaveBeenCalledWith("schedule-1", "test-user-123");
    });
  });
});