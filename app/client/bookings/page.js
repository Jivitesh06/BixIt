"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getClientBookings, updateBookingStatus, processPayment } from "@/lib/firestore";
import { SERVICE_CATEGORIES } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import { getGoogleMapsUrl, reverseGeocode } from "@/lib/location";
import BottomNav from "@/components/BottomNav";
import CancelModal from "@/components/CancelModal";
import StatusBadge from "@/components/StatusBadge";
import {
  CalendarIcon, ClockIcon, StarIcon, XIcon, CheckIcon,
  ChatIcon, ArrowRightIcon, MapPinIcon, NavigationIcon, Spinner
} from "@/components/Icons";

const STATUS_TABS = [
  { id:"all",       label:"All"       },
  { id:"pending",   label:"Pending"   },
  { id:"active",    label:"Active"    },
  { id:"completed", label:"Done"      },
  { id:"cancelled", label:"Cancelled" },
];

const STATUS_ICON = {
  pending:"🕐", accepted:"✅", on_the_way:"🛵", arrived:"📍",
  in_progress:"🔧", completed:"🏆", cancelled:"❌",
};

// ── OTP Card shown to client when worker has arrived ──────────────
function ArrivalOtpCard({ otp }) {
  return (
    <div className="bg-[#0F172A] rounded-2xl p-5 mb-3">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">🎉</span>
        <div>
          <p className="font-bold text-white text-sm">Worker has arrived!</p>
          <p className="text-[#64748B] text-xs">Share this OTP to start the job</p>
        </div>
      </div>
      <div className="flex gap-2 mb-3">
        {String(otp).split("").map((d, i) => (
          <div key={i} className="flex-1 aspect-square max-w-[56px] bg-[#1E293B] border-2 border-[#F97316]/30 rounded-xl flex items-center justify-center text-2xl font-black text-[#F97316]">
            {d}
          </div>
        ))}
      </div>
      <p className="text-[#475569] text-[10px]">⚠️ Do not share this OTP with anyone else</p>
    </div>
  );
}

// ── Worker location card when on_the_way ─────────────────────────
function WorkerLocationCard({ booking }) {
  const [area, setArea] = useState(null);
  const loc  = booking?.workerLocation;
  const mins = loc?.updatedAt?.seconds ? Math.round((Date.now()/1000 - loc.updatedAt.seconds) / 60) : null;

  useEffect(() => {
    if (loc?.lat && loc?.lng) {
      reverseGeocode(loc.lat, loc.lng).then(setArea);
    }
  }, [loc]);

  if (!loc) return null;
  return (
    <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-2xl p-4 mb-3">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">🛵</span>
        <p className="font-bold text-[#1D4ED8] text-sm">Worker is on the way!</p>
      </div>
      {area && <p className="text-xs text-[#3B82F6] mb-1">Last seen near: <span className="font-semibold">{area}</span></p>}
      {mins !== null && <p className="text-xs text-[#64748B] mb-3">Updated {mins < 1 ? "just now" : `${mins} min ago`}</p>}
      {loc.lat && loc.lng && (
        <a href={getGoogleMapsUrl(loc.lat, loc.lng)} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1D4ED8] hover:underline">
          <NavigationIcon size={12}/> Open in Google Maps ↗
        </a>
      )}
    </div>
  );
}

