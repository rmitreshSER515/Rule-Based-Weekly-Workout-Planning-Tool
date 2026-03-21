import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import FitnessPage from "../components/FitnessTrackerPage";

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

describe("FitnessPage", () => {
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

    it("renders the fitness page with all core UI elements", () => {
        render(<FitnessPage />);

        expect(screen.getByText("Fitness Page")).toBeInTheDocument();
        expect(
            screen.getByText("Create, view, and compare your schedules")
        ).toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: /compare schedules/i })
        ).toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: /log out/i })
        ).toBeInTheDocument();
        expect(screen.getByText("Create New Schedule")).toBeInTheDocument();
        expect(
            screen.getByText("Start building a new fitness schedule from scratch.")
        ).toBeInTheDocument();
    });

    it("logs out the user and navigates to login on logout button click", () => {
        render(<FitnessPage />);

        fireEvent.click(screen.getByRole("button", { name: /log out/i }));

        expect(localStorage.removeItem).toHaveBeenCalledWith("token");
        expect(localStorage.removeItem).toHaveBeenCalledWith("user");
        expect(mockNavigate).toHaveBeenCalledWith("/login");
    });
});