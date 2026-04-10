"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import {
  MailIcon, LockIcon, EyeIcon, EyeOffIcon,
  ArrowRightIcon, CheckIcon, Spinner
} from "@/components/Icons";

function mapAuthError(code) {
  const m = {
    "auth/invalid-email":       "Please enter a valid email address.",
    "auth/user-not-found":      "No account found with this email.",
    "auth/wrong-password":      "Incorrect password. Please try again.",
    "auth/invalid-credential":  "Incorrect email or password.",
    "auth/too-many-requests":   "Too many attempts. Try again later.",
    "auth/network-request-failed": "Network error. Check your connection.",
  };
  return m[code] || "Something went wrong. Please try again.";
}

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
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      // Email verification gate
      if (!user.emailVerified) {
        await sendEmailVerification(user).catch(() => {});
        router.push("/verify-email");
        return;
      }
      router.push(redirectTo);
    } catch (err) {
      setError(mapAuthError(err.code));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {/* Email */}
      <div>
        <label className="block text-xs font-semibold text-[#374151] mb-2 uppercase tracking-wide">
          Email address
        </label>
        <div className="flex items-center bg-white border border-[#E2E8F0] rounded-xl focus-within:border-[#F97316] focus-within:ring-2 focus-within:ring-[#F97316]/10 transition-all">
          <span className="pl-4 text-[#94A3B8] flex-shrink-0"><MailIcon size={17}/></span>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com" autoComplete="email"
            className="flex-1 px-3 py-3.5 bg-transparent text-sm text-[#0F172A] outline-none placeholder:text-[#CBD5E1]" />
        </div>
      </div>

      {/* Password */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-[#374151] uppercase tracking-wide">Password</label>
          <Link href="/forgot-password" className="text-xs text-[#F97316] font-semibold hover:underline">
            Forgot password?
          </Link>
        </div>
        <div className="flex items-center bg-white border border-[#E2E8F0] rounded-xl focus-within:border-[#F97316] focus-within:ring-2 focus-within:ring-[#F97316]/10 transition-all">
          <span className="pl-4 text-[#94A3B8] flex-shrink-0"><LockIcon size={17}/></span>
          <input type={showPass ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
            placeholder="Enter your password" autoComplete="current-password"
            className="flex-1 px-3 py-3.5 bg-transparent text-sm text-[#0F172A] outline-none placeholder:text-[#CBD5E1]" />
          <button type="button" onClick={() => setShowPass(p => !p)} className="pr-4 text-[#94A3B8] hover:text-[#64748B] flex-shrink-0">
            {showPass ? <EyeOffIcon size={17}/> : <EyeIcon size={17}/>}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <p className="text-[#EF4444] text-xs flex items-start gap-1.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="flex-shrink-0 mt-0.5">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
          {error}
        </p>
      )}

      {/* Submit */}
      <button type="submit" disabled={loading}
        className="w-full bg-[#0F172A] text-white py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#1E293B] active:scale-[0.98] transition-all disabled:opacity-50 mt-1">
        {loading ? <><Spinner size={18}/>Signing in…</> : <><span>Sign in</span><ArrowRightIcon size={18}/></>}
      </button>

      <div className="flex items-center gap-3 py-1">
        <div className="flex-1 h-px bg-[#F1F5F9]" />
        <span className="text-xs text-[#94A3B8] font-medium">or</span>
        <div className="flex-1 h-px bg-[#F1F5F9]" />
      </div>

      <Link href={role === "worker" ? "/register?role=worker" : "/register"}
        className="w-full border border-[#E2E8F0] text-[#0F172A] py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center hover:border-[#0F172A] hover:bg-[#F8FAFC] active:scale-[0.98] transition-all">
        {role === "worker" ? "Register as a worker" : "Create an account"}
      </Link>
    </form>
  );
}

export default function LoginPage() {
  const [tab, setTab] = useState("client");

  return (
    <>
      <style>{`
        input:-webkit-autofill { -webkit-box-shadow: 0 0 0 60px white inset; -webkit-text-fill-color: #0F172A; }
      `}</style>
      <div className="min-h-screen flex bg-white">
        {/* Left panel */}
        <div className="hidden lg:flex lg:w-[45%] bg-[#0F172A] flex-col relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px,white 1px,transparent 0)", backgroundSize: "32px 32px" }} />
          <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-[#F97316] rounded-full blur-[120px] opacity-10 pointer-events-none" />
          <div className="relative z-10 flex flex-col h-full px-12 py-12">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="w-8 h-8 bg-[#F97316] rounded-lg flex items-center justify-center"><span className="text-white font-black text-sm">B</span></div>
              <span className="font-black text-white text-2xl tracking-tight">Bixit</span>
            </Link>
            <div className="flex-1 flex flex-col justify-center">
              <p className="text-[#F97316] text-xs font-bold uppercase tracking-[0.2em] mb-6">On-demand services</p>
              <h1 className="text-white font-black text-5xl leading-[1.05] tracking-tight mb-6">Welcome<br/>back.</h1>
              <p className="text-[#64748B] text-lg leading-relaxed max-w-xs">India's most trusted platform for skilled workers at your doorstep.</p>
            </div>
            <div className="space-y-4 pb-4">
              {["2,000+ Aadhaar-verified workers","Instant booking, anytime","Safe & secure payments"].map(p => (
                <div key={p} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#F97316]/15 flex items-center justify-center flex-shrink-0 text-[#F97316]"><CheckIcon size={11}/></div>
                  <span className="text-[#64748B] text-sm">{p}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 min-h-screen">
          <div className="lg:hidden mb-10 text-center">
            <Link href="/" className="inline-flex items-center gap-2 mb-2">
              <div className="w-9 h-9 bg-[#0F172A] rounded-xl flex items-center justify-center"><span className="text-white font-black text-base">B</span></div>
              <span className="font-black text-[#0F172A] text-2xl tracking-tight">Bixit</span>
            </Link>
          </div>
          <div className="w-full max-w-[400px]">
            <div className="mb-8">
              <h2 className="font-black text-[#0F172A] text-3xl tracking-tight mb-1">Sign in</h2>
              <p className="text-[#64748B] text-sm">
                New here?{" "}
                <Link href="/register" className="text-[#F97316] font-semibold hover:underline">Create an account</Link>
              </p>
            </div>
            {/* Tabs */}
            <div className="flex bg-[#F4F4F5] rounded-xl p-1 mb-8">
              {[{ id:"client", label:"I'm a Client" },{ id:"worker", label:"I'm a Worker" }].map(t => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`flex-1 py-2.5 rounded-[10px] text-sm font-semibold transition-all duration-200 ${tab === t.id ? "bg-[#0F172A] text-white shadow-sm" : "text-[#71717A] hover:text-[#0F172A]"}`}>
                  {t.label}
                </button>
              ))}
            </div>

            {tab === "client"
              ? <LoginForm key="client" role="client" redirectTo="/client/dashboard" />
              : <LoginForm key="worker" role="worker" redirectTo="/worker/dashboard" />}

            <p className="text-center text-xs text-[#94A3B8] mt-8">
              By signing in you agree to our{" "}
              <Link href="/terms" className="underline underline-offset-2">Terms</Link>{" & "}
              <Link href="/privacy" className="underline underline-offset-2">Privacy Policy</Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
