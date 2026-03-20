import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import LoginPage from "../components/LoginPage";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", () => ({
  Link: ({
    to,
    children,
    className,
  }: {
    to: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
  useNavigate: vi.fn(() => mockNavigate),
}));

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.stubGlobal("localStorage", {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    });

    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders login form fields and links", () => {
    render(<LoginPage />);

    expect(screen.getByText("Fitness Tracker")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Email Address")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Password")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /forgot password/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /register/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Login" })).toBeInTheDocument();
  });

  it("keeps login button disabled initially", () => {
    render(<LoginPage />);
    expect(screen.getByRole("button", { name: "Login" })).toBeDisabled();
  });

  it("shows invalid email error on blur", async () => {
    render(<LoginPage />);

    const emailInput = screen.getByPlaceholderText("Email Address");
    fireEvent.change(emailInput, { target: { value: "invalid-email" } });
    fireEvent.blur(emailInput);

    expect(
      await screen.findByText("Please enter a valid email address")
    ).toBeInTheDocument();
  });

  it("enables login button when form is valid", async () => {
    render(<LoginPage />);

    const emailInput = screen.getByPlaceholderText("Email Address");
    const passwordInput = screen.getByPlaceholderText("Password");
    const loginButton = screen.getByRole("button", { name: "Login" });

    fireEvent.change(emailInput, { target: { value: "sam@asu.edu" } });
    fireEvent.blur(emailInput);
    fireEvent.change(passwordInput, { target: { value: "password123" } });

    await waitFor(() => {
      expect(loginButton).toBeEnabled();
    });
  });

  it("toggles password visibility", () => {
    render(<LoginPage />);

    const passwordInput = screen.getByPlaceholderText(
      "Password"
    ) as HTMLInputElement;

    const toggleButton = screen.getByRole("button", {
      name: /show password/i,
    });

    expect(passwordInput.type).toBe("password");

    fireEvent.click(toggleButton);
    expect(passwordInput.type).toBe("text");

    fireEvent.click(screen.getByRole("button", { name: /hide password/i }));
    expect(passwordInput.type).toBe("password");
  });

  it("submits valid credentials, stores token/user, and navigates on success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          accessToken: "fake-token",
          user: { id: "user-1", email: "sam@asu.edu" },
        }),
      })
    );

    render(<LoginPage />);

    fireEvent.change(screen.getByPlaceholderText("Email Address"), {
      target: { value: "sam@asu.edu" },
    });
    fireEvent.blur(screen.getByPlaceholderText("Email Address"));

    fireEvent.change(screen.getByPlaceholderText("Password"), {
      target: { value: "password123" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Login" }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "http://localhost:3000/auth/login",
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: "sam@asu.edu",
            password: "password123",
          }),
        })
      );
    });

    expect(localStorage.setItem).toHaveBeenCalledWith("token", "fake-token");
    expect(localStorage.setItem).toHaveBeenCalledWith(
      "user",
      JSON.stringify({ id: "user-1", email: "sam@asu.edu" })
    );
    expect(mockNavigate).toHaveBeenCalledWith("/fitness");
  });

  it("shows backend error on failed login", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({
          message: "Invalid credentials",
        }),
      })
    );

    render(<LoginPage />);

    fireEvent.change(screen.getByPlaceholderText("Email Address"), {
      target: { value: "sam@asu.edu" },
    });
    fireEvent.blur(screen.getByPlaceholderText("Email Address"));

    fireEvent.change(screen.getByPlaceholderText("Password"), {
      target: { value: "wrongpass" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Login" }));

    expect(await screen.findByText("Invalid credentials")).toBeInTheDocument();
  });

  it("shows loading state during login", async () => {
    let resolveFetch: (value: any) => void = () => {};

    vi.stubGlobal(
      "fetch",
      vi.fn(
        () =>
          new Promise((resolve) => {
            resolveFetch = resolve;
          })
      )
    );

    render(<LoginPage />);

    fireEvent.change(screen.getByPlaceholderText("Email Address"), {
      target: { value: "sam@asu.edu" },
    });
    fireEvent.blur(screen.getByPlaceholderText("Email Address"));

    fireEvent.change(screen.getByPlaceholderText("Password"), {
      target: { value: "password123" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Login" }));

    expect(
      await screen.findByRole("button", { name: /logging in/i })
    ).toBeInTheDocument();

    resolveFetch({
      ok: true,
      json: async () => ({
        accessToken: "fake-token",
        user: { id: "user-1", email: "sam@asu.edu" },
      }),
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/fitness");
    });
  });
});