"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getBooking, updateBookingStatus, uploadWorkPhoto } from "@/lib/firestore";
import { SERVICE_CATEGORIES } from "@/lib/constants";
import { formatCurrency, getStatusStyle } from "@/lib/utils";
import BottomNav from "@/components/BottomNav";
import {
  NavigationIcon, ClockIcon, CheckIcon, ArrowRightIcon,
  CameraIcon, UploadIcon, AlertCircleIcon, Spinner
} from "@/components/Icons";

const FLOW = [
  { status: "accepted",    label: "On My Way",      next: "on_the_way",  desc: "Let the client know you're heading over.", btnLabel: "I'm On My Way",   color: "#3B82F6" },
  { status: "on_the_way", label: "I've Arrived",    next: "arrived",     desc: "Mark arrival so the client is notified.",  btnLabel: "Mark Arrived",    color: "#8B5CF6" },
  { status: "arrived",    label: "Start Job (OTP)", next: "in_progress", desc: "Ask the client for their OTP to begin.",   btnLabel: "Enter Client OTP", color: "#F97316", requiresOtp: true },
  { status: "in_progress",label: "Complete Job",    next: "completed",   desc: "Upload a work photo and mark complete.",   btnLabel: "Mark Complete",   color: "#22C55E", requiresPhoto: true },
];

function OtpInput({ onVerify, loading }) {
  const [otp, setOtp] = useState(["","","","",""]);
  const refs = [useRef(),useRef(),useRef(),useRef(),useRef()];
  function handle(i, val) {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp]; next[i] = val; setOtp(next);
    if (val && i < 4) refs[i+1].current?.focus();
  }
  function onKey(i, e) { if (e.key==="Backspace" && !otp[i] && i>0) refs[i-1].current?.focus(); }
  return (
    <div className="bg-[#FFF7ED] border border-[#FED7AA] rounded-2xl p-4">
      <p className="text-xs font-bold text-[#9A3412] mb-3 uppercase tracking-wider">Enter Client's OTP</p>
      <div className="flex gap-2 mb-4">
        {otp.map((d,i) => (
          <input key={i} ref={refs[i]} type="text" inputMode="numeric" maxLength={1} value={d}
            onChange={e => handle(i, e.target.value)} onKeyDown={e => onKey(i,e)}
            className="w-full aspect-square max-w-[52px] text-center text-2xl font-black rounded-xl border-2 border-[#FED7AA] bg-white text-[#0F172A] outline-none focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/20 transition-all" />
        ))}
      </div>
      <button onClick={() => onVerify(otp.join(""))} disabled={loading || otp.join("").length < 5}
        className="w-full py-3 rounded-xl bg-[#F97316] text-sm font-bold text-white disabled:opacity-40 hover:bg-[#EA580C] transition-colors flex items-center justify-center gap-2">
        {loading ? <><Spinner size={16}/>Verifying…</> : <><CheckIcon size={15}/> Verify & Start</>}
      </button>
    </div>
  );
}

