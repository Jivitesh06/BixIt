"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { getClientProfile, getWorkersByCategory } from "@/lib/firestore";
import { SERVICE_CATEGORIES } from "@/lib/constants";
import { getWorkerBadge, formatCurrency } from "@/lib/utils";
import { INDIAN_CITIES } from "@/components/CityAutocomplete";
import BottomNav from "@/components/BottomNav";
import {
  SearchIcon, BellIcon, UserIcon, LogOutIcon, MapPinIcon,
  StarIcon, ChevronDownIcon, XIcon, CheckIcon, AlertCircleIcon, ArrowRightIcon
} from "@/components/Icons";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function Avatar({ name = "", photo, size = 44 }) {
  const initials = name.split(" ").map(w => w[0]).join("").slice(0,2).toUpperCase();
  const colors = ["#7C3AED","#0891B2","#059669","#DC2626","#D97706","#2563EB"];
  const color  = colors[name.charCodeAt(0) % colors.length] || "#7C3AED";
  if (photo) return <img src={photo} alt={name} className="w-full h-full object-cover" style={{ borderRadius: "50%" }} />;
  return (
    <div style={{ width: size, height: size, background: color, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <span style={{ color: "white", fontWeight: 800, fontSize: size * 0.36 }}>{initials || "U"}</span>
    </div>
  );
}

function ProfileMenu({ name, onLogout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  useEffect(() => {
    const fn = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E2E8F0] rounded-full pl-2 pr-3 py-1.5 transition-colors">
        <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 bg-[#E2E8F0]">
          <Avatar name={name} size={28} />
        </div>
        <span className="text-xs font-semibold text-[#374151] hidden sm:block max-w-[80px] truncate">{name?.split(" ")[0]}</span>
        <ChevronDownIcon size={14}/>
      </button>
      {open && (
        <div className="absolute right-0 top-12 z-50 bg-white border border-[#E2E8F0] rounded-2xl shadow-xl py-1.5 w-44 overflow-hidden">
          <Link href="/client/profile" onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#374151] hover:bg-[#F8FAFC] transition-colors">
            <UserIcon size={15}/> My Profile
          </Link>
          <div className="h-px bg-[#F1F5F9] mx-3 my-1" />
          <button onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#EF4444] hover:bg-[#FEF2F2] transition-colors">
            <LogOutIcon size={15}/> Sign out
          </button>
        </div>
      )}
    </div>
  );
}

function CityModal({ current, onSelect, onClose }) {
  const [q, setQ] = useState("");
  const filtered = INDIAN_CITIES.filter(c => !q || c.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="bg-white w-full sm:w-96 rounded-t-3xl sm:rounded-2xl shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#F1F5F9]">
          <h3 className="font-bold text-[#0F172A]">Select City</h3>
          <button onClick={onClose} className="text-[#94A3B8] hover:text-[#0F172A]"><XIcon size={20}/></button>
        </div>
        <div className="px-5 py-3 border-b border-[#F1F5F9]">
          <div className="flex items-center bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3 py-2.5">
            <SearchIcon size={16}/><input value={q} onChange={e => setQ(e.target.value)} placeholder="Search city…"
              className="ml-2 flex-1 bg-transparent text-sm outline-none" autoFocus />
          </div>
        </div>
        <div className="max-h-72 overflow-y-auto py-2">
          {filtered.map(city => (
            <button key={city} onClick={() => { onSelect(city); onClose(); }}
              className={`w-full flex items-center justify-between px-5 py-3 text-sm hover:bg-[#FFF7ED] hover:text-[#F97316] transition-colors ${city === current ? "text-[#F97316] font-semibold" : "text-[#374151]"}`}>
              <div className="flex items-center gap-3"><MapPinIcon size={14}/>{city}</div>
              {city === current && <CheckIcon size={14}/>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function WorkerCard({ worker }) {
  const badge = getWorkerBadge(worker.completedJobs || 0);
  const name  = worker.name || "Worker";
  const cat   = SERVICE_CATEGORIES.find(c => c.id === (worker.skills || [])[0]);
  const rating = worker.averageRating?.toFixed(1) || null;

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
      <div className="flex gap-3 mb-4">
        <div className="relative flex-shrink-0">
          <div className="w-14 h-14 rounded-2xl overflow-hidden bg-[#F1F5F9] flex items-center justify-center">
            <Avatar name={name} photo={worker.profilePhoto} size={56} />
          </div>
          {worker.isVerified && (
            <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#22C55E] rounded-full flex items-center justify-center border-2 border-white">
              <CheckIcon size={10}/>
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-1">
            <p className="font-bold text-[#0F172A] text-sm truncate">{name}</p>
            <p className="text-[#F97316] font-bold text-sm flex-shrink-0">{formatCurrency(worker.ratePerHour || 0)}<span className="text-[10px] font-normal text-[#94A3B8]">/hr</span></p>
          </div>
          {cat && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-[#FFF7ED] text-[#F97316] px-2 py-0.5 rounded-full mt-1">
              {cat.icon} {cat.label}
            </span>
          )}
          <div className="flex items-center gap-3 mt-1.5 text-[11px] text-[#64748B]">
            {rating ? (
              <span className="flex items-center gap-0.5 text-amber-500 font-bold">
                <StarIcon size={11} fill="#F59E0B"/> {rating}
                <span className="text-[#94A3B8] font-normal ml-0.5">({worker.totalReviews || 0})</span>
              </span>
            ) : <span className="text-[#94A3B8]">New</span>}
            <span className="flex items-center gap-0.5">
              <MapPinIcon size={11}/> {worker.area || "—"}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3 text-[10px]">
        <span className="bg-[#F8FAFC] border border-[#E2E8F0] text-[#64748B] px-2.5 py-1 rounded-full font-semibold">{badge.icon} {badge.label}</span>
        <span className="text-[#94A3B8]">{worker.completedJobs || 0} jobs done</span>
      </div>

      <div className="flex gap-2">
        <Link href={`/worker-profile/${worker.id}`}
          className="flex-1 py-2.5 rounded-xl border border-[#E2E8F0] text-xs font-bold text-[#374151] text-center hover:border-[#0F172A] transition-colors">
          View Profile
        </Link>
        <Link href={`/booking/${worker.id}`}
          className="flex-1 py-2.5 rounded-xl bg-[#0F172A] text-xs font-bold text-white text-center hover:bg-[#1E293B] active:scale-95 transition-all">
          Book Now
        </Link>
      </div>
    </div>
  );
}

export default function ClientDashboard() {
  const router = useRouter();
  const { user, userRole, loading: authLoading } = useAuth();
  const [profile, setProfile]   = useState(null);
  const [workers, setWorkers]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [cat, setCat]           = useState("all");
  const [search, setSearch]     = useState("");
  const [city, setCity]         = useState("");
  const [cityModal, setCityModal] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
    if (!authLoading && user && userRole === "worker") router.replace("/worker/dashboard");
  }, [user, userRole, authLoading]);

  useEffect(() => {
    if (!user) return;
    getClientProfile(user.uid).then(p => { setProfile(p); if (p?.area) setCity(p.area); });
    fetchWorkers("all");
  }, [user]);

  async function fetchWorkers(category) {
    setLoading(true);
    const list = await getWorkersByCategory(category);
    setWorkers(list);
    setLoading(false);
  }

  useEffect(() => { fetchWorkers(cat); }, [cat]);

  async function handleLogout() {
    await signOut(auth);
    router.push("/");
  }

  const filtered = workers.filter(w => !search
    || w.name?.toLowerCase().includes(search.toLowerCase())
    || (w.skills || []).some(s => s.includes(search.toLowerCase())));

  if (authLoading) return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
      <div className="animate-spin w-10 h-10 rounded-full border-4 border-[#0F172A] border-t-transparent" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      {cityModal && <CityModal current={city} onSelect={setCity} onClose={() => setCityModal(false)} />}

      {/* Top bar */}
      <div className="bg-white border-b border-[#F1F5F9] px-4 pt-4 pb-3 sticky top-0 z-40">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs text-[#94A3B8] font-medium">{greeting()},</p>
            <h1 className="font-bold text-lg text-[#0F172A]">{profile?.name?.split(" ")[0] || "there"} 👋</h1>
          </div>
          <div className="flex items-center gap-2">
            <button className="w-9 h-9 rounded-full bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:border-[#CBD5E1] transition-colors relative">
              <BellIcon size={18}/>
            </button>
            <ProfileMenu name={profile?.name || user?.email || "User"} onLogout={handleLogout} />
          </div>
        </div>

        {/* Location chip */}
        <button onClick={() => setCityModal(true)}
          className="flex items-center gap-1.5 bg-[#FFF7ED] border border-[#FED7AA] text-[#C2410C] px-3 py-1.5 rounded-full text-xs font-semibold hover:bg-[#FFEDD5] transition-colors mb-3">
          <MapPinIcon size={13}/> {city || "Select city"} <ChevronDownIcon size={13}/>
        </button>

        {/* Search */}
        <div className="flex items-center gap-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-3">
          <SearchIcon size={16}/><span className="text-[#94A3B8]"></span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search services or workers…"
            className="flex-1 bg-transparent text-sm text-[#0F172A] outline-none placeholder:text-[#94A3B8]" />
          {search && <button onClick={() => setSearch("")} className="text-[#94A3B8]"><XIcon size={16}/></button>}
        </div>
      </div>

      {/* Category chips */}
      <div className="flex gap-2 px-4 py-4 overflow-x-auto scrollbar-hide">
        <button onClick={() => setCat("all")}
          className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all ${cat === "all" ? "bg-[#0F172A] text-white" : "bg-white border border-[#E2E8F0] text-[#374151] hover:border-[#0F172A]"}`}>
          All
        </button>
        {SERVICE_CATEGORIES.map(c => (
          <button key={c.id} onClick={() => setCat(c.id)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all ${cat === c.id ? "bg-[#F97316] text-white" : "bg-white border border-[#E2E8F0] text-[#374151] hover:border-[#F97316]"}`}>
            <span>{c.icon}</span>{c.label}
          </button>
        ))}
      </div>

      <div className="px-4">
        {/* Promo card */}
        <div className="bg-[#0F172A] rounded-2xl p-5 mb-5 relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-[#F97316]/10 rounded-full pointer-events-none" />
          <div className="absolute right-4 bottom-3 w-14 h-14 bg-white/5 rounded-full pointer-events-none" />
          <div className="relative">
            <span className="text-[10px] font-bold text-[#F97316] uppercase tracking-widest">Limited Offer</span>
            <h3 className="font-bold text-white text-xl mt-1">₹100 off your first booking</h3>
            <p className="text-[#64748B] text-xs mt-1 mb-3">Code valid for first-time users only</p>
            <span className="bg-[#F97316] text-white text-xs font-bold px-3 py-1.5 rounded-full">BIXIT100</span>
          </div>
        </div>

        {/* Workers */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-[#0F172A]">Top rated near you</h2>
          {!loading && <span className="text-xs text-[#94A3B8]">{filtered.length} workers</span>}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="bg-white rounded-2xl h-36 animate-pulse border border-[#F1F5F9]" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <p className="font-bold text-[#0F172A] mb-1">No workers in your area yet</p>
            <p className="text-sm text-[#64748B]">We're growing! Check back soon.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(w => <WorkerCard key={w.id} worker={w} />)}
          </div>
        )}
      </div>

      <BottomNav role="client" />
    </div>
  );
}
