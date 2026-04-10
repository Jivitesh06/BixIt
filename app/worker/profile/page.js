"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getWorkerProfile, updateWorkerProfile } from "@/lib/firestore";
import { SERVICE_CATEGORIES } from "@/lib/constants";
import CityAutocomplete from "@/components/CityAutocomplete";
import BottomNav from "@/components/BottomNav";
import {
  CameraIcon, UserIcon, MailIcon, PhoneIcon, BadgeIcon,
  CheckIcon, ArrowRightIcon, AlertCircleIcon, Spinner, ShieldIcon
} from "@/components/Icons";

export default function WorkerProfile() {
  const router = useRouter();
  const { user } = useAuth();
  const [profile, setProfile]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [toast, setToast]       = useState("");
  const [error, setError]       = useState("");

  // Editable fields
  const [photo, setPhoto]       = useState(null);
  const [name, setName]         = useState("");
  const [phone, setPhone]       = useState("");
  const [city, setCity]         = useState("");
  const [skills, setSkills]     = useState([]);
  const [exp, setExp]           = useState("");
  const [rate, setRate]         = useState("");
  const [bio, setBio]           = useState("");
  const photoRef = useRef();

  useEffect(() => {
    if (!user) return;
    getWorkerProfile(user.uid).then(p => {
      if (!p) return;
      setProfile(p);
      setName(p.name || ""); setPhone(p.phone || ""); setCity(p.area || "");
      setSkills(p.skills || []); setExp(p.experience || ""); setRate(p.ratePerHour || "");
      setBio(p.bio || ""); setPhoto(p.profilePhoto || null);
      setLoading(false);
    });
  }, [user]);

  function toggleSkill(id) {
    setSkills(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  }

  function readFile(file) {
    const r = new FileReader();
    r.onload = ev => setPhoto(ev.target.result);
    r.readAsDataURL(file);
  }

  async function handleSave(e) {
    e.preventDefault();
    setError("");
    if (!name) { setError("Name is required."); return; }
    setSaving(true);
    try {
      await updateWorkerProfile(user.uid, {
        name, phone, area: city, skills, experience: exp,
        ratePerHour: Number(rate), bio, profilePhoto: photo || "",
      });
      setToast("Profile saved ✓");
      setTimeout(() => setToast(""), 3000);
    } catch { setError("Failed to save. Please try again."); }
    finally { setSaving(false); }
  }

  if (loading) return <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center"><div className="animate-spin w-10 h-10 rounded-full border-4 border-[#0F172A] border-t-transparent"/></div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] bg-[#0F172A] text-white text-sm font-semibold px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2">
          <CheckIcon size={15}/>{toast}
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-[#E2E8F0] px-4 py-4 sticky top-0 z-40">
        <h1 className="font-black text-xl text-[#0F172A]">My Profile</h1>
        <p className="text-xs text-[#64748B]">How clients see you</p>
      </div>

      <form onSubmit={handleSave} className="max-w-md mx-auto px-4 py-6 space-y-5">
        {/* Photo */}
        <div className="flex flex-col items-center py-2">
          <button type="button" onClick={() => photoRef.current.click()}
            className="relative w-24 h-24 rounded-full bg-[#F8FAFC] border-2 border-dashed border-[#CBD5E1] flex items-center justify-center overflow-hidden hover:border-[#F97316] transition-colors group">
            {photo ? <img src={photo} alt="Profile" className="w-full h-full object-cover" />
              : <span className="text-[#94A3B8] group-hover:text-[#F97316] transition-colors"><CameraIcon size={28}/></span>}
          </button>
          <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files[0] && readFile(e.target.files[0])} />
          <span className="text-xs text-[#94A3B8] mt-2">Tap to change photo</span>
        </div>

        {/* Aadhaar status */}
        <div className={`rounded-2xl p-4 flex items-start gap-3 border ${profile?.isVerified ? "bg-[#F0FDF4] border-[#BBF7D0]" : "bg-[#FFF7ED] border-[#FED7AA]"}`}>
          <ShieldIcon size={18}/>
          <div>
            <p className={`font-bold text-sm ${profile?.isVerified ? "text-[#166534]" : "text-[#9A3412]"}`}>
              {profile?.isVerified ? "✓ Aadhaar Verified" : "Aadhaar Verification Pending"}
            </p>
            <p className={`text-xs mt-0.5 ${profile?.isVerified ? "text-[#16A34A]" : "text-[#C2410C]"}`}>
              {profile?.isVerified ? "Your profile shows a verified badge." : "Our team will verify your Aadhaar soon."}
            </p>
            {profile?.aadhaarNumber && (
              <p className="text-xs text-[#94A3B8] mt-1 font-mono">
                XXXX XXXX {profile.aadhaarNumber.slice(-4)}
              </p>
            )}
          </div>
        </div>

        {/* Basic info */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 space-y-4">
          <p className="text-xs font-bold text-[#374151] uppercase tracking-wider">Basic Info</p>
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-[#374151] mb-1.5">Full Name *</label>
            <div className="flex items-center bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl focus-within:border-[#F97316] focus-within:ring-2 focus-within:ring-[#F97316]/10 transition-all">
              <span className="pl-4 text-[#94A3B8]"><UserIcon size={16}/></span>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Your name"
                className="flex-1 px-3 py-3.5 bg-transparent text-sm text-[#0F172A] outline-none" />
            </div>
          </div>
          {/* Phone */}
          <div>
            <label className="block text-xs font-semibold text-[#374151] mb-1.5">Phone Number</label>
            <div className="flex items-center bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl overflow-hidden focus-within:border-[#F97316] focus-within:ring-2 focus-within:ring-[#F97316]/10 transition-all">
              <div className="flex items-center gap-1.5 pl-4 pr-3 border-r border-[#E2E8F0] py-3.5">
                <PhoneIcon size={16}/><span className="text-sm font-bold text-[#0F172A]">+91</span>
              </div>
              <input type="tel" inputMode="numeric" maxLength={10} value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g,"").slice(0,10))}
                placeholder="9876543210" className="flex-1 px-4 py-3.5 bg-transparent text-sm text-[#0F172A] outline-none" />
            </div>
          </div>
          {/* City */}
          <div className="relative">
            <CityAutocomplete value={city} onChange={setCity} label="Working City" placeholder="Search your city…" />
          </div>
        </div>

        {/* Professional */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 space-y-4">
          <p className="text-xs font-bold text-[#374151] uppercase tracking-wider">Professional Details</p>
          {/* Skills */}
          <div>
            <label className="block text-xs font-semibold text-[#374151] mb-2">
              Skills {skills.length > 0 && <span className="text-[#F97316] font-normal">({skills.length} selected)</span>}
            </label>
            <div className="flex flex-wrap gap-2">
              {SERVICE_CATEGORIES.map(cat => (
                <button key={cat.id} type="button" onClick={() => toggleSkill(cat.id)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${skills.includes(cat.id) ? "bg-[#0F172A] text-white" : "bg-[#F8FAFC] border border-[#E2E8F0] text-[#374151] hover:border-[#F97316]"}`}>
                  {cat.icon} {cat.label}
                </button>
              ))}
            </div>
          </div>
          {/* Experience pills */}
          <div>
            <label className="block text-xs font-semibold text-[#374151] mb-2">Experience</label>
            <div className="flex gap-2 flex-wrap">
              {["0-1 yr","1-3 yrs","3-5 yrs","5+ yrs"].map(e => (
                <button key={e} type="button" onClick={() => setExp(e)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold border transition-all ${exp === e ? "bg-[#0F172A] text-white border-[#0F172A]" : "bg-[#F8FAFC] text-[#374151] border-[#E2E8F0] hover:border-[#0F172A]"}`}>
                  {e}
                </button>
              ))}
            </div>
          </div>
          {/* Rate */}
          <div>
            <label className="block text-xs font-semibold text-[#374151] mb-1.5">Rate per Hour (₹)</label>
            <div className="flex items-center bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl overflow-hidden focus-within:border-[#F97316] focus-within:ring-2 focus-within:ring-[#F97316]/10 transition-all">
              <span className="px-4 py-3.5 bg-[#F1F5F9] border-r border-[#E2E8F0] font-bold text-[#374151] text-sm">₹</span>
              <input type="number" min="50" value={rate} onChange={e => setRate(e.target.value)} placeholder="250"
                className="flex-1 px-4 py-3.5 bg-transparent text-sm text-[#0F172A] outline-none" />
            </div>
          </div>
          {/* Bio */}
          <div>
            <label className="block text-xs font-semibold text-[#374151] mb-1.5">About / Bio</label>
            <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3}
              placeholder="Describe your expertise…"
              className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-3.5 text-sm text-[#0F172A] outline-none focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/10 resize-none placeholder:text-[#CBD5E1] transition-all" />
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] text-sm rounded-xl px-4 py-3">
            <AlertCircleIcon size={16}/>{error}
          </div>
        )}

        <button type="submit" disabled={saving}
          className="w-full bg-[#0F172A] text-white py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 hover:bg-[#1E293B] active:scale-[0.98] transition-all disabled:opacity-50">
          {saving ? <><Spinner size={18}/>Saving…</> : <><CheckIcon size={18}/>Save Profile</>}
        </button>
      </form>

      <BottomNav role="worker" />
    </div>
  );
}