export default function WorkerJobs() {
  const router      = useRouter();
  const searchParams = useSearchParams();
  const bookingId   = searchParams.get("bookingId");
  const { user, userRole, loading: authLoading } = useAuth();
  const [booking, setBooking]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [actLoading, setActLoading] = useState(false);
  const [error, setError]       = useState("");
  const [photo, setPhoto]       = useState(null);
  const [showOtp, setShowOtp]   = useState(false);
  const photoRef = useRef();

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [user, authLoading]);

  useEffect(() => {
    if (!bookingId || !user) return;
    getBooking(bookingId).then(b => { setBooking(b); setLoading(false); });
  }, [bookingId, user]);

  function readFile(file) {
    const r = new FileReader();
    r.onload = ev => setPhoto(ev.target.result);
    r.readAsDataURL(file);
  }

  const step = FLOW.find(f => f.status === booking?.status);

  async function handleAction() {
    if (!step) return;
    setError(""); setActLoading(true);
    try {
      let extra = {};
      if (step.requiresPhoto && photo) extra.workPhoto = photo;
      await updateBookingStatus(bookingId, step.next, extra);
      setBooking(prev => ({ ...prev, status: step.next }));
      setShowOtp(false); setPhoto(null);
    } catch (e) { setError("Failed to update status. Try again."); }
    finally { setActLoading(false); }
  }

  async function handleOtpVerify(code) {
    setError(""); setActLoading(true);
    try {
      if (code !== String(booking?.startOtp)) { setError("Incorrect OTP. Ask the client for the correct code."); setActLoading(false); return; }
      await updateBookingStatus(bookingId, "in_progress");
      setBooking(prev => ({ ...prev, status: "in_progress" }));
      setShowOtp(false);
    } catch (e) { setError("Verification failed."); }
    finally { setActLoading(false); }
  }

  if (authLoading || loading) return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
      <div className="animate-spin w-10 h-10 rounded-full border-4 border-[#0F172A] border-t-transparent" />
    </div>
  );

  if (!booking) return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center">
      <div className="text-6xl mb-4">📋</div>
      <p className="font-bold text-[#0F172A] mb-2">Job not found</p>
      <button onClick={() => router.back()} className="text-[#F97316] font-semibold text-sm">← Go back</button>
    </div>
  );

  const cat = SERVICE_CATEGORIES.find(c => (booking.services||[]).includes(c.id));
  const ss  = getStatusStyle(booking.status);

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      {/* Map placeholder */}
      <div className="relative h-48 bg-[#E2E8F0] overflow-hidden"
        style={{ backgroundImage: "linear-gradient(#E2E8F0 1px,transparent 1px),linear-gradient(90deg,#E2E8F0 1px,transparent 1px)", backgroundSize: "32px 32px", backgroundColor: "#F1F5F9" }}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl px-5 py-3 flex items-center gap-2 shadow-lg">
            <NavigationIcon size={18}/><span className="text-sm font-bold text-[#0F172A]">{booking.clientArea || "Client location"}</span>
          </div>
        </div>
        <button className="absolute bottom-3 right-3 bg-[#F97316] text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 hover:bg-[#EA580C] shadow-lg">
          <NavigationIcon size={13}/> Navigate
        </button>
      </div>

      <div className="px-4 py-5 space-y-4">
        {/* Job card */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <p className="font-bold text-[#0F172A]">{booking.clientName || "Client"}</p>
              <p className="text-sm text-[#64748B]">{cat ? `${cat.icon} ${cat.label}` : "Service"}</p>
            </div>
            <div className="text-right">
              <p className="font-black text-[#0F172A] text-xl">{formatCurrency(booking.totalAmount || 0)}</p>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ss}`}>{booking.status?.replace(/_/g," ").toUpperCase()}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#94A3B8]">
            <ClockIcon size={12}/>{booking.scheduledDate} · {booking.scheduledTime}
          </div>
          {booking.description && <p className="text-xs text-[#64748B] bg-[#F8FAFC] rounded-xl p-3 mt-3">{booking.description}</p>}
        </div>

        {/* Progress steps */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4">
          <p className="text-xs font-bold text-[#374151] uppercase tracking-wider mb-4">Job Progress</p>
          <div className="space-y-3">
            {["accepted","on_the_way","arrived","in_progress","completed"].map((s, i, arr) => {
              const isDone    = arr.indexOf(booking.status) > i || booking.status === s;
              const isCurrent = booking.status === s;
              return (
                <div key={s} className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-all ${isCurrent ? "bg-[#F97316] border-[#F97316]" : isDone ? "bg-[#22C55E] border-[#22C55E]" : "bg-white border-[#E2E8F0]"}`}>
                    {isDone ? <CheckIcon size={12}/> : <span className="text-[10px] font-bold text-[#94A3B8]">{i+1}</span>}
                  </div>
                  <span className={`text-sm ${isCurrent ? "font-bold text-[#0F172A]" : isDone ? "text-[#22C55E] font-semibold" : "text-[#94A3B8]"}`}>
                    {s.replace(/_/g," ").replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] text-sm rounded-xl px-4 py-3">
            <AlertCircleIcon size={16}/>{error}
          </div>
        )}

        {/* OTP input section */}
        {showOtp && step?.requiresOtp && <OtpInput onVerify={handleOtpVerify} loading={actLoading} />}

        {/* Photo upload */}
        {step?.requiresPhoto && (
          <div>
            <p className="text-xs font-bold text-[#374151] uppercase tracking-wider mb-2">Upload Work Photo</p>
            <label className={`flex flex-col items-center justify-center h-36 rounded-2xl border-2 border-dashed cursor-pointer transition-colors overflow-hidden ${photo ? "border-[#22C55E]" : "border-[#CBD5E1] hover:border-[#F97316]"}`}>
              {photo ? <img src={photo} alt="Work" className="w-full h-full object-cover" />
                : <><UploadIcon size={28}/><span className="text-sm text-[#94A3B8] mt-2">Tap to upload before/after photo</span></>}
              <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files[0] && readFile(e.target.files[0])} />
            </label>
          </div>
        )}

        {/* Primary action button */}
        {step && booking.status !== "completed" && !showOtp && (
          <button onClick={() => step.requiresOtp ? setShowOtp(true) : handleAction()} disabled={actLoading || (step.requiresPhoto && !photo)}
            className="w-full py-4 rounded-2xl font-bold text-white text-base flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50"
            style={{ backgroundColor: step.color }}>
            {actLoading ? <><Spinner size={20}/>{step.btnLabel}…</> : <><ArrowRightIcon size={18}/>{step.btnLabel}</>}
          </button>
        )}

        {booking.status === "completed" && (
          <div className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-2xl p-5 text-center">
            <div className="text-4xl mb-2">🎉</div>
            <p className="font-bold text-[#166534] text-lg">Job Complete!</p>
            <p className="text-sm text-[#16A34A] mt-1">Payment of {formatCurrency(booking.totalAmount)} will be processed.</p>
          </div>
        )}
      </div>

      <BottomNav role="worker" />
    </div>
  );
}
