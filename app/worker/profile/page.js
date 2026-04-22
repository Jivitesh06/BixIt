"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getWorkerProfile, updateWorkerProfile } from "@/lib/firestore";
import { SERVICE_CATEGORIES } from "@/lib/constants";
import LocationPicker from "@/components/LocationPicker";
import BottomNav from "@/components/BottomNav";
import { useToast } from "@/components/Toast";
import { uploadToCloudinary, getOptimizedUrl } from "@/lib/cloudinary";
import {
  CameraIcon, UserIcon, MailIcon, PhoneIcon, BadgeIcon,
  CheckIcon, ArrowRightIcon, AlertCircleIcon, Spinner, ShieldIcon
} from "@/components/Icons";

export default function WorkerProfile() {
  const router   = useRouter();
  const addToast = useToast();
  const { user } = useAuth();
  const [profile, setProfile]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [saving,  setSaving]    = useState(false);
  const [error,   setError]     = useState("");

  // Editable fields
  const [photoPreview, setPhotoPreview] = useState(null); // blob URL for preview
  const [photoFile,    setPhotoFile]    = useState(null); // File to upload
  const [photoUrl,     setPhotoUrl]     = useState(null); // confirmed Cloudinary URL
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [name, setName]         = useState("");
  const [phone, setPhone]       = useState("");
  const [city, setCity]         = useState("");
  const [skills, setSkills]     = useState([]);
  const [exp, setExp]           = useState("");
  const [rate, setRate]         = useState("");
  const [bio, setBio]           = useState("");
  // Aadhaar
  const [aadhaarFrontUrl,  setAadhaarFrontUrl]  = useState("");
  const [aadhaarBackUrl,   setAadhaarBackUrl]   = useState("");
  const [aadhaarFrontPrev, setAadhaarFrontPrev] = useState(null);
  const [aadhaarBackPrev,  setAadhaarBackPrev]  = useState(null);
  const [uploadingAadhaar, setUploadingAadhaar] = useState(null);
  const photoRef  = useRef();
  const aFrontRef = useRef();
  const aBackRef  = useRef();

  useEffect(() => {
    if (!user) return;
    getWorkerProfile(user.uid).then(p => {
      if (!p) return;
      setProfile(p);
      setName(p.name || ""); setPhone(p.phone || ""); setCity(p.area || "");
      setSkills(p.skills || []); setExp(p.experience || ""); setRate(p.ratePerHour || "");
      setBio(p.bio || "");
      setPhotoUrl(p.profilePhoto || null);
      setPhotoPreview(p.profilePhoto || null);
      setAadhaarFrontUrl(p.aadhaarFront || "");
      setAadhaarFrontPrev(p.aadhaarFront || null);
      setAadhaarBackUrl(p.aadhaarBack || "");
      setAadhaarBackPrev(p.aadhaarBack || null);
      setLoading(false);
    });
  }, [user]);

  function toggleSkill(id) {
    setSkills(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  }

  function handlePhotoSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoPreview(URL.createObjectURL(file));
    setPhotoFile(file);
  }

  async function handleAadhaarUpload(e, side) {
    const file = e.target.files[0];
    if (!file) return;
    const prev = URL.createObjectURL(file);
    if (side === "front") setAadhaarFrontPrev(prev);
    else setAadhaarBackPrev(prev);
    setUploadingAadhaar(side);
    try {
      const url = await uploadToCloudinary(file, "bixit/aadhaar");
      if (side === "front") setAadhaarFrontUrl(url);
      else setAadhaarBackUrl(url);
    } catch { addToast("Aadhaar upload failed. Try again.", "error"); }
    finally { setUploadingAadhaar(null); }
  }

  async function handleSave(e) {
    e.preventDefault();
    setError("");
    if (!name) { setError("Name is required."); return; }
    setSaving(true);
    try {
      // Upload profile photo if a new file was selected
      let finalPhotoUrl = photoUrl || "";
      if (photoFile) {
        setUploadingPhoto(true);
        finalPhotoUrl = await uploadToCloudinary(photoFile, "bixit/profiles");
        setPhotoUrl(finalPhotoUrl);
        setUploadingPhoto(false);
      }
      await updateWorkerProfile(user.uid, {
        name, phone, area: city, skills, experience: exp,
        ratePerHour: Number(rate), bio,
        profilePhoto: finalPhotoUrl,
        aadhaarFront: aadhaarFrontUrl,
        aadhaarBack:  aadhaarBackUrl,
      });
      addToast("Profile saved successfully!", "success");
    } catch { setError("Failed to save. Please try again."); addToast("Failed to save profile.", "error"); }
    finally { setSaving(false); setUploadingPhoto(false); }
  }

  if (loading) return <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center"><div className="animate-spin w-10 h-10 rounded-full border-4 border-[#0F172A] border-t-transparent"/></div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">

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
            {uploadingPhoto
              ? <Spinner size={26}/>
              : photoPreview
                ? <img src={photoPreview} alt="Profile" className="w-full h-full object-cover" />
                : <span className="text-[#94A3B8] group-hover:text-[#F97316] transition-colors"><CameraIcon size={28}/></span>}
          </button>
          <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect} />
          <span className="text-xs text-[#94A3B8] mt-2">
            {uploadingPhoto ? "Uploading…" : photoPreview ? "✓ Photo selected" : "Tap to change photo"}
          </span>
        </div>

        {/* Aadhaar status + upload */}
        <div className={`rounded-2xl p-4 border space-y-3 ${profile?.isVerified ? "bg-[#F0FDF4] border-[#BBF7D0]" : "bg-[#FFF7ED] border-[#FED7AA]"}` }>
          <div className="flex items-start gap-3">
            <ShieldIcon size={18}/>
            <div className="flex-1">
              <p className={`font-bold text-sm ${profile?.isVerified ? "text-[#166534]" : "text-[#9A3412]"}`}>
                {profile?.isVerified ? "✓ Aadhaar Verified" : "Aadhaar Verification Pending"}
              </p>
              <p className={`text-xs mt-0.5 ${profile?.isVerified ? "text-[#16A34A]" : "text-[#C2410C]"}`}>
                {profile?.isVerified ? "Your profile shows a verified badge." : "Our team will verify your Aadhaar soon."}
              </p>
              {profile?.aadhaarNumber && (
                <p className="text-xs text-[#94A3B8] mt-1 font-mono">XXXX XXXX {profile.aadhaarNumber.slice(-4)}</p>
              )}
            </div>
          </div>
          {/* Aadhaar photo upload */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label:"Front", side:"front", url:aadhaarFrontUrl, prev:aadhaarFrontPrev, ref:aFrontRef, uploading:uploadingAadhaar==="front" },
              { label:"Back",  side:"back",  url:aadhaarBackUrl,  prev:aadhaarBackPrev,  ref:aBackRef,  uploading:uploadingAadhaar==="back"  },
            ].map(({ label, side, url, prev, ref, uploading }) => (
              <div key={label}>
                <p className="text-xs font-semibold text-[#9A3412] mb-1.5 flex items-center gap-1">
                  {label} {url && <span className="text-[#22C55E] text-[10px]">✓ Uploaded</span>}
                </p>
                <label className={`flex flex-col items-center justify-center h-20 rounded-xl border-2 border-dashed cursor-pointer transition-colors overflow-hidden ${url ? "border-[#22C55E]" : prev ? "border-[#F97316]" : "border-[#FED7AA] hover:border-[#F97316]"}`}>
                  {uploading
                    ? <><Spinner size={18}/><span className="text-[10px] text-[#C2410C] mt-1">Uploading…</span></>
                    : prev
                      ? <img src={prev} alt={label} className="w-full h-full object-cover"/>
                      : <><BadgeIcon size={18}/><span className="text-[10px] text-[#C2410C] mt-1">Upload {label}</span></>}
                  <input ref={ref} type="file" accept="image/*" className="hidden" onChange={e => handleAadhaarUpload(e, side)} />
                </label>
              </div>
            ))}
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
            <LocationPicker value={city} onChange={setCity} label="Working City" />
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
