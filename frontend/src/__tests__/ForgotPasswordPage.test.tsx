import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import ForgotPasswordPage from "../components/Forgotpasswordpage";

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
}));

describe("ForgotPasswordPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders forgot password page fields and links", () => {
    render(<ForgotPasswordPage />);

    expect(
      screen.getByRole("heading", { name: /forgot password/i })
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Email Address")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /send verification code/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /back/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /sign in/i })).toBeInTheDocument();
  });

  it("keeps send verification code button disabled initially", () => {
    render(<ForgotPasswordPage />);

    expect(
      screen.getByRole("button", { name: /send verification code/i })
    ).toBeDisabled();
  });

  it("shows required email error on blur when email is empty", async () => {
    render(<ForgotPasswordPage />);

    const emailInput = screen.getByPlaceholderText("Email Address");
    fireEvent.blur(emailInput);

    expect(
      await screen.findByText("Email address is required")
    ).toBeInTheDocument();
  });

  it("shows invalid email error on blur", async () => {
    render(<ForgotPasswordPage />);

    const emailInput = screen.getByPlaceholderText("Email Address");
    fireEvent.change(emailInput, { target: { value: "invalid-email" } });
    fireEvent.blur(emailInput);

    expect(
      await screen.findByText("Please enter a valid email address")
    ).toBeInTheDocument();
  });

  it("enables submit button when email is valid", () => {
    render(<ForgotPasswordPage />);

    const emailInput = screen.getByPlaceholderText("Email Address");
    const submitButton = screen.getByRole("button", {
      name: /send verification code/i,
    });

    fireEvent.change(emailInput, { target: { value: "harshil@example.com" } });
    fireEvent.blur(emailInput);

    expect(submitButton).toBeEnabled();
  });

  it("shows loading state while sending verification code", () => {
    vi.useFakeTimers();

    render(<ForgotPasswordPage />);

    const emailInput = screen.getByPlaceholderText("Email Address");
    fireEvent.change(emailInput, { target: { value: "harshil@example.com" } });
    fireEvent.blur(emailInput);

    fireEvent.click(
      screen.getByRole("button", { name: /send verification code/i })
    );

    expect(
      screen.getByRole("button", { name: /sending/i })
    ).toBeInTheDocument();
  });

  it("shows success state after submitting valid email", async () => {
    vi.useFakeTimers();

    render(<ForgotPasswordPage />);

    const emailInput = screen.getByPlaceholderText("Email Address");
    fireEvent.change(emailInput, { target: { value: "harshil@example.com" } });
    fireEvent.blur(emailInput);

    fireEvent.click(
      screen.getByRole("button", { name: /send verification code/i })
    );

    await act(async () => {
      vi.advanceTimersByTime(1600);
    });

    expect(
      screen.getByRole("heading", { name: /check your inbox/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/we've sent a verification code to/i)
    ).toBeInTheDocument();
    expect(screen.getByText("harshil@example.com")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /back to sign in/i })
    ).toBeInTheDocument();
  });

  it("returns to form when resend code is clicked", async () => {
    vi.useFakeTimers();

    render(<ForgotPasswordPage />);

    const emailInput = screen.getByPlaceholderText("Email Address");
    fireEvent.change(emailInput, { target: { value: "harshil@example.com" } });
    fireEvent.blur(emailInput);

    fireEvent.click(
      screen.getByRole("button", { name: /send verification code/i })
    );

    await act(async () => {
      vi.advanceTimersByTime(1600);
    });

    expect(
      screen.getByRole("heading", { name: /check your inbox/i })
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /resend code/i }));

    expect(
      screen.getByRole("heading", { name: /forgot password/i })
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Email Address")).toBeInTheDocument();
  });
});