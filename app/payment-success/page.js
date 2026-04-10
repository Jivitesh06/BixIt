"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircleIcon, ArrowRightIcon, CalendarIcon } from "@/components/Icons";

export default function PaymentSuccess() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center px-6">
      <style>{`
        @keyframes scaleIn { from{transform:scale(0);opacity:0} to{transform:scale(1);opacity:1} }
        @keyframes checkDraw { from{stroke-dashoffset:100} to{stroke-dashoffset:0} }
        .check-anim { animation: scaleIn 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards; }
        .ring-pulse { animation: scaleIn 0.4s ease forwards, pulse 2s 0.5s ease infinite; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.7} }
      `}</style>

      <div className="w-full max-w-sm text-center">
        {/* Animated checkmark */}
        <div className="relative flex items-center justify-center mb-8">
          <div className="w-28 h-28 bg-[#F0FDF4] rounded-full ring-pulse flex items-center justify-center">
            <div className="w-20 h-20 bg-[#22C55E] rounded-full check-anim flex items-center justify-center">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
          </div>
        </div>

        <h1 className="font-black text-3xl text-[#0F172A] mb-2">Booking Confirmed!</h1>
        <p className="text-[#64748B] mb-8">Your worker has been notified and will be there on time.</p>

        {/* Summary card */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 mb-8 text-left shadow-sm">
          <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-4">Booking Summary</p>
          <div className="space-y-3">
            {[
              { label:"Status",   value:"✅ Confirmed",        highlight: true },
              { label:"Payment",  value:"Secured by Bixit"              },
              { label:"Next",     value:"Worker will contact you soon"   },
            ].map(r => (
              <div key={r.label} className="flex items-center justify-between">
                <span className="text-sm text-[#64748B]">{r.label}</span>
                <span className={`text-sm font-semibold ${r.highlight ? "text-[#22C55E]" : "text-[#0F172A]"}`}>{r.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Link href="/client/bookings"
            className="w-full bg-[#0F172A] text-white py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 hover:bg-[#1E293B] transition-all">
            <CalendarIcon size={18}/> View My Bookings
          </Link>
          <Link href="/client/dashboard"
            className="w-full border border-[#E2E8F0] text-[#374151] py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 hover:bg-[#F8FAFC] transition-all">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
