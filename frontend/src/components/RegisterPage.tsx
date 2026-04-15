import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function RegisterPage() {
  const navigate = useNavigate();

  const PHONE_DIGITS = 10;

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState(""); 
  const [countryCode, setCountryCode] = useState("+1");
  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const [touched, setTouched] = useState({
    firstName: false,
    lastName: false,
    phone: false,
    email: false,
    password: false,
    confirm: false,
  });

  const [errors, setErrors] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    password: "",
    confirm: "",
  });

  const digitsOnlyPhone = (v: string) => v.replace(/\D/g, "");

  const emailOk = useMemo(() => {
    const r = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return r.test(email.trim());
  }, [email]);

  const passwordCriteria = useMemo(
    () => ({
      minLength: password.length >= 6,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSymbol: /[^A-Za-z0-9]/.test(password),
    }),
    [password]
  );

  const allCriteriaMet = Object.values(passwordCriteria).every(Boolean);

  
  useEffect(() => {
    if (!touched.email) return;
    if (!email.trim()) {
      setErrors((p) => ({ ...p, email: "Email address is required" }));
    } else if (!emailOk) {
      setErrors((p) => ({ ...p, email: "Please enter a valid email address" }));
    } else {
      setErrors((p) => ({ ...p, email: "" }));
    }
  }, [email, emailOk, touched.email]);

 
  useEffect(() => {
    if (!touched.phone) return;

    const ph = digitsOnlyPhone(phone);

    if (!ph) {
      setErrors((p) => ({ ...p, phone: "Phone number is required" }));
    } else if (ph.length !== PHONE_DIGITS) {
      setErrors((p) => ({ ...p, phone: "Enter a valid phone number" }));
    } else {
      setErrors((p) => ({ ...p, phone: "" }));
    }
  }, [phone, touched.phone]);

  
  useEffect(() => {
    if (!touched.password) return;
    if (!password) {
      setErrors((p) => ({ ...p, password: "Password is required" }));
    } else if (!allCriteriaMet) {
      setErrors((p) => ({ ...p, password: "Password doesn't meet all requirements" }));
    } else {
      setErrors((p) => ({ ...p, password: "" }));
    }
  }, [password, allCriteriaMet, touched.password]);

 
  useEffect(() => {
    if (!touched.confirm) return;
    if (!confirmPassword) {
      setErrors((p) => ({ ...p, confirm: "Please confirm your password" }));
    } else if (confirmPassword !== password) {
      setErrors((p) => ({ ...p, confirm: "Passwords do not match" }));
    } else {
      setErrors((p) => ({ ...p, confirm: "" }));
    }
  }, [confirmPassword, password, touched.confirm]);

  const validateAll = () => {
    let ok = true;

    const next = {
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
      password: "",
      confirm: "",
    };

    if (!firstName.trim()) {
      next.firstName = "First name is required";
      ok = false;
    }
    if (!lastName.trim()) {
      next.lastName = "Last name is required";
      ok = false;
    }

    const ph = digitsOnlyPhone(phone);
    if (!ph) {
      next.phone = "Phone number is required";
      ok = false;
    } else if (ph.length !== PHONE_DIGITS) {
      next.phone = "Enter a valid phone number";
      ok = false;
    }

    if (!email.trim()) {
      next.email = "Email address is required";
      ok = false;
    } else if (!emailOk) {
      next.email = "Please enter a valid email address";
      ok = false;
    }

    if (!password) {
      next.password = "Password is required";
      ok = false;
    } else if (!allCriteriaMet) {
      next.password = "Password doesn't meet all requirements";
      ok = false;
    }

    if (!confirmPassword) {
      next.confirm = "Please confirm your password";
      ok = false;
    } else if (confirmPassword !== password) {
      next.confirm = "Passwords do not match";
      ok = false;
    }

    setErrors(next);
    return ok;
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
  
    setTouched({
      firstName: true,
      lastName: true,
      phone: true,
      email: true,
      password: true,
      confirm: true,
    });
    setSubmitError("");
  
    if (!validateAll()) return;
  
    try {
      setIsLoading(true);
  
      const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";
  
      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phoneNumber: countryCode + digitsOnlyPhone(phone),
          email: email.trim(),
          password,
          confirmPassword,
        }),
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.message || "Registration failed");
      }
  
      localStorage.removeItem("token");
      localStorage.removeItem("user");
  
      navigate("/login");
    } catch (error: any) {
      setSubmitError(error.message || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid =
    firstName.trim() &&
    lastName.trim() &&
    digitsOnlyPhone(phone).length === PHONE_DIGITS &&
    email.trim() &&
    emailOk &&
    password &&
    allCriteriaMet &&
    confirmPassword &&
    confirmPassword === password &&
    !Object.values(errors).some(Boolean);

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
              Create Account
            </h1>
            <p className="mt-2 text-white/70 text-sm">
              Register to start planning your workouts
            </p>
          </div>

          <form onSubmit={onSubmit} className="px-8 pb-8 pt-6 space-y-5">
            {/* First name */}
            <div>
              <input
                value={firstName}
                onChange={(e) => {
                  setFirstName(e.target.value);
                  setSubmitError("");
                }}
                onBlur={() => setTouched((p) => ({ ...p, firstName: true }))}
                placeholder="First Name"
                className={`w-full rounded-full bg-white/10 text-white placeholder-white/60 px-5 py-3.5 outline-none border ${
                  errors.firstName ? "border-red-400" : "border-white/15"
                } focus:border-white/35 focus:ring-2 focus:ring-white/20`}
              />
              {errors.firstName && (
                <p className="text-red-400 text-xs mt-1.5 ml-5">{errors.firstName}</p>
              )}
            </div>

            {/* Last name */}
            <div>
              <input
                value={lastName}
                onChange={(e) => {
                  setLastName(e.target.value);
                  setSubmitError("");
                }}
                onBlur={() => setTouched((p) => ({ ...p, lastName: true }))}
                placeholder="Last Name"
                className={`w-full rounded-full bg-white/10 text-white placeholder-white/60 px-5 py-3.5 outline-none border ${
                  errors.lastName ? "border-red-400" : "border-white/15"
                } focus:border-white/35 focus:ring-2 focus:ring-white/20`}
              />
              {errors.lastName && (
                <p className="text-red-400 text-xs mt-1.5 ml-5">{errors.lastName}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <div className="relative flex gap-2">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="rounded-full bg-white/10 text-white px-4 py-3.5 outline-none border border-white/15 focus:border-white/35 focus:ring-2 focus:ring-white/20 appearance-none pr-8"
                  style={{ width: "110px" }}
                >
                  <option value="+1" className="bg-slate-900">🇺🇸 +1</option>
                  <option value="+44" className="bg-slate-900">🇬🇧 +44</option>
                  <option value="+91" className="bg-slate-900">🇮🇳 +91</option>
                  <option value="+86" className="bg-slate-900">🇨🇳 +86</option>
                  <option value="+81" className="bg-slate-900">🇯🇵 +81</option>
                  <option value="+49" className="bg-slate-900">🇩🇪 +49</option>
                  <option value="+33" className="bg-slate-900">🇫🇷 +33</option>
                  <option value="+61" className="bg-slate-900">🇦🇺 +61</option>
                  <option value="+55" className="bg-slate-900">🇧🇷 +55</option>
                  <option value="+7" className="bg-slate-900">🇷🇺 +7</option>
                  <option value="+82" className="bg-slate-900">🇰🇷 +82</option>
                  <option value="+34" className="bg-slate-900">🇪🇸 +34</option>
                  <option value="+39" className="bg-slate-900">🇮🇹 +39</option>
                  <option value="+52" className="bg-slate-900">🇲🇽 +52</option>
                  <option value="+27" className="bg-slate-900">🇿🇦 +27</option>
                </select>

                <input
                  value={phone}
                  onChange={(e) => {
                    const digits = digitsOnlyPhone(e.target.value).slice(0, PHONE_DIGITS);
                    setPhone(digits);
                    setSubmitError("");
                  }}
                  onBlur={() => setTouched((p) => ({ ...p, phone: true }))}
                  placeholder="Phone Number"
                  inputMode="numeric"
                  autoComplete="tel"
                  maxLength={PHONE_DIGITS}
                  className={`flex-1 rounded-full bg-white/10 text-white placeholder-white/60 px-5 py-3.5 outline-none border ${
                    errors.phone ? "border-red-400" : "border-white/15"
                  } focus:border-white/35 focus:ring-2 focus:ring-white/20`}
                />
              </div>
              {errors.phone && (
                <p className="text-red-400 text-xs mt-1.5 ml-5">{errors.phone}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <input
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setSubmitError("");
                }}
                onBlur={() => setTouched((p) => ({ ...p, email: true }))}
                placeholder="Email Address"
                className={`w-full rounded-full bg-white/10 text-white placeholder-white/60 px-5 py-3.5 outline-none border ${
                  errors.email ? "border-red-400" : "border-white/15"
                } focus:border-white/35 focus:ring-2 focus:ring-white/20`}
              />
              {errors.email && (
                <p className="text-red-400 text-xs mt-1.5 ml-5">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setSubmitError("");
                  }}
                  onBlur={() => setTouched((p) => ({ ...p, password: true }))}
                  placeholder="Password"
                  className={`w-full rounded-full bg-white/10 text-white placeholder-white/60 px-5 py-3.5 pr-12 outline-none border ${
                    errors.password ? "border-red-400" : "border-white/15"
                  } focus:border-white/35 focus:ring-2 focus:ring-white/20`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white"
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
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

              {password && (
                <div className="mt-2 ml-5 space-y-1">
                  <div className="flex items-center gap-2 text-xs">
                    <span className={passwordCriteria.minLength ? "text-green-400" : "text-white/60"}>
                      {passwordCriteria.minLength ? "✓" : "○"}
                    </span>
                    <span className={passwordCriteria.minLength ? "text-white/90" : "text-white/60"}>
                      At least 6 characters
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className={passwordCriteria.hasUpperCase ? "text-green-400" : "text-white/60"}>
                      {passwordCriteria.hasUpperCase ? "✓" : "○"}
                    </span>
                    <span className={passwordCriteria.hasUpperCase ? "text-white/90" : "text-white/60"}>
                      One uppercase letter
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className={passwordCriteria.hasLowerCase ? "text-green-400" : "text-white/60"}>
                      {passwordCriteria.hasLowerCase ? "✓" : "○"}
                    </span>
                    <span className={passwordCriteria.hasLowerCase ? "text-white/90" : "text-white/60"}>
                      One lowercase letter
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className={passwordCriteria.hasNumber ? "text-green-400" : "text-white/60"}>
                      {passwordCriteria.hasNumber ? "✓" : "○"}
                    </span>
                    <span className={passwordCriteria.hasNumber ? "text-white/90" : "text-white/60"}>
                      One number
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className={passwordCriteria.hasSymbol ? "text-green-400" : "text-white/60"}>
                      {passwordCriteria.hasSymbol ? "✓" : "○"}
                    </span>
                    <span className={passwordCriteria.hasSymbol ? "text-white/90" : "text-white/60"}>
                      One symbol (!@#$...)
                    </span>
                  </div>
                </div>
              )}

              {errors.password && (
                <p className="text-red-400 text-xs mt-1.5 ml-5">{errors.password}</p>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setSubmitError("");
                  }}
                  onBlur={() => setTouched((p) => ({ ...p, confirm: true }))}
                  placeholder="Confirm Password"
                  className={`w-full rounded-full bg-white/10 text-white placeholder-white/60 px-5 py-3.5 pr-12 outline-none border ${
                    errors.confirm ? "border-red-400" : "border-white/15"
                  } focus:border-white/35 focus:ring-2 focus:ring-white/20`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white"
                >
                  {showConfirm ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
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
              {errors.confirm && (
                <p className="text-red-400 text-xs mt-1.5 ml-5">{errors.confirm}</p>
              )}
            </div>

            {submitError && (
              <p className="text-red-400 text-xs ml-5">{submitError}</p>
            )}

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
                  Creating...
                </>
              ) : (
                "Create Account"
              )}
            </button>

            <p className="text-center text-sm text-white/70">
              Already have an account?{" "}
              <Link to="/login" className="text-white underline underline-offset-4 hover:opacity-90">
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
