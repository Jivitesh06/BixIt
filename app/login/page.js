"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";

/* ─────────────────────────── SVG Icons ─────────────────────────── */
const MailIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="3"/>
    <path d="m2 7 9.3 6.2a1 1 0 0 0 1.4 0L22 7"/>
  </svg>
);

const LockIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

const EyeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const EyeOffIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
    <line x1="2" y1="2" x2="22" y2="22"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const ArrowRightIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M12 5l7 7-7 7"/>
  </svg>
);

const Spinner = () => (
  <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" strokeOpacity="0.3"/>
    <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round"/>
  </svg>
);

/* ─────────────────────── Error message helper ───────────────────── */
function mapAuthError(code) {
  const map = {
    "auth/invalid-email":       "Please enter a valid email address.",
    "auth/user-not-found":      "No account found with this email.",
    "auth/wrong-password":      "Incorrect password. Please try again.",
    "auth/invalid-credential":  "Incorrect email or password.",
    "auth/too-many-requests":   "Too many attempts. Please try again later.",
    "auth/network-request-failed": "Network error. Please check your connection.",
  };
  return map[code] || "Something went wrong. Please try again.";
}

/* ─────────────── Shared login form (used by both tabs) ──────────── */
function LoginForm({ role, redirectTo }) {
  const router = useRouter();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!email || !password) { setError("Please fill in all fields."); return; }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push(redirectTo);
    } catch (err) {
      setError(mapAuthError(err.code));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="fade-up space-y-5" noValidate>
      {/* Email */}
      <div>
        <label className="block text-xs font-semibold text-[#374151] mb-2 uppercase tracking-wide">
          Email address
        </label>
        <div className={`relative flex items-center bg-white border rounded-xl transition-all duration-200 ${
          error && !email ? "border-red-400 ring-1 ring-red-100" : "border-[#e4e4e7] focus-within:border-[#F97316] focus-within:ring-2 focus-within:ring-[#F97316]/10"
        }`}>
          <span className="pl-4 text-[#9ca3af] flex-shrink-0"><MailIcon /></span>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            className="flex-1 px-3 py-3.5 bg-transparent text-sm text-[#0F172A] outline-none placeholder:text-[#d4d4d8]"
          />
        </div>
      </div>

      {/* Password */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-[#374151] uppercase tracking-wide">
            Password
          </label>
          <Link href="/forgot-password" className="text-xs text-[#F97316] font-medium hover:underline">
            Forgot password?
          </Link>
        </div>
        <div className={`relative flex items-center bg-white border rounded-xl transition-all duration-200 ${
          error && !password ? "border-red-400 ring-1 ring-red-100" : "border-[#e4e4e7] focus-within:border-[#F97316] focus-within:ring-2 focus-within:ring-[#F97316]/10"
        }`}>
          <span className="pl-4 text-[#9ca3af] flex-shrink-0"><LockIcon /></span>
          <input
            type={showPass ? "text" : "password"}
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Enter your password"
            autoComplete="current-password"
            className="flex-1 px-3 py-3.5 bg-transparent text-sm text-[#0F172A] outline-none placeholder:text-[#d4d4d8]"
          />
          <button
            type="button"
            onClick={() => setShowPass(p => !p)}
            className="pr-4 text-[#9ca3af] hover:text-[#6b7280] transition-colors flex-shrink-0"
          >
            {showPass ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <p className="flex items-start gap-1.5 text-red-500 text-xs">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="flex-shrink-0 mt-0.5">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
          {error}
        </p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[#0F172A] text-white py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2.5 hover:bg-[#1e293b] active:scale-[0.98] transition-all duration-150 disabled:opacity-60 mt-2"
      >
        {loading ? <><Spinner />Signing in…</> : <><span>Sign in</span><ArrowRightIcon /></>}
      </button>

      {/* Divider */}
      <div className="flex items-center gap-3 py-1">
        <div className="flex-1 h-px bg-[#f4f4f5]" />
        <span className="text-xs text-[#a1a1aa] font-medium">or</span>
        <div className="flex-1 h-px bg-[#f4f4f5]" />
      </div>

      {/* Register link */}
      <Link
        href={role === "worker" ? "/register?role=worker" : "/register"}
        className="w-full border border-[#e4e4e7] text-[#0F172A] py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center hover:border-[#0F172A] hover:bg-[#fafafa] active:scale-[0.98] transition-all duration-150"
      >
        {role === "worker" ? "Register as a worker" : "Create an account"}
      </Link>
    </form>
  );
}

/* ═══════════════════════════ Main Page ════════════════════════════ */
export default function LoginPage() {
  const [tab, setTab] = useState("client");

  return (
    <>
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity:0; transform:translateY(10px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .fade-up { animation: fadeSlideUp 0.3s ease forwards; }
        input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 60px white inset;
          -webkit-text-fill-color: #0F172A;
        }
      `}</style>

      <div className="min-h-screen flex bg-white">

        {/* ═══════════ LEFT PANEL (desktop only) ═══════════ */}
        <div className="hidden lg:flex lg:w-[45%] bg-[#0F172A] flex-col relative overflow-hidden">
          {/* Grid texture */}
          <div className="absolute inset-0 opacity-[0.03]"
            style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "32px 32px" }} />
          {/* Glow */}
          <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-[#F97316] rounded-full blur-[120px] opacity-10 pointer-events-none" />
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#F97316] rounded-full blur-[100px] opacity-5 pointer-events-none" />

          <div className="relative z-10 flex flex-col h-full px-12 py-12">
            {/* Logo */}
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="w-8 h-8 bg-[#F97316] rounded-lg flex items-center justify-center">
                <span className="text-white font-black text-sm">B</span>
              </div>
              <span className="font-black text-white text-2xl tracking-tight">Bixit</span>
            </Link>

            {/* Hero text */}
            <div className="flex-1 flex flex-col justify-center">
              <p className="text-[#F97316] text-xs font-bold uppercase tracking-[0.2em] mb-6">
                On-demand services
              </p>
              <h1 className="text-white font-black text-5xl leading-[1.05] tracking-tight mb-6">
                Welcome<br />back.
              </h1>
              <p className="text-[#6b7280] text-lg leading-relaxed max-w-xs">
                India's most trusted platform for skilled workers at your doorstep.
              </p>
            </div>

            {/* Trust points */}
            <div className="space-y-4 pb-4">
              {[
                "2,000+ Aadhaar-verified workers",
                "Instant booking, anytime",
                "Safe & secure payments",
              ].map((point) => (
                <div key={point} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#F97316]/15 flex items-center justify-center flex-shrink-0 text-[#F97316]">
                    <CheckIcon />
                  </div>
                  <span className="text-[#9ca3af] text-sm">{point}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ═══════════ RIGHT PANEL ═══════════ */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 lg:py-0 min-h-screen">

          {/* Mobile logo */}
          <div className="lg:hidden mb-10 text-center">
            <Link href="/" className="inline-flex items-center gap-2 mb-3">
              <div className="w-9 h-9 bg-[#0F172A] rounded-xl flex items-center justify-center">
                <span className="text-white font-black text-base">B</span>
              </div>
              <span className="font-black text-[#0F172A] text-2xl tracking-tight">Bixit</span>
            </Link>
            <p className="text-sm text-[#6b7280]">India's trusted skilled-worker platform</p>
          </div>

          <div className="w-full max-w-[400px]">
            {/* Heading */}
            <div className="mb-8">
              <h2 className="font-black text-[#0F172A] text-3xl tracking-tight mb-1">Sign in</h2>
              <p className="text-[#6b7280] text-sm">
                New here?{" "}
                <Link href="/register" className="text-[#F97316] font-semibold hover:underline">
                  Create an account
                </Link>
              </p>
            </div>

            {/* Tab Toggle */}
            <div className="flex bg-[#f4f4f5] rounded-xl p-1 mb-8">
              {[
                { id: "client", label: "I'm a Client"  },
                { id: "worker", label: "I'm a Worker" },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex-1 py-2.5 rounded-[10px] text-sm font-semibold transition-all duration-200 ${
                    tab === t.id
                      ? "bg-[#0F172A] text-white shadow-sm"
                      : "text-[#71717a] hover:text-[#0F172A]"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Forms — keyed so fade-up replays on tab switch */}
            {tab === "client" ? (
              <LoginForm key="client" role="client" redirectTo="/client/dashboard" />
            ) : (
              <LoginForm key="worker" role="worker" redirectTo="/worker/dashboard" />
            )}

            {/* Footer */}
            <p className="text-center text-xs text-[#a1a1aa] mt-10">
              By signing in you agree to our{" "}
              <Link href="/terms" className="underline hover:text-[#6b7280]">Terms</Link>
              {" & "}
              <Link href="/privacy" className="underline hover:text-[#6b7280]">Privacy Policy</Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
