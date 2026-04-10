"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getBooking, getWorkerBookings, updateBookingStatus } from "@/lib/firestore";
import { SERVICE_CATEGORIES } from "@/lib/constants";
import { formatCurrency, getStatusStyle } from "@/lib/utils";
import BottomNav from "@/components/BottomNav";
import { NavigationIcon, ClockIcon, CheckIcon, ArrowRightIcon, UploadIcon, AlertCircleIcon, Spinner, XIcon } from "@/components/Icons";

const FLOW = [
  { status:"accepted",    next:"on_the_way", btnLabel:"I'm On My Way",     color:"#3B82F6",  requiresGps:true  },
  { status:"on_the_way",  next:"arrived",    btnLabel:"Mark Arrived",       color:"#8B5CF6"   },
  { status:"arrived",     next:null,         btnLabel:"Enter Client OTP",   color:"#F97316",  requiresOtp:true  },
  { status:"in_progress", next:"completed",  btnLabel:"Mark Job Complete",  color:"#22C55E",  requiresPhoto:true },
];

// ── 4-digit OTP inputs ───────────────────────────────────────────
function OtpInput({ onVerify, error, loading }) {
  const [otp, setOtp] = useState(["","","","",""]);
  const refs = Array.from({length:5}, () => useRef());
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (error) { setShake(true); setTimeout(() => setShake(false), 450); }
  }, [error]);

  function handle(i, val) {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp]; next[i] = val; setOtp(next);
    if (val && i < 4) refs[i+1].current?.focus();
    if (val && i === 4) onVerify(next.join(""));
  }
  function onKey(i, e) { if (e.key==="Backspace" && !otp[i] && i>0) refs[i-1].current?.focus(); }

  return (
    <div className={`bg-[#FFF7ED] border border-[#FED7AA] rounded-2xl p-5 ${shake ? "shake" : ""}`}>
      <p className="text-xs font-bold text-[#9A3412] uppercase tracking-wider mb-3">Enter Client's OTP</p>
      <div className="flex gap-2 mb-4 justify-center">
        {otp.map((d,i) => (
          <input key={i} ref={refs[i]} type="text" inputMode="numeric" maxLength={1} value={d}
            onChange={e => handle(i, e.target.value)} onKeyDown={e => onKey(i,e)}
            className="w-14 h-14 text-center text-2xl font-black rounded-xl border-2 border-[#FED7AA] bg-white text-[#0F172A] outline-none focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/20 transition-all" />
        ))}
      </div>
      {error && <p className="text-xs text-[#EF4444] text-center mb-3">{error}</p>}
      <button onClick={() => onVerify(otp.join(""))} disabled={loading || otp.join("").length < 5}
        className="w-full py-3 rounded-xl bg-[#F97316] text-sm font-bold text-white disabled:opacity-40 hover:bg-[#EA580C] flex items-center justify-center gap-2">
        {loading ? <><Spinner size={16}/>Verifying…</> : <><CheckIcon size={15}/>Verify & Start Job</>}
      </button>
    </div>
  );
}

