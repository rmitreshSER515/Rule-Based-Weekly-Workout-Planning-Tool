import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import RegisterPage from "../components/RegisterPage";

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

describe("RegisterPage", () => {
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

  it("renders register form fields and sign in link", () => {
    render(<RegisterPage />);

    expect(
      screen.getByRole("heading", { name: "Create Account" })
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText("First Name")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Last Name")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Phone Number")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Email Address")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Password")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Confirm Password")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /sign in/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /create account/i })
    ).toBeInTheDocument();
  });

  it("keeps create account button disabled initially", () => {
    render(<RegisterPage />);

    expect(
      screen.getByRole("button", { name: /create account/i })
    ).toBeDisabled();
  });

  it("shows invalid email error on blur", async () => {
    render(<RegisterPage />);

    const emailInput = screen.getByPlaceholderText("Email Address");
    fireEvent.change(emailInput, { target: { value: "invalid-email" } });
    fireEvent.blur(emailInput);

    expect(
      await screen.findByText("Please enter a valid email address")
    ).toBeInTheDocument();
  });

  it("shows phone validation error for short number", async () => {
    render(<RegisterPage />);

    const phoneInput = screen.getByPlaceholderText("Phone Number");
    fireEvent.change(phoneInput, { target: { value: "12345" } });
    fireEvent.blur(phoneInput);

    expect(
      await screen.findByText("Enter a valid phone number")
    ).toBeInTheDocument();
  });

  it("shows password mismatch error", async () => {
    render(<RegisterPage />);

    fireEvent.change(screen.getByPlaceholderText("Password"), {
      target: { value: "Password1!" },
    });
    fireEvent.blur(screen.getByPlaceholderText("Password"));

    fireEvent.change(screen.getByPlaceholderText("Confirm Password"), {
      target: { value: "Password2!" },
    });
    fireEvent.blur(screen.getByPlaceholderText("Confirm Password"));

    expect(await screen.findByText("Passwords do not match")).toBeInTheDocument();
  });

  it("shows password criteria while typing password", async () => {
    render(<RegisterPage />);

    const passwordInput = screen.getByPlaceholderText("Password");
    fireEvent.change(passwordInput, { target: { value: "Password1!" } });

    expect(await screen.findByText("At least 6 characters")).toBeInTheDocument();
    expect(screen.getByText("One uppercase letter")).toBeInTheDocument();
    expect(screen.getByText("One lowercase letter")).toBeInTheDocument();
    expect(screen.getByText("One number")).toBeInTheDocument();
    expect(screen.getByText("One symbol (!@#$...)")).toBeInTheDocument();
  });

  it("enables create account button when form is valid", async () => {
    render(<RegisterPage />);

    fireEvent.change(screen.getByPlaceholderText("First Name"), {
      target: { value: "Harshil" },
    });
    fireEvent.change(screen.getByPlaceholderText("Last Name"), {
      target: { value: "Dave" },
    });
    fireEvent.change(screen.getByPlaceholderText("Phone Number"), {
      target: { value: "1234567890" },
    });
    fireEvent.change(screen.getByPlaceholderText("Email Address"), {
      target: { value: "harshil@example.com" },
    });
    fireEvent.blur(screen.getByPlaceholderText("Email Address"));

    fireEvent.change(screen.getByPlaceholderText("Password"), {
      target: { value: "Password1!" },
    });
    fireEvent.blur(screen.getByPlaceholderText("Password"));

    fireEvent.change(screen.getByPlaceholderText("Confirm Password"), {
      target: { value: "Password1!" },
    });
    fireEvent.blur(screen.getByPlaceholderText("Confirm Password"));

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /create account/i })
      ).toBeEnabled();
    });
  });

  it("submits valid registration data and navigates to login on success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          message: "Registration successful",
        }),
      })
    );

    render(<RegisterPage />);

    fireEvent.change(screen.getByPlaceholderText("First Name"), {
      target: { value: "Harshil" },
    });
    fireEvent.change(screen.getByPlaceholderText("Last Name"), {
      target: { value: "Dave" },
    });
    fireEvent.change(screen.getByPlaceholderText("Phone Number"), {
      target: { value: "1234567890" },
    });
    fireEvent.change(screen.getByPlaceholderText("Email Address"), {
      target: { value: "harshil@example.com" },
    });
    fireEvent.blur(screen.getByPlaceholderText("Email Address"));

    fireEvent.change(screen.getByPlaceholderText("Password"), {
      target: { value: "Password1!" },
    });
    fireEvent.blur(screen.getByPlaceholderText("Password"));

    fireEvent.change(screen.getByPlaceholderText("Confirm Password"), {
      target: { value: "Password1!" },
    });
    fireEvent.blur(screen.getByPlaceholderText("Confirm Password"));

    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "http://localhost:3000/auth/register",
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            firstName: "Harshil",
            lastName: "Dave",
            phoneNumber: "+11234567890",
            email: "harshil@example.com",
            password: "Password1!",
            confirmPassword: "Password1!",
          }),
        })
      );
    });

    expect(localStorage.removeItem).toHaveBeenCalledWith("token");
    expect(localStorage.removeItem).toHaveBeenCalledWith("user");
    expect(mockNavigate).toHaveBeenCalledWith("/login");
  });

  it("shows backend error on failed registration", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({
          message: "Email already exists",
        }),
      })
    );

    render(<RegisterPage />);

    fireEvent.change(screen.getByPlaceholderText("First Name"), {
      target: { value: "Harshil" },
    });
    fireEvent.change(screen.getByPlaceholderText("Last Name"), {
      target: { value: "Dave" },
    });
    fireEvent.change(screen.getByPlaceholderText("Phone Number"), {
      target: { value: "1234567890" },
    });
    fireEvent.change(screen.getByPlaceholderText("Email Address"), {
      target: { value: "harshil@example.com" },
    });
    fireEvent.blur(screen.getByPlaceholderText("Email Address"));

    fireEvent.change(screen.getByPlaceholderText("Password"), {
      target: { value: "Password1!" },
    });
    fireEvent.blur(screen.getByPlaceholderText("Password"));

    fireEvent.change(screen.getByPlaceholderText("Confirm Password"), {
      target: { value: "Password1!" },
    });
    fireEvent.blur(screen.getByPlaceholderText("Confirm Password"));

    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    expect(await screen.findByText("Email already exists")).toBeInTheDocument();
  });

  it("shows loading state during registration", async () => {
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

    render(<RegisterPage />);

    fireEvent.change(screen.getByPlaceholderText("First Name"), {
      target: { value: "Harshil" },
    });
    fireEvent.change(screen.getByPlaceholderText("Last Name"), {
      target: { value: "Dave" },
    });
    fireEvent.change(screen.getByPlaceholderText("Phone Number"), {
      target: { value: "1234567890" },
    });
    fireEvent.change(screen.getByPlaceholderText("Email Address"), {
      target: { value: "harshil@example.com" },
    });
    fireEvent.blur(screen.getByPlaceholderText("Email Address"));

    fireEvent.change(screen.getByPlaceholderText("Password"), {
      target: { value: "Password1!" },
    });
    fireEvent.blur(screen.getByPlaceholderText("Password"));

    fireEvent.change(screen.getByPlaceholderText("Confirm Password"), {
      target: { value: "Password1!" },
    });
    fireEvent.blur(screen.getByPlaceholderText("Confirm Password"));

    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    expect(
      await screen.findByRole("button", { name: /creating/i })
    ).toBeInTheDocument();

    resolveFetch({
      ok: true,
      json: async () => ({
        message: "Registration successful",
      }),
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/login");
    });
  });
});