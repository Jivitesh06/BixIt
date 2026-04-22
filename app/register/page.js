"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { createClientProfile, createWorkerProfile } from "@/lib/firestore";
import { SERVICE_CATEGORIES } from "@/lib/constants";
import { uploadToCloudinary } from "@/lib/cloudinary";
import LocationPicker from "@/components/LocationPicker";
import {
  MailIcon, LockIcon, EyeIcon, EyeOffIcon, UserIcon, PhoneIcon,
  CameraIcon, UploadIcon, BadgeIcon, ArrowRightIcon, Spinner,
  CheckIcon, AlertCircleIcon
} from "@/components/Icons";

function mapError(code) {
  const m = {
    "auth/email-already-in-use": "An account with this email already exists.",
    "auth/invalid-email":        "Invalid email address.",
    "auth/weak-password":        "Password must be at least 6 characters.",
  };
  return m[code] || "Registration failed. Please try again.";
}

function PasswordInput({ label, value, onChange, placeholder, autoComplete, error }) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="block text-xs font-semibold text-[#374151] uppercase tracking-wide mb-2">{label}</label>
      <div className={`flex items-center bg-white border rounded-xl transition-all duration-200 ${error ? "border-[#EF4444]" : "border-[#E2E8F0] focus-within:border-[#F97316] focus-within:ring-2 focus-within:ring-[#F97316]/10"}`}>
        <span className="pl-4 text-[#94A3B8]"><LockIcon size={17}/></span>
        <input type={show ? "text" : "password"} value={value} onChange={onChange}
          placeholder={placeholder} autoComplete={autoComplete}
          className="flex-1 px-3 py-3.5 bg-transparent text-sm text-[#0F172A] outline-none placeholder:text-[#CBD5E1]" />
        <button type="button" onClick={() => setShow(s => !s)} className="pr-4 text-[#94A3B8] hover:text-[#64748B]">
          {show ? <EyeOffIcon size={17}/> : <EyeIcon size={17}/>}
        </button>
      </div>
      {error && <p className="text-[#EF4444] text-xs mt-1.5 flex items-center gap-1"><AlertCircleIcon size={12}/>{error}</p>}
    </div>
  );
}

function InputRow({ label, icon, error, children }) {
  return (
    <div>
      {label && <label className="block text-xs font-semibold text-[#374151] uppercase tracking-wide mb-2">{label}</label>}
      <div className={`flex items-center bg-white border rounded-xl transition-all duration-200 ${error ? "border-[#EF4444]" : "border-[#E2E8F0] focus-within:border-[#F97316] focus-within:ring-2 focus-within:ring-[#F97316]/10"}`}>
        {icon && <span className="pl-4 text-[#94A3B8] flex-shrink-0">{icon}</span>}
        {children}
      </div>
      {error && <p className="text-[#EF4444] text-xs mt-1.5 flex items-center gap-1"><AlertCircleIcon size={12}/>{error}</p>}
    </div>
  );
}

