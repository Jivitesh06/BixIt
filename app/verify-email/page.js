"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { sendEmailVerification } from "firebase/auth";
import { useAuth } from "@/context/AuthContext";
import { ArrowRightIcon, Spinner, CheckCircleIcon, MailIcon } from "@/components/Icons";

export default function VerifyEmailPage() {
  const router = useRouter();
  const { user, userRole } = useAuth();
  const [checking,  setChecking]  = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown,  setCooldown]  = useState(0);
  const [error,     setError]     = useState("");
  const [resent,    setResent]    = useState(false);

  // If already verified redirect
  useEffect(() => {
    if (user?.emailVerified) {
      router.replace(userRole === "worker" ? "/worker/dashboard" : "/client/dashboard");
    }
  }, [user, userRole]);

  // Countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function handleContinue() {
    setError(""); setChecking(true);
    try {
      await auth.currentUser?.reload();
      if (auth.currentUser?.emailVerified) {
        router.replace(userRole === "worker" ? "/worker/dashboard" : "/client/dashboard");
      } else {
        setError("Email not verified yet. Please check your inbox and click the link.");
      }
    } catch { setError("Failed to check. Please try again."); }
    finally { setChecking(false); }
  }

  async function handleResend() {
    setResent(false); setError(""); setResending(true);
    try {
      await sendEmailVerification(auth.currentUser);
      setResent(true); setCooldown(60);
    } catch { setError("Failed to resend. Please wait a moment and try again."); }
    finally { setResending(false); }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm text-center">
        {/* Icon */}
        <div className="w-24 h-24 bg-[#FFF7ED] rounded-full flex items-center justify-center mx-auto mb-6 text-[#F97316]">
          <MailIcon size={44}/>
        </div>

        <h1 className="font-black text-[#0F172A] text-3xl mb-2">Check your email</h1>
        <p className="text-[#64748B] mb-2">We sent a verification link to</p>
        <p className="font-semibold text-[#0F172A] mb-8 bg-[#F1F5F9] px-4 py-2 rounded-xl text-sm inline-block">
          {user?.email || "your email"}
        </p>

        <p className="text-xs text-[#94A3B8] mb-8 leading-relaxed">
          Click the link in the email to verify your account, then come back and press "Continue".
        </p>

        {error && (
          <div className="bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] text-sm rounded-xl px-4 py-3 mb-5 text-left">
            {error}
          </div>
        )}
        {resent && (
          <div className="bg-[#F0FDF4] border border-[#BBF7D0] text-[#166534] text-sm rounded-xl px-4 py-3 mb-5 flex items-center gap-2">
            <CheckCircleIcon size={16}/> Verification email resent!
          </div>
        )}

        <div className="space-y-3">
          <button onClick={handleContinue} disabled={checking}
            className="w-full bg-[#0F172A] text-white py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#1E293B] active:scale-[0.98] transition-all disabled:opacity-50">
            {checking ? <><Spinner size={18}/>Checking…</> : <><span>I've verified, Continue</span><ArrowRightIcon size={18}/></>}
          </button>

          <button onClick={handleResend} disabled={resending || cooldown > 0}
            className="w-full bg-white border border-[#E2E8F0] text-[#374151] py-3.5 rounded-xl font-semibold text-sm hover:bg-[#F8FAFC] disabled:opacity-50 transition-colors">
            {resending ? "Sending…" : cooldown > 0 ? `Resend in ${cooldown}s` : "Resend Verification Email"}
          </button>

          <Link href="/register" className="block text-center text-sm text-[#94A3B8] hover:text-[#F97316] py-1 transition-colors">
            Wrong email? Go back
          </Link>
        </div>
      </div>
    </div>
  );
}
