import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import FriendsModal from "../components/FriendsModal";
import {
  deleteFriend,
  fetchFriends,
  sendFriendRequestByEmail,
} from "../api/users";

vi.mock("../api/users", () => ({
  fetchUsers: vi.fn(),
  fetchFriends: vi.fn(),
  sendFriendRequestByEmail: vi.fn(),
  deleteFriend: vi.fn(),
}));

describe("FriendsModal", () => {
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

    vi.mocked(sendFriendRequestByEmail).mockResolvedValue({
      id: "request-1",
      message: 'Request sent to "Alex Friend"',
      status: "pending",
      type: "friend_request",
      userId: "friend-2",
      fromUserId: "sender-1",
      email: "newfriend@example.com",
    } as any);

    vi.mocked(deleteFriend).mockResolvedValue({
      message: 'Removed "Alex Friend" from your friends',
      friendId: "friend-1",
    } as any);
  });

  it("adds a friend by full email from the dedicated friends modal", async () => {
    const user = userEvent.setup();

    render(<FriendsModal isOpen={true} onClose={vi.fn()} />);

    expect(await screen.findByText("Manage Friends")).toBeInTheDocument();
    expect(await screen.findByText("Alex Friend")).toBeInTheDocument();

    await user.type(
      screen.getByPlaceholderText(/enter a friend's full email/i),
      "newfriend@example.com",
    );
    await user.click(screen.getByRole("button", { name: /send friend request/i }));

    await waitFor(() => {
      expect(sendFriendRequestByEmail).toHaveBeenCalledWith(
        "sender-1",
        "newfriend@example.com",
      );
    });

    expect(await screen.findByText('Request sent to "Alex Friend"')).toBeInTheDocument();
  });

  it("removes an existing friend", async () => {
    const user = userEvent.setup();

    render(<FriendsModal isOpen={true} onClose={vi.fn()} />);

    expect(await screen.findByText("Alex Friend")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /remove/i }));

    await waitFor(() => {
      expect(deleteFriend).toHaveBeenCalledWith("sender-1", "friend-1");
    });

    expect(screen.queryByText("Alex Friend")).not.toBeInTheDocument();
    expect(await screen.findByText('Removed "Alex Friend" from your friends')).toBeInTheDocument();
  });
});
