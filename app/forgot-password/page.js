"use client";

import { useState } from "react";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import { sendPasswordResetEmail } from "firebase/auth";
import { MailIcon, ArrowLeftIcon, CheckCircleIcon, Spinner, AlertCircleIcon } from "@/components/Icons";

export default function ForgotPassword() {
  const [email,   setEmail]   = useState("");
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);
  const [error,   setError]   = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setSent(true);
    } catch (err) {
      const m = {
        "auth/user-not-found":  "No account found with this email.",
        "auth/invalid-email":   "Please enter a valid email address.",
      };
      setError(m[err.code] || "Failed to send reset email. Please try again.");
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <Link href="/login" className="inline-flex items-center gap-1.5 text-sm text-[#64748B] hover:text-[#0F172A] mb-8 transition-colors">
          <ArrowLeftIcon size={16}/> Back to sign in
        </Link>

        {sent ? (
          <div className="text-center">
            <div className="w-20 h-20 bg-[#F0FDF4] rounded-full flex items-center justify-center mx-auto mb-6 text-[#22C55E]">
              <CheckCircleIcon size={40}/>
            </div>
            <h1 className="font-black text-[#0F172A] text-2xl mb-2">Reset link sent!</h1>
            <p className="text-[#64748B] mb-2">We sent a password reset link to</p>
            <p className="font-semibold text-[#0F172A] bg-[#F1F5F9] px-4 py-2 rounded-xl text-sm inline-block mb-6">{email}</p>
            <p className="text-xs text-[#94A3B8] mb-8">Check your inbox (and spam folder). The link expires in 1 hour.</p>
            <Link href="/login" className="inline-flex items-center gap-2 bg-[#0F172A] text-white px-8 py-3.5 rounded-xl font-bold text-sm hover:bg-[#1E293B]">
              Back to sign in
            </Link>
          </div>
        ) : (
          <>
            <div className="w-16 h-16 bg-[#FFF7ED] rounded-2xl flex items-center justify-center mb-6 text-[#F97316]">
              <MailIcon size={30}/>
            </div>
            <h1 className="font-black text-[#0F172A] text-2xl mb-1">Forgot password?</h1>
            <p className="text-[#64748B] text-sm mb-8">Enter your email and we'll send you a reset link.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#374151] uppercase tracking-wide mb-2">Email Address</label>
                <div className="flex items-center bg-white border border-[#E2E8F0] rounded-xl focus-within:border-[#F97316] focus-within:ring-2 focus-within:ring-[#F97316]/10 transition-all">
                  <span className="pl-4 text-[#94A3B8]"><MailIcon size={16}/></span>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required
                    className="flex-1 px-3 py-3.5 bg-transparent text-sm text-[#0F172A] outline-none placeholder:text-[#CBD5E1]" />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] text-sm rounded-xl px-4 py-3">
                  <AlertCircleIcon size={15}/>{error}
                </div>
              )}

              <button type="submit" disabled={loading || !email}
                className="w-full bg-[#0F172A] text-white py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#1E293B] active:scale-[0.98] transition-all disabled:opacity-50">
                {loading ? <><Spinner size={16}/>Sending…</> : "Send Reset Link"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
