"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getWorkerProfile, updateWorkerProfile } from "@/lib/firestore";
import { SERVICE_CATEGORIES } from "@/lib/constants";
import BottomNav from "@/components/BottomNav";

function Toast({ msg, type }) {
  return (
    <div className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-lg text-sm font-bold flex items-center gap-2 animate-[slideDown_.3s_ease] ${type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"}`}>
      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{type === "success" ? "check_circle" : "error"}</span>
      {msg}
    </div>
  );
}

export default function WorkerProfileEdit() {
  const router = useRouter();
  const { user, userRole } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [toast,   setToast]   = useState(null);
  const photoRef = useRef();

  // Form state
  const [name,    setName]    = useState("");
  const [area,    setArea]    = useState("");
  const [skills,  setSkills]  = useState([]);
  const [exp,     setExp]     = useState("");
  const [rate,    setRate]    = useState("");
  const [bio,     setBio]     = useState("");
  const [photo,   setPhoto]   = useState(null);

  useEffect(() => {
    if (!user) return;
    getWorkerProfile(user.uid).then(w => {
      if (w) {
        setProfile(w);
        setName(w.name || "");
        setArea(w.area || "");
        setSkills(w.skills || []);
        setExp(w.experience || "");
        setRate(String(w.ratePerHour || ""));
        setBio(w.bio || "");
        setPhoto(w.profilePhoto || null);
      }
      setLoading(false);
    });
  }, [user]);

  function toggleSkill(id) {
    setSkills(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  }

  function handlePhotoChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = ev => setPhoto(ev.target.result);
    r.readAsDataURL(file);
  }

  function showToast(msg, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function handleSave() {
    if (!name || !area || skills.length === 0 || !exp || !rate) {
      showToast("Please fill all required fields.", "error"); return;
    }
    setSaving(true);
    try {
      await updateWorkerProfile(user.uid, {
        name, area, skills, experience: exp,
        ratePerHour: Number(rate), bio,
        ...(photo ? { profilePhoto: photo } : {}),
      });
      showToast("Profile saved successfully!");
    } catch (e) {
      showToast("Failed to save. Please try again.", "error");
    } finally { setSaving(false); }
  }

  if (loading) return (
    <div className="min-h-screen bg-[#f7f9fb] flex items-center justify-center">
      <div className="animate-spin w-10 h-10 rounded-full border-4 border-[#131b2e] border-t-transparent" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f7f9fb] pb-28">
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      {/* Header */}
      <nav className="flex items-center gap-3 px-5 h-14 bg-white border-b border-gray-100 sticky top-0 z-10">
        <button onClick={() => router.back()} className="w-9 h-9 rounded-xl bg-[#f2f4f6] flex items-center justify-center">
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_back</span>
        </button>
        <h1 className="font-headline font-bold text-[#0F172A] flex-1">My Profile</h1>
        <button onClick={handleSave} disabled={saving}
          className="bg-[#131b2e] text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-[#1e2a45] transition-colors disabled:opacity-60">
          {saving ? "Saving…" : "Save"}
        </button>
      </nav>

      <div className="max-w-md mx-auto px-5 pt-6 space-y-6">
        {/* Photo */}
        <div className="flex flex-col items-center">
          <button type="button" onClick={() => photoRef.current.click()}
            className="w-24 h-24 rounded-full bg-[#f2f4f6] border-2 border-dashed border-[#c6c6cd] flex items-center justify-center overflow-hidden hover:border-[#F97316] transition-colors relative group">
            {photo ? <img src={photo} alt="Profile" className="w-full h-full object-cover" />
              : <span className="material-symbols-outlined text-[#76777d]" style={{ fontSize: 32 }}>person</span>}
            <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="material-symbols-outlined text-white" style={{ fontSize: 20 }}>edit</span>
            </div>
          </button>
          <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
          <span className="text-xs text-[#45464d] mt-2">Tap to change photo</span>
        </div>

        {/* Name */}
        <div>
          <label className="block text-xs font-semibold text-[#45464d] uppercase tracking-wider mb-1.5">Full Name *</label>
          <div className="flex items-center bg-white border border-[#e0e3e5] rounded-xl px-4 py-3.5 focus-within:border-[#131b2e] transition-colors">
            <span className="material-symbols-outlined text-[#76777d] mr-2" style={{ fontSize: 18 }}>person</span>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Your full name"
              className="flex-1 bg-transparent text-sm text-[#0F172A] outline-none placeholder:text-[#c6c6cd]" />
          </div>
        </div>

        {/* Area */}
        <div>
          <label className="block text-xs font-semibold text-[#45464d] uppercase tracking-wider mb-1.5">Area / Locality *</label>
          <div className="flex items-center bg-white border border-[#e0e3e5] rounded-xl px-4 py-3.5 focus-within:border-[#131b2e] transition-colors">
            <span className="material-symbols-outlined text-[#76777d] mr-2" style={{ fontSize: 18 }}>location_on</span>
            <input type="text" value={area} onChange={e => setArea(e.target.value)} placeholder="e.g. Andheri, Mumbai"
              className="flex-1 bg-transparent text-sm text-[#0F172A] outline-none placeholder:text-[#c6c6cd]" />
          </div>
        </div>

        {/* Skills */}
        <div>
          <label className="block text-xs font-semibold text-[#45464d] uppercase tracking-wider mb-2">
            Skills * <span className="text-[#F97316] normal-case font-normal">({skills.length} selected)</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {SERVICE_CATEGORIES.map(cat => (
              <button key={cat.id} type="button" onClick={() => toggleSkill(cat.id)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${skills.includes(cat.id) ? "bg-[#fd761a] text-white" : "bg-white border border-[#e0e3e5] text-[#45464d] hover:border-[#fd761a]"}`}>
                <span>{cat.icon}</span> {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Experience */}
        <div>
          <label className="block text-xs font-semibold text-[#45464d] uppercase tracking-wider mb-1.5">Experience *</label>
          <div className="bg-white border border-[#e0e3e5] rounded-xl px-4 py-3.5 focus-within:border-[#131b2e]">
            <select value={exp} onChange={e => setExp(e.target.value)} className="w-full bg-transparent text-sm text-[#0F172A] outline-none">
              <option value="">Select experience</option>
              <option value="0-1 yr">0–1 Year</option>
              <option value="1-3 yrs">1–3 Years</option>
              <option value="3-5 yrs">3–5 Years</option>
              <option value="5+ yrs">5+ Years</option>
            </select>
          </div>
        </div>

        {/* Rate */}
        <div>
          <label className="block text-xs font-semibold text-[#45464d] uppercase tracking-wider mb-1.5">Rate per Hour (₹) *</label>
          <div className="flex items-center bg-white border border-[#e0e3e5] rounded-xl overflow-hidden focus-within:border-[#131b2e]">
            <span className="px-4 py-3.5 bg-[#f2f4f6] border-r border-[#e0e3e5] text-sm font-bold text-[#0F172A]">₹</span>
            <input type="number" value={rate} onChange={e => setRate(e.target.value)} min="50" placeholder="250"
              className="flex-1 px-4 py-3.5 bg-transparent text-sm text-[#0F172A] outline-none placeholder:text-[#c6c6cd]" />
          </div>
        </div>

        {/* Bio */}
        <div>
          <label className="block text-xs font-semibold text-[#45464d] uppercase tracking-wider mb-1.5">About / Bio</label>
          <textarea value={bio} onChange={e => setBio(e.target.value)} rows={4} placeholder="Describe your expertise and experience…"
            className="w-full bg-white border border-[#e0e3e5] rounded-xl px-4 py-3.5 text-sm text-[#0F172A] outline-none focus:border-[#131b2e] resize-none placeholder:text-[#c6c6cd] transition-colors" />
        </div>

        {/* Aadhaar card */}
        <div className="bg-white rounded-2xl border border-[#f2f4f6] shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-headline font-bold text-[#0F172A]">Aadhaar Verification</h3>
            {profile?.aadhaarStatus === "verified"
              ? <span className="text-[10px] font-bold bg-green-50 text-green-700 px-3 py-1 rounded-full flex items-center gap-1"><span className="material-symbols-outlined" style={{ fontSize: 12 }}>check_circle</span>Verified</span>
              : <span className="text-[10px] font-bold bg-amber-50 text-amber-700 px-3 py-1 rounded-full flex items-center gap-1"><span className="material-symbols-outlined" style={{ fontSize: 12 }}>schedule</span>Pending</span>
            }
          </div>
          <div className="flex items-center bg-[#f2f4f6] rounded-xl px-4 py-3">
            <span className="material-symbols-outlined text-[#76777d] mr-2" style={{ fontSize: 18 }}>badge</span>
            <span className="text-sm text-[#45464d] font-mono">
              {profile?.aadhaarNumber
                ? `XXXX-XXXX-${profile.aadhaarNumber.slice(-4)}`
                : "Not submitted"
              }
            </span>
          </div>
          {profile?.aadhaarStatus !== "verified" && (
            <p className="text-xs text-[#76777d] mt-2">To update Aadhaar, contact support@bixit.in</p>
          )}
        </div>

        {/* Save button */}
        <button onClick={handleSave} disabled={saving}
          className="w-full bg-[#131b2e] text-white py-4 rounded-2xl font-headline font-bold text-base hover:bg-[#1e2a45] active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2">
          {saving
            ? <><svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Saving…</>
            : "Save Changes"
          }
        </button>
      </div>

      <BottomNav role="worker" />
    </div>
  );
}
