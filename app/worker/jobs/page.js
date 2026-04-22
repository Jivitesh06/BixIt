"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getBooking, getWorkerBookings, updateBookingStatus, createNotification } from "@/lib/firestore";
import { SERVICE_CATEGORIES } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { useToast } from "@/components/Toast";
import BottomNav from "@/components/BottomNav";
import StatusBadge from "@/components/StatusBadge";
import {
  NavigationIcon, ClockIcon, CheckIcon, ArrowRightIcon,
  UploadIcon, AlertCircleIcon, Spinner, XIcon
} from "@/components/Icons";

// ─── OTP input (5-digit) ─────────────────────────────────────────
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

// ─── Job list (no bookingId in URL) ──────────────────────────────
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
  const pending   = bookings.filter(b => ["pending","counter_offered"].includes(b.status));
  const history   = bookings.filter(b => ["completed","cancelled"].includes(b.status));
  const showing   = tab === "active" ? active : tab === "pending" ? pending : history;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      <div className="bg-white border-b border-[#E2E8F0] px-4 pt-5 pb-3 sticky top-0 z-40">
        <h1 className="font-black text-2xl text-[#0F172A] mb-4">My Jobs</h1>
        <div className="flex bg-[#F8FAFC] rounded-xl p-1 border border-[#E2E8F0]">
          {[["active","Active"],["pending","Requests"],["history","History"]].map(([id,label]) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex-1 py-2.5 rounded-[10px] text-xs font-bold transition-all ${tab === id ? "bg-[#0F172A] text-white" : "text-[#64748B]"}`}>
              {label}
              {id === "pending" && pending.length > 0 && <span className="ml-1 bg-[#F97316] text-white text-[9px] px-1.5 py-0.5 rounded-full">{pending.length}</span>}
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
            const canManage = ["accepted","on_the_way","arrived","in_progress"].includes(b.status);
            const displayAmt = b.finalAmount || b.offeredAmount || b.totalAmount || 0;
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
                    <p className="font-black text-[#F97316]">{formatCurrency(displayAmt)}</p>
                    <StatusBadge status={b.status} />
                  </div>
                </div>
                {canManage && (
                  <button onClick={() => router.push(`/worker/jobs?bookingId=${b.id}`)}
                    className="w-full py-2.5 rounded-xl bg-[#F97316] text-xs font-bold text-white hover:bg-[#EA580C] flex items-center justify-center gap-1.5">
                    <ArrowRightIcon size={13}/> View & Manage Job
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

// ─── Job detail (with bookingId in URL) ──────────────────────────
function WorkerJobsInner() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const bookingId    = searchParams.get("bookingId");
  const addToast     = useToast();
  const { user, loading: authLoading } = useAuth();

  const [booking,       setBooking]       = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [actLoading,    setActLoading]    = useState(false);
  const [error,         setError]         = useState("");
  const [otpError,      setOtpError]      = useState("");
  const [showOtp,       setShowOtp]       = useState(false);

  // Cloudinary work photos
  const [workPhotoUrls,   setWorkPhotoUrls]   = useState([]);
  const [workPreviews,    setWorkPreviews]    = useState([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const photoRef = useRef();

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [user, authLoading]);

  useEffect(() => {
    if (!bookingId || !user) { setLoading(false); return; }
    getBooking(bookingId).then(b => { setBooking(b); setLoading(false); });
  }, [bookingId, user]);

  async function handleWorkPhotos(e) {
    const files = Array.from(e.target.files).slice(0, 3 - workPhotoUrls.length);
    if (!files.length) return;
    const previews = files.map(f => URL.createObjectURL(f));
    setWorkPreviews(prev => [...prev, ...previews].slice(0, 3));
    setUploadingPhotos(true);
    try {
      const urls = await Promise.all(files.map(f => uploadToCloudinary(f, "bixit/work-photos")));
      setWorkPhotoUrls(prev => [...prev, ...urls].slice(0, 3));
    } catch { setError("Photo upload failed. Try again."); }
    finally { setUploadingPhotos(false); }
  }

  function removePhoto(i) {
    setWorkPhotoUrls(prev => prev.filter((_,idx) => idx !== i));
    setWorkPreviews(prev => prev.filter((_,idx) => idx !== i));
  }

  // ── On the way ──────────────────────────────────────────────────
  async function handleOnTheWay() {
    setActLoading(true); setError("");
    try {
      let workerLocation = null;
      if (navigator.geolocation) {
        await new Promise(res => navigator.geolocation.getCurrentPosition(pos => {
          workerLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude, updatedAt: { seconds: Date.now()/1000 } };
          res();
        }, res, { timeout: 5000 }));
      }
      await updateBookingStatus(bookingId, "on_the_way", workerLocation ? { workerLocation } : {});
      await createNotification(booking.clientId, {
        title: "Worker on the way 🛵",
        body: "Worker is heading to your location",
        type: "on_the_way",
        bookingId,
        href: "/client/bookings",
      }).catch(() => {});
      setBooking(prev => ({ ...prev, status: "on_the_way", ...(workerLocation ? { workerLocation } : {}) }));
      addToast("Status updated — heading to client!", "success");
    } catch { setError("Failed to update. Try again."); }
    finally { setActLoading(false); }
  }

  // ── Arrived ─────────────────────────────────────────────────────
  async function handleArrived() {
    setActLoading(true); setError("");
    try {
      // Re-use existing arrivalOtp from booking (set at creation), or generate new
      const otp = booking.arrivalOtp || Math.floor(10000 + Math.random() * 90000).toString();
      await updateBookingStatus(bookingId, "arrived", { arrivalOtp: otp });
      await createNotification(booking.clientId, {
        title: "Worker has arrived! 📍",
        body: "Show your OTP to start the job",
        type: "arrived",
        bookingId,
        href: "/client/bookings",
      }).catch(() => {});
      setBooking(prev => ({ ...prev, status: "arrived", arrivalOtp: otp }));
      addToast("Marked as arrived! Ask client for OTP.", "success");
    } catch { setError("Failed to update. Try again."); }
    finally { setActLoading(false); }
  }

  // ── OTP verify ──────────────────────────────────────────────────
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
      addToast("Job started! 🔧", "success");
    } catch { setOtpError("Verification failed. Try again."); }
    finally { setActLoading(false); }
  }

  // ── Mark complete ───────────────────────────────────────────────
  async function handleComplete() {
    setActLoading(true); setError("");
    try {
      await updateBookingStatus(bookingId, "completed", { workPhotos: workPhotoUrls });
      setBooking(prev => ({ ...prev, status: "completed", workPhotos: workPhotoUrls }));
      addToast("Job complete! 🎉 Payment will be processed.", "success");
    } catch { setError("Failed to complete. Try again."); }
    finally { setActLoading(false); }
  }

  // ── Cash received ───────────────────────────────────────────────
  async function handleCashReceived() {
    setActLoading(true);
    try {
      await updateBookingStatus(bookingId, "completed", { cashConfirmed: true });
      setBooking(prev => ({ ...prev, cashConfirmed: true }));
      addToast("Cash payment confirmed! ✅", "success");
    } catch { setError("Failed. Try again."); }
    finally { setActLoading(false); }
  }

  if (authLoading || loading) return <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center"><div className="animate-spin w-10 h-10 rounded-full border-4 border-[#0F172A] border-t-transparent"/></div>;

  if (!bookingId) return <JobsList workerId={user?.uid} />;

  if (!booking) return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center">
      <div className="text-6xl mb-4">📋</div>
      <p className="font-bold text-[#0F172A] mb-2">Job not found</p>
      <button onClick={() => router.push("/worker/jobs")} className="text-[#F97316] font-semibold text-sm">← Back to jobs</button>
    </div>
  );

  const cat  = SERVICE_CATEGORIES.find(c => (booking.services||[]).includes(c.id));
  const STATUSES = ["accepted","on_the_way","arrived","in_progress","completed"];
  const currentIdx = STATUSES.indexOf(booking.status);
  const displayAmt = booking.finalAmount || booking.offeredAmount || booking.totalAmount || 0;

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
            <p className="font-black text-[#F97316] text-xl">{formatCurrency(displayAmt)}</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#94A3B8]">
            <ClockIcon size={12}/>{booking.scheduledDate} · {booking.scheduledTime}
          </div>
          {booking.description && <p className="text-xs text-[#64748B] bg-[#F8FAFC] rounded-xl p-3 mt-3">{booking.description}</p>}
        </div>

        {/* Progress stepper */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4">
          <p className="text-xs font-bold text-[#374151] uppercase tracking-wider mb-4">Progress</p>
          <div className="space-y-3">
            {STATUSES.map((s, i) => {
              const isDone    = currentIdx > i || booking.status === s;
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

        {/* ── STATUS: accepted ── */}
        {booking.status === "accepted" && (
          <button onClick={handleOnTheWay} disabled={actLoading}
            className="w-full py-4 rounded-2xl font-bold text-white text-base flex items-center justify-center gap-2 bg-[#3B82F6] hover:bg-[#2563EB] disabled:opacity-50 transition-all">
            {actLoading ? <><Spinner size={20}/>Updating…</> : <>🛵 I'm On My Way</>}
          </button>
        )}

        {/* ── STATUS: on_the_way ── */}
        {booking.status === "on_the_way" && (
          <button onClick={handleArrived} disabled={actLoading}
            className="w-full py-4 rounded-2xl font-bold text-white text-base flex items-center justify-center gap-2 bg-[#8B5CF6] hover:bg-[#7C3AED] disabled:opacity-50 transition-all">
            {actLoading ? <><Spinner size={20}/>Updating…</> : <>📍 I've Arrived</>}
          </button>
        )}

        {/* ── STATUS: arrived ── */}
        {booking.status === "arrived" && (
          <>
            {!showOtp && (
              <button onClick={() => setShowOtp(true)}
                className="w-full py-4 rounded-2xl font-bold text-white text-base flex items-center justify-center gap-2 bg-[#F97316] hover:bg-[#EA580C] transition-all">
                🔑 Enter Client OTP to Start
              </button>
            )}
            {showOtp && <OtpInput onVerify={handleOtpVerify} error={otpError} loading={actLoading} />}
          </>
        )}

        {/* ── STATUS: in_progress ── */}
        {booking.status === "in_progress" && (
          <div className="space-y-3">
            <p className="text-xs font-bold text-[#374151] uppercase tracking-wider">
              Work Photos <span className="text-[#94A3B8] normal-case font-normal">({workPhotoUrls.length}/3 uploaded)</span>
            </p>

            {workPreviews.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {workPreviews.map((prev, i) => (
                  <div key={i} className="relative rounded-xl overflow-hidden aspect-square">
                    <img src={prev} alt={`Work ${i+1}`} className="w-full h-full object-cover" />
                    {workPhotoUrls[i]
                      ? <div className="absolute top-1 right-1 w-5 h-5 bg-[#22C55E] rounded-full flex items-center justify-center"><CheckIcon size={10}/></div>
                      : <div className="absolute top-1 right-1 w-5 h-5 bg-black/30 rounded-full flex items-center justify-center"><Spinner size={10}/></div>}
                    <button onClick={() => removePhoto(i)}
                      className="absolute bottom-1 right-1 w-5 h-5 bg-[#EF4444] rounded-full flex items-center justify-center">
                      <XIcon size={8}/>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {uploadingPhotos && <p className="text-xs text-[#F97316] flex items-center gap-1"><Spinner size={13}/> Uploading photos…</p>}

            {workPreviews.length < 3 && (
              <label className="flex flex-col items-center justify-center h-24 rounded-2xl border-2 border-dashed cursor-pointer border-[#CBD5E1] hover:border-[#F97316] transition-colors">
                <UploadIcon size={24}/>
                <span className="text-sm text-[#94A3B8] mt-2">Add work photos (max 3)</span>
                <input ref={photoRef} type="file" accept="image/*" multiple className="hidden" onChange={handleWorkPhotos} />
              </label>
            )}

            <button onClick={handleComplete}
              disabled={actLoading || workPhotoUrls.length === 0 || uploadingPhotos}
              className="w-full py-4 rounded-2xl font-bold text-white text-base flex items-center justify-center gap-2 bg-[#22C55E] hover:bg-[#16A34A] disabled:opacity-50 transition-all">
              {actLoading ? <><Spinner size={20}/>Completing…</> : <><CheckIcon size={18}/>Mark Work Complete</>}
            </button>
            <p className="text-[11px] text-center text-[#94A3B8]">Upload at least 1 photo to complete</p>
          </div>
        )}

        {/* ── STATUS: completed ── */}
        {booking.status === "completed" && (
          <div className="space-y-3">
            <div className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-2xl p-5 text-center">
              <div className="text-4xl mb-2">🎉</div>
              <p className="font-bold text-[#166534] text-lg">Job Complete!</p>
              <p className="text-sm text-[#16A34A] mt-1">Well done! Payment will be processed shortly.</p>
            </div>
            {/* Cash confirmation button */}
            {booking.paymentMethod === "cash" && !booking.cashConfirmed && (
              <button onClick={handleCashReceived} disabled={actLoading}
                className="w-full py-3 rounded-xl bg-[#22C55E] text-sm font-bold text-white hover:bg-[#16A34A] disabled:opacity-50 flex items-center justify-center gap-2">
                {actLoading ? <Spinner size={15}/> : "💵"} Cash Received ✅
              </button>
            )}
          </div>
        )}
      </div>

      <BottomNav role="worker" />
    </div>
  );
}
const Loader = () => (
  <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
    <div className="w-10 h-10 rounded-full border-4 border-[#F97316] border-t-transparent animate-spin"/>
  </div>
);

export default function WorkerJobs() {
  return (
    <Suspense fallback={<Loader />}>
      <WorkerJobsInner />
    </Suspense>
  );
}