// ── Job list (no bookingId) ──────────────────────────────────────
function JobsList({ workerId }) {
  const router = useRouter();
  const [bookings, setBookings] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState("active");

  useEffect(() => {
    if (!workerId) return;
    getWorkerBookings(workerId).then(b => { setBookings(b); setLoading(false); });
  }, [workerId]);

  const active    = bookings.filter(b => ["accepted","on_the_way","arrived","in_progress"].includes(b.status));
  const pending   = bookings.filter(b => b.status === "pending");
  const completed = bookings.filter(b => ["completed","cancelled"].includes(b.status));
  const showing   = tab === "active" ? active : tab === "pending" ? pending : completed;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      <div className="bg-white border-b border-[#E2E8F0] px-4 pt-5 pb-3 sticky top-0 z-40">
        <h1 className="font-black text-2xl text-[#0F172A] mb-4">My Jobs</h1>
        <div className="flex bg-[#F8FAFC] rounded-xl p-1 border border-[#E2E8F0]">
          {[["active","Active"],["pending","Requests"],["completed","History"]].map(([id,label]) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex-1 py-2.5 rounded-[10px] text-xs font-bold transition-all ${tab === id ? "bg-[#0F172A] text-white" : "text-[#64748B]"}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-5 space-y-3">
        {loading ? (
          [1,2,3].map(i => <div key={i} className="skeleton h-28 rounded-2xl"/>)
        ) : showing.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-3">📋</div>
            <p className="font-bold text-[#0F172A]">No jobs here</p>
          </div>
        ) : (
          showing.map(b => {
            const cat = SERVICE_CATEGORIES.find(c => (b.services||[]).includes(c.id));
            const ss  = getStatusStyle(b.status);
            return (
              <div key={b.id} className="bg-white rounded-2xl border border-[#E2E8F0] p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#F8FAFC] flex items-center justify-center text-lg">{cat?.icon||"🔧"}</div>
                    <div>
                      <p className="font-bold text-[#0F172A] text-sm">{b.clientName||"Client"}</p>
                      <p className="text-xs text-[#94A3B8]">{b.scheduledDate} · {b.scheduledTime}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-[#F97316]">{formatCurrency(b.totalAmount||0)}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ss}`}>{b.status?.replace(/_/g," ")}</span>
                  </div>
                </div>
                {["accepted","on_the_way","arrived","in_progress"].includes(b.status) && (
                  <button onClick={() => router.push(`/worker/jobs?bookingId=${b.id}`)}
                    className="w-full py-2.5 rounded-xl bg-[#F97316] text-xs font-bold text-white hover:bg-[#EA580C] flex items-center justify-center gap-1.5">
                    <ArrowRightIcon size={13}/> View Details
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      <BottomNav role="worker" />
    </div>
  );
}

// ── Job detail (with bookingId) ──────────────────────────────────
export default function WorkerJobs() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const bookingId    = searchParams.get("bookingId");
  const { user, loading: authLoading } = useAuth();

  const [booking,    setBooking]    = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [actLoading, setActLoading] = useState(false);
  const [error,      setError]      = useState("");
  const [otpError,   setOtpError]   = useState("");
  const [photo,      setPhoto]      = useState(null);
  const [showOtp,    setShowOtp]    = useState(false);
  const photoRef = useRef();

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [user, authLoading]);

  useEffect(() => {
    if (!bookingId || !user) { setLoading(false); return; }
    getBooking(bookingId).then(b => { setBooking(b); setLoading(false); });
  }, [bookingId, user]);

  function readFile(file) {
    const r = new FileReader();
    r.onload = ev => setPhoto(ev.target.result);
    r.readAsDataURL(file);
  }

  async function handleAction(step) {
    setError(""); setActLoading(true);
    try {
      let extra = {};
      // Save GPS when going on_the_way
      if (step.requiresGps && navigator.geolocation) {
        await new Promise(res => navigator.geolocation.getCurrentPosition(pos => {
          extra.workerLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude, updatedAt: { seconds: Date.now()/1000 } };
          res();
        }, res, { timeout:5000 }));
      }
      if (step.requiresPhoto && photo) extra.workPhoto = photo;
      await updateBookingStatus(bookingId, step.next, extra);
      setBooking(prev => ({ ...prev, status: step.next, ...extra }));
      setShowOtp(false); setPhoto(null);
    } catch { setError("Failed to update. Try again."); }
    finally { setActLoading(false); }
  }

  async function handleOtpVerify(code) {
    setOtpError(""); setActLoading(true);
    if (String(code) !== String(booking?.arrivalOtp)) {
      setOtpError("Wrong OTP — ask the client to check their screen.");
      setActLoading(false); return;
    }
    try {
      await updateBookingStatus(bookingId, "in_progress");
      setBooking(prev => ({ ...prev, status: "in_progress" }));
      setShowOtp(false);
    } catch { setOtpError("Verification failed. Try again."); }
    finally { setActLoading(false); }
  }

  if (authLoading || loading) return <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center"><div className="animate-spin w-10 h-10 rounded-full border-4 border-[#0F172A] border-t-transparent"/></div>;

  // Show job list if no bookingId in URL
  if (!bookingId) return <JobsList workerId={user?.uid} />;

  if (!booking) return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center">
      <div className="text-6xl mb-4">📋</div>
      <p className="font-bold text-[#0F172A] mb-2">Job not found</p>
      <button onClick={() => router.push("/worker/jobs")} className="text-[#F97316] font-semibold text-sm">← Back to jobs</button>
    </div>
  );

  const cat  = SERVICE_CATEGORIES.find(c => (booking.services||[]).includes(c.id));
  const step = FLOW.find(f => f.status === booking.status);
  const STATUSES = ["accepted","on_the_way","arrived","in_progress","completed"];

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      {/* Map placeholder */}
      <div className="relative h-44 overflow-hidden" style={{backgroundColor:"#F1F5F9",backgroundImage:"linear-gradient(#E2E8F0 1px,transparent 1px),linear-gradient(90deg,#E2E8F0 1px,transparent 1px)",backgroundSize:"32px 32px"}}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl px-5 py-3 flex items-center gap-2 shadow-lg">
            <NavigationIcon size={18}/><span className="text-sm font-bold text-[#0F172A]">{booking.address?.split(",")[0] || "Client location"}</span>
          </div>
        </div>
        <button onClick={() => router.push("/worker/jobs")} className="absolute top-4 left-4 w-9 h-9 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center text-[#374151] shadow-sm">
          <XIcon size={16}/>
        </button>
      </div>

      <div className="px-4 py-5 space-y-4">
        {/* Job card */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div>
              <p className="font-bold text-[#0F172A]">{booking.clientName||"Client"}</p>
              <p className="text-sm text-[#64748B]">{cat ? `${cat.icon} ${cat.label}` : "Service"}</p>
            </div>
            <p className="font-black text-[#F97316] text-xl">{formatCurrency(booking.totalAmount||0)}</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#94A3B8]">
            <ClockIcon size={12}/>{booking.scheduledDate} · {booking.scheduledTime}
          </div>
          {booking.description && <p className="text-xs text-[#64748B] bg-[#F8FAFC] rounded-xl p-3 mt-3">{booking.description}</p>}
        </div>

        {/* Progress */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4">
          <p className="text-xs font-bold text-[#374151] uppercase tracking-wider mb-4">Progress</p>
          <div className="space-y-3">
            {STATUSES.map((s, i) => {
              const idx = STATUSES.indexOf(booking.status);
              const isDone = idx > i || booking.status === s;
              const isCurrent = booking.status === s;
              return (
                <div key={s} className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 border-2 ${isCurrent ? "bg-[#F97316] border-[#F97316]" : isDone ? "bg-[#22C55E] border-[#22C55E]" : "bg-white border-[#E2E8F0]"}`}>
                    {isDone ? <CheckIcon size={12}/> : <span className="text-[10px] font-bold text-[#94A3B8]">{i+1}</span>}
                  </div>
                  <span className={`text-sm ${isCurrent ? "font-bold text-[#0F172A]" : isDone ? "text-[#22C55E] font-semibold" : "text-[#94A3B8]"}`}>
                    {s.replace(/_/g," ").replace(/\b\w/g, l=>l.toUpperCase())}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Error */}
        {error && <div className="flex items-start gap-2 bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] text-sm rounded-xl px-4 py-3"><AlertCircleIcon size={16}/>{error}</div>}

        {/* OTP entry */}
        {showOtp && step?.requiresOtp && <OtpInput onVerify={handleOtpVerify} error={otpError} loading={actLoading} />}

        {/* Photo upload */}
        {step?.requiresPhoto && (
          <div>
            <p className="text-xs font-bold text-[#374151] uppercase tracking-wider mb-2">Upload Work Photo</p>
            <label className={`flex flex-col items-center justify-center h-36 rounded-2xl border-2 border-dashed cursor-pointer transition-colors overflow-hidden ${photo ? "border-[#22C55E]" : "border-[#CBD5E1] hover:border-[#F97316]"}`}>
              {photo ? <img src={photo} alt="Work" className="w-full h-full object-cover"/> : <><UploadIcon size={28}/><span className="text-sm text-[#94A3B8] mt-2">Upload before/after photo</span></>}
              <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files[0] && readFile(e.target.files[0])} />
            </label>
          </div>
        )}

        {/* Action button */}
        {step && booking.status !== "completed" && !showOtp && (
          <button onClick={() => step.requiresOtp ? setShowOtp(true) : handleAction(step)} disabled={actLoading || (step.requiresPhoto && !photo)}
            className="w-full py-4 rounded-2xl font-bold text-white text-base flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50"
            style={{ backgroundColor: step.color }}>
            {actLoading ? <><Spinner size={20}/>{step.btnLabel}…</> : <><ArrowRightIcon size={18}/>{step.btnLabel}</>}
          </button>
        )}

        {booking.status === "completed" && (
          <div className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-2xl p-5 text-center">
            <div className="text-4xl mb-2">🎉</div>
            <p className="font-bold text-[#166534] text-lg">Job Complete!</p>
            <p className="text-sm text-[#16A34A] mt-1">Well done! Payment will be processed shortly.</p>
          </div>
        )}
      </div>

      <BottomNav role="worker" />
    </div>
  );
}
