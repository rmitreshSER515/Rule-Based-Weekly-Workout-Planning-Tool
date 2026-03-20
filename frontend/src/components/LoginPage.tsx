import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function LoginPage() {
  const [emailOrUser, setEmailOrUser] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [touched, setTouched] = useState({ email: false, password: false });

  const navigate = useNavigate();

  useEffect(() => {
    if (touched.email && emailOrUser) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailOrUser)) {
        setEmailError("Please enter a valid email address");
      } else {
        setEmailError("");
      }
    } else if (touched.email && !emailOrUser) {
      setEmailError("Email address is required");
    }
  }, [emailOrUser, touched.email]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setTouched({ email: true, password: true });
    setEmailError("");
    setPasswordError("");

    let hasError = false;

    if (!emailOrUser.trim()) {
      setEmailError("Email address is required");
      hasError = true;
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailOrUser)) {
        setEmailError("Please enter a valid email address");
        hasError = true;
      }
    }

    if (!password) {
      setPasswordError("Password is required");
      hasError = true;
    }

    if (hasError) return;

    try {
      setIsLoading(true);
      const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: emailOrUser.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      if (data.accessToken) {
        localStorage.setItem("token", data.accessToken);
      }

      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      }

      navigate("/fitness");
    } catch (err: any) {
      const msg = err?.message || "Login failed";
      setPasswordError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid =
    !!emailOrUser.trim() &&
    !!password &&
    !emailError &&
    !passwordError;

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
        <div className="rounded-2xl border border-white/15 bg-white/10 backdrop-blur-xl shadow-[0_18px_60px_rgba(0,0,0,0.45)]">
          <div className="pt-8 px-8 text-center">
            <h1 className="text-4xl font-extrabold tracking-wide text-white drop-shadow">
              Fitness Tracker
            </h1>
            <p className="mt-2 text-white/70 text-sm">
              Sign in to plan your workouts
            </p>
          </div>

          <form onSubmit={onSubmit} className="px-8 pb-8 pt-6 space-y-5">
            <div className="relative">
              <input
                type="email"
                value={emailOrUser}
                onChange={(e) => setEmailOrUser(e.target.value)}
                onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
                placeholder="Email Address"
                className={`w-full rounded-full bg-white/10 text-white placeholder-white/60 px-5 py-3.5 pr-12 outline-none border ${
                  emailError ? "border-red-400" : "border-white/15"
                } focus:border-white/35 focus:ring-2 focus:ring-white/20`}
              />

              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 12a4.5 4.5 0 1 0-4.5-4.5A4.5 4.5 0 0 0 12 12Z"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <path
                    d="M4 20c1.6-3.6 5-6 8-6s6.4 2.4 8 6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </span>

              {emailError && (
                <p className="text-red-400 text-xs mt-1.5 ml-5">{emailError}</p>
              )}
            </div>

            <div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() =>
                    setTouched((prev) => ({ ...prev, password: true }))
                  }
                  placeholder="Password"
                  className={`w-full rounded-full bg-white/10 text-white placeholder-white/60 px-5 py-3.5 pr-12 outline-none border ${
                    passwordError ? "border-red-400" : "border-white/15"
                  } focus:border-white/35 focus:ring-2 focus:ring-white/20`}
                />

                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white"
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                      <circle
                        cx="12"
                        cy="12"
                        r="3"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                      <path
                        d="M3 3l18 18"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  )}
                </button>
              </div>

              {passwordError && (
                <p className="text-red-400 text-xs mt-1.5 ml-5">
                  {passwordError}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-white/70 select-none">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 rounded border-white/40 bg-white/10 text-white focus:ring-white/30"
                />
                Remember me
              </label>

              <Link
                to="/forgot-password"
                className="text-white/75 hover:text-white underline underline-offset-4"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading || !isFormValid}
              className="w-full rounded-full bg-white text-slate-900 font-semibold py-3.5 shadow hover:opacity-95 active:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Logging in...
                </>
              ) : (
                "Login"
              )}
            </button>

            <p className="text-center text-sm text-white/70">
              Don&apos;t have an account?{" "}
              <Link
                to="/register"
                className="text-white underline underline-offset-4 hover:opacity-90"
              >
                Register
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}