"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getBooking, createReview } from "@/lib/firestore";
import { formatCurrency } from "@/lib/utils";
import { SERVICE_CATEGORIES } from "@/lib/constants";

const TAGS = ["On time", "Professional", "Good work", "Clean work", "Friendly", "Recommended"];

function Toast({ msg, type }) {
  return (
    <div className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-lg text-sm font-bold flex items-center gap-2 ${type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"}`}>
      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{type === "success" ? "check_circle" : "error"}</span>
      {msg}
    </div>
  );
}

export default function ReviewPage() {
  const { bookingId } = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const [booking, setBooking]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [rating, setRating]     = useState(0);
  const [hovered, setHovered]   = useState(0);
  const [tags, setTags]         = useState([]);
  const [comment, setComment]   = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast]       = useState(null);

  useEffect(() => {
    getBooking(bookingId).then(b => { setBooking(b); setLoading(false); });
  }, [bookingId]);

  function toggleTag(t) {
    setTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  }

  function showToast(msg, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function handleSubmit() {
    if (rating === 0) { showToast("Please select a star rating.", "error"); return; }
    setSubmitting(true);
    try {
      await createReview({
        bookingId,
        workerId: booking.workerId,
        clientId: user.uid,
        rating,
        tags,
        comment,
      });
      showToast("Review submitted! Thank you 🎉");
      setTimeout(() => router.push("/client/bookings"), 1500);
    } catch (e) {
      showToast("Failed to submit review. Try again.", "error");
    } finally { setSubmitting(false); }
  }

  if (loading) return (
    <div className="min-h-screen bg-[#f7f9fb] flex items-center justify-center">
      <div className="animate-spin w-10 h-10 rounded-full border-4 border-[#131b2e] border-t-transparent" />
    </div>
  );

  const catLabel = SERVICE_CATEGORIES.find(c => c.id === booking?.serviceType)?.label;

  return (
    <div className="min-h-screen bg-[#f7f9fb] pb-10">
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      {/* Header */}
      <nav className="flex items-center gap-3 px-5 h-14 bg-white border-b border-gray-100">
        <button onClick={() => router.back()} className="w-9 h-9 rounded-xl bg-[#f2f4f6] flex items-center justify-center hover:bg-[#e0e3e5]">
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_back</span>
        </button>
        <span className="font-headline font-black text-[#0F172A] text-lg">Rate Your Experience</span>
      </nav>

      <div className="max-w-md mx-auto px-5 pt-8">
        {/* Worker */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 rounded-3xl bg-[#f2f4f6] flex items-center justify-center mb-3 shadow-sm border border-[#e0e3e5]">
            <span className="material-symbols-outlined text-[#76777d]" style={{ fontSize: 36 }}>person</span>
          </div>
          <h2 className="font-headline font-bold text-xl text-[#0F172A]">{booking?.workerName || "Worker"}</h2>
          {catLabel && <p className="text-sm text-[#45464d] mt-0.5">{catLabel}</p>}
        </div>

        {/* Job summary */}
        <div className="bg-white rounded-2xl border border-[#f2f4f6] shadow-sm p-4 mb-7">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[#45464d]">{catLabel || "Service"}</span>
            <span className="font-bold text-[#0F172A]">{formatCurrency(booking?.finalAmount || booking?.offeredAmount || 0)}</span>
          </div>
          <div className="flex items-center justify-between text-sm mt-1.5">
            <span className="text-[#45464d]">Date</span>
            <span className="font-medium text-[#0F172A]">{booking?.date}</span>
          </div>
        </div>

        {/* Heading */}
        <h3 className="font-headline font-bold text-lg text-[#0F172A] text-center mb-5">How was your experience?</h3>

        {/* Stars */}
        <div className="flex justify-center gap-3 mb-7">
          {[1,2,3,4,5].map(s => (
            <button key={s} onClick={() => setRating(s)} onMouseEnter={() => setHovered(s)} onMouseLeave={() => setHovered(0)}
              className="transition-transform duration-100 active:scale-95 hover:scale-110">
              <span className="material-symbols-outlined"
                style={{ fontSize: 44, color: s <= (hovered || rating) ? "#f59e0b" : "#e0e3e5", transition: "color .15s" }}>
                star
              </span>
            </button>
          ))}
        </div>

        {/* Tags */}
        <div className="mb-7">
          <p className="text-xs font-semibold text-[#45464d] uppercase tracking-wider mb-3 text-center">Select what applies</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {TAGS.map(tag => (
              <button key={tag} type="button" onClick={() => toggleTag(tag)}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${tags.includes(tag) ? "bg-[#131b2e] text-white shadow-sm" : "bg-white border border-[#e0e3e5] text-[#45464d] hover:border-[#131b2e]"}`}>
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Comment */}
        <div className="mb-7">
          <label className="block text-xs font-semibold text-[#45464d] uppercase tracking-wider mb-1.5">Your Review (optional)</label>
          <textarea value={comment} onChange={e => setComment(e.target.value)} rows={4}
            placeholder="Share your experience with this worker…"
            className="w-full bg-white border border-[#e0e3e5] rounded-xl px-4 py-3.5 text-sm text-[#0F172A] outline-none focus:border-[#131b2e] resize-none placeholder:text-[#c6c6cd] transition-colors" />
        </div>

        {/* Submit */}
        <button onClick={handleSubmit} disabled={submitting || rating === 0}
          className="w-full bg-[#131b2e] text-white py-4 rounded-2xl font-headline font-bold text-base hover:bg-[#1e2a45] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 mb-4">
          {submitting
            ? <><svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Submitting…</>
            : "Submit Review"
          }
        </button>

        <button onClick={() => router.push("/client/bookings")}
          className="w-full text-center text-sm text-[#45464d] hover:text-[#F97316] transition-colors py-2">
          Skip for now
        </button>
      </div>
    </div>
  );
}
