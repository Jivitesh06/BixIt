"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { getWorkerProfile, getWorkerReviews } from "@/lib/firestore";
import { SERVICE_CATEGORIES } from "@/lib/constants";
import { getWorkerBadge, formatCurrency, timeAgo } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

function StarRow({ rating, size = 16 }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(s => (
        <span key={s} className="material-symbols-outlined"
          style={{ fontSize: size, color: s <= Math.round(rating) ? "#f59e0b" : "#e0e3e5" }}>
          star
        </span>
      ))}
    </div>
  );
}

export default function WorkerProfilePage() {
  const { workerId } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [worker, setWorker] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [w, r] = await Promise.all([
        getWorkerProfile(workerId),
        getWorkerReviews(workerId),
      ]);
      setWorker(w);
      setReviews(r);
      setLoading(false);
    }
    load();
  }, [workerId]);

  if (loading) return (
    <div className="min-h-screen bg-[#f7f9fb] flex items-center justify-center">
      <div className="animate-spin w-10 h-10 rounded-full border-4 border-[#131b2e] border-t-transparent" />
    </div>
  );

  if (!worker) return (
    <div className="min-h-screen bg-[#f7f9fb] flex flex-col items-center justify-center gap-4">
      <span className="material-symbols-outlined text-[#c6c6cd]" style={{ fontSize: 64 }}>person_off</span>
      <p className="font-headline font-bold text-[#0F172A]">Worker not found</p>
      <button onClick={() => router.back()} className="text-[#F97316] font-bold">← Go back</button>
    </div>
  );

  const badge = getWorkerBadge(worker.completedJobs || 0);

  return (
    <div className="min-h-screen bg-[#f7f9fb] pb-28">
      {/* Cover */}
      <div className="h-48 bg-gradient-to-br from-[#131b2e] to-[#1e3560] relative">
        <button onClick={() => router.back()} className="absolute top-5 left-5 w-9 h-9 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-white hover:bg-white/30 transition-colors z-10">
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_back</span>
        </button>
        {/* Decorative */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#fd761a]/10 rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none" />
      </div>

      {/* Profile photo */}
      <div className="px-5">
        <div className="relative -mt-14 mb-4">
          <div className="w-28 h-28 rounded-3xl bg-[#f2f4f6] border-4 border-white shadow-lg overflow-hidden flex items-center justify-center">
            {worker.profilePhoto
              ? <img src={worker.profilePhoto} alt={worker.name} className="w-full h-full object-cover" />
              : <span className="material-symbols-outlined text-[#76777d]" style={{ fontSize: 40 }}>person</span>
            }
          </div>
          {worker.isVerified && (
            <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
              <span className="material-symbols-outlined" style={{ fontSize: 10 }}>verified</span> Verified
            </div>
          )}
        </div>

        {/* Name + info */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <h1 className="font-headline font-bold text-2xl text-[#0F172A]">{worker.name}</h1>
            {worker.aadhaarStatus === "verified" && (
              <div className="flex items-center gap-1 mt-0.5">
                <span className="material-symbols-outlined text-green-500" style={{ fontSize: 14 }}>verified_user</span>
                <span className="text-xs font-bold text-green-600">Aadhaar Verified</span>
              </div>
            )}
          </div>
          <div className="text-right">
            <p className="font-headline font-bold text-xl text-[#F97316]">{formatCurrency(worker.ratePerHour || 0)}</p>
            <p className="text-[10px] text-[#76777d]">per hour</p>
          </div>
        </div>

        {/* Skill chips */}
        <div className="flex flex-wrap gap-2 mb-3">
          {(worker.skills || []).map(s => {
            const cat = SERVICE_CATEGORIES.find(c => c.id === s);
            return cat ? (
              <span key={s} className="flex items-center gap-1 bg-[#fd761a]/10 text-[#9d4300] text-xs font-bold px-3 py-1 rounded-full">
                <span>{cat.icon}</span> {cat.label}
              </span>
            ) : null;
          })}
        </div>

        {/* Rating row */}
        <div className="flex items-center gap-3 mb-3">
          <StarRow rating={worker.averageRating || 0} />
          <span className="font-bold text-[#0F172A] text-sm">{worker.averageRating?.toFixed(1) || "—"}</span>
          <span className="text-xs text-[#76777d]">({worker.totalReviews || 0} reviews)</span>
        </div>

        {/* Badge + area */}
        <div className="flex items-center gap-3 mb-5">
          <span className="text-xs font-bold bg-[#f2f4f6] text-[#45464d] px-3 py-1.5 rounded-full">{badge.icon} {badge.label}</span>
          <div className="flex items-center gap-1 text-xs text-[#45464d]">
            <span className="material-symbols-outlined" style={{ fontSize: 13 }}>location_on</span>
            {worker.area}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { val: worker.completedJobs || 0, label: "Jobs Done", icon: "work" },
            { val: worker.experience || "—", label: "Experience", icon: "schedule" },
            { val: "95%", label: "Response Rate", icon: "bolt" },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-3 text-center shadow-sm border border-[#f2f4f6]">
              <span className="material-symbols-outlined text-[#fd761a] mb-1 block" style={{ fontSize: 20 }}>{s.icon}</span>
              <p className="font-headline font-bold text-[#0F172A] text-lg leading-tight">{s.val}</p>
              <p className="text-[10px] text-[#76777d] uppercase tracking-wide">{s.label}</p>
            </div>
          ))}
        </div>

        {/* About */}
        {worker.bio && (
          <div className="mb-6">
            <h2 className="font-headline font-bold text-base text-[#0F172A] mb-2">About</h2>
            <p className="text-sm text-[#45464d] leading-relaxed">{worker.bio}</p>
          </div>
        )}

        {/* Reviews */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-headline font-bold text-base text-[#0F172A]">Client Reviews</h2>
            <span className="text-xs text-[#76777d]">{reviews.length} total</span>
          </div>

          {reviews.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 text-center border border-[#f2f4f6]">
              <span className="material-symbols-outlined text-[#c6c6cd] block mb-2" style={{ fontSize: 40 }}>rate_review</span>
              <p className="text-sm text-[#45464d]">No reviews yet</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {reviews.slice(0, 5).map(r => (
                <div key={r.id} className="bg-white rounded-2xl p-4 shadow-sm border border-[#f2f4f6]">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#f2f4f6] flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-[#76777d]" style={{ fontSize: 20 }}>person</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <StarRow rating={r.rating} size={13} />
                        <span className="text-[10px] text-[#76777d]">{timeAgo(r.createdAt)}</span>
                      </div>
                      {r.comment && <p className="text-xs text-[#45464d] mt-1.5 leading-relaxed">{r.comment}</p>}
                      {(r.tags || []).length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {r.tags.map(tag => (
                            <span key={tag} className="text-[9px] font-bold bg-green-50 text-green-700 px-2 py-0.5 rounded-full">{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Fixed book button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-[#f2f4f6] shadow-[0_-4px_20px_rgba(15,23,42,0.08)]">
        <Link href={`/booking/${workerId}`}
          className="block w-full bg-[#131b2e] text-white py-4 rounded-2xl font-headline font-bold text-base text-center hover:bg-[#1e2a45] active:scale-[0.98] transition-all">
          Book Now →
        </Link>
      </div>
    </div>
  );
}
