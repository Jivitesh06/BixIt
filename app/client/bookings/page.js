"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { getClientBookings, updateBookingStatus } from "@/lib/firestore";
import { SERVICE_CATEGORIES } from "@/lib/constants";
import { formatCurrency, getStatusStyle } from "@/lib/utils";
import BottomNav from "@/components/BottomNav";
import {
  CalendarIcon, ClockIcon, MapPinIcon, StarIcon,
  XIcon, CheckIcon, ChatIcon, ArrowRightIcon, AlertCircleIcon
} from "@/components/Icons";

const STATUS_TABS = [
  { id: "all",       label: "All"       },
  { id: "pending",   label: "Pending"   },
  { id: "active",    label: "Active"    },
  { id: "completed", label: "Done"      },
  { id: "cancelled", label: "Cancelled" },
];

const STATUS_ICON = {
  pending:     "🕐",
  accepted:    "✅",
  on_the_way:  "🛵",
  arrived:     "📍",
  in_progress: "🔧",
  completed:   "🏆",
  cancelled:   "❌",
};

function BookingCard({ booking, onCancel }) {
  const cat = SERVICE_CATEGORIES.find(c => (booking.services || []).includes(c.id));
  const ss  = getStatusStyle(booking.status);
  const isActive    = ["accepted","on_the_way","arrived","in_progress"].includes(booking.status);
  const isPending   = booking.status === "pending";
  const isCompleted = booking.status === "completed";

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-sm">
      {/* Status stripe */}
      <div className={`h-1 w-full ${isPending ? "bg-amber-400" : isActive ? "bg-[#F97316]" : isCompleted ? "bg-[#22C55E]" : "bg-[#E2E8F0]"}`} />
      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center text-xl flex-shrink-0">
              {cat?.icon || "🔧"}
            </div>
            <div>
              <p className="font-bold text-[#0F172A] text-sm">{booking.workerName || "Worker"}</p>
              <p className="text-xs text-[#64748B]">{cat?.label || "Service"}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-black text-[#0F172A]">{formatCurrency(booking.totalAmount || 0)}</p>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ss}`}>
              {STATUS_ICON[booking.status]} {booking.status?.replace(/_/g," ")}
            </span>
          </div>
        </div>

        {/* Date/time */}
        <div className="flex items-center gap-4 text-[11px] text-[#94A3B8] mb-3">
          <span className="flex items-center gap-1"><CalendarIcon size={11}/> {booking.scheduledDate}</span>
          <span className="flex items-center gap-1"><ClockIcon    size={11}/> {booking.scheduledTime}</span>
        </div>

        {/* OTP display — show to worker */}
        {isActive && booking.startOtp && (
          <div className="bg-[#FFF7ED] border border-[#FED7AA] rounded-xl p-3 mb-3">
            <p className="text-[10px] font-bold text-[#9A3412] uppercase tracking-wider mb-1">Show this OTP to worker to start</p>
            <div className="flex items-center gap-2">
              {String(booking.startOtp).split("").map((d, i) => (
                <div key={i} className="w-10 h-12 bg-white border-2 border-[#FED7AA] rounded-xl flex items-center justify-center text-xl font-black text-[#C2410C]">
                  {d}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 flex-wrap">
          {isPending && (
            <button onClick={() => onCancel(booking.id)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#FECACA] text-xs font-bold text-[#EF4444] hover:bg-[#FEF2F2] transition-colors">
              <XIcon size={12}/> Cancel
            </button>
          )}
          {isActive && (
            <Link href={`/client/chat?bookingId=${booking.id}`}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E2E8F0] text-xs font-bold text-[#374151] hover:bg-[#F8FAFC] transition-colors">
              <ChatIcon size={12}/> Chat
            </Link>
          )}
          {isCompleted && !booking.hasReview && (
            <Link href={`/review/${booking.id}`}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#F97316] text-xs font-bold text-white hover:bg-[#EA580C] transition-colors">
              <StarIcon size={12} fill="white"/> Rate Worker
            </Link>
          )}
          {isCompleted && booking.hasReview && (
            <span className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#F0FDF4] text-xs font-bold text-[#16A34A]">
              <CheckIcon size={12}/> Review done
            </span>
          )}
          <Link href={`/client/chat?bookingId=${booking.id}`}
            className="ml-auto flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold text-[#94A3B8] hover:text-[#374151] transition-colors">
            Details <ArrowRightIcon size={12}/>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ClientBookings() {
  const router = useRouter();
  const { user, userRole, loading: authLoading } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading]  = useState(true);
  const [tab, setTab]          = useState("all");

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
    if (!authLoading && user && userRole === "worker") router.replace("/worker/dashboard");
  }, [user, userRole, authLoading]);

  useEffect(() => {
    if (!user) return;
    getClientBookings(user.uid).then(b => { setBookings(b); setLoading(false); });
  }, [user]);

  async function handleCancel(id) {
    await updateBookingStatus(id, "cancelled");
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: "cancelled" } : b));
  }

  const filtered = bookings.filter(b => {
    if (tab === "all") return true;
    if (tab === "active") return ["accepted","on_the_way","arrived","in_progress"].includes(b.status);
    return b.status === tab;
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      {/* Header */}
      <div className="bg-white border-b border-[#F1F5F9] px-4 pt-safe-top pt-5 pb-4 sticky top-0 z-40">
        <h1 className="font-black text-2xl text-[#0F172A] mb-4">My Bookings</h1>
        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {STATUS_TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all ${tab === t.id ? "bg-[#0F172A] text-white" : "bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0]"}`}>
              {t.label}
              {t.id !== "all" && bookings.filter(b => t.id === "active" ? ["accepted","on_the_way","arrived","in_progress"].includes(b.status) : b.status === t.id).length > 0 && (
                <span className="ml-1.5 text-[10px] opacity-70">
                  ({bookings.filter(b => t.id === "active" ? ["accepted","on_the_way","arrived","in_progress"].includes(b.status) : b.status === t.id).length})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-5">
        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="bg-white rounded-2xl h-36 animate-pulse border border-[#F1F5F9]"/>)}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📋</div>
            <p className="font-bold text-[#0F172A] mb-1">No bookings here</p>
            <p className="text-sm text-[#64748B] mb-6">You haven't made any bookings yet.</p>
            <Link href="/client/dashboard" className="inline-flex items-center gap-2 bg-[#0F172A] text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-[#1E293B]">
              Find Workers <ArrowRightIcon size={16}/>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(b => <BookingCard key={b.id} booking={b} onCancel={handleCancel} />)}
          </div>
        )}
      </div>

      <BottomNav role="client" />
    </div>
  );
}
