"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getClientProfile, getWorkersByCategory } from "@/lib/firestore";
import { SERVICE_CATEGORIES, TRANSLATIONS } from "@/lib/constants";
import { getWorkerBadge, formatCurrency } from "@/lib/utils";
import BottomNav from "@/components/BottomNav";

function WorkerCard({ worker }) {
  const badge = getWorkerBadge(worker.completedJobs || 0);
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#f2f4f6] p-4 hover:shadow-md transition-shadow duration-200">
      <div className="flex gap-3 mb-3">
        <div className="relative flex-shrink-0">
          <div className="w-14 h-14 rounded-2xl bg-[#f2f4f6] overflow-hidden flex items-center justify-center">
            {worker.profilePhoto
              ? <img src={worker.profilePhoto} alt={worker.name} className="w-full h-full object-cover" />
              : <span className="material-symbols-outlined text-[#76777d]" style={{ fontSize: 28 }}>person</span>
            }
          </div>
          {worker.isVerified && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined text-white" style={{ fontSize: 12 }}>check</span>
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="font-headline font-bold text-[#0F172A] text-sm truncate">{worker.name}</h3>
          </div>
          <div className="flex flex-wrap gap-1 mt-1">
            {(worker.skills || []).slice(0, 2).map(s => {
              const cat = SERVICE_CATEGORIES.find(c => c.id === s);
              return cat ? (
                <span key={s} className="text-[9px] font-bold bg-[#fd761a]/10 text-[#9d4300] px-2 py-0.5 rounded-full">
                  {cat.label}
                </span>
              ) : null;
            })}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="flex items-center text-xs text-amber-500 font-bold">
              <span className="material-symbols-outlined" style={{ fontSize: 12, marginRight: 2 }}>star</span>
              {worker.averageRating?.toFixed(1) || "New"}
            </span>
            <span className="text-[10px] text-[#76777d]">({worker.totalReviews || 0})</span>
            <span className="text-[10px] text-[#76777d]">· {worker.experience || "—"}</span>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-[#F97316] font-bold text-sm">{formatCurrency(worker.ratePerHour || 0)}/hr</p>
          <p className="text-[10px] text-[#76777d] mt-0.5 flex items-center justify-end gap-0.5">
            <span className="material-symbols-outlined" style={{ fontSize: 11 }}>location_on</span>
            {worker.area}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] bg-[#f2f4f6] text-[#45464d] px-2 py-1 rounded-full font-bold">
          {badge.icon} {badge.label}
        </span>
        <span className="text-[10px] text-[#76777d]">{worker.completedJobs || 0} jobs done</span>
      </div>

      <div className="flex gap-2">
        <Link href={`/worker-profile/${worker.id}`}
          className="flex-1 py-2.5 rounded-xl border border-[#e0e3e5] text-xs font-bold text-[#0F172A] text-center hover:border-[#131b2e] transition-colors">
          Details
        </Link>
        <Link href={`/booking/${worker.id}`}
          className="flex-1 py-2.5 rounded-xl bg-[#131b2e] text-xs font-bold text-white text-center hover:bg-[#1e2a45] transition-colors">
          Book Now
        </Link>
      </div>
    </div>
  );
}

export default function ClientDashboard() {
  const router = useRouter();
  const { user, userRole, loading: authLoading } = useAuth();
  const [profile, setProfile]     = useState(null);
  const [workers, setWorkers]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [selectedCat, setSelectedCat] = useState("all");
  const [search, setSearch]       = useState("");
  const [lang, setLang]           = useState("en");
  const t = TRANSLATIONS[lang];

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
    if (!authLoading && user && userRole === "worker") router.replace("/worker/dashboard");
  }, [user, userRole, authLoading]);

  useEffect(() => {
    if (!user) return;
    async function load() {
      const [prof, workerList] = await Promise.all([
        getClientProfile(user.uid),
        getWorkersByCategory("all"),
      ]);
      setProfile(prof);
      setWorkers(workerList);
      setLoading(false);
    }
    load();
  }, [user]);

  useEffect(() => {
    async function fetchWorkers() {
      setLoading(true);
      const list = await getWorkersByCategory(selectedCat);
      setWorkers(list);
      setLoading(false);
    }
    fetchWorkers();
  }, [selectedCat]);

  const filtered = workers.filter(w =>
    !search || w.name?.toLowerCase().includes(search.toLowerCase()) ||
    (w.skills || []).some(s => s.includes(search.toLowerCase()))
  );

  if (authLoading) return (
    <div className="min-h-screen bg-[#f7f9fb] flex items-center justify-center">
      <div className="animate-spin w-10 h-10 rounded-full border-3 border-[#131b2e] border-t-transparent" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f7f9fb] pb-24">
      {/* Top Bar */}
      <div className="bg-white px-5 pt-5 pb-4 border-b border-[#f2f4f6]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-[#76777d] font-medium uppercase tracking-wider">Welcome back</p>
            <h1 className="font-headline font-bold text-xl text-[#0F172A]">
              Hello {profile?.name?.split(" ")[0] || "there"} 👋
            </h1>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="material-symbols-outlined text-[#F97316]" style={{ fontSize: 13 }}>location_on</span>
              <span className="text-xs text-[#45464d]">{profile?.area || "Set your location"}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setLang(l => l === "en" ? "hi" : "en")} className="text-xs font-bold text-[#0F172A] hover:text-[#F97316] px-2 py-1 rounded-lg bg-[#f2f4f6] transition-colors">
              {lang === "en" ? "EN | हिं" : "हिं | EN"}
            </button>
            <button className="w-9 h-9 rounded-xl bg-[#f2f4f6] flex items-center justify-center hover:bg-[#fd761a]/10 transition-colors">
              <span className="material-symbols-outlined text-[#0F172A]" style={{ fontSize: 20 }}>notifications</span>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 bg-[#f2f4f6] rounded-xl px-4 py-3">
          <span className="material-symbols-outlined text-[#76777d]" style={{ fontSize: 20 }}>search</span>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder={t.searchPlaceholder || "Search services or workers…"}
            className="flex-1 bg-transparent text-sm text-[#0F172A] outline-none placeholder:text-[#76777d]"
          />
          {search && (
            <button onClick={() => setSearch("")} className="text-[#76777d] hover:text-[#0F172A]">
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
            </button>
          )}
        </div>
      </div>

      {/* Category Chips */}
      <div className="flex gap-2 px-5 py-4 overflow-x-auto scrollbar-hide">
        <button onClick={() => setSelectedCat("all")}
          className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all duration-150 ${selectedCat === "all" ? "bg-[#131b2e] text-white" : "bg-white border border-[#e0e3e5] text-[#45464d] hover:border-[#131b2e]"}`}
        >
          All Services
        </button>
        {SERVICE_CATEGORIES.map(cat => (
          <button key={cat.id} onClick={() => setSelectedCat(cat.id)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all duration-150 ${selectedCat === cat.id ? "bg-[#fd761a] text-white" : "bg-white border border-[#e0e3e5] text-[#45464d] hover:border-[#fd761a]"}`}
          >
            <span>{cat.icon}</span> {cat.label}
          </button>
        ))}
      </div>

      <div className="px-5">
        {/* Promo Banner */}
        <div className="bg-[#131b2e] rounded-2xl p-5 mb-6 relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-28 h-28 bg-[#fd761a]/15 rounded-full pointer-events-none" />
          <div className="absolute right-4 bottom-2 w-16 h-16 bg-white/5 rounded-full pointer-events-none" />
          <div className="relative z-10">
            <p className="text-[10px] font-bold text-[#fd761a] uppercase tracking-widest mb-1">Limited Offer</p>
            <h3 className="font-headline font-bold text-white text-lg mb-0.5">Get ₹100 off</h3>
            <p className="text-[#7c839b] text-xs mb-3">On your first booking with any verified worker.</p>
            <span className="bg-[#fd761a] text-white text-xs font-bold px-3 py-1.5 rounded-full">Use: BIXIT100</span>
          </div>
        </div>

        {/* Workers Section */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-headline font-bold text-lg text-[#0F172A]">{t.topRated || "Top Rated Near You"}</h2>
          {!loading && <span className="text-xs text-[#76777d]">{filtered.length} workers</span>}
        </div>

        {loading ? (
          <div className="flex flex-col gap-4">
            {[1,2,3].map(i => (
              <div key={i} className="bg-white rounded-2xl h-32 animate-pulse border border-[#f2f4f6]" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <span className="material-symbols-outlined text-[#c6c6cd] mb-3 block" style={{ fontSize: 56 }}>search_off</span>
            <p className="font-headline font-bold text-[#0F172A] mb-1">No workers found</p>
            <p className="text-sm text-[#45464d]">Try a different category or search term</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map(w => <WorkerCard key={w.id} worker={w} />)}
          </div>
        )}
      </div>

      <BottomNav role="client" />
    </div>
  );
}