// ── Individual booking card ───────────────────────────────────────
function BookingCard({ booking, onCancel, onConfirmComplete }) {
  const cat        = SERVICE_CATEGORIES.find(c => (booking.services||[]).includes(c.id));
  const isActive   = ["accepted","on_the_way","arrived","in_progress"].includes(booking.status);
  const isPending  = booking.status === "pending";
  const isAccepted = booking.status === "accepted";
  const isArrived  = booking.status === "arrived";
  const isOnWay    = booking.status === "on_the_way";
  const isProgress = booking.status === "in_progress";
  const isDone     = booking.status === "completed";

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-sm">
      <div className={`h-1 w-full ${isPending ? "bg-amber-400" : isActive ? "bg-[#F97316]" : isDone ? "bg-[#22C55E]" : "bg-[#E2E8F0]"}`} />
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center text-xl flex-shrink-0">{cat?.icon || "🔧"}</div>
            <div>
              <p className="font-bold text-[#0F172A] text-sm">{booking.workerName || "Worker"}</p>
              <p className="text-xs text-[#64748B]">{cat?.label || "Service"}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-black text-[#0F172A]">{formatCurrency(booking.totalAmount || 0)}</p>
            <StatusBadge status={booking.status} />
          </div>
        </div>

        <div className="flex items-center gap-4 text-[11px] text-[#94A3B8] mb-3">
          <span className="flex items-center gap-1"><CalendarIcon size={11}/>{booking.scheduledDate}</span>
          <span className="flex items-center gap-1"><ClockIcon size={11}/>{booking.scheduledTime}</span>
        </div>

        {/* OTP when arrived */}
        {isArrived && booking.arrivalOtp && <ArrivalOtpCard otp={booking.arrivalOtp} />}

        {/* Location when on_the_way or arrived */}
        {(isOnWay || isArrived) && <WorkerLocationCard booking={booking} />}

        {/* Actions */}
        <div className="flex gap-2 flex-wrap">
          {(isPending || isAccepted) && (
            <button onClick={() => onCancel(booking)}
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
          {/* Client confirms completion when worker marks complete */}
          {isProgress && (
            <button onClick={() => onConfirmComplete(booking)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#22C55E] text-xs font-bold text-white hover:bg-[#16A34A] transition-colors">
              <CheckIcon size={12}/> Confirm Complete
            </button>
          )}
          {isDone && !booking.hasReview && (
            <Link href={`/review/${booking.id}`}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#F97316] text-xs font-bold text-white hover:bg-[#EA580C] transition-colors">
              <StarIcon size={12} fill="white"/> Rate Worker
            </Link>
          )}
          {isDone && booking.hasReview && (
            <span className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#F0FDF4] text-xs font-bold text-[#16A34A]">
              <CheckIcon size={12}/> Reviewed
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
  const [bookings,       setBookings]       = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [tab,            setTab]            = useState("all");
  const [cancelTarget,   setCancelTarget]   = useState(null);
  const [cancelLoading,  setCancelLoading]  = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
    if (!authLoading && user && userRole === "worker") router.replace("/worker/dashboard");
  }, [user, userRole, authLoading]);

  useEffect(() => {
    if (!user) return;
    getClientBookings(user.uid).then(b => { setBookings(b); setLoading(false); });
  }, [user]);

  async function handleCancelConfirm(reason) {
    if (!cancelTarget) return;
    setCancelLoading(true);
    await updateBookingStatus(cancelTarget.id, "cancelled", { cancelledBy: "client", cancelReason: reason });
    setBookings(prev => prev.map(b => b.id === cancelTarget.id ? { ...b, status: "cancelled" } : b));
    setCancelLoading(false); setCancelTarget(null);
  }

  async function handleConfirmComplete(booking) {
    await updateBookingStatus(booking.id, "completed");
    // Process payment — worker gets their share minus platform commission
    if (booking.workerId) {
      await processPayment(booking.id, booking.workerAmount || booking.totalAmount, booking.workerId).catch(() => {});
    }
    setBookings(prev => prev.map(b => b.id === booking.id ? { ...b, status: "completed" } : b));
  }

  const filtered = bookings.filter(b => {
    if (tab === "all")    return true;
    if (tab === "active") return ["accepted","on_the_way","arrived","in_progress"].includes(b.status);
    return b.status === tab;
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      <CancelModal isOpen={!!cancelTarget} onClose={() => setCancelTarget(null)}
        onConfirm={handleCancelConfirm} role="client" loading={cancelLoading} />

      {/* Header */}
      <div className="bg-white border-b border-[#F1F5F9] px-4 pt-5 pb-0 sticky top-0 z-40">
        <h1 className="font-black text-2xl text-[#0F172A] mb-4">My Bookings</h1>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-3">
          {STATUS_TABS.map(t => {
            const count = bookings.filter(b => t.id === "all" ? true : t.id === "active" ? ["accepted","on_the_way","arrived","in_progress"].includes(b.status) : b.status === t.id).length;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all ${tab === t.id ? "bg-[#0F172A] text-white" : "bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0]"}`}>
                {t.label}{t.id !== "all" && count > 0 && <span className="ml-1.5 opacity-70">({count})</span>}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-4 py-5">
        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="skeleton h-36 rounded-2xl"/>)}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📋</div>
            <p className="font-bold text-[#0F172A] mb-1">No bookings here</p>
            <p className="text-sm text-[#64748B] mb-6">You haven't made any bookings yet.</p>
            <Link href="/client/dashboard"
              className="inline-flex items-center gap-2 bg-[#0F172A] text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-[#1E293B]">
              Find Workers <ArrowRightIcon size={16}/>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(b => <BookingCard key={b.id} booking={b} onCancel={(booking) => setCancelTarget(booking)} onConfirmComplete={handleConfirmComplete} />)}
          </div>
        )}
      </div>

      <BottomNav role="client" />
    </div>
  );
}
