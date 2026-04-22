"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getWorkerProfile, createBooking, processPayment, getClientProfile } from "@/lib/firestore";
import { SERVICE_CATEGORIES, PLATFORM_COMMISSION } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import {
  ArrowLeftIcon, CalendarIcon, ClockIcon, MapPinIcon,
  CreditCardIcon, CashIcon, CheckIcon, ArrowRightIcon, Spinner, AlertCircleIcon
} from "@/components/Icons";

export default function BookingPage() {
  const router    = useRouter();
  const params    = useParams();
  const workerId  = params?.workerId;
  const { user }  = useAuth();

  const [worker, setWorker]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]     = useState("");
  const [clientProfile, setClientProfile] = useState(null);

  const [services, setServices] = useState([]);
  const [date, setDate]         = useState("");
  const [time, setTime]         = useState("");
  const [address, setAddress]   = useState("");
  const [desc, setDesc]         = useState("");
  const [payment, setPayment]   = useState("online");
  const [hours, setHours]       = useState(2);

  useEffect(() => {
    if (!workerId) return;
    getWorkerProfile(workerId).then(w => { setWorker(w); setLoading(false); });
  }, [workerId]);

  useEffect(() => {
    if (!user) return;
    getClientProfile(user.uid).then(p => setClientProfile(p));
  }, [user]);

  function toggleService(id) {
    setServices(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  }

  const workerSkills = (worker?.skills || []).map(id => SERVICE_CATEGORIES.find(c => c.id === id)).filter(Boolean);
  const subtotal     = (worker?.ratePerHour || 0) * hours;
  const platformFee  = Math.round(subtotal * PLATFORM_COMMISSION);
  const workerAmount = subtotal - platformFee;
  const total        = subtotal + platformFee;

  async function handleBook() {
    setError("");
    if (services.length === 0) { setError("Please select at least one service."); return; }
    if (!date)    { setError("Please select a date."); return; }
    if (!time)    { setError("Please select a time."); return; }
    if (!address) { setError("Please enter your address."); return; }

    setSubmitting(true);
    try {
      if (payment === "online" && typeof window !== "undefined") {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        document.body.appendChild(script);
        script.onload = () => {
          const rzp = new window.Razorpay({
            key: process.env.NEXT_PUBLIC_RAZORPAY_KEY || "rzp_test_XXXXXXXX",
            amount: total * 100,
            currency: "INR",
            name: "Bixit",
            description: `Booking: ${services.join(", ")}`,
            handler: async () => {
              const bookingId = await saveBooking("online_paid");
              await processPayment(bookingId, workerAmount, workerId);
              router.push("/payment-success");
            },
            prefill: { email: user?.email || "" },
            theme: { color: "#F97316" },
          });
          rzp.open();
          setSubmitting(false);
        };
      } else {
        await saveBooking("cash");
        router.push("/payment-success");
      }
    } catch (e) { setError("Booking failed. Please try again."); setSubmitting(false); }
  }

  async function saveBooking(paymentMode) {
    const clientName = clientProfile?.name || user?.email?.split("@")[0] || "Client";
    const bookingId = await createBooking({
      clientId: user.uid, workerId,
      workerName: worker?.name, clientName,
      services, scheduledDate: date, scheduledTime: time,
      address, description: desc,
      hours, totalAmount: total, platformFee, workerAmount, paymentMode,
      status: "pending",
    });
    return bookingId;
  }

  if (loading) return <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center"><div className="animate-spin w-10 h-10 rounded-full border-4 border-[#0F172A] border-t-transparent"/></div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-28">
      {/* Header */}
      <div className="bg-white border-b border-[#E2E8F0] px-4 py-4 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="w-9 h-9 rounded-full bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:border-[#CBD5E1]">
            <ArrowLeftIcon size={18}/>
          </button>
          <h1 className="font-bold text-[#0F172A]">Book Worker</h1>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-5 space-y-5">
        {/* Worker mini-card */}
        {worker && (
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-[#F1F5F9] flex items-center justify-center text-2xl font-black text-[#0F172A] overflow-hidden flex-shrink-0">
              {worker.profilePhoto ? <img src={worker.profilePhoto} alt={worker.name} className="w-full h-full object-cover"/> : (worker.name?.[0] || "W")}
            </div>
            <div className="flex-1">
              <p className="font-bold text-[#0F172A]">{worker.name}</p>
              <p className="text-xs text-[#64748B]">{workerSkills[0]?.label || "Professional"}</p>
            </div>
            <div className="text-right">
              <p className="font-black text-[#F97316] text-lg">{formatCurrency(worker.ratePerHour || 0)}</p>
              <p className="text-[10px] text-[#94A3B8]">per hour</p>
            </div>
          </div>
        )}

        {/* Services */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4">
          <p className="text-xs font-bold text-[#374151] uppercase tracking-wider mb-3">Select Services *</p>
          <div className="flex flex-wrap gap-2">
            {workerSkills.map(s => (
              <button key={s.id} type="button" onClick={() => toggleService(s.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold transition-all border ${services.includes(s.id) ? "bg-[#0F172A] text-white border-[#0F172A]" : "bg-[#F8FAFC] text-[#374151] border-[#E2E8F0] hover:border-[#F97316]"}`}>
                {s.icon} {s.label} {services.includes(s.id) && <CheckIcon size={12}/>}
              </button>
            ))}
          </div>
        </div>

        {/* Date & Time */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 space-y-4">
          <p className="text-xs font-bold text-[#374151] uppercase tracking-wider">Schedule *</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[#64748B] font-semibold block mb-1.5 flex items-center gap-1"><CalendarIcon size={12}/> Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} min={new Date().toISOString().split("T")[0]}
                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3 py-3 text-sm text-[#0F172A] outline-none focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/10 transition-all" />
            </div>
            <div>
              <label className="text-xs text-[#64748B] font-semibold block mb-1.5 flex items-center gap-1"><ClockIcon size={12}/> Time</label>
              <input type="time" value={time} onChange={e => setTime(e.target.value)}
                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3 py-3 text-sm text-[#0F172A] outline-none focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/10 transition-all" />
            </div>
          </div>
        </div>

        {/* Hours */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-[#374151] uppercase tracking-wider">Estimated Hours</p>
            <span className="font-black text-[#0F172A]">{hours}h</span>
          </div>
          <input type="range" min={1} max={8} value={hours} onChange={e => setHours(Number(e.target.value))} className="w-full accent-[#F97316]" />
          <div className="flex justify-between text-[10px] text-[#94A3B8] mt-1"><span>1h</span><span>4h</span><span>8h</span></div>
        </div>

        {/* Address */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4">
          <label className="text-xs font-bold text-[#374151] uppercase tracking-wider mb-2 block flex items-center gap-1"><MapPinIcon size={12}/> Service Address *</label>
          <textarea value={address} onChange={e => setAddress(e.target.value)} rows={2}
            placeholder="House/flat no., street, landmark, city…"
            className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm text-[#0F172A] outline-none focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/10 resize-none placeholder:text-[#CBD5E1] transition-all" />
        </div>

        {/* Description */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4">
          <label className="text-xs font-bold text-[#374151] uppercase tracking-wider mb-2 block">Problem Description</label>
          <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={3}
            placeholder="Describe the issue or what needs to be done…"
            className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm text-[#0F172A] outline-none focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/10 resize-none placeholder:text-[#CBD5E1] transition-all" />
        </div>

        {/* Payment */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4">
          <p className="text-xs font-bold text-[#374151] uppercase tracking-wider mb-3">Payment Method</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { id:"online", label:"Pay Online", sub:"Secure & instant", Icon: CreditCardIcon },
              { id:"cash",   label:"Pay Cash",   sub:"After service",   Icon: CashIcon },
            ].map(({ id, label, sub, Icon }) => (
              <button key={id} type="button" onClick={() => setPayment(id)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${payment === id ? "border-[#F97316] bg-[#FFF7ED]" : "border-[#E2E8F0] bg-[#F8FAFC] hover:border-[#CBD5E1]"}`}>
                <div className={`mb-2 ${payment === id ? "text-[#F97316]" : "text-[#94A3B8]"}`}><Icon size={20}/></div>
                <p className={`text-sm font-bold ${payment === id ? "text-[#C2410C]" : "text-[#374151]"}`}>{label}</p>
                <p className="text-[10px] text-[#94A3B8] mt-0.5">{sub}</p>
                {payment === id && <div className="mt-2 flex items-center gap-1 text-[#22C55E] text-[10px] font-bold"><CheckIcon size={10}/> Selected</div>}
              </button>
            ))}
          </div>
        </div>

        {/* Price breakdown */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 space-y-3">
          <p className="text-xs font-bold text-[#374151] uppercase tracking-wider">Price Breakdown</p>
          {[
            { label:`Service (${formatCurrency(worker?.ratePerHour||0)} × ${hours}h)`, val: formatCurrency(subtotal) },
            { label:"Platform fee (5%)", val: formatCurrency(platformFee) },
          ].map(r => (
            <div key={r.label} className="flex justify-between text-sm text-[#64748B]">
              <span>{r.label}</span><span className="font-semibold text-[#374151]">{r.val}</span>
            </div>
          ))}
          <div className="border-t border-[#E2E8F0] pt-3 flex justify-between">
            <span className="font-bold text-[#0F172A]">Total</span>
            <span className="font-black text-[#F97316] text-xl">{formatCurrency(total)}</span>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] text-sm rounded-xl px-4 py-3">
            <AlertCircleIcon size={16}/>{error}
          </div>
        )}
      </div>

      {/* Sticky confirm */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-t border-[#E2E8F0] px-4 py-4">
        <button onClick={handleBook} disabled={submitting}
          className="w-full bg-[#0F172A] text-white py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 hover:bg-[#1E293B] active:scale-[0.98] transition-all disabled:opacity-50 max-w-md mx-auto">
          {submitting ? <><Spinner size={20}/>Processing…</> : <><span>Confirm Booking · {formatCurrency(total)}</span><ArrowRightIcon size={18}/></>}
        </button>
      </div>
    </div>
  );
}
