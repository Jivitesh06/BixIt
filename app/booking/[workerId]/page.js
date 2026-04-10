"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getWorkerProfile, createBooking } from "@/lib/firestore";
import { formatCurrency } from "@/lib/utils";
import { PAYMENT_METHODS, SERVICE_CATEGORIES } from "@/lib/constants";

function Spinner() {
  return <svg className="animate-spin h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>;
}

function loadRazorpay() {
  return new Promise(resolve => {
    if (window.Razorpay) { resolve(true); return; }
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export default function BookingPage() {
  const { workerId } = useParams();
  const router = useRouter();
  const { user, userRole } = useAuth();

  const [worker, setWorker]         = useState(null);
  const [loading, setLoading]       = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState("");

  const [description, setDescription] = useState("");
  const [date, setDate]               = useState("");
  const [time, setTime]               = useState("");
  const [address, setAddress]         = useState("");
  const [amount, setAmount]           = useState("");
  const [payMethod, setPayMethod]     = useState("cash");

  const today = new Date().toISOString().split("T")[0];
  const platformFee  = amount ? Math.round(Number(amount) * 0.1) : 0;
  const totalAmount  = amount ? Number(amount) + platformFee : 0;

  useEffect(() => {
    if (user && userRole === "worker") router.replace("/worker/dashboard");
    if (!user) router.replace("/login");
  }, [user, userRole]);

  useEffect(() => {
    async function load() {
      const w = await getWorkerProfile(workerId);
      setWorker(w);
      if (w?.ratePerHour) setAmount(String(w.ratePerHour * 2));
      setLoading(false);
    }
    load();
  }, [workerId]);

  async function handleBooking() {
    setError("");
    if (!description || !date || !time || !address) {
      setError("Please fill all required fields."); return;
    }
    if (!amount || Number(amount) < 1) {
      setError("Enter a valid budget amount."); return;
    }
    setSubmitting(true);

    const bookingData = {
      clientId: user.uid,
      workerId,
      workerName: worker.name,
      serviceType: (worker.skills || [])[0] || "general",
      description, date, time, address,
      offeredAmount: Number(amount),
      finalAmount: totalAmount,
      paymentMethod: payMethod,
      paymentStatus: "pending",
    };

    try {
      if (payMethod === "cash") {
        const id = await createBooking(bookingData);
        router.push("/client/bookings");
      } else {
        // Razorpay online payment
        const ok = await loadRazorpay();
        if (!ok) { setError("Payment gateway failed to load. Try again."); setSubmitting(false); return; }
        const key = process.env.NEXT_PUBLIC_RAZORPAY_KEY || "rzp_test_XXXXXXXX";
        const options = {
          key,
          amount: totalAmount * 100,
          currency: "INR",
          name: "Bixit",
          description: `Booking for ${worker.name}`,
          handler: async (response) => {
            const id = await createBooking({
              ...bookingData,
              paymentStatus: "paid",
              paymentId: response.razorpay_payment_id,
              status: "accepted",
            });
            router.push(`/payment-success?bookingId=${id}`);
          },
          prefill: { name: user.displayName || "", email: user.email || "" },
          theme: { color: "#131b2e" },
          modal: { ondismiss: () => setSubmitting(false) },
        };
        new window.Razorpay(options).open();
        return;
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-[#f7f9fb] flex items-center justify-center">
      <div className="animate-spin w-10 h-10 rounded-full border-4 border-[#131b2e] border-t-transparent" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f7f9fb] pb-10">
      {/* Header */}
      <nav className="flex items-center gap-3 px-5 h-14 bg-white border-b border-gray-100 sticky top-0 z-10">
        <button onClick={() => router.back()} className="w-9 h-9 rounded-xl bg-[#f2f4f6] flex items-center justify-center hover:bg-[#e0e3e5] transition-colors">
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_back</span>
        </button>
        <span className="font-headline font-black text-[#0F172A] text-lg flex-1">Bixit</span>
        <button className="text-sm font-bold text-[#45464d] hover:text-[#F97316]">EN | हिं</button>
      </nav>

      <div className="max-w-md mx-auto px-5 pt-5">
        {/* Worker mini card */}
        {worker && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#f2f4f6] mb-5 flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-[#f2f4f6] overflow-hidden flex items-center justify-center flex-shrink-0">
              {worker.profilePhoto
                ? <img src={worker.profilePhoto} alt={worker.name} className="w-full h-full object-cover" />
                : <span className="material-symbols-outlined text-[#76777d]" style={{ fontSize: 28 }}>person</span>
              }
            </div>
            <div className="flex-1">
              <p className="font-headline font-bold text-[#0F172A]">{worker.name}</p>
              <p className="text-xs text-[#45464d]">
                {SERVICE_CATEGORIES.find(c => c.id === (worker.skills||[])[0])?.label || "Professional"}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="flex items-center text-xs text-amber-500 font-bold">
                  <span className="material-symbols-outlined" style={{ fontSize: 12 }}>star</span>
                  {worker.averageRating?.toFixed(1) || "New"}
                </span>
                {worker.isVerified && (
                  <span className="text-[9px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">VERIFIED</span>
                )}
              </div>
            </div>
            <p className="text-[#F97316] font-bold text-sm">{formatCurrency(worker.ratePerHour || 0)}/hr</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-5 flex items-center gap-2">
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>error</span>
            {error}
          </div>
        )}

        {/* Form */}
        <div className="space-y-5">
          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-[#45464d] uppercase tracking-wider mb-1.5">Job Description *</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4}
              placeholder="Describe the issue or service required…"
              className="w-full bg-white border border-[#e0e3e5] rounded-xl px-4 py-3.5 text-sm text-[#0F172A] outline-none focus:border-[#131b2e] resize-none placeholder:text-[#c6c6cd] transition-colors"
            />
          </div>

          {/* Date + Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#45464d] uppercase tracking-wider mb-1.5">Date *</label>
              <input type="date" min={today} value={date} onChange={e => setDate(e.target.value)}
                className="w-full bg-white border border-[#e0e3e5] rounded-xl px-4 py-3.5 text-sm text-[#0F172A] outline-none focus:border-[#131b2e] transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#45464d] uppercase tracking-wider mb-1.5">Time *</label>
              <input type="time" value={time} onChange={e => setTime(e.target.value)}
                className="w-full bg-white border border-[#e0e3e5] rounded-xl px-4 py-3.5 text-sm text-[#0F172A] outline-none focus:border-[#131b2e] transition-colors" />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs font-semibold text-[#45464d] uppercase tracking-wider mb-1.5">Service Address *</label>
            <div className="flex items-center bg-white border border-[#e0e3e5] rounded-xl px-4 py-3.5 focus-within:border-[#131b2e] transition-colors">
              <span className="material-symbols-outlined text-[#76777d] mr-2" style={{ fontSize: 18 }}>location_on</span>
              <input type="text" value={address} onChange={e => setAddress(e.target.value)}
                placeholder="House No, Street, Landmark"
                className="flex-1 bg-transparent text-sm text-[#0F172A] outline-none placeholder:text-[#c6c6cd]" />
            </div>
          </div>

          {/* Budget */}
          <div>
            <label className="block text-xs font-semibold text-[#45464d] uppercase tracking-wider mb-1.5">
              Your Budget (₹) <span className="text-[#76777d] normal-case font-normal">Suggested: {formatCurrency((worker?.ratePerHour || 0) * 2)}</span>
            </label>
            <div className="flex items-center bg-white border border-[#e0e3e5] rounded-xl overflow-hidden focus-within:border-[#131b2e] transition-colors">
              <span className="px-4 py-3.5 bg-[#f2f4f6] border-r border-[#e0e3e5] text-sm font-bold text-[#0F172A]">₹</span>
              <input type="number" value={amount} onChange={e => setAmount(e.target.value)} min="1"
                placeholder="0.00"
                className="flex-1 px-4 py-3.5 bg-transparent text-sm text-[#0F172A] outline-none placeholder:text-[#c6c6cd]" />
            </div>
          </div>

          {/* Payment method */}
          <div>
            <label className="block text-xs font-semibold text-[#45464d] uppercase tracking-wider mb-2">Payment Method</label>
            <div className="flex bg-[#f2f4f6] rounded-2xl p-1">
              {[
                { val: "online", label: "Online",  icon: "credit_card" },
                { val: "cash",   label: "Cash",    icon: "payments"    },
              ].map(m => (
                <button key={m.val} type="button" onClick={() => setPayMethod(m.val)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${payMethod === m.val ? "bg-white text-[#0F172A] shadow-sm" : "text-[#45464d]"}`}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{m.icon}</span>
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Price breakdown */}
          {amount && Number(amount) > 0 && (
            <div className="bg-white rounded-2xl p-4 border border-[#f2f4f6] shadow-sm space-y-2">
              <div className="flex justify-between text-sm text-[#45464d]">
                <span>Service Charge</span>
                <span>{formatCurrency(Number(amount))}</span>
              </div>
              <div className="flex justify-between text-sm text-[#45464d]">
                <span>Platform Fee (10%)</span>
                <span>{formatCurrency(platformFee)}</span>
              </div>
              <div className="border-t border-[#f2f4f6] pt-2 flex justify-between font-headline font-bold">
                <span className="text-[#0F172A]">Total Amount</span>
                <span className="text-[#F97316] text-lg">{formatCurrency(totalAmount)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Confirm button */}
        <button onClick={handleBooking} disabled={submitting}
          className="w-full mt-6 bg-[#131b2e] text-white py-4 rounded-2xl font-headline font-bold text-base hover:bg-[#1e2a45] active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2">
          {submitting && <Spinner />}
          {submitting ? "Processing…" : `Confirm Booking →`}
        </button>
      </div>
    </div>
  );
}
