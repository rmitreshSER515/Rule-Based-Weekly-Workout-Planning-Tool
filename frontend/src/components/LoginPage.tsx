import { useState } from "react";
import { useNavigate } from "react-router-dom";


export default function LoginPage() {
  const [emailOrUser, setEmailOrUser] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const navigate = useNavigate();

  const onSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  // no backend yet — just navigate
  navigate("/fitness");
};

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center px-5 py-10 overflow-hidden bg-slate-950">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950" />

      {/* Fitness “energy” glows */}
      <div className="absolute -top-32 -left-32 h-[520px] w-[520px] rounded-full bg-fuchsia-500/20 blur-[90px]" />
      <div className="absolute -bottom-40 -right-40 h-[620px] w-[620px] rounded-full bg-cyan-400/15 blur-[110px]" />

      {/* Subtle dotted texture */}
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
                value={emailOrUser}
                onChange={(e) => setEmailOrUser(e.target.value)}
                placeholder="Username or Email"
                className="w-full rounded-full bg-white/10 text-white placeholder-white/60 px-5 py-3.5 pr-12 outline-none border border-white/15 focus:border-white/35 focus:ring-2 focus:ring-white/20"
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
            </div>

            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full rounded-full bg-white/10 text-white placeholder-white/60 px-5 py-3.5 pr-12 outline-none border border-white/15 focus:border-white/35 focus:ring-2 focus:ring-white/20"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M17 11V8a5 5 0 0 0-10 0v3"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M6.5 11h11A2.5 2.5 0 0 1 20 13.5v6A2.5 2.5 0 0 1 17.5 22h-11A2.5 2.5 0 0 1 4 19.5v-6A2.5 2.5 0 0 1 6.5 11Z"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                </svg>
              </span>
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

              <button
                type="button"
                className="text-white/75 hover:text-white underline underline-offset-4"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              className="w-full rounded-full bg-white text-slate-900 font-semibold py-3.5 shadow hover:opacity-95 active:opacity-90"
            >
              Login
            </button>

            <p className="text-center text-sm text-white/70">
              Don&apos;t have an account?{" "}
              <button
                type="button"
                className="text-white underline underline-offset-4 hover:opacity-90"
              >
                Register
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}