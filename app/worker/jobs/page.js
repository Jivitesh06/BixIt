"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getBooking, updateBookingStatus, listenToBooking } from "@/lib/firestore";
import { getStatusStyle, formatCurrency } from "@/lib/utils";
import { JOB_STATUS } from "@/lib/constants";
import BottomNav from "@/components/BottomNav";

function OtpInputRow({ value, onChange }) {
  const refs = [useRef(), useRef(), useRef(), useRef()];
  const digits = value.split("").concat(["","","",""]).slice(0,4);

  function handleChange(i, val) {
    if (!/^\d?$/.test(val)) return;
    const arr = [...digits]; arr[i] = val;
    onChange(arr.join(""));
    if (val && i < 3) refs[i+1].current?.focus();
    if (!val && i > 0) refs[i-1].current?.focus();
  }

  return (
    <div className="flex gap-2">
      {digits.map((d, i) => (
        <input key={i} ref={refs[i]} type="text" inputMode="numeric" maxLength={1} value={d}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => e.key === "Backspace" && !digits[i] && i > 0 && refs[i-1].current?.focus()}
          className="w-11 h-11 text-center text-xl font-bold bg-[#f2f4f6] border-2 border-transparent rounded-xl text-white outline-none focus:border-[#fd761a] transition-colors"
        />
      ))}
    </div>
  );
}

