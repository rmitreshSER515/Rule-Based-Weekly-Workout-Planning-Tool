import { useState } from "react";
import { Link } from "react-router-dom";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [touched, setTouched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const validateEmail = (value: string) => {
    if (!value.trim()) return "Email address is required";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return "Please enter a valid email address";
    return "";
  };

  const handleBlur = () => {
    setTouched(true);
    setEmailError(validateEmail(email));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (touched) setEmailError(validateEmail(e.target.value));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    const error = validateEmail(email);
    setEmailError(error);
    if (error) return;

    setIsLoading(true);
    // Replace with your real API call
    await new Promise((res) => setTimeout(res, 1500));
    setIsLoading(false);
    setSent(true);
  };

  const isFormValid = email.trim() && !emailError;

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center px-5 py-10 overflow-hidden bg-slate-950">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950" />

      {/* Glow blobs */}
      <div className="absolute -top-32 -left-32 h-[520px] w-[520px] rounded-full bg-fuchsia-500/20 blur-[90px]" />
      <div className="absolute -bottom-40 -right-40 h-[620px] w-[620px] rounded-full bg-cyan-400/15 blur-[110px]" />

      {/* Dot grid */}
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

          {!sent ? (
            <>
              {/* Header */}
              <div className="pt-8 px-8 text-center">
                {/* Back arrow */}
                <Link
                  to="/login"
                  className="absolute top-6 left-6 text-white/60 hover:text-white transition-colors flex items-center gap-1.5 text-sm"
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

                {/* Lock icon */}
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-white/20 bg-white/10">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <rect
                      x="5"
                      y="11"
                      width="14"
                      height="10"
                      rx="2"
                      stroke="white"
                      strokeWidth="2"
                    />
                    <path
                      d="M8 11V7a4 4 0 1 1 8 0v4"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <circle cx="12" cy="16" r="1.5" fill="white" />
                  </svg>
                </div>

                <h1 className="text-3xl font-extrabold tracking-wide text-white drop-shadow">
                  Forgot Password?
                </h1>
                <p className="mt-2 text-white/60 text-sm leading-relaxed px-4">
                  No worries! Enter your email and we'll send you a verification code to reset your password.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={onSubmit} className="px-8 pb-8 pt-6 space-y-5">
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Email Address"
                    className={`w-full rounded-full bg-white/10 text-white placeholder-white/60 px-5 py-3.5 pr-12 outline-none border ${
                      emailError ? "border-red-400" : "border-white/15"
                    } focus:border-white/35 focus:ring-2 focus:ring-white/20 transition-colors`}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <rect x="2" y="4" width="20" height="16" rx="3" stroke="currentColor" strokeWidth="2" />
                      <path
                        d="M2 8l10 6 10-6"
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

                <button
                  type="submit"
                  disabled={isLoading || !isFormValid}
                  className="w-full rounded-full bg-white text-slate-900 font-semibold py-3.5 shadow hover:opacity-95 active:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-opacity"
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
                      Sending...
                    </>
                  ) : (
                    "Send Verification Code"
                  )}
                </button>

                <p className="text-center text-sm text-white/70">
                  Remember your password?{" "}
                  <Link
                    to="/login"
                    className="text-white underline underline-offset-4 hover:opacity-90"
                  >
                    Sign in
                  </Link>
                </p>
              </form>
            </>
          ) : (
            /* Success state */
            <div className="px-8 py-10 text-center space-y-5">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-emerald-400/40 bg-emerald-500/20">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M5 13l4 4L19 7"
                    stroke="#34d399"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              <div>
                <h2 className="text-2xl font-extrabold text-white tracking-wide">Check your inbox</h2>
                <p className="mt-2 text-white/60 text-sm leading-relaxed px-2">
                  We've sent a verification code to{" "}
                  <span className="text-white font-medium">{email}</span>.
                  <br />
                  It may take a few minutes to arrive.
                </p>
              </div>

              <p className="text-sm text-white/60">
                Didn't receive it?{" "}
                <button
                  onClick={() => setSent(false)}
                  className="text-white underline underline-offset-4 hover:opacity-90"
                >
                  Resend code
                </button>
              </p>

              <Link
                to="/login"
                className="block w-full rounded-full border border-white/20 bg-white/10 text-white font-semibold py-3.5 hover:bg-white/20 transition-colors text-center text-sm"
              >
                Back to Sign In
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}