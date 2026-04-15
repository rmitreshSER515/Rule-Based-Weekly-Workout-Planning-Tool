import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ShareSchedulesModal from "../components/ShareSchedulesModal";
import { createNotification } from "../api/notifications";
import { fetchFriends } from "../api/users";

vi.mock("../api/notifications", () => ({
  createNotification: vi.fn(),
}));

vi.mock("../api/users", () => ({
  fetchUsers: vi.fn(),
  fetchFriends: vi.fn(),
  sendFriendRequestByEmail: vi.fn(),
}));

describe("ShareSchedulesModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: vi.fn((key: string) => {
          if (key === "user") {
            return JSON.stringify({ id: "sender-1", email: "sender@example.com" });
          }
          return null;
        }),
      },
      writable: true,
    });

    vi.mocked(fetchFriends).mockResolvedValue([
      {
        id: "friend-1",
        email: "friend@example.com",
        firstName: "Alex",
        lastName: "Friend",
      },
    ]);

    vi.mocked(createNotification).mockResolvedValue({
      id: "notification-1",
      userId: "friend-1",
      fromUserId: "sender-1",
      scheduleId: "schedule-1",
      message: "Schedule shared",
      status: "pending",
      type: "schedule_share",
    } as any);
  });

  it("shares only with selected accepted friends and triggers confirmation", async () => {
    const user = userEvent.setup();
    const onShared = vi.fn();

    render(
      <ShareSchedulesModal
        isOpen={true}
        onClose={vi.fn()}
        onShared={onShared}
        schedules={[{ id: "schedule-1", title: "My Week" }]}
      />,
    );

    await waitFor(() => {
      expect(fetchFriends).toHaveBeenCalled();
    });

    expect(screen.queryByPlaceholderText(/enter a friend's full email/i)).not.toBeInTheDocument();
    expect(await screen.findByText("Alex Friend")).toBeInTheDocument();
    expect(screen.getByText("friend@example.com")).toBeInTheDocument();

    await user.click(screen.getByRole("checkbox", { name: /alex friend/i }));
    await user.click(screen.getByRole("button", { name: /share 1 schedule/i }));

    await waitFor(() => {
      expect(createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "friend-1",
          fromUserId: "sender-1",
          scheduleId: "schedule-1",
        }),
      );
    });

    expect(onShared).toHaveBeenCalled();
  });
});
