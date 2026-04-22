"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getBooking, createReview } from "@/lib/firestore";
import { StarIcon, ArrowRightIcon, CheckCircleIcon, Spinner } from "@/components/Icons";

const TAGS = ["Professional","On time","Great quality","Clean work","Friendly","Fair price","Would rebook"];

export default function ReviewPage({ params }) {
  const router    = useRouter();
  const bookingId = params?.bookingId;
  const { user }  = useAuth();
  const [booking, setBooking]   = useState(null);
  const [stars, setStars]       = useState(0);
  const [hover, setHover]       = useState(0);
  const [tags, setTags]         = useState([]);
  const [comment, setComment]   = useState("");
  const [loading, setLoading]   = useState(false);
  const [done, setDone]         = useState(false);
  const [error, setError]       = useState("");

  useEffect(() => {
    if (bookingId && user) getBooking(bookingId).then(setBooking);
  }, [bookingId, user]);

  function toggleTag(t) {
    setTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  }

  async function handleSubmit() {
    if (stars === 0) { setError("Please select a star rating."); return; }
    setError(""); setLoading(true);
    try {
      await createReview({
        bookingId: bid, workerId: booking?.workerId, clientId: user.uid,
        rating: stars, tags, comment, workerName: booking?.workerName,
      });
      setDone(true);
    } catch { setError("Failed to submit review. Please try again."); }
    finally { setLoading(false); }
  }

  if (done) return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center px-6 text-center">
      <div className="w-20 h-20 bg-[#F0FDF4] rounded-full flex items-center justify-center mb-6 text-[#22C55E]">
        <CheckCircleIcon size={44}/>
      </div>
      <h2 className="font-black text-2xl text-[#0F172A] mb-2">Review submitted!</h2>
      <p className="text-[#64748B] mb-8">Thank you for helping the community.</p>
      <button onClick={() => router.push("/client/bookings")}
        className="bg-[#0F172A] text-white px-8 py-3.5 rounded-xl font-bold text-sm hover:bg-[#1E293B] flex items-center gap-2">
        Back to Bookings <ArrowRightIcon size={16}/>
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <div className="bg-white border-b border-[#E2E8F0] px-4 py-5">
        <h1 className="font-black text-2xl text-[#0F172A]">Rate your experience</h1>
        {booking && <p className="text-sm text-[#64748B] mt-1">with <span className="font-semibold text-[#0F172A]">{booking.workerName}</span></p>}
      </div>

      <div className="max-w-sm mx-auto px-4 py-8 space-y-8">
        {/* Stars */}
        <div className="text-center">
          <p className="text-sm font-semibold text-[#374151] mb-5">How was the service?</p>
          <div className="flex items-center justify-center gap-3 mb-3">
            {[1,2,3,4,5].map(i => (
              <button key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(0)} onClick={() => setStars(i)}
                className="transition-all duration-150 active:scale-90">
                <StarIcon size={44} fill={(hover||stars) >= i ? "#F59E0B" : "none"} className={(hover||stars) >= i ? "text-amber-400" : "text-[#E2E8F0]"} />
              </button>
            ))}
          </div>
          <p className="text-sm font-semibold text-[#64748B]">
            {stars === 0 ? "Tap to rate" : ["","Terrible","Bad","Okay","Good","Excellent!"][stars]}
          </p>
        </div>

        {/* Quick tags */}
        <div>
          <p className="text-xs font-bold text-[#374151] uppercase tracking-wider mb-3">What went well?</p>
          <div className="flex flex-wrap gap-2">
            {TAGS.map(tag => (
              <button key={tag} onClick={() => toggleTag(tag)}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-all duration-150 border ${tags.includes(tag) ? "bg-[#0F172A] text-white border-[#0F172A]" : "bg-white text-[#374151] border-[#E2E8F0] hover:border-[#F97316]"}`}>
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Comment */}
        <div>
          <p className="text-xs font-bold text-[#374151] uppercase tracking-wider mb-2">Add a comment (optional)</p>
          <textarea value={comment} onChange={e => setComment(e.target.value)} rows={4}
            placeholder="Share your experience to help others…"
            className="w-full bg-white border border-[#E2E8F0] rounded-xl px-4 py-3.5 text-sm text-[#0F172A] outline-none focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/10 resize-none placeholder:text-[#CBD5E1] transition-all" />
        </div>

        {error && <p className="text-[#EF4444] text-sm text-center">{error}</p>}

        <button onClick={handleSubmit} disabled={loading || stars === 0}
          className="w-full bg-[#0F172A] text-white py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 hover:bg-[#1E293B] active:scale-[0.98] transition-all disabled:opacity-50">
          {loading ? <><Spinner size={18}/>Submitting…</> : <><span>Submit Review</span><ArrowRightIcon size={18}/></>}
        </button>
      </div>
    </div>
  );
}