export default function RegisterPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const initialTab   = searchParams.get("role") === "worker" ? "worker" : "client";
  const [tab,     setTab]     = useState(initialTab);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  /* ── Client fields ── */
  const [cName,    setCName]    = useState("");
  const [cEmail,   setCEmail]   = useState("");
  const [cPhone,   setCPhone]   = useState("");
  const [cCity,    setCCity]    = useState("");
  const [cPass,    setCPass]    = useState("");
  const [cConfirm, setCConfirm] = useState("");

  /* ── Worker fields ── */
  const [wPhotoPreview, setWPhotoPreview] = useState(null); // local blob URL for instant preview
  const [wPhotoFile,    setWPhotoFile]    = useState(null); // raw File for upload
  const [wName,     setWName]     = useState("");
  const [wEmail,    setWEmail]    = useState("");
  const [wPhone,    setWPhone]    = useState("");
  const [wCity,     setWCity]     = useState("");
  const [wPass,     setWPass]     = useState("");
  const [wConfirm,  setWConfirm]  = useState("");
  const [wSkills,   setWSkills]   = useState([]);
  const [wExp,      setWExp]      = useState("");
  const [wRate,     setWRate]     = useState("");
  const [wAadhaar,  setWAadhaar]  = useState("");
  const [wAFrontUrl,  setWAFrontUrl]  = useState(null); // Cloudinary URL
  const [wABackUrl,   setWABackUrl]   = useState(null); // Cloudinary URL
  const [wAFrontPrev, setWAFrontPrev] = useState(null); // local preview
  const [wABackPrev,  setWABackPrev]  = useState(null);
  const [uploadingPhoto,   setUploadingPhoto]   = useState(false);
  const [uploadingAadhaar, setUploadingAadhaar] = useState(null); // "front"|"back"|null
  const photoRef  = useRef();
  const aFrontRef = useRef();
  const aBackRef  = useRef();
  function toggleSkill(id) {
    setWSkills(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  }

  // Photo: show preview immediately, store file for later upload
  function handlePhotoSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    setWPhotoPreview(URL.createObjectURL(file));
    setWPhotoFile(file);
  }

  // Aadhaar: upload immediately on select so admin sees it fast
  async function handleAadhaarUpload(e, side) {
    const file = e.target.files[0];
    if (!file) return;
    // Show local preview while uploading
    const prev = URL.createObjectURL(file);
    if (side === "front") setWAFrontPrev(prev);
    else setWABackPrev(prev);
    setUploadingAadhaar(side);
    try {
      const url = await uploadToCloudinary(file, "bixit/aadhaar");
      if (side === "front") { setWAFrontUrl(url); }
      else { setWABackUrl(url); }
    } catch { /* keep preview, user can retry */ }
    finally { setUploadingAadhaar(null); }
  }

  /* ── Client register ── */
  async function handleClientRegister(e) {
    e.preventDefault();
    setError("");
    if (!cName.trim())        { setError("Please enter your name."); return; }
    if (!cEmail.trim())       { setError("Please enter your email."); return; }
    if (cPass !== cConfirm)   { setError("Passwords do not match."); return; }
    if (cPass.length < 6)     { setError("Password must be at least 6 characters."); return; }
    setLoading(true);
    try {
      const { user } = await createUserWithEmailAndPassword(auth, cEmail, cPass);
      await sendEmailVerification(user);
      await createClientProfile(user.uid, {
        name: cName.trim(), email: cEmail.trim(),
        phone: cPhone.trim(), area: cCity,
      });
      router.push("/verify-email");
    } catch (err) { setError(mapError(err.code)); }
    finally { setLoading(false); }
  }

  /* ── Worker register ── */
  async function handleWorkerRegister(e) {
    e.preventDefault();
    setError("");
    if (!wName.trim())       { setError("Name is required."); return; }
    if (!wEmail.trim())      { setError("Email is required."); return; }
    if (wPass !== wConfirm)  { setError("Passwords do not match."); return; }
    if (wPass.length < 6)    { setError("Password must be at least 6 characters."); return; }
    if (wSkills.length === 0) { setError("Select at least one skill."); return; }
    setLoading(true);
    try {
      // Upload profile photo to Cloudinary first
      let profilePhotoUrl = "";
      if (wPhotoFile) {
        setUploadingPhoto(true);
        profilePhotoUrl = await uploadToCloudinary(wPhotoFile, "bixit/profiles");
        setUploadingPhoto(false);
      }
      const { user } = await createUserWithEmailAndPassword(auth, wEmail, wPass);
      await sendEmailVerification(user);
      await createWorkerProfile(user.uid, {
        name: wName.trim(), email: wEmail.trim(),
        phone: wPhone.trim(), area: wCity,
        skills: wSkills, experience: wExp,
        ratePerHour: Number(wRate) || 0,
        aadhaarNumber: wAadhaar.trim(),
        aadhaarFront: wAFrontUrl || "",
        aadhaarBack:  wABackUrl  || "",
        profilePhoto: profilePhotoUrl,
      });
      router.push("/verify-email");
    } catch (err) { setError(mapError(err.code)); setUploadingPhoto(false); }
    finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <div className="bg-white border-b border-[#E2E8F0] px-5 py-4 sticky top-0 z-40 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#0F172A] rounded-xl flex items-center justify-center">
            <span className="text-white font-black text-sm">B</span>
          </div>
          <span className="font-black text-[#0F172A] text-xl tracking-tight">Bixit</span>
        </Link>
        <Link href="/login" className="text-sm font-semibold text-[#64748B] hover:text-[#0F172A] transition-colors">
          Sign in
        </Link>
      </div>

      <div className="max-w-md mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="font-black text-3xl text-[#0F172A] mb-1">Create account</h1>
          <p className="text-[#64748B] text-sm">Already have one?{" "}
            <Link href="/login" className="text-[#F97316] font-semibold hover:underline">Sign in</Link>
          </p>
        </div>

        {/* Role tabs */}
        <div className="flex bg-[#F4F4F5] rounded-xl p-1 mb-8">
          {[{ id:"client", label:"I'm a Client" }, { id:"worker", label:"I'm a Worker" }].map(t => (
            <button key={t.id} type="button" onClick={() => { setTab(t.id); setError(""); }}
              className={`flex-1 py-2.5 rounded-[10px] text-sm font-semibold transition-all ${tab === t.id ? "bg-[#0F172A] text-white shadow-sm" : "text-[#71717A] hover:text-[#0F172A]"}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── CLIENT FORM ── */}
        {tab === "client" && (
          <form onSubmit={handleClientRegister} className="space-y-5">
            <InputRow label="Full Name" icon={<UserIcon size={17}/>}>
              <input type="text" value={cName} onChange={e => setCName(e.target.value)} placeholder="Rahul Sharma"
                className="flex-1 px-3 py-3.5 bg-transparent text-sm text-[#0F172A] outline-none placeholder:text-[#CBD5E1]" />
            </InputRow>

            <InputRow label="Email Address" icon={<MailIcon size={17}/>}>
              <input type="email" value={cEmail} onChange={e => setCEmail(e.target.value)} placeholder="you@example.com" autoComplete="email"
                className="flex-1 px-3 py-3.5 bg-transparent text-sm text-[#0F172A] outline-none placeholder:text-[#CBD5E1]" />
            </InputRow>

            <InputRow label="Phone Number" icon={<PhoneIcon size={17}/>}>
              <span className="pl-3 pr-2 border-r border-[#E2E8F0] py-3.5 text-sm font-bold text-[#374151]">+91</span>
              <input type="tel" inputMode="numeric" maxLength={10} value={cPhone}
                onChange={e => setCPhone(e.target.value.replace(/\D/g,"").slice(0,10))}
                placeholder="98765 43210" className="flex-1 px-3 py-3.5 bg-transparent text-sm text-[#0F172A] outline-none placeholder:text-[#CBD5E1]" />
            </InputRow>

            <div className="relative">
              <LocationPicker value={cCity} onChange={setCCity} label="Your City" required />
            </div>

            <PasswordInput label="Password" value={cPass} onChange={e => setCPass(e.target.value)}
              placeholder="Min. 6 characters" autoComplete="new-password" />
            <PasswordInput label="Confirm Password" value={cConfirm} onChange={e => setCConfirm(e.target.value)}
              placeholder="Re-enter password" autoComplete="new-password"
              error={cConfirm && cPass !== cConfirm ? "Passwords don't match" : ""} />

            {error && (
              <div className="flex items-center gap-2 bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] text-sm rounded-xl px-4 py-3">
                <AlertCircleIcon size={15}/>{error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full bg-[#0F172A] text-white py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 hover:bg-[#1E293B] active:scale-[0.98] transition-all disabled:opacity-50 mt-2">
              {loading ? <><Spinner size={20}/>Creating account…</> : <><span>Create Account</span><ArrowRightIcon size={20}/></>}
            </button>
            <p className="text-xs text-[#94A3B8] text-center">
              We'll send a verification link to your email.
            </p>
          </form>
        )}

        {/* ── WORKER FORM ── */}
        {tab === "worker" && (
          <form onSubmit={handleWorkerRegister} className="space-y-5">
            {/* Profile photo */}
            <div className="flex flex-col items-center py-2">
              <button type="button" onClick={() => photoRef.current.click()}
                className="relative w-20 h-20 rounded-full bg-[#F1F5F9] border-2 border-dashed border-[#CBD5E1] flex items-center justify-center overflow-hidden hover:border-[#F97316] transition-colors group cursor-pointer">
                {uploadingPhoto
                  ? <Spinner size={24} />
                  : wPhotoPreview
                    ? <img src={wPhotoPreview} alt="Profile" className="w-full h-full object-cover"/>
                    : <span className="text-[#94A3B8] group-hover:text-[#F97316]"><CameraIcon size={26}/></span>}
              </button>
              <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect} />
              <span className="text-xs text-[#94A3B8] mt-2">
                {uploadingPhoto ? "Uploading…" : wPhotoPreview ? "✓ Photo selected" : "Profile photo (optional)"}
              </span>
            </div>

            <InputRow label="Full Name *" icon={<UserIcon size={17}/>}>
              <input type="text" value={wName} onChange={e => setWName(e.target.value)} placeholder="Your full name"
                className="flex-1 px-3 py-3.5 bg-transparent text-sm text-[#0F172A] outline-none placeholder:text-[#CBD5E1]" />
            </InputRow>

            <InputRow label="Email Address *" icon={<MailIcon size={17}/>}>
              <input type="email" value={wEmail} onChange={e => setWEmail(e.target.value)} placeholder="you@example.com" autoComplete="email"
                className="flex-1 px-3 py-3.5 bg-transparent text-sm text-[#0F172A] outline-none placeholder:text-[#CBD5E1]" />
            </InputRow>

            <InputRow label="Phone Number" icon={<PhoneIcon size={17}/>}>
              <span className="pl-3 pr-2 border-r border-[#E2E8F0] py-3.5 text-sm font-bold text-[#374151]">+91</span>
              <input type="tel" inputMode="numeric" maxLength={10} value={wPhone}
                onChange={e => setWPhone(e.target.value.replace(/\D/g,"").slice(0,10))}
                placeholder="98765 43210" className="flex-1 px-3 py-3.5 bg-transparent text-sm text-[#0F172A] outline-none placeholder:text-[#CBD5E1]" />
            </InputRow>

            <div className="relative">
              <LocationPicker value={wCity} onChange={setWCity} label="Working City" required />
            </div>

            {/* Skills */}
            <div>
              <label className="block text-xs font-semibold text-[#374151] uppercase tracking-wide mb-2">
                Skills * {wSkills.length > 0 && <span className="text-[#F97316] normal-case font-normal">({wSkills.length} selected)</span>}
              </label>
              <div className="flex flex-wrap gap-2">
                {SERVICE_CATEGORIES.map(cat => (
                  <button key={cat.id} type="button" onClick={() => toggleSkill(cat.id)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${wSkills.includes(cat.id) ? "bg-[#0F172A] text-white" : "bg-white border border-[#E2E8F0] text-[#374151] hover:border-[#F97316]"}`}>
                    {cat.icon} {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Experience */}
            <div>
              <label className="block text-xs font-semibold text-[#374151] uppercase tracking-wide mb-2">Experience</label>
              <div className="flex gap-2 flex-wrap">
                {["0-1 yr","1-3 yrs","3-5 yrs","5+ yrs"].map(e => (
                  <button key={e} type="button" onClick={() => setWExp(e)}
                    className={`px-4 py-2 rounded-full text-xs font-semibold border transition-all ${wExp === e ? "bg-[#0F172A] text-white border-[#0F172A]" : "bg-white text-[#374151] border-[#E2E8F0] hover:border-[#0F172A]"}`}>
                    {e}
                  </button>
                ))}
              </div>
            </div>

            {/* Rate */}
            <InputRow label="Rate per Hour (₹)">
              <span className="pl-4 pr-3 py-3.5 border-r border-[#E2E8F0] font-bold text-[#374151] text-sm">₹</span>
              <input type="number" min="50" value={wRate} onChange={e => setWRate(e.target.value)} placeholder="250"
                className="flex-1 px-4 py-3.5 bg-transparent text-sm text-[#0F172A] outline-none placeholder:text-[#CBD5E1]" />
            </InputRow>

            {/* Aadhaar section */}
            <div className="bg-[#FFF7ED] border border-[#FED7AA] rounded-2xl p-4 space-y-4">
              <div className="flex items-center gap-2">
                <BadgeIcon size={18}/>
                <div>
                  <p className="font-bold text-[#9A3412] text-sm">Aadhaar Verification</p>
                  <p className="text-xs text-[#C2410C]">Required to get verified badge and more bookings</p>
                </div>
              </div>

              <InputRow>
                <input type="text" inputMode="numeric" maxLength={12} value={wAadhaar}
                  onChange={e => setWAadhaar(e.target.value.replace(/\D/g,"").slice(0,12))}
                  placeholder="12-digit Aadhaar number"
                  className="flex-1 px-4 py-3.5 bg-transparent text-sm text-[#0F172A] outline-none placeholder:text-[#CBD5E1] font-mono tracking-widest" />
              </InputRow>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label:"Front Side", ref: aFrontRef, side:"front", url: wAFrontUrl, prev: wAFrontPrev, uploading: uploadingAadhaar==="front" },
                  { label:"Back Side",  ref: aBackRef,  side:"back",  url: wABackUrl,  prev: wABackPrev,  uploading: uploadingAadhaar==="back"  },
                ].map(({ label, ref, side, url, prev, uploading }) => (
                  <div key={label}>
                    <p className="text-xs font-semibold text-[#9A3412] mb-1.5 flex items-center gap-1">
                      {label}
                      {url && <span className="text-[#22C55E] text-[10px]">✓ Uploaded</span>}
                    </p>
                    <label className={`flex flex-col items-center justify-center h-24 rounded-xl border-2 border-dashed cursor-pointer transition-colors overflow-hidden ${
                      url ? "border-[#22C55E]" : prev ? "border-[#F97316]" : "border-[#FED7AA] hover:border-[#F97316]"}`}>
                      {uploading
                        ? <><Spinner size={20}/><span className="text-[10px] text-[#C2410C] mt-1">Uploading…</span></>
                        : prev
                          ? <img src={prev} alt={label} className="w-full h-full object-cover"/>
                          : <><UploadIcon size={20}/><span className="text-[10px] text-[#C2410C] mt-1">Upload photo</span></>}
                      <input ref={ref} type="file" accept="image/*" className="hidden"
                        onChange={e => handleAadhaarUpload(e, side)} />
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <PasswordInput label="Password *" value={wPass} onChange={e => setWPass(e.target.value)}
              placeholder="Min. 6 characters" autoComplete="new-password" />
            <PasswordInput label="Confirm Password *" value={wConfirm} onChange={e => setWConfirm(e.target.value)}
              placeholder="Re-enter password" autoComplete="new-password"
              error={wConfirm && wPass !== wConfirm ? "Passwords don't match" : ""} />

            {error && (
              <div className="flex items-center gap-2 bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] text-sm rounded-xl px-4 py-3">
                <AlertCircleIcon size={15}/>{error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full bg-[#0F172A] text-white py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 hover:bg-[#1E293B] active:scale-[0.98] transition-all disabled:opacity-50">
              {loading ? <><Spinner size={20}/>Creating account…</> : <><span>Register as Worker</span><ArrowRightIcon size={20}/></>}
            </button>
            <p className="text-xs text-[#94A3B8] text-center">
              We'll send a verification link to your email. Aadhaar will be reviewed by our team.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
