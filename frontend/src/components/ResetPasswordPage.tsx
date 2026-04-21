import { useState, useMemo } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { getApiErrorMessage } from "../utils/apiError";

function validatePassword(value: string) {
  const hasUpper = /[A-Z]/.test(value);
  const hasDigit = /\d/.test(value);
  const hasSymbol = /[^A-Za-z0-9]/.test(value);
  if (!value) return "Password is required";
  if (value.length < 8) return "At least 8 characters";
  if (!hasUpper || !hasDigit || !hasSymbol) {
    return "Include 1 uppercase letter, 1 digit, and 1 symbol";
  }
  return "";
}

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = useMemo(() => searchParams.get("token")?.trim() ?? "", [searchParams]);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({ password: false, confirm: false });
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [done, setDone] = useState(false);

  const passwordError = touched.password ? validatePassword(password) : "";
  const confirmError =
    touched.confirm && confirm !== password ? "Passwords do not match" : "";

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ password: true, confirm: true });
    setSubmitError("");

    const pErr = validatePassword(password);
    const cErr = confirm !== password ? "Passwords do not match" : "";
    if (pErr || cErr) return;

    if (!token) {
      setSubmitError("Missing reset token. Open the link from your email.");
      return;
    }

    try {
      setIsLoading(true);
      const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.status === 429) {
        throw new Error(
          "Too many attempts. Please wait about 15 minutes and try again.",
        );
      }
      if (!response.ok) {
        throw new Error(
          getApiErrorMessage(data, "Could not reset password"),
        );
      }
      setDone(true);
      setTimeout(() => navigate("/login", { replace: true }), 2500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setSubmitError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center px-5 bg-slate-950">
        <div className="relative w-full max-w-md rounded-2xl border border-white/15 bg-white/10 p-8 text-center text-white">
          <p className="text-white/80">This page needs a reset link from your email.</p>
          <Link to="/forgot-password" className="mt-4 inline-block text-cyan-300 underline">
            Request a new link
          </Link>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center px-5 bg-slate-950">
        <div className="relative w-full max-w-md rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-8 text-center text-white">
          <p className="font-semibold text-emerald-200">Password updated.</p>
          <p className="mt-2 text-sm text-white/70">Redirecting to sign in…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center px-5 py-10 overflow-hidden bg-slate-950">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950" />
      <div className="absolute -top-32 -left-32 h-[520px] w-[520px] rounded-full bg-fuchsia-500/20 blur-[90px]" />
      <div className="absolute -bottom-40 -right-40 h-[620px] w-[620px] rounded-full bg-cyan-400/15 blur-[110px]" />
      <div
        className="absolute inset-0 opacity-[0.10]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.35) 1px, transparent 0)",
          backgroundSize: "26px 26px",
        }}
      />

      <div className="relative w-full max-w-md">
        <div className="rounded-2xl border border-white/15 bg-white/10 backdrop-blur-xl shadow-[0_18px_60px_rgba(0,0,0,0.45)] px-8 py-8">
          <Link
            to="/login"
            className="text-white/60 hover:text-white text-sm flex items-center gap-1.5 mb-6"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M19 12H5M5 12l7-7M5 12l7 7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Back
          </Link>

          <h1 className="text-3xl font-extrabold text-white text-center">Set new password</h1>
          <p className="mt-2 text-center text-white/60 text-sm">
            Choose a strong password for your account.
          </p>

          <form onSubmit={onSubmit} className="mt-8 space-y-5">
            <div>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                placeholder="New password"
                className={`w-full rounded-full bg-white/10 text-white placeholder-white/60 px-5 py-3.5 outline-none border ${
                  passwordError ? "border-red-400" : "border-white/15"
                } focus:border-white/35`}
              />
              {passwordError && (
                <p className="text-red-400 text-xs mt-1.5 ml-5">{passwordError}</p>
              )}
            </div>

            <div>
              <input
                type={showPassword ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, confirm: true }))}
                placeholder="Confirm new password"
                className={`w-full rounded-full bg-white/10 text-white placeholder-white/60 px-5 py-3.5 outline-none border ${
                  confirmError ? "border-red-400" : "border-white/15"
                } focus:border-white/35`}
              />
              {confirmError && (
                <p className="text-red-400 text-xs mt-1.5 ml-5">{confirmError}</p>
              )}
            </div>

            <label className="flex items-center gap-2 text-sm text-white/70">
              <input
                type="checkbox"
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
                className="rounded border-white/40"
              />
              Show passwords
            </label>

            {submitError && (
              <p className="text-red-400 text-sm text-center">{submitError}</p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-full bg-white text-slate-900 font-semibold py-3.5 disabled:opacity-50"
            >
              {isLoading ? "Saving…" : "Update password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
