"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getBooking } from "@/lib/firestore";
import { formatCurrency } from "@/lib/utils";
import { SERVICE_CATEGORIES } from "@/lib/constants";

export default function PaymentSuccess() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("bookingId");
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkVisible, setCheckVisible] = useState(false);

  useEffect(() => {
    if (bookingId) {
      getBooking(bookingId).then(b => {
        setBooking(b);
        setLoading(false);
        setTimeout(() => setCheckVisible(true), 100);
      });
    } else {
      setLoading(false);
      setTimeout(() => setCheckVisible(true), 100);
    }
  }, [bookingId]);

  const catLabel = SERVICE_CATEGORIES.find(c => c.id === booking?.serviceType)?.label;

  return (
    <div className="min-h-screen bg-[#f7f9fb] flex flex-col">
      {/* Header */}
      <nav className="flex items-center justify-between px-5 h-14 bg-white border-b border-gray-100">
        <Link href="/client/dashboard" className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#0F172A]" style={{ fontSize: 20 }}>arrow_back</span>
          <span className="font-headline font-black text-[#0F172A]">Bixit</span>
        </Link>
        <span className="text-sm font-bold text-[#45464d]">EN | हिं</span>
      </nav>

      <div className="flex-1 flex flex-col items-center px-5 py-10 max-w-md mx-auto w-full">

        {/* Animated checkmark */}
        <div className={`w-24 h-24 rounded-full bg-[#f2f4f6] flex items-center justify-center mb-6 transition-all duration-700 ${checkVisible ? "scale-100 opacity-100" : "scale-50 opacity-0"}`}>
          <div className={`w-16 h-16 rounded-full bg-[#131b2e] flex items-center justify-center transition-all duration-500 delay-200 ${checkVisible ? "scale-100" : "scale-0"}`}>
            <style>{`
              @keyframes checkDraw {
                from { stroke-dashoffset: 50; }
                to   { stroke-dashoffset: 0;  }
              }
              .check-path {
                stroke-dasharray: 50;
                stroke-dashoffset: 50;
                animation: checkDraw 0.5s ease 0.4s forwards;
              }
            `}</style>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path className="check-path" d="M7 16l6.5 7L25 9" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        {/* Heading */}
        <h1 className={`font-headline font-bold text-3xl text-[#0F172A] text-center mb-2 transition-all duration-500 delay-300 ${checkVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          Booking Confirmed!
        </h1>
        <p className={`text-[#45464d] text-center text-sm mb-8 transition-all duration-500 delay-500 ${checkVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          Your professional is scheduled and notified.
        </p>

        {/* Booking card */}
        {booking && (
          <div className={`w-full bg-white rounded-2xl shadow-sm border border-[#f2f4f6] overflow-hidden mb-5 transition-all duration-500 delay-700 ${checkVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            {/* Worker row */}
            <div className="flex items-center justify-between p-4 border-b border-[#f2f4f6]">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#f2f4f6] flex items-center justify-center overflow-hidden">
                  <span className="material-symbols-outlined text-[#76777d]" style={{ fontSize: 24 }}>person</span>
                </div>
                <div>
                  <p className="font-headline font-bold text-[#0F172A]">{booking.workerName || "Worker"}</p>
                  {catLabel && (
                    <span className="text-[10px] font-bold bg-[#fd761a]/10 text-[#9d4300] px-2 py-0.5 rounded-full">{catLabel.toUpperCase()}</span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-[#76777d] uppercase tracking-wider">Total Paid</p>
                <p className="font-headline font-bold text-[#0F172A] text-xl">{formatCurrency(booking.finalAmount || booking.offeredAmount)}</p>
              </div>
            </div>

            {/* Date */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-[#f2f4f6]">
              <span className="material-symbols-outlined text-[#45464d]" style={{ fontSize: 20 }}>calendar_today</span>
              <div>
                <p className="text-[10px] font-bold text-[#76777d] uppercase tracking-wider">Scheduled Date</p>
                <p className="text-sm font-medium text-[#0F172A]">{booking.date} · {booking.time}</p>
              </div>
            </div>

            {/* Address */}
            <div className="flex items-center gap-3 px-4 py-3">
              <span className="material-symbols-outlined text-[#45464d]" style={{ fontSize: 20 }}>location_on</span>
              <div>
                <p className="text-[10px] font-bold text-[#76777d] uppercase tracking-wider">Service Address</p>
                <p className="text-sm font-medium text-[#0F172A]">{booking.address}</p>
              </div>
            </div>
          </div>
        )}

        {/* Help link */}
        <div className={`w-full bg-white rounded-2xl border border-[#f2f4f6] p-4 flex items-center justify-between mb-8 transition-all duration-500 delay-1000 cursor-pointer hover:border-[#F97316] ${checkVisible ? "opacity-100" : "opacity-0"}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#fd761a]/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-[#F97316]" style={{ fontSize: 20 }}>support_agent</span>
            </div>
            <p className="text-sm font-medium text-[#0F172A]">Need help with this booking?</p>
          </div>
          <span className="material-symbols-outlined text-[#45464d]" style={{ fontSize: 20 }}>chevron_right</span>
        </div>

        {/* Buttons */}
        <div className={`w-full flex flex-col gap-3 transition-all duration-500 delay-1000 ${checkVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          <Link href="/client/bookings"
            className="w-full bg-[#131b2e] text-white py-4 rounded-2xl font-headline font-bold text-base text-center hover:bg-[#1e2a45] active:scale-[0.98] transition-all flex items-center justify-center gap-2">
            View Booking →
          </Link>
          <Link href="/client/dashboard"
            className="w-full bg-white border border-[#e0e3e5] text-[#0F172A] py-4 rounded-2xl font-headline font-bold text-base text-center hover:border-[#131b2e] active:scale-[0.98] transition-all">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
