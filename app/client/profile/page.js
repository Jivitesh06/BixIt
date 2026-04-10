"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { getClientProfile, updateClientProfile, getClientBookings } from "@/lib/firestore";
import { SERVICE_CATEGORIES } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import BottomNav from "@/components/BottomNav";
import LocationPicker from "@/components/LocationPicker";
import {
  UserIcon, MailIcon, PhoneIcon, LogOutIcon,
  CalendarIcon, CheckIcon, EditIcon, ArrowRightIcon, Spinner, AlertCircleIcon
} from "@/components/Icons";

function Avatar({ name = "", photo, size = 80 }) {
  const initials = name.split(" ").map(w => w[0]).join("").slice(0,2).toUpperCase();
  const colors = ["#7C3AED","#0891B2","#059669","#DC2626","#D97706","#2563EB"];
  const color  = colors[(name.charCodeAt(0)||0) % colors.length];
  if (photo) return <img src={photo} alt={name} style={{ width:size, height:size, borderRadius:"50%", objectFit:"cover" }} />;
  return (
    <div style={{ width:size, height:size, background:color, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <span style={{ color:"white", fontWeight:800, fontSize:size*0.34 }}>{initials||"U"}</span>
    </div>
  );
}

function StatCard({ value, label, icon }) {
  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 text-center">
      <div className="text-2xl mb-1">{icon}</div>
      <p className="font-black text-[#0F172A] text-xl">{value}</p>
      <p className="text-[10px] text-[#94A3B8] mt-0.5 font-medium">{label}</p>
    </div>
  );
}

export default function ClientProfile() {
  const router  = useRouter();
  const { user, userRole, loading: authLoading } = useAuth();
  const [profile,  setProfile]  = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [toast,    setToast]    = useState("");
  const [error,    setError]    = useState("");
  const [editing,  setEditing]  = useState(false);

  // Editable
  const [name,  setName]  = useState("");
  const [phone, setPhone] = useState("");
  const [city,  setCity]  = useState("");

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
    if (!authLoading && user && userRole === "worker") router.replace("/worker/dashboard");
  }, [user, userRole, authLoading]);

  useEffect(() => {
    if (!user) return;
    Promise.all([getClientProfile(user.uid), getClientBookings(user.uid)])
      .then(([p, b]) => {
        setProfile(p); setBookings(b);
        setName(p?.name || ""); setPhone(p?.phone || ""); setCity(p?.area || "");
        setLoading(false);
      });
  }, [user]);

  async function handleSave() {
    setError(""); setSaving(true);
    try {
      await updateClientProfile(user.uid, { name, phone, area: city });
      setProfile(prev => ({ ...prev, name, phone, area: city }));
      setToast("Profile saved ✓"); setTimeout(() => setToast(""), 3000);
      setEditing(false);
    } catch { setError("Failed to save. Please try again."); }
    finally { setSaving(false); }
  }

  async function handleLogout() {
    await signOut(auth);
    router.push("/");
  }

  const completed  = bookings.filter(b => b.status === "completed").length;
  const memberSince = profile?.createdAt?.toDate
    ? profile.createdAt.toDate().toLocaleDateString("en-IN", { month:"short", year:"numeric" })
    : "—";

  if (authLoading || loading) return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
      <div className="animate-spin w-10 h-10 rounded-full border-4 border-[#0F172A] border-t-transparent"/>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] bg-[#0F172A] text-white text-sm font-semibold px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2">
          <CheckIcon size={14}/>{toast}
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-[#E2E8F0] px-4 py-4 sticky top-0 z-40 flex items-center justify-between">
        <h1 className="font-black text-xl text-[#0F172A]">My Profile</h1>
        <button onClick={() => setEditing(e => !e)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold border transition-all ${editing ? "bg-[#F97316] text-white border-[#F97316]" : "bg-[#F8FAFC] text-[#374151] border-[#E2E8F0] hover:border-[#F97316]"}`}>
          <EditIcon size={14}/>{editing ? "Cancel" : "Edit"}
        </button>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-5">
        {/* Avatar block */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 flex flex-col items-center text-center">
          <div className="mb-4"><Avatar name={profile?.name || ""} size={80}/></div>
          {editing ? (
            <div className="w-full">
              <label className="block text-xs font-semibold text-[#374151] uppercase tracking-wide mb-1.5">Full Name</label>
              <div className="flex items-center bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl focus-within:border-[#F97316] focus-within:ring-2 focus-within:ring-[#F97316]/10 transition-all mb-3">
                <span className="pl-4 text-[#94A3B8]"><UserIcon size={16}/></span>
                <input value={name} onChange={e => setName(e.target.value)} className="flex-1 px-3 py-3 bg-transparent text-sm text-[#0F172A] outline-none" />
              </div>
            </div>
          ) : (
            <>
              <h2 className="font-black text-[#0F172A] text-xl mb-1">{profile?.name || "—"}</h2>
              <p className="text-sm text-[#64748B]">{user?.email}</p>
            </>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard value={bookings.length} label="Total Bookings" icon="📋"/>
          <StatCard value={completed}       label="Completed"      icon="✅"/>
          <StatCard value={memberSince}     label="Member Since"   icon="🗓️"/>
        </div>

        {/* Contact info */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 space-y-4">
          <p className="text-xs font-bold text-[#374151] uppercase tracking-wider">Contact Info</p>

          {/* Email (read-only) */}
          <div>
            <label className="block text-xs font-semibold text-[#94A3B8] mb-1.5">Email Address</label>
            <div className="flex items-center bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-3.5">
              <span className="text-[#94A3B8] mr-3"><MailIcon size={16}/></span>
              <span className="text-sm text-[#94A3B8]">{user?.email}</span>
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-semibold text-[#374151] mb-1.5">Phone Number</label>
            {editing ? (
              <div className="flex items-center bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl overflow-hidden focus-within:border-[#F97316] focus-within:ring-2 focus-within:ring-[#F97316]/10 transition-all">
                <div className="flex items-center gap-1 pl-4 pr-3 border-r border-[#E2E8F0] py-3.5">
                  <PhoneIcon size={15}/><span className="text-sm font-bold text-[#0F172A]">+91</span>
                </div>
                <input type="tel" inputMode="numeric" maxLength={10} value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g,"").slice(0,10))}
                  placeholder="98765 43210" className="flex-1 px-4 py-3.5 bg-transparent text-sm text-[#0F172A] outline-none" />
              </div>
            ) : (
              <div className="flex items-center bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-3.5">
                <span className="text-[#94A3B8] mr-3"><PhoneIcon size={16}/></span>
                <span className="text-sm text-[#0F172A]">{profile?.phone ? `+91 ${profile.phone}` : "—"}</span>
              </div>
            )}
          </div>

          {/* Location */}
          {editing ? (
            <div className="relative">
              <LocationPicker value={city} onChange={setCity} label="Your City" />
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1.5">Location</label>
              <div className="flex items-center bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-3.5">
                <span className="text-[#94A3B8] mr-3">📍</span>
                <span className="text-sm text-[#0F172A]">{profile?.area || "—"}</span>
              </div>
            </div>
          )}
        </div>

        {/* Save button */}
        {editing && (
          <>
            {error && (
              <div className="flex items-center gap-2 bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] text-sm rounded-xl px-4 py-3">
                <AlertCircleIcon size={15}/>{error}
              </div>
            )}
            <button onClick={handleSave} disabled={saving}
              className="w-full bg-[#0F172A] text-white py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#1E293B] active:scale-[0.98] transition-all disabled:opacity-50">
              {saving ? <><Spinner size={17}/>Saving…</> : <><CheckIcon size={17}/>Save Changes</>}
            </button>
          </>
        )}

        {/* Recent bookings */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-bold text-[#374151] uppercase tracking-wider">Recent Bookings</p>
            <Link href="/client/bookings" className="text-xs text-[#F97316] font-semibold hover:underline flex items-center gap-1">
              View all <ArrowRightIcon size={12}/>
            </Link>
          </div>
          {bookings.length === 0 ? (
            <div className="text-center py-6">
              <div className="text-3xl mb-2">📋</div>
              <p className="text-sm text-[#94A3B8]">No bookings yet</p>
              <Link href="/client/dashboard" className="text-xs text-[#F97316] font-semibold mt-2 inline-block">Find a worker →</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {bookings.slice(0,3).map(b => {
                const cat = SERVICE_CATEGORIES.find(c => (b.services||[]).includes(c.id));
                return (
                  <div key={b.id} className="flex items-center justify-between py-2 border-b border-[#F1F5F9] last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{cat?.icon || "🔧"}</span>
                      <div>
                        <p className="text-sm font-semibold text-[#0F172A]">{b.workerName || "Worker"}</p>
                        <p className="text-xs text-[#94A3B8]">{b.scheduledDate}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full capitalize ${b.status === "completed" ? "bg-[#F0FDF4] text-[#16A34A]" : b.status === "cancelled" ? "bg-[#FEF2F2] text-[#DC2626]" : "bg-[#FFF7ED] text-[#C2410C]"}`}>
                      {b.status?.replace(/_/g," ")}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Logout */}
        <button onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border-2 border-[#FECACA] text-[#EF4444] font-bold text-sm hover:bg-[#FEF2F2] active:scale-[0.98] transition-all">
          <LogOutIcon size={17}/> Sign Out
        </button>
      </div>

      <BottomNav role="client" />
    </div>
  );
}
