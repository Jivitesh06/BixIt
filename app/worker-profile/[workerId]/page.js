"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getWorkerProfile, getWorkerReviews } from "@/lib/firestore";
import { SERVICE_CATEGORIES } from "@/lib/constants";
import { getWorkerBadge, formatCurrency } from "@/lib/utils";
import {
  StarIcon, MapPinIcon, CheckIcon, ArrowRightIcon, ArrowLeftIcon,
  ShieldIcon, ClockIcon, WorkIcon, ChevronRightIcon
} from "@/components/Icons";

function Avatar({ name = "", photo, size = 80 }) {
  const initials = name.split(" ").map(w => w[0]).join("").slice(0,2).toUpperCase();
  const colors = ["#7C3AED","#0891B2","#059669","#DC2626","#D97706","#2563EB"];
  const color  = colors[(name.charCodeAt(0)||0) % colors.length];
  if (photo) return <img src={photo} alt={name} className="w-full h-full object-cover" style={{ borderRadius: "50%" }} />;
  return (
    <div style={{ width:size, height:size, background:color, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <span style={{ color:"white", fontWeight:800, fontSize:size*0.34 }}>{initials||"W"}</span>
    </div>
  );
}

export default function WorkerProfilePage() {
  const router = useRouter();
  const params = useParams();
  const workerId = params?.workerId;
  const { user }  = useAuth();
  const [worker, setWorker]   = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workerId) return;
    Promise.all([getWorkerProfile(workerId), getWorkerReviews(workerId)])
      .then(([w, r]) => { setWorker(w); setReviews(r); setLoading(false); });
  }, [workerId]);

  if (loading) return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
      <div className="animate-spin w-10 h-10 rounded-full border-4 border-[#0F172A] border-t-transparent" />
    </div>
  );
  if (!worker) return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center text-center p-6">
      <div className="text-6xl mb-4">👤</div>
      <p className="font-bold text-[#0F172A] mb-2">Worker not found</p>
      <button onClick={() => router.back()} className="text-[#F97316] font-semibold text-sm">← Go back</button>
    </div>
  );

  const badge = getWorkerBadge(worker.completedJobs || 0);
  const skills = (worker.skills || []).map(id => SERVICE_CATEGORIES.find(c => c.id === id)).filter(Boolean);
  const rating = worker.averageRating?.toFixed(1);

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-28">
      {/* Cover */}
      <div className="h-44 bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A] relative">
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage:"radial-gradient(circle at 1px 1px,white 1px,transparent 0)",backgroundSize:"28px 28px" }}/>
        <button onClick={() => router.back()} className="absolute top-4 left-4 w-9 h-9 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors">
          <ArrowLeftIcon size={18}/>
        </button>
      </div>

      {/* Profile info */}
      <div className="px-4 -mt-14 relative z-10 mb-5">
        <div className="flex items-end justify-between mb-4">
          <div className="w-24 h-24 rounded-full border-4 border-white bg-white shadow-lg overflow-hidden flex-shrink-0">
            <Avatar name={worker.name} photo={worker.profilePhoto} size={96} />
          </div>
          {worker.isVerified && (
            <span className="flex items-center gap-1.5 bg-[#F0FDF4] border border-[#BBF7D0] text-[#16A34A] text-xs font-bold px-3 py-1.5 rounded-full">
              <ShieldIcon size={13}/> Aadhaar Verified
            </span>
          )}
        </div>
        <h1 className="font-black text-2xl text-[#0F172A] mb-1">{worker.name}</h1>
        <div className="flex items-center gap-3 text-sm text-[#64748B] mb-3">
          {rating && <span className="flex items-center gap-1 text-amber-500 font-bold"><StarIcon size={14} fill="#F59E0B"/> {rating} ({worker.totalReviews || 0})</span>}
          <span className="flex items-center gap-1"><MapPinIcon size={13}/> {worker.area || "—"}</span>
        </div>
        {/* Skills */}
        <div className="flex flex-wrap gap-2 mb-4">
          {skills.map(s => (
            <span key={s.id} className="flex items-center gap-1 bg-[#FFF7ED] border border-[#FED7AA] text-[#C2410C] text-xs font-bold px-3 py-1 rounded-full">
              {s.icon} {s.label}
            </span>
          ))}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon:<WorkIcon size={16}/>, val: worker.completedJobs || 0, label:"Jobs Done" },
            { icon:<ClockIcon size={16}/>, val: worker.experience || "—",  label:"Experience" },
            { icon:<StarIcon size={16}/>,  val: badge.icon+" "+badge.label, label:"Badge" },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-[#E2E8F0] p-3 text-center">
              <div className="text-[#94A3B8] flex justify-center mb-1.5">{s.icon}</div>
              <p className="font-black text-[#0F172A] text-sm">{s.val}</p>
              <p className="text-[10px] text-[#94A3B8] mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 space-y-4">
        {/* Rate */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#64748B]">Hourly Rate</span>
            <span className="font-black text-2xl text-[#F97316]">{formatCurrency(worker.ratePerHour || 0)}<span className="text-sm text-[#94A3B8] font-normal">/hr</span></span>
          </div>
        </div>

        {/* About */}
        {worker.bio && (
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4">
            <h3 className="font-bold text-[#0F172A] mb-2">About</h3>
            <p className="text-sm text-[#64748B] leading-relaxed">{worker.bio}</p>
          </div>
        )}

        {/* Reviews */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4">
          <h3 className="font-bold text-[#0F172A] mb-4">Reviews ({reviews.length})</h3>
          {reviews.length === 0 ? (
            <p className="text-sm text-[#94A3B8] text-center py-4">No reviews yet — be the first to book!</p>
          ) : (
            <div className="space-y-4">
              {reviews.slice(0,5).map((r, i) => (
                <div key={i} className="border-b border-[#F1F5F9] pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[#F1F5F9] flex items-center justify-center text-xs font-bold text-[#64748B]">
                        {r.clientName?.[0] || "C"}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#0F172A]">{r.clientName || "Client"}</p>
                        <div className="flex gap-0.5 mt-0.5">
                          {[1,2,3,4,5].map(s => <StarIcon key={s} size={10} fill={r.rating >= s ? "#F59E0B" : "none"} className={r.rating >= s ? "text-amber-400" : "text-[#E2E8F0]"}/>)}
                        </div>
                      </div>
                    </div>
                  </div>
                  {r.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {r.tags.map(t => <span key={t} className="text-[10px] bg-[#F8FAFC] border border-[#E2E8F0] text-[#64748B] px-2 py-0.5 rounded-full">{t}</span>)}
                    </div>
                  )}
                  {r.comment && <p className="text-xs text-[#64748B] leading-relaxed">{r.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sticky Book Now */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-t border-[#E2E8F0] px-4 py-4">
        <div className="flex items-center justify-between max-w-sm mx-auto">
          <div>
            <p className="text-xs text-[#94A3B8]">Starting from</p>
            <p className="font-black text-[#0F172A] text-xl">{formatCurrency(worker.ratePerHour || 0)}<span className="text-xs text-[#94A3B8] font-normal">/hr</span></p>
          </div>
          <Link href={user ? `/booking/${workerId}` : "/login"}
            className="bg-[#0F172A] text-white px-8 py-3.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-[#1E293B] active:scale-95 transition-all">
            Book Now <ArrowRightIcon size={16}/>
          </Link>
        </div>
      </div>
    </div>
  );
}
