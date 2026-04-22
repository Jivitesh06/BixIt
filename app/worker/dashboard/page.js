"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { getWorkerProfile, getWorkerBookings, updateBookingStatus } from "@/lib/firestore";
import { SERVICE_CATEGORIES } from "@/lib/constants";
import { formatCurrency, getStatusStyle } from "@/lib/utils";
import BottomNav from "@/components/BottomNav";
import CancelModal from "@/components/CancelModal";
import NotificationBell from "@/components/NotificationBell";
import StatusBadge from "@/components/StatusBadge";
import {
  BellIcon, UserIcon, LogOutIcon, ChevronDownIcon, CheckIcon, XIcon,
  TrendingUpIcon, ClockIcon, BadgeIcon, ArrowRightIcon, ChatIcon, Spinner
} from "@/components/Icons";

function Avatar({ name = "", photo, size = 44 }) {
  const initials = name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
  const colors = ["#7C3AED","#0891B2","#059669","#DC2626","#D97706","#2563EB"];
  const color = colors[(name.charCodeAt(0)||0) % colors.length];
  if (photo) return <img src={photo} alt={name} className="w-full h-full object-cover rounded-full" />;
  return <div style={{width:size,height:size,background:color,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center"}}>
    <span style={{color:"white",fontWeight:800,fontSize:size*0.36}}>{initials||"U"}</span>
  </div>;
}

function ProfileMenu({ name, onLogout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  useEffect(() => {
    const fn = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(o=>!o)} className="flex items-center gap-2 bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E2E8F0] rounded-full pl-2 pr-3 py-1.5 transition-colors">
        <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0"><Avatar name={name} size={28}/></div>
        <span className="text-xs font-semibold text-[#374151] hidden sm:block max-w-[80px] truncate">{name?.split(" ")[0]}</span>
        <ChevronDownIcon size={14}/>
      </button>
      {open && (
        <div className="absolute right-0 top-12 z-50 bg-white border border-[#E2E8F0] rounded-2xl shadow-xl py-1.5 w-44">
          <Link href="/worker/profile" onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#374151] hover:bg-[#F8FAFC] transition-colors">
            <UserIcon size={15}/> My Profile
          </Link>
          <div className="h-px bg-[#F1F5F9] mx-3 my-1" />
          <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#EF4444] hover:bg-[#FEF2F2] transition-colors">
            <LogOutIcon size={15}/> Sign out
          </button>
        </div>
      )}
    </div>
  );
}

function CounterModal({ booking, onSubmit, onClose }) {
  const [amount, setAmount] = useState(booking?.totalAmount || "");
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <h3 className="font-bold text-[#0F172A] mb-1">Counter Offer</h3>
        <p className="text-xs text-[#64748B] mb-4">Suggest a different price for this job</p>
        <div className="flex items-center bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl overflow-hidden mb-5">
          <span className="px-4 py-3.5 bg-[#F1F5F9] border-r border-[#E2E8F0] font-bold text-[#374151]">₹</span>
          <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Enter amount"
            className="flex-1 px-4 py-3.5 bg-transparent text-sm text-[#0F172A] outline-none" autoFocus />
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-[#E2E8F0] text-sm font-semibold text-[#374151] hover:bg-[#F8FAFC]">Cancel</button>
          <button onClick={() => onSubmit(amount)} className="flex-1 py-3 rounded-xl bg-[#F97316] text-sm font-semibold text-white hover:bg-[#EA580C]">Send Offer</button>
        </div>
      </div>
    </div>
  );
}

export default function WorkerDashboard() {
  const router = useRouter();
  const { user, userRole, loading: authLoading } = useAuth();
  const [profile,       setProfile]       = useState(null);
  const [bookings,      setBookings]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [counter,       setCounter]       = useState(null);
  const [tab,           setTab]           = useState("pending");
  const [cancelTarget,  setCancelTarget]  = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
    if (!authLoading && user && userRole === "client") router.replace("/client/dashboard");
  }, [user, userRole, authLoading]);

  useEffect(() => {
    if (!user) return;
    getWorkerProfile(user.uid).then(setProfile);
    getWorkerBookings(user.uid).then(b => { setBookings(b); setLoading(false); });
  }, [user]);

  async function handleLogout() { await signOut(auth); router.push("/"); }

  async function handleAction(bookingId, status, extra = {}) {
    await updateBookingStatus(bookingId, status, extra);
    setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status } : b));
    setCounter(null);
  }

  async function handleCancelConfirm(reason) {
    if (!cancelTarget) return;
    setCancelLoading(true);
    await updateBookingStatus(cancelTarget.id, "cancelled", { cancelledBy: "worker", cancelReason: reason });
    setBookings(prev => prev.map(b => b.id === cancelTarget.id ? { ...b, status: "cancelled" } : b));
    setCancelLoading(false); setCancelTarget(null);
  }

  const pending   = bookings.filter(b => b.status === "pending");
  const active    = bookings.filter(b => ["accepted","on_the_way","arrived","in_progress"].includes(b.status));
  const completed = bookings.filter(b => ["completed","cancelled"].includes(b.status));
  const showing   = tab === "pending" ? pending : tab === "active" ? active : completed;

  const totalEarnings     = bookings.filter(b => b.status === "completed").reduce((a,b) => a + (b.workerAmount || b.totalAmount || 0), 0);
  const thisMonthEarnings = bookings.filter(b => b.status === "completed" && (b.completedAt?.seconds || 0) > Date.now()/1000 - 2592000)
                                    .reduce((a,b) => a + (b.workerAmount || b.totalAmount || 0), 0);

  if (authLoading) return <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center"><div className="animate-spin w-10 h-10 rounded-full border-4 border-[#0F172A] border-t-transparent"/></div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      {counter   && <CounterModal booking={counter} onClose={() => setCounter(null)} onSubmit={amt => handleAction(counter.id, "counter_offered", { counterAmount: Number(amt) })} />}
      <CancelModal isOpen={!!cancelTarget} onClose={() => setCancelTarget(null)} onConfirm={handleCancelConfirm} role="worker" loading={cancelLoading} />

      {/* Topbar */}
      <div className="bg-white border-b border-[#F1F5F9] px-4 pt-4 pb-3 sticky top-0 z-40">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-[#94A3B8] font-medium">Worker Dashboard</p>
            <h1 className="font-bold text-lg text-[#0F172A]">Hi, {profile?.name?.split(" ")[0] || "Worker"} 👷</h1>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <ProfileMenu name={profile?.name || user?.email || "Worker"} onLogout={handleLogout} />
          </div>
        </div>
      </div>

      <div className="px-4 py-5 space-y-4">
        {/* Earnings card */}
        <div className="bg-[#0F172A] rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-40 h-40 bg-[#F97316]/10 rounded-full pointer-events-none" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUpIcon size={14}/><span className="text-[#64748B] text-xs font-semibold uppercase tracking-wider">Total Earnings</span>
            </div>
            <p className="text-white font-black text-4xl mb-1">{formatCurrency(totalEarnings)}</p>
            <p className="text-[#64748B] text-sm mb-4">This month: <span className="text-[#F97316] font-bold">{formatCurrency(thisMonthEarnings)}</span></p>
            <div className="flex items-center gap-6 text-xs">
              {[
                { label:"Completed", val: bookings.filter(b=>b.status==="completed").length },
                { label:"Pending",   val: pending.length },
                { label:"Rating",    val: profile?.averageRating?.toFixed(1) || "—" },
              ].map(({ label, val }) => (
                <div key={label} className="flex flex-col">
                  <span className="text-white font-bold text-base">{val}</span>
                  <span className="text-[#475569]">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Verification banners */}
        {profile && !profile.isVerified && (
          <div className="bg-[#FFF7ED] border border-[#FED7AA] rounded-2xl p-4 flex items-start gap-3">
            <BadgeIcon size={20}/>
            <div>
              <p className="font-bold text-[#9A3412] text-sm">Aadhaar Verification Pending</p>
              <p className="text-xs text-[#C2410C] mt-0.5">Get verified to unlock more bookings and build trust.</p>
            </div>
          </div>
        )}
        {profile?.isVerified && (
          <div className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-2xl p-4 flex items-center gap-3">
            <CheckIcon size={18}/><p className="text-[#166534] font-bold text-sm">Aadhaar Verified ✓</p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex bg-[#F8FAFC] rounded-xl p-1 border border-[#E2E8F0]">
          {[["pending","Requests"],["active","Active"],["completed","History"]].map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex-1 py-2.5 rounded-[10px] text-xs font-bold transition-all ${tab === id ? "bg-[#0F172A] text-white" : "text-[#64748B]"}`}>
              {label}
              {id === "pending" && pending.length > 0 && <span className="ml-1.5 bg-[#F97316] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">{pending.length}</span>}
            </button>
          ))}
        </div>

        {/* Booking cards */}
        {loading ? (
          <div className="space-y-3">{[1,2].map(i=><div key={i} className="skeleton h-36 rounded-2xl"/>)}</div>
        ) : showing.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-3">{tab==="pending"?"📭":tab==="active"?"🔧":"🏆"}</div>
            <p className="font-bold text-[#0F172A] mb-1">{tab==="pending"?"No new requests":tab==="active"?"No active jobs":"No history yet"}</p>
          </div>
        ) : (
          showing.map(b => {
            const cat = SERVICE_CATEGORIES.find(c => (b.services||[]).includes(c.id));
            const ss  = getStatusStyle(b.status);
            const isActiveJob = ["accepted","on_the_way","arrived","in_progress"].includes(b.status);
            return (
              <div key={b.id} className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden" style={{ borderLeftWidth: 4, borderLeftColor: b.status === "pending" ? "#F97316" : isActiveJob ? "#3B82F6" : "#E2E8F0" }}>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <p className="font-bold text-[#0F172A] text-sm">{b.clientName || "Client"}</p>
                      <p className="text-xs text-[#94A3B8]">{cat ? `${cat.icon} ${cat.label}` : "General service"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[#F97316] font-black text-xl">{formatCurrency(b.totalAmount || 0)}</p>
                      <StatusBadge status={b.status} />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-[#94A3B8] mb-3">
                    <ClockIcon size={12}/> {b.scheduledDate} · {b.scheduledTime}
                  </div>
                  {b.description && <p className="text-xs text-[#64748B] bg-[#F8FAFC] rounded-xl p-3 mb-3">{b.description}</p>}

                  {b.status === "pending" && (
                    <div className="flex gap-2">
                      <button onClick={() => handleAction(b.id, "accepted")} className="flex-1 py-2.5 rounded-xl bg-[#0F172A] text-xs font-bold text-white hover:bg-[#1E293B] flex items-center justify-center gap-1.5"><CheckIcon size={13}/> Accept</button>
                      <button onClick={() => setCounter(b)} className="flex-1 py-2.5 rounded-xl border border-[#F97316] text-xs font-bold text-[#F97316] hover:bg-[#FFF7ED]">Counter</button>
                      <button onClick={() => handleAction(b.id, "declined")} className="px-3 py-2.5 rounded-xl border border-[#E2E8F0] text-xs font-bold text-[#EF4444] hover:bg-[#FEF2F2]"><XIcon size={13}/></button>
                    </div>
                  )}
                  {isActiveJob && (
                    <div className="flex gap-2">
                      <Link href={`/worker/jobs?bookingId=${b.id}`} className="flex-1 py-2.5 rounded-xl bg-[#F97316] text-xs font-bold text-white text-center hover:bg-[#EA580C] flex items-center justify-center gap-1.5">
                        <ArrowRightIcon size={13}/> Manage Job
                      </Link>
                      <button onClick={() => setCancelTarget(b)} className="px-3 py-2.5 rounded-xl border border-[#FECACA] text-xs font-bold text-[#EF4444] hover:bg-[#FEF2F2]"><XIcon size={13}/></button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <BottomNav role="worker" />
    </div>
  );
}