export default function WorkerJobDetail() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("bookingId");
  const router = useRouter();
  const { user } = useAuth();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [otp, setOtp]         = useState("");
  const [otpError, setOtpError] = useState("");
  const [photos, setPhotos]   = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const photoRef = useRef();

  useEffect(() => {
    if (!bookingId) { setLoading(false); return; }
    getBooking(bookingId).then(b => { setBooking(b); setLoading(false); });
    const unsub = listenToBooking(bookingId, b => setBooking(b));
    return () => unsub();
  }, [bookingId]);

  async function handleStatusChange(status, extra = {}) {
    setSubmitting(true);
    await updateBookingStatus(bookingId, status, extra);
    setSubmitting(false);
  }

  async function handleStartJob() {
    if (otp !== booking.otp) { setOtpError("Wrong OTP. Please ask client to share the correct OTP."); return; }
    setOtpError("");
    await handleStatusChange(JOB_STATUS.IN_PROGRESS);
  }

  async function handleComplete() {
    await handleStatusChange(JOB_STATUS.COMPLETED, { workPhotos: photos });
  }

  function handlePhotoAdd(e) {
    const files = Array.from(e.target.files);
    files.slice(0, 3 - photos.length).forEach(f => {
      const r = new FileReader();
      r.onload = ev => setPhotos(prev => [...prev, ev.target.result].slice(0,3));
      r.readAsDataURL(f);
    });
  }

  function openMaps() {
    const addr = encodeURIComponent(booking?.address || "");
    window.open(`https://www.google.com/maps/search/?api=1&query=${addr}`, "_blank");
  }

  if (!bookingId || loading) return (
    <div className="min-h-screen bg-[#f7f9fb] flex items-center justify-center">
      <div className="animate-spin w-10 h-10 rounded-full border-4 border-[#131b2e] border-t-transparent" />
    </div>
  );

  if (!booking) return (
    <div className="min-h-screen bg-[#f7f9fb] flex flex-col items-center justify-center gap-3">
      <span className="material-symbols-outlined text-[#c6c6cd]" style={{ fontSize: 56 }}>work_off</span>
      <p className="font-headline font-bold text-[#0F172A]">Booking not found</p>
      <button onClick={() => router.back()} className="text-[#F97316] font-bold">← Go back</button>
    </div>
  );

  const { label, color } = getStatusStyle(booking.status);

  return (
    <div className="min-h-screen bg-[#f7f9fb] pb-28">
      {/* Map / Header area */}
      <div className="relative h-52 bg-gradient-to-br from-[#2d4a7a] to-[#0f1f3d] overflow-hidden">
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 30px,rgba(255,255,255,.05) 30px,rgba(255,255,255,.05) 31px),repeating-linear-gradient(90deg,transparent,transparent 30px,rgba(255,255,255,.05) 30px,rgba(255,255,255,.05) 31px)"
        }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="material-symbols-outlined text-white/20" style={{ fontSize: 80 }}>map</span>
        </div>
        <button onClick={() => router.back()} className="absolute top-5 left-5 w-9 h-9 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-white z-10 hover:bg-white/30 transition-colors">
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_back</span>
        </button>
        <button onClick={openMaps} className="absolute top-5 right-5 bg-[#131b2e]/80 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 backdrop-blur-sm hover:bg-[#131b2e] transition-colors z-10">
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>near_me</span>
          NAVIGATE
        </button>
        {/* Pin */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 w-6 h-6 bg-[#F97316] rounded-full border-2 border-white shadow-lg" />
      </div>

      <div className="px-5 -mt-3 relative z-10">
        {/* Job card */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#f2f4f6] p-4 mb-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${color} mb-2 inline-block uppercase tracking-wider`}>{label}</span>
              <h2 className="font-headline font-bold text-xl text-[#0F172A] leading-tight">{booking.clientName || "Client"}</h2>
              <p className="text-xs text-[#45464d] mt-0.5 flex items-center gap-1">
                <span className="material-symbols-outlined" style={{ fontSize: 12 }}>location_on</span>
                {booking.address}
              </p>
            </div>
            <Link href={`/worker/chat?bookingId=${bookingId}`}
              className="w-10 h-10 rounded-xl bg-[#f2f4f6] flex items-center justify-center hover:bg-[#e0e3e5] transition-colors flex-shrink-0">
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>chat_bubble</span>
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#f2f4f6] rounded-xl p-3">
              <p className="text-[10px] text-[#76777d] uppercase tracking-wider mb-0.5">Date</p>
              <p className="font-bold text-[#0F172A] text-sm">{booking.date}</p>
            </div>
            <div className="bg-[#f2f4f6] rounded-xl p-3">
              <p className="text-[10px] text-[#76777d] uppercase tracking-wider mb-0.5">Time</p>
              <p className="font-bold text-[#0F172A] text-sm">{booking.time}</p>
            </div>
          </div>
        </div>

        {/* Description + Earnings */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#f2f4f6] p-4 mb-4">
          <div className="flex items-start justify-between mb-3">
            <h3 className="font-headline font-bold text-[#0F172A]">Job Description</h3>
            <div className="text-right">
              <p className="text-[10px] text-[#76777d] uppercase tracking-wider">Estimated Earnings</p>
              <p className="font-headline font-bold text-[#F97316] text-xl">{formatCurrency(booking.offeredAmount)}</p>
            </div>
          </div>
          <p className="text-sm text-[#45464d] leading-relaxed">{booking.description}</p>
        </div>

        {/* Progressive action buttons */}

        {/* accepted → on the way */}
        {booking.status === "accepted" && (
          <button onClick={() => handleStatusChange(JOB_STATUS.ON_THE_WAY)} disabled={submitting}
            className="w-full bg-[#131b2e] text-white py-4 rounded-2xl font-headline font-bold text-base mb-3 hover:bg-[#1e2a45] active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2">
            🛵 On my way
          </button>
        )}

        {/* on_the_way → arrived */}
        {booking.status === "on_the_way" && (
          <button onClick={() => handleStatusChange(JOB_STATUS.ARRIVED)} disabled={submitting}
            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-headline font-bold text-base mb-3 hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-60">
            📍 I've Arrived
          </button>
        )}

        {/* arrived → otp + start */}
        {booking.status === "arrived" && (
          <div className="bg-[#131b2e] rounded-2xl p-5 mb-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] text-[#7c839b] uppercase tracking-widest font-bold mb-2">Enter Client OTP</p>
                <OtpInputRow value={otp} onChange={setOtp} />
              </div>
              <button onClick={handleStartJob} disabled={submitting || otp.length < 4}
                className="bg-[#F97316] text-white px-5 py-3 rounded-xl font-headline font-bold text-sm hover:bg-[#e8680a] active:scale-95 transition-all disabled:opacity-50 ml-4">
                Start<br/>Job
              </button>
            </div>
            {otpError && <p className="text-red-400 text-xs">{otpError}</p>}
            <p className="text-[10px] text-[#7c839b]">Required to start · Ask client for OTP</p>
          </div>
        )}

        {/* in_progress → photos + complete */}
        {booking.status === "in_progress" && (
          <div className="space-y-3 mb-4">
            <div className="bg-white rounded-2xl border border-[#f2f4f6] p-4">
              <p className="text-xs font-bold text-[#45464d] uppercase tracking-wider mb-3">Work Photos (optional, max 3)</p>
              <div className="flex gap-2 flex-wrap">
                {photos.map((p, i) => (
                  <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden">
                    <img src={p} alt={`Photo ${i+1}`} className="w-full h-full object-cover" />
                    <button onClick={() => setPhotos(prev => prev.filter((_, j) => j !== i))}
                      className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold">✕</button>
                  </div>
                ))}
                {photos.length < 3 && (
                  <button onClick={() => photoRef.current.click()}
                    className="w-20 h-20 rounded-xl bg-[#f2f4f6] border-2 border-dashed border-[#c6c6cd] flex flex-col items-center justify-center hover:border-[#fd761a] transition-colors">
                    <span className="material-symbols-outlined text-[#76777d]" style={{ fontSize: 24 }}>add_a_photo</span>
                    <span className="text-[9px] text-[#76777d] mt-0.5">Add photo</span>
                  </button>
                )}
              </div>
              <input ref={photoRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoAdd} />
            </div>
            <button onClick={handleComplete} disabled={submitting}
              className="w-full bg-green-600 text-white py-4 rounded-2xl font-headline font-bold text-base hover:bg-green-700 active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2">
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>add_a_photo</span>
              Mark Work Complete
            </button>
          </div>
        )}

        {/* completed + cash → cash received */}
        {booking.status === "completed" && booking.paymentMethod === "cash" && (
          <button onClick={() => handleStatusChange(JOB_STATUS.COMPLETED, { cashReceived: true })} disabled={booking.cashReceived || submitting}
            className="w-full bg-[#f2f4f6] text-[#45464d] py-4 rounded-2xl font-headline font-bold text-base mb-3 flex items-center justify-center gap-2 disabled:opacity-50">
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>payments</span>
            {booking.cashReceived ? "✅ Cash Received" : "Cash Received"}
          </button>
        )}
      </div>

      <BottomNav role="worker" />
    </div>
  );
}
