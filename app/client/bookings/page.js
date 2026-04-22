"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getClientBookings, updateBookingStatus, processPayment } from "@/lib/firestore";
import { SERVICE_CATEGORIES } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import { getGoogleMapsUrl, reverseGeocode } from "@/lib/location";
import { useToast } from "@/components/Toast";
import BottomNav from "@/components/BottomNav";
import CancelModal from "@/components/CancelModal";
import {
  CalendarIcon, ClockIcon, StarIcon, XIcon, CheckIcon,
  ChatIcon, ArrowRightIcon, NavigationIcon, Spinner, AlertCircleIcon
} from "@/components/Icons";

const STATUS_TABS = [
  { id:"all",             label:"All"       },
  { id:"pending",         label:"Pending"   },
  { id:"counter_offered", label:"Offers"    },
  { id:"active",          label:"Active"    },
  { id:"completed",       label:"Done"      },
  { id:"cancelled",       label:"Cancelled" },
];

// ─── Status pill ────────────────────────────────────────────────
function StatusPill({ status }) {
  const map = {
    pending:        { label:"⏳ Awaiting Response", cls:"bg-amber-100 text-amber-700" },
    counter_offered:{ label:"💬 Counter Offer",      cls:"bg-orange-100 text-orange-700" },
    accepted:       { label:"✅ Accepted",            cls:"bg-green-100 text-green-700" },
    on_the_way:     { label:"🛵 On the Way",          cls:"bg-blue-100 text-blue-700" },
    arrived:        { label:"📍 Arrived",             cls:"bg-purple-100 text-purple-700" },
    in_progress:    { label:"🔧 In Progress",         cls:"bg-orange-100 text-orange-700" },
    completed:      { label:"✔️ Completed",           cls:"bg-green-100 text-green-700" },
    cancelled:      { label:"❌ Cancelled",           cls:"bg-red-100 text-red-700" },
  };
  const s = map[status] || { label: status, cls:"bg-gray-100 text-gray-600" };
  return <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${s.cls}`}>{s.label}</span>;
}

// ─── OTP display card ───────────────────────────────────────────
function ArrivalOtpCard({ otp }) {
  return (
    <div className="bg-[#0F172A] rounded-2xl p-5 mb-3">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">🎉</span>
        <div>
          <p className="font-bold text-white text-sm">Worker has arrived!</p>
          <p className="text-[#94A3B8] text-xs">Share this code to start the job</p>
        </div>
      </div>
      <div className="flex gap-2 justify-center mb-4">
        {String(otp).split("").map((d, i) => (
          <div key={i} className="w-14 h-14 bg-[#1E293B] border-2 border-[#F97316]/40 rounded-xl flex items-center justify-center text-3xl font-black text-[#F97316]">
            {d}
          </div>
        ))}
      </div>
      <p className="text-[#475569] text-[11px] text-center">⚠️ Do not share this OTP with anyone else</p>
    </div>
  );
}

// ─── Worker location card ───────────────────────────────────────
function WorkerLocationCard({ booking }) {
  const [area, setArea] = useState(null);
  const loc  = booking?.workerLocation;
  const mins = loc?.updatedAt?.seconds ? Math.round((Date.now()/1000 - loc.updatedAt.seconds) / 60) : null;
  useEffect(() => {
    if (loc?.lat && loc?.lng) reverseGeocode(loc.lat, loc.lng).then(setArea);
  }, [loc]);
  if (!loc) return null;
  return (
    <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-2xl p-4 mb-3">
      <div className="flex items-center gap-2 mb-2">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"/>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"/>
        </span>
        <p className="font-bold text-[#1D4ED8] text-sm">Worker is heading your way!</p>
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

// ─── Counter Offer card ─────────────────────────────────────────
function CounterOfferCard({ booking, onAccept, onDecline, accepting }) {
  return (
    <div className="bg-[#FFF7ED] border-2 border-[#F97316] rounded-2xl p-4 mb-3">
      <p className="text-xs font-bold text-[#9A3412] uppercase tracking-wider mb-2">💬 Worker sent a counter offer</p>
      <div className="text-center mb-4">
        <p className="text-xs text-[#94A3B8] mb-1">Worker suggests</p>
        <p className="font-black text-[#F97316] text-3xl">{formatCurrency(booking.counterAmount || 0)}</p>
        <p className="text-xs text-[#94A3B8] mt-1 line-through">Your offer: {formatCurrency(booking.offeredAmount || 0)}</p>
        {booking.counterMessage && <p className="text-xs text-[#64748B] mt-2 italic">"{booking.counterMessage}"</p>}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => onAccept(booking)} disabled={accepting}
          className="py-3 rounded-xl bg-[#0F172A] text-sm font-bold text-white hover:bg-[#1E293B] disabled:opacity-50 flex items-center justify-center gap-1.5 transition-all">
          {accepting ? <Spinner size={15}/> : <CheckIcon size={15}/>}
          Accept {formatCurrency(booking.counterAmount || 0)}
        </button>
        <button onClick={() => onDecline(booking)} disabled={accepting}
          className="py-3 rounded-xl border-2 border-[#EF4444] text-sm font-bold text-[#EF4444] hover:bg-[#FEF2F2] disabled:opacity-50 transition-all">
          ✕ Decline
        </button>
      </div>
    </div>
  );
}

// ─── Individual booking card ────────────────────────────────────
function BookingCard({ booking, onCancel, onAcceptCounter, onDeclineCounter, onMarkComplete, accepting, completing }) {
  const cat          = SERVICE_CATEGORIES.find(c => (booking.services||[]).includes(c.id));
  const isPending    = booking.status === "pending";
  const isCounter    = booking.status === "counter_offered";
  const isAccepted   = booking.status === "accepted";
  const isOnWay      = booking.status === "on_the_way";
  const isArrived    = booking.status === "arrived";
  const isProgress   = booking.status === "in_progress";
  const isDone       = booking.status === "completed";
  const isCancelled  = booking.status === "cancelled";
  const isActive     = [isAccepted, isOnWay, isArrived, isProgress].some(Boolean);

  const accentColor = isPending ? "bg-amber-400" : isCounter ? "bg-orange-500"
    : isActive ? "bg-[#F97316]" : isDone ? "bg-[#22C55E]" : "bg-[#E2E8F0]";

  const displayAmount = booking.finalAmount || booking.counterAmount || booking.offeredAmount || booking.totalAmount || 0;

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-sm">
      <div className={`h-1.5 w-full ${accentColor}`} />
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
          <div className="text-right flex flex-col items-end gap-1">
            <p className="font-black text-[#F97316]">{formatCurrency(displayAmount)}</p>
            <StatusPill status={booking.status} />
          </div>
        </div>

        <div className="flex items-center gap-4 text-[11px] text-[#94A3B8] mb-3">
          <span className="flex items-center gap-1"><CalendarIcon size={11}/>{booking.scheduledDate}</span>
          <span className="flex items-center gap-1"><ClockIcon size={11}/>{booking.scheduledTime}</span>
        </div>

        {/* Counter offer UI */}
        {isCounter && (
          <CounterOfferCard
            booking={booking}
            onAccept={onAcceptCounter}
            onDecline={onDeclineCounter}
            accepting={accepting === booking.id}
          />
        )}

        {/* OTP when arrived */}
        {isArrived && booking.arrivalOtp && <ArrivalOtpCard otp={booking.arrivalOtp} />}

        {/* Map when on way or arrived */}
        {(isOnWay || isArrived) && <WorkerLocationCard booking={booking} />}

        {/* In Progress — client mark complete */}
        {isProgress && (
          <div className="bg-[#FFF7ED] border border-[#FED7AA] rounded-xl p-3 mb-3">
            <p className="text-xs font-bold text-[#9A3412] flex items-center gap-1">🔧 Work In Progress</p>
            <div className="mt-2 h-1.5 bg-[#FED7AA] rounded-full overflow-hidden">
              <div className="h-full bg-[#F97316] rounded-full animate-pulse" style={{width:"70%"}}/>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 flex-wrap">
          {/* Cancel */}
          {(isPending || isAccepted) && (
            <button onClick={() => onCancel(booking)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#FECACA] text-xs font-bold text-[#EF4444] hover:bg-[#FEF2F2] transition-colors">
              <XIcon size={12}/> Cancel
            </button>
          )}
          {/* Chat */}
          {isActive && (
            <Link href={`/client/chat?bookingId=${booking.id}`}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E2E8F0] text-xs font-bold text-[#374151] hover:bg-[#F8FAFC] transition-colors">
              <ChatIcon size={12}/> Chat
            </Link>
          )}
          {/* Mark complete */}
          {isProgress && (
            <button onClick={() => onMarkComplete(booking)} disabled={completing === booking.id}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#22C55E] text-xs font-bold text-white hover:bg-[#16A34A] transition-colors disabled:opacity-50">
              {completing === booking.id ? <Spinner size={12}/> : <CheckIcon size={12}/>}
              Mark as Complete
            </button>
          )}
          {/* Review */}
          {isDone && !booking.hasReview && (
            <Link href={`/review/${booking.id}`}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#F97316] text-xs font-bold text-white hover:bg-[#EA580C] transition-colors">
              <StarIcon size={12} fill="white"/> Write Review
            </Link>
          )}
          {isDone && booking.hasReview && (
            <span className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#F0FDF4] text-xs font-bold text-[#16A34A]">
              <CheckIcon size={12}/> Reviewed
            </span>
          )}
          {/* Cash confirm */}
          {isDone && booking.paymentMethod === "cash" && !booking.cashConfirmed && (
            <Link href={`/client/chat?bookingId=${booking.id}`}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] text-xs font-bold text-[#16A34A] transition-colors">
              💵 Cash Paid
            </Link>
          )}
          {/* Details */}
          {!isCancelled && !isDone && (
            <Link href={`/client/chat?bookingId=${booking.id}`}
              className="ml-auto flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold text-[#94A3B8] hover:text-[#374151] transition-colors">
              Details <ArrowRightIcon size={12}/>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────
export default function ClientBookings() {
  const router   = useRouter();
  const addToast = useToast();
  const { user, userRole, loading: authLoading } = useAuth();

  const [bookings,      setBookings]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [tab,           setTab]           = useState("all");
  const [cancelTarget,  setCancelTarget]  = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [accepting,     setAccepting]     = useState(null); // bookingId
  const [completing,    setCompleting]    = useState(null); // bookingId

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
    if (!authLoading && user && userRole === "worker") router.replace("/worker/dashboard");
  }, [user, userRole, authLoading]);

  useEffect(() => {
    if (!user) return;
    getClientBookings(user.uid).then(b => { setBookings(b); setLoading(false); });
  }, [user]);

  // ── Cancel ──────────────────────────────────────────────────────
  async function handleCancelConfirm(reason) {
    if (!cancelTarget) return;
    setCancelLoading(true);
    await updateBookingStatus(cancelTarget.id, "cancelled", { cancelledBy: "client", cancelReason: reason });
    setBookings(prev => prev.map(b => b.id === cancelTarget.id ? { ...b, status: "cancelled" } : b));
    setCancelLoading(false); setCancelTarget(null);
    addToast("Booking cancelled.", "info");
  }

  // ── Accept counter offer ────────────────────────────────────────
  async function handleAcceptCounter(booking) {
    setAccepting(booking.id);
    try {
      const amount = booking.counterAmount || booking.offeredAmount;

      if (booking.paymentMethod === "online") {
        // Load Razorpay and charge the counter amount
        await new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://checkout.razorpay.com/v1/checkout.js";
          document.body.appendChild(script);
          script.onload = () => {
            const rzp = new window.Razorpay({
              key: process.env.NEXT_PUBLIC_RAZORPAY_KEY,
              amount: Math.round(amount * 100),
              currency: "INR",
              name: "Bixit",
              description: `Counter offer accepted`,
              handler: async (response) => {
                await updateBookingStatus(booking.id, "accepted", {
                  finalAmount: amount,
                  paymentId: response.razorpay_payment_id,
                  paymentStatus: "paid",
                });
                const workerAmt = Math.round(amount * 0.9);
                await processPayment(booking.id, workerAmt, booking.workerId).catch(() => {});
                setBookings(prev => prev.map(b => b.id === booking.id ? { ...b, status: "accepted", finalAmount: amount } : b));
                addToast("Offer accepted & payment done! 🎉", "success");
                resolve();
              },
              modal: { ondismiss: () => reject(new Error("dismissed")) },
              prefill: { email: user?.email || "" },
              theme: { color: "#F97316" },
            });
            rzp.open();
          };
          script.onerror = reject;
        });
      } else {
        // Cash — just accept
        await updateBookingStatus(booking.id, "accepted", { finalAmount: amount });
        setBookings(prev => prev.map(b => b.id === booking.id ? { ...b, status: "accepted", finalAmount: amount } : b));
        addToast("Offer accepted! 🎉", "success");
      }
    } catch (e) {
      if (e?.message !== "dismissed") addToast("Something went wrong. Try again.", "error");
    } finally {
      setAccepting(null);
    }
  }

  // ── Decline counter offer ───────────────────────────────────────
  async function handleDeclineCounter(booking) {
    await updateBookingStatus(booking.id, "cancelled", { cancelReason: "Client declined counter offer" });
    setBookings(prev => prev.map(b => b.id === booking.id ? { ...b, status: "cancelled" } : b));
    addToast("Counter offer declined.", "info");
  }

  // ── Mark complete (client side) ─────────────────────────────────
  async function handleMarkComplete(booking) {
    setCompleting(booking.id);
    try {
      await updateBookingStatus(booking.id, "completed");
      const amount = booking.finalAmount || booking.offeredAmount || booking.totalAmount || 0;
      const workerAmt = Math.round(amount * 0.9);
      if (booking.workerId) await processPayment(booking.id, workerAmt, booking.workerId).catch(() => {});
      setBookings(prev => prev.map(b => b.id === booking.id ? { ...b, status: "completed" } : b));
      addToast("Job marked complete! Please leave a review.", "success");
      router.push(`/review/${booking.id}`);
    } catch {
      addToast("Failed to complete. Try again.", "error");
    } finally {
      setCompleting(null);
    }
  }

  const filtered = bookings.filter(b => {
    if (tab === "all")             return true;
    if (tab === "active")          return ["accepted","on_the_way","arrived","in_progress"].includes(b.status);
    if (tab === "counter_offered") return b.status === "counter_offered";
    return b.status === tab;
  });

  const pendingCount  = bookings.filter(b => b.status === "pending").length;
  const counterCount  = bookings.filter(b => b.status === "counter_offered").length;
  const activeCount   = bookings.filter(b => ["accepted","on_the_way","arrived","in_progress"].includes(b.status)).length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      <CancelModal isOpen={!!cancelTarget} onClose={() => setCancelTarget(null)}
        onConfirm={handleCancelConfirm} role="client" loading={cancelLoading} />

      {/* Header */}
      <div className="bg-white border-b border-[#F1F5F9] px-4 pt-5 pb-0 sticky top-0 z-40">
        <h1 className="font-black text-2xl text-[#0F172A] mb-4">My Bookings</h1>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-3">
          {STATUS_TABS.map(t => {
            const badge = t.id === "pending" ? pendingCount : t.id === "counter_offered" ? counterCount : t.id === "active" ? activeCount : 0;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all ${tab === t.id ? "bg-[#0F172A] text-white" : "bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0]"}`}>
                {t.label}
                {badge > 0 && <span className="ml-1.5 bg-[#F97316] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">{badge}</span>}
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
            {filtered.map(b => (
              <BookingCard
                key={b.id}
                booking={b}
                onCancel={b => setCancelTarget(b)}
                onAcceptCounter={handleAcceptCounter}
                onDeclineCounter={handleDeclineCounter}
                onMarkComplete={handleMarkComplete}
                accepting={accepting}
                completing={completing}
              />
            ))}
          </div>
        )}
      </div>

      <BottomNav role="client" />
    </div>
  );
}
