"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signInWithEmailAndPassword, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getWorkerProfile, getClientProfile } from "@/lib/firestore";
import { useAuth } from "@/context/AuthContext";

function Spinner() {
  return (
    <svg className="animate-spin h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRole = searchParams.get("role") === "worker" ? "worker" : "client";

  const [tab, setTab]             = useState(initialRole);
  const [lang, setLang]           = useState("en");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [showPw, setShowPw]       = useState(false);

  // Client fields
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");

  // Worker phone auth
  const [phone, setPhone]         = useState("");
  const [otpSent, setOtpSent]     = useState(false);
  const [otp, setOtp]             = useState(["", "", "", ""]);
  const [confirmResult, setConfirmResult] = useState(null);
  const otpRefs = [useRef(), useRef(), useRef(), useRef()];
  const recaptchaRef = useRef(null);

  const { user, userRole } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (user && userRole) {
      router.replace(userRole === "worker" ? "/worker/dashboard" : "/client/dashboard");
    }
  }, [user, userRole]);

  /* ── Client Login ─────────────────────────────── */
  async function handleClientLogin(e) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const profile = await getClientProfile(cred.user.uid);
      if (!profile) { setError("No client account found. Please register."); setLoading(false); return; }
      router.push("/client/dashboard");
    } catch (err) {
      setError(
        err.code === "auth/user-not-found"   ? "No account found with this email." :
        err.code === "auth/wrong-password"   ? "Incorrect password." :
        err.code === "auth/invalid-email"    ? "Invalid email address." :
        "Login failed. Please try again."
      );
    } finally { setLoading(false); }
  }

  /* ── Worker: Send OTP ─────────────────────────── */
  async function handleSendOTP() {
    if (!phone || phone.length < 10) { setError("Enter a valid 10-digit phone number."); return; }
    setError(""); setLoading(true);
    try {
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
          size: "invisible",
          callback: () => {},
        });
      }
      const result = await signInWithPhoneNumber(auth, `+91${phone}`, window.recaptchaVerifier);
      setConfirmResult(result);
      setOtpSent(true);
    } catch (err) {
      setError("Failed to send OTP. Check the phone number and try again.");
      if (window.recaptchaVerifier) { window.recaptchaVerifier.clear(); window.recaptchaVerifier = null; }
    } finally { setLoading(false); }
  }

  /* ── Worker: Verify OTP ───────────────────────── */
  async function handleVerifyOTP() {
    const otpString = otp.join("");
    if (otpString.length < 4) { setError("Enter the 4-digit OTP."); return; }
    setError(""); setLoading(true);
    try {
      const cred = await confirmResult.confirm(otpString);
      const profile = await getWorkerProfile(cred.user.uid);
      if (!profile) { setError("No worker account found. Please register."); setLoading(false); return; }
      router.push("/worker/dashboard");
    } catch (err) {
      setError("Invalid OTP. Please try again.");
    } finally { setLoading(false); }
  }

  function handleOtpChange(i, val) {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp]; next[i] = val; setOtp(next);
    if (val && i < 3) otpRefs[i + 1].current?.focus();
    if (!val && i > 0) otpRefs[i - 1].current?.focus();
  }

  return (
    <div className="min-h-screen bg-[#f7f9fb] flex flex-col">
      {/* Recaptcha (invisible) */}
      <div id="recaptcha-container" ref={recaptchaRef} />

      {/* Header */}
      <nav className="flex items-center justify-between px-5 h-14 bg-white border-b border-gray-100">
        <Link href="/" className="font-headline font-black text-[#0F172A] text-xl">Bixit</Link>
        <button onClick={() => setLang(l => l === "en" ? "hi" : "en")} className="text-sm font-bold text-[#0F172A] hover:text-[#F97316] transition-colors px-2 py-1 rounded-lg">
          {lang === "en" ? "EN | हिं" : "हिं | EN"}
        </button>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center px-5 py-10">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#131b2e] text-white font-headline font-black text-2xl mb-3 shadow-lg shadow-[#131b2e]/20">B</div>
            <h1 className="font-headline font-bold text-2xl text-[#0F172A]">Welcome back</h1>
            <p className="text-[#45464d] text-sm mt-1">Sign in to your Bixit account</p>
          </div>

          {/* Tab Toggle */}
          <div className="flex bg-[#f2f4f6] rounded-2xl p-1 mb-7">
            {["client", "worker"].map((t) => (
              <button key={t} onClick={() => { setTab(t); setError(""); setOtpSent(false); }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${tab === t ? "bg-white text-[#0F172A] shadow-sm" : "text-[#45464d]"}`}
              >
                {t === "client" ? "I'm a Client" : "I'm a Worker"}
              </button>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-5">
              <span className="material-symbols-outlined text-red-500" style={{ fontSize: 18 }}>error</span>
              {error}
            </div>
          )}

          {/* ── CLIENT TAB ── */}
          {tab === "client" && (
            <form onSubmit={handleClientLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#45464d] uppercase tracking-wider mb-1.5">Email</label>
                <div className="flex items-center bg-white border border-[#e0e3e5] rounded-xl px-4 py-3.5 focus-within:border-[#131b2e] transition-colors">
                  <span className="material-symbols-outlined text-[#76777d] mr-2" style={{ fontSize: 18 }}>mail</span>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com"
                    className="flex-1 bg-transparent text-[#0F172A] text-sm outline-none placeholder:text-[#c6c6cd]" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#45464d] uppercase tracking-wider mb-1.5">Password</label>
                <div className="flex items-center bg-white border border-[#e0e3e5] rounded-xl px-4 py-3.5 focus-within:border-[#131b2e] transition-colors">
                  <span className="material-symbols-outlined text-[#76777d] mr-2" style={{ fontSize: 18 }}>lock</span>
                  <input type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••"
                    className="flex-1 bg-transparent text-[#0F172A] text-sm outline-none placeholder:text-[#c6c6cd]" />
                  <button type="button" onClick={() => setShowPw(v => !v)} className="text-[#76777d] hover:text-[#0F172A] transition-colors">
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{showPw ? "visibility_off" : "visibility"}</span>
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-[#131b2e] text-white py-4 rounded-2xl font-headline font-bold text-base hover:bg-[#1e2a45] active:scale-[0.98] transition-all duration-150 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading ? <Spinner /> : null}
                {loading ? "Signing in…" : "Login"}
              </button>
            </form>
          )}

          {/* ── WORKER TAB ── */}
          {tab === "worker" && (
            <div className="space-y-4">
              {!otpSent ? (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-[#45464d] uppercase tracking-wider mb-1.5">Phone Number</label>
                    <div className="flex items-center bg-white border border-[#e0e3e5] rounded-xl overflow-hidden focus-within:border-[#131b2e] transition-colors">
                      <span className="px-4 py-3.5 bg-[#f2f4f6] border-r border-[#e0e3e5] text-sm font-bold text-[#0F172A]">+91</span>
                      <input type="tel" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        placeholder="9876543210" className="flex-1 px-4 py-3.5 bg-transparent text-[#0F172A] text-sm outline-none placeholder:text-[#c6c6cd]" />
                    </div>
                  </div>
                  <button onClick={handleSendOTP} disabled={loading}
                    className="w-full bg-[#131b2e] text-white py-4 rounded-2xl font-headline font-bold text-base hover:bg-[#1e2a45] active:scale-[0.98] transition-all duration-150 disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {loading ? <Spinner /> : null}
                    {loading ? "Sending OTP…" : "Send OTP"}
                  </button>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-[#45464d] uppercase tracking-wider mb-1.5">Enter OTP sent to +91{phone}</label>
                    <div className="flex gap-3 justify-center">
                      {otp.map((digit, i) => (
                        <input key={i} ref={otpRefs[i]} type="text" inputMode="numeric" maxLength={1} value={digit}
                          onChange={e => handleOtpChange(i, e.target.value)}
                          onKeyDown={e => e.key === "Backspace" && !otp[i] && i > 0 && otpRefs[i - 1].current?.focus()}
                          className="w-14 h-14 text-center text-2xl font-bold bg-white border-2 border-[#e0e3e5] rounded-2xl text-[#0F172A] outline-none focus:border-[#131b2e] transition-colors"
                        />
                      ))}
                    </div>
                  </div>
                  <button onClick={handleVerifyOTP} disabled={loading}
                    className="w-full bg-[#131b2e] text-white py-4 rounded-2xl font-headline font-bold text-base hover:bg-[#1e2a45] active:scale-[0.98] transition-all duration-150 disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {loading ? <Spinner /> : null}
                    {loading ? "Verifying…" : "Verify & Login"}
                  </button>
                  <button onClick={() => { setOtpSent(false); setOtp(["","","",""]); }} className="w-full text-[#45464d] text-sm py-2 hover:text-[#F97316] transition-colors">
                    ← Change number
                  </button>
                </>
              )}
            </div>
          )}

          {/* Footer link */}
          <p className="text-center text-sm text-[#45464d] mt-7">
            New here?{" "}
            <Link href="/register" className="text-[#F97316] font-bold hover:underline">Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
