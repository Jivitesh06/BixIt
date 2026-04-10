"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getClientBookings, updateBookingStatus, listenToBooking } from "@/lib/firestore";
import { getStatusStyle, formatCurrency, timeAgo } from "@/lib/utils";
import { JOB_STATUS, SERVICE_CATEGORIES } from "@/lib/constants";
import BottomNav from "@/components/BottomNav";

const TABS = [
  { id: "active",    label: "Active"    },
  { id: "completed", label: "Completed" },
  { id: "cancelled", label: "Cancelled" },
];

const ACTIVE_STATUSES = ["pending", "accepted", "on_the_way", "arrived", "in_progress"];

function StatusBadge({ status }) {
  const { label, color } = getStatusStyle(status);
  return (
    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${color}`}>{label}</span>
  );
}

function BookingCard({ booking, onCancel, onComplete, lang }) {
  const [localBooking, setLocalBooking] = useState(booking);
  const isActive = ACTIVE_STATUSES.includes(localBooking.status);
  const catLabel = SERVICE_CATEGORIES.find(c => c.id === localBooking.serviceType)?.label || localBooking.serviceType;

  useEffect(() => {
    const unsub = listenToBooking(booking.id, updated => setLocalBooking(updated));
    return () => unsub();
  }, [booking.id]);

  return (
    <div className={`bg-white rounded-2xl shadow-sm border-l-4 overflow-hidden ${
      localBooking.status === "in_progress" ? "border-l-orange-400" :
      localBooking.status === "on_the_way" || localBooking.status === "accepted" ? "border-l-blue-400" :
      localBooking.status === "completed" ? "border-l-green-400" :
      localBooking.status === "pending" ? "border-l-yellow-400" : "border-l-gray-200"
    } border border-[#f2f4f6]`}>
      <div className="p-4">
        {/* Top row */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#f2f4f6] flex items-center justify-center overflow-hidden flex-shrink-0">
              <span className="material-symbols-outlined text-[#76777d]" style={{ fontSize: 24 }}>person</span>
            </div>
            <div>
              <p className="font-headline font-bold text-sm text-[#0F172A]">{localBooking.workerName || "Worker"}</p>
              <p className="text-[10px] font-bold text-[#9d4300] uppercase tracking-wide">{catLabel}</p>
              <div className="flex items-center gap-1 text-[10px] text-[#76777d] mt-0.5">
                <span className="material-symbols-outlined" style={{ fontSize: 11 }}>calendar_today</span>
                {localBooking.date} · {localBooking.time}
              </div>
            </div>
          </div>
          <StatusBadge status={localBooking.status} />
        </div>

        {/* Description */}
        <p className="text-xs text-[#45464d] mb-3 line-clamp-2">{localBooking.description}</p>

        {/* Amount */}
        <p className="font-headline font-bold text-[#0F172A] text-base mb-3">{formatCurrency(localBooking.finalAmount || localBooking.offeredAmount)}</p>

        {/* OTP box — show when arrived */}
        {localBooking.status === "arrived" && localBooking.otp && (
          <div className="bg-[#f2f4f6] rounded-xl p-3 mb-3 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-[#45464d] uppercase tracking-wider mb-1">Service OTP</p>
              <div className="flex gap-2">
                {localBooking.otp.split("").map((d, i) => (
                  <span key={i} className="w-9 h-9 bg-white rounded-xl flex items-center justify-center font-headline font-black text-xl text-[#0F172A] shadow-sm">{d}</span>
                ))}
              </div>
            </div>
            <div className="text-right">
              <span className="material-symbols-outlined text-[#F97316]" style={{ fontSize: 24 }}>shield</span>
              <p className="text-[9px] text-[#45464d]">Share this with<br/>worker to start</p>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2 flex-wrap">
          {/* Mark as complete */}
          {localBooking.status === "in_progress" && (
            <button onClick={() => onComplete(localBooking.id)}
              className="flex-1 py-2.5 bg-[#131b2e] text-white text-xs font-bold rounded-xl hover:bg-[#1e2a45] transition-colors active:scale-95">
              Mark as Complete
            </button>
          )}

          {/* Cancel */}
          {localBooking.status === "pending" && (
            <button onClick={() => onCancel(localBooking.id)}
              className="flex-1 py-2.5 border border-red-300 text-red-600 text-xs font-bold rounded-xl hover:bg-red-50 transition-colors active:scale-95">
              Cancel Request
            </button>
          )}

          {/* Chat */}
          {["accepted","on_the_way","arrived","in_progress"].includes(localBooking.status) && (
            <Link href={`/client/chat?bookingId=${localBooking.id}`}
              className="flex items-center gap-1 px-4 py-2.5 bg-[#f2f4f6] text-xs font-bold text-[#0F172A] rounded-xl hover:bg-[#e0e3e5] transition-colors">
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>chat_bubble</span>
              Chat
            </Link>
          )}

          {/* Write review */}
          {localBooking.status === "completed" && (
            <Link href={`/review/${localBooking.id}`}
              className="flex-1 py-2.5 bg-[#fd761a]/10 text-[#9d4300] text-xs font-bold rounded-xl text-center hover:bg-[#fd761a]/20 transition-colors">
              Write Review ⭐
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ClientBookings() {
  const { user, userRole, loading: authLoading } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("active");
  const [lang, setLang] = useState("en");

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
    if (!authLoading && userRole === "worker") router.replace("/worker/dashboard");
  }, [user, userRole, authLoading]);

  useEffect(() => {
    if (!user) return;
    getClientBookings(user.uid).then(list => {
      setBookings(list);
      setLoading(false);
    });
  }, [user]);

  async function handleCancel(id) {
    await updateBookingStatus(id, JOB_STATUS.CANCELLED);
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: "cancelled" } : b));
  }

  async function handleComplete(id) {
    await updateBookingStatus(id, JOB_STATUS.COMPLETED);
    router.push(`/review/${id}`);
  }

  const filtered = bookings.filter(b => {
    if (activeTab === "active")    return ACTIVE_STATUSES.includes(b.status);
    if (activeTab === "completed") return b.status === "completed";
    if (activeTab === "cancelled") return ["cancelled","disputed"].includes(b.status);
    return true;
  });

  return (
    <div className="min-h-screen bg-[#f7f9fb] pb-28">
      {/* Header */}
      <div className="bg-white px-5 pt-5 pb-4 border-b border-[#f2f4f6]">
        <div className="flex items-center justify-between mb-1">
          <div>
            <h1 className="font-headline font-bold text-2xl text-[#0F172A]">My Bookings</h1>
            <p className="text-xs text-[#45464d]">Manage your skilled labor requests</p>
          </div>
          <button onClick={() => setLang(l => l === "en" ? "hi" : "en")} className="text-xs font-bold text-[#0F172A] px-2 py-1 rounded-lg bg-[#f2f4f6] hover:text-[#F97316] transition-colors">
            {lang === "en" ? "EN | हिं" : "हिं | EN"}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-5 pt-4 pb-2">
        <div className="flex bg-[#f2f4f6] rounded-2xl p-1">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${activeTab === tab.id ? "bg-white text-[#0F172A] shadow-sm" : "text-[#45464d]"}`}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 pt-3">
        {loading ? (
          <div className="flex flex-col gap-3">
            {[1,2,3].map(i => <div key={i} className="bg-white rounded-2xl h-36 animate-pulse border border-[#f2f4f6]" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <span className="material-symbols-outlined text-[#c6c6cd] block mb-3" style={{ fontSize: 64 }}>calendar_today</span>
            <p className="font-headline font-bold text-[#0F172A] mb-1">No {activeTab} bookings</p>
            <p className="text-sm text-[#45464d] mb-5">Your {activeTab} bookings will appear here.</p>
            {activeTab === "active" && (
              <Link href="/client/dashboard" className="inline-block bg-[#131b2e] text-white text-sm font-bold px-5 py-3 rounded-xl">
                Find Workers →
              </Link>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map(b => (
              <BookingCard key={b.id} booking={b} onCancel={handleCancel} onComplete={handleComplete} lang={lang} />
            ))}
          </div>
        )}
      </div>

      <BottomNav role="client" />
    </div>
  );
}
