"use client";

import { getWorkerBadge, formatCurrency } from "@/lib/utils";
import { SERVICE_CATEGORIES } from "@/lib/constants";
import { StarIcon, MapPinIcon, CheckIcon } from "@/components/Icons";

function Avatar({ name = "", photo, size = 56 }) {
  const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const palette  = ["#7C3AED","#0891B2","#059669","#DC2626","#D97706","#2563EB"];
  const bg       = palette[(name.charCodeAt(0) || 0) % palette.length];
  if (photo) return <img src={photo} alt={name} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover" }} />;
  return (
    <div style={{ width: size, height: size, background: bg, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <span style={{ color: "white", fontWeight: 800, fontSize: size * 0.34 }}>{initials || "W"}</span>
    </div>
  );
}

export default function WorkerCard({ worker, onBook, onView }) {
  const badge  = getWorkerBadge(worker.completedJobs || 0);
  const name   = worker.name || "Worker";
  const cat    = SERVICE_CATEGORIES.find(c => c.id === (worker.skills || [])[0]);
  const rating = worker.averageRating?.toFixed(1) || null;

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200">
      {/* Top row */}
      <div className="flex gap-3 mb-3">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div className="w-14 h-14 rounded-2xl overflow-hidden bg-[#F1F5F9] flex items-center justify-center">
            <Avatar name={name} photo={worker.profilePhoto} size={56} />
          </div>
          {worker.isVerified && (
            <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#22C55E] rounded-full flex items-center justify-center border-2 border-white">
              <CheckIcon size={10} />
            </span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-1">
            <p className="font-bold text-[#0F172A] text-sm truncate">{name}</p>
            <p className="text-[#F97316] font-black text-sm flex-shrink-0">
              {formatCurrency(worker.ratePerHour || 0)}
              <span className="text-[10px] font-normal text-[#94A3B8]">/hr</span>
            </p>
          </div>

          {cat && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-[#FFF7ED] text-[#F97316] px-2 py-0.5 rounded-full mt-0.5">
              {cat.icon} {cat.label}
            </span>
          )}

          <div className="flex items-center gap-3 mt-1.5 text-[11px] text-[#64748B]">
            {rating ? (
              <span className="flex items-center gap-0.5 text-amber-500 font-bold">
                <StarIcon size={11} fill="#F59E0B" />
                {rating}
                <span className="text-[#94A3B8] font-normal ml-0.5">({worker.totalReviews || 0})</span>
              </span>
            ) : (
              <span className="text-[#94A3B8]">New</span>
            )}
            <span className="flex items-center gap-0.5">
              <MapPinIcon size={11} /> {worker.area || "—"}
            </span>
          </div>
        </div>
      </div>

      {/* Badge + jobs row */}
      <div className="flex items-center justify-between mb-3 text-[10px]">
        <span className="bg-[#F8FAFC] border border-[#E2E8F0] text-[#64748B] px-2.5 py-1 rounded-full font-semibold">
          {badge.icon} {badge.label}
        </span>
        {worker.experience && (
          <span className="text-[#94A3B8]">{worker.experience} exp.</span>
        )}
        <span className="text-[#94A3B8]">{worker.completedJobs || 0} jobs</span>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={onView}
          className="flex-1 py-2.5 rounded-xl border border-[#E2E8F0] text-xs font-bold text-[#374151] text-center hover:border-[#0F172A] hover:text-[#0F172A] transition-colors"
        >
          View Profile
        </button>
        <button
          onClick={onBook}
          className="flex-1 py-2.5 rounded-xl bg-[#0F172A] text-xs font-bold text-white text-center hover:bg-[#1E293B] active:scale-95 transition-all"
        >
          Book Now
        </button>
      </div>
    </div>
  );
}
