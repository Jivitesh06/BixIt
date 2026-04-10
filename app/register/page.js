"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { createClientProfile, createWorkerProfile } from "@/lib/firestore";
import { SERVICE_CATEGORIES } from "@/lib/constants";
import CityAutocomplete from "@/components/CityAutocomplete";
import {
  MailIcon, LockIcon, EyeIcon, EyeOffIcon, UserIcon, PhoneIcon,
  CameraIcon, UploadIcon, BadgeIcon, ArrowRightIcon, Spinner, CheckIcon, AlertCircleIcon
} from "@/components/Icons";

function mapError(code) {
  const m = {
    "auth/email-already-in-use": "An account with this email already exists.",
    "auth/invalid-email":        "Invalid email address.",
    "auth/weak-password":        "Password must be at least 6 characters.",
  };
  return m[code] || "Registration failed. Please try again.";
}

function Field({ label, icon, right, error, hint, className = "", children }) {
  return (
    <div className={`relative ${className}`}>
      {label && <label className="block text-xs font-semibold text-[#374151] uppercase tracking-wide mb-2">{label}</label>}
      <div className={`flex items-center bg-white border rounded-xl transition-all duration-200 ${error ? "border-[#EF4444] ring-1 ring-[#EF4444]/20" : "border-[#E2E8F0] focus-within:border-[#F97316] focus-within:ring-2 focus-within:ring-[#F97316]/10"}`}>
        {icon && <span className="pl-4 text-[#94A3B8] flex-shrink-0">{icon}</span>}
        {children}
        {right}
      </div>
      {error && <p className="text-[#EF4444] text-xs mt-1.5 flex items-center gap-1"><AlertCircleIcon size={12}/>{error}</p>}
      {hint && !error && <p className="text-[#94A3B8] text-xs mt-1.5">{hint}</p>}
    </div>
  );
}

function Input({ label, icon, rightEl, error, hint, ...props }) {
  return (
    <Field label={label} icon={icon} right={rightEl} error={error} hint={hint}>
      <input className="flex-1 px-3 py-3.5 bg-transparent text-sm text-[#0F172A] outline-none placeholder:text-[#CBD5E1] w-full" {...props} />
    </Field>
  );
}

function PasswordInput({ label, value, onChange, placeholder, error, autoComplete }) {
  const [show, setShow] = useState(false);
  return (
    <Field label={label} icon={<LockIcon size={17}/>}
      right={<button type="button" onClick={() => setShow(s => !s)} className="pr-4 text-[#94A3B8] hover:text-[#64748B] flex-shrink-0">{show ? <EyeOffIcon size={17}/> : <EyeIcon size={17}/>}</button>}
      error={error}>
      <input type={show ? "text" : "password"} value={value} onChange={onChange} placeholder={placeholder} autoComplete={autoComplete}
        className="flex-1 px-3 py-3.5 bg-transparent text-sm text-[#0F172A] outline-none placeholder:text-[#CBD5E1] w-full" />
    </Field>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("role") === "worker" ? "worker" : "client";
  const [tab, setTab]         = useState(initialTab);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  /* Client */
  const [cName, setCName]       = useState("");
  const [cEmail, setCEmail]     = useState("");
  const [cPhone, setCPhone]     = useState("");
  const [cCity, setCCity]       = useState("");
  const [cPass, setCPass]       = useState("");
  const [cConfirm, setCConfirm] = useState("");

  /* Worker */
  const [wPhoto, setWPhoto]             = useState(null);
  const [wName, setWName]               = useState("");
  const [wEmail, setWEmail]             = useState("");
  const [wPhone, setWPhone]             = useState("");
  const [wCity, setWCity]               = useState("");
  const [wPass, setWPass]               = useState("");
  const [wConfirm, setWConfirm]         = useState("");
  const [wSkills, setWSkills]           = useState([]);
  const [wExp, setWExp]                 = useState("");
  const [wRate, setWRate]               = useState("");
  const [wAadhaar, setWAadhaar]         = useState("");
  const [wAadhaarFront, setWAadhaarFront] = useState(null);
  const [wAadhaarBack, setWAadhaarBack]   = useState(null);
  const [wBio, setWBio]                 = useState("");
  const photoRef  = useRef();

  function readFile(file, setter) {
    const r = new FileReader();
    r.onload = ev => setter(ev.target.result);
    r.readAsDataURL(file);
  }

  function toggleSkill(id) {
    setWSkills(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  }

  async function handleClient(e) {
    e.preventDefault(); setError("");
    if (!cName || !cEmail || !cPass) { setError("Please fill all required fields."); return; }
    if (cPass !== cConfirm)           { setError("Passwords do not match."); return; }
    if (cPass.length < 6)             { setError("Password must be at least 6 characters."); return; }
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, cEmail, cPass);
      await createClientProfile(cred.user.uid, { name: cName, email: cEmail, phone: cPhone, area: cCity });
      router.push("/client/dashboard");
    } catch (err) { setError(mapError(err.code)); }
    finally { setLoading(false); }
  }

  async function handleWorker(e) {
    e.preventDefault(); setError("");
    if (!wName || !wEmail || !wPass)   { setError("Please fill all required fields."); return; }
    if (wSkills.length === 0)           { setError("Please select at least one skill."); return; }
    if (!wExp || !wRate)                { setError("Please fill experience and hourly rate."); return; }
    if (wPass !== wConfirm)             { setError("Passwords do not match."); return; }
    if (wPass.length < 6)               { setError("Password must be at least 6 characters."); return; }
    if (wAadhaar && wAadhaar.length !== 12) { setError("Aadhaar must be 12 digits."); return; }
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, wEmail, wPass);
      await createWorkerProfile(cred.user.uid, {
        name: wName, email: wEmail, phone: wPhone, area: wCity,
        skills: wSkills, experience: wExp, ratePerHour: Number(wRate),
        aadhaarNumber: wAadhaar, aadhaarFrontPhoto: wAadhaarFront || "",
        aadhaarBackPhoto: wAadhaarBack || "", bio: wBio, profilePhoto: wPhoto || "",
      });
      router.push("/worker/dashboard");
    } catch (err) { setError(mapError(err.code)); }
    finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left panel — desktop */}
      <div className="hidden lg:flex lg:w-[42%] bg-[#0F172A] flex-col relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px,white 1px,transparent 0)", backgroundSize: "32px 32px" }} />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-[#F97316] rounded-full blur-[100px] opacity-10 pointer-events-none" />
        <div className="relative z-10 flex flex-col h-full px-10 py-10">
          <Link href="/" className="inline-flex items-center gap-2 mb-auto">
            <div className="w-8 h-8 bg-[#F97316] rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-sm">B</span>
            </div>
            <span className="font-black text-white text-xl tracking-tight">Bixit</span>
          </Link>
          <div className="flex-1 flex flex-col justify-center">
            <p className="text-[#F97316] text-xs font-bold uppercase tracking-[0.18em] mb-5">Join India's best</p>
            <h1 className="text-white font-black text-4xl leading-tight tracking-tight mb-5">
              {tab === "client" ? "Find workers\nyou can trust." : "Earn more,\nwork smarter."}
            </h1>
            <p className="text-[#64748B] leading-relaxed">
              {tab === "client"
                ? "Join 50,000+ clients who book verified skilled workers every day."
                : "Join 2,000+ verified workers earning great income with Bixit."}
            </p>
          </div>
          <div className="space-y-3">
            {(tab === "client" ? ["Free to join", "Verified workers only", "Secure payments"] : ["Instant job alerts", "Get paid fast", "Build your reputation"]).map(p => (
              <div key={p} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-[#F97316]/20 flex items-center justify-center text-[#F97316] flex-shrink-0"><CheckIcon size={12}/></div>
                <span className="text-[#94A3B8] text-sm">{p}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[420px] mx-auto px-6 py-10">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="w-8 h-8 bg-[#0F172A] rounded-lg flex items-center justify-center">
                <span className="text-white font-black text-sm">B</span>
              </div>
              <span className="font-black text-[#0F172A] text-xl">Bixit</span>
            </Link>
          </div>

          <h2 className="font-black text-[#0F172A] text-2xl tracking-tight mb-1">Create account</h2>
          <p className="text-[#64748B] text-sm mb-7">
            Already have one?{" "}
            <Link href="/login" className="text-[#F97316] font-semibold hover:underline">Sign in</Link>
          </p>

          {/* Tabs */}
          <div className="flex bg-[#F8FAFC] rounded-xl p-1 mb-7 border border-[#E2E8F0]">
            {[{ id: "client", label: "I'm a Client" }, { id: "worker", label: "I'm a Worker" }].map(t => (
              <button key={t.id} onClick={() => { setTab(t.id); setError(""); }}
                className={`flex-1 py-2.5 rounded-[10px] text-sm font-semibold transition-all duration-200 ${t.id === tab ? "bg-[#0F172A] text-white shadow-sm" : "text-[#64748B] hover:text-[#0F172A]"}`}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2.5 bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] text-sm rounded-xl px-4 py-3 mb-5">
              <AlertCircleIcon size={16}/> {error}
            </div>
          )}

          {/* ── CLIENT ── */}
          {tab === "client" && (
            <form onSubmit={handleClient} className="space-y-4" noValidate>
              <Input label="Full Name *" icon={<UserIcon size={17}/>} type="text" placeholder="Rahul Sharma" value={cName} onChange={e => setCName(e.target.value)} />
              <Input label="Email Address *" icon={<MailIcon size={17}/>} type="email" placeholder="you@example.com" value={cEmail} onChange={e => setCEmail(e.target.value)} />
              {/* Phone */}
              <div>
                <label className="block text-xs font-semibold text-[#374151] uppercase tracking-wide mb-2">Phone Number</label>
                <div className="flex items-center bg-white border border-[#E2E8F0] rounded-xl overflow-hidden focus-within:border-[#F97316] focus-within:ring-2 focus-within:ring-[#F97316]/10 transition-all">
                  <div className="flex items-center gap-1.5 pl-4 pr-3 border-r border-[#E2E8F0] py-3.5 flex-shrink-0">
                    <PhoneIcon size={17}/><span className="text-sm font-bold text-[#0F172A]">+91</span>
                  </div>
                  <input type="tel" inputMode="numeric" maxLength={10} value={cPhone} onChange={e => setCPhone(e.target.value.replace(/\D/g,"").slice(0,10))} placeholder="98765 43210"
                    className="flex-1 px-4 py-3.5 bg-transparent text-sm text-[#0F172A] outline-none placeholder:text-[#CBD5E1]" />
                </div>
              </div>
              <div className="relative"><CityAutocomplete value={cCity} onChange={setCCity} label="Your City" placeholder="Search your city…" /></div>
              <PasswordInput label="Password *" value={cPass} onChange={e => setCPass(e.target.value)} placeholder="Min. 6 characters" autoComplete="new-password" />
              <PasswordInput label="Confirm Password *" value={cConfirm} onChange={e => setCConfirm(e.target.value)} placeholder="Repeat password" autoComplete="new-password" />
              <button type="submit" disabled={loading} className="w-full bg-[#0F172A] text-white py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#1E293B] active:scale-[0.98] transition-all disabled:opacity-50 mt-2">
                {loading ? <><Spinner size={18}/>Creating…</> : <><span>Create Client Account</span><ArrowRightIcon size={18}/></>}
              </button>
            </form>
          )}

          {/* ── WORKER ── */}
          {tab === "worker" && (
            <form onSubmit={handleWorker} className="space-y-5" noValidate>
              {/* Profile photo */}
              <div className="flex flex-col items-center py-2">
                <button type="button" onClick={() => photoRef.current.click()}
                  className="relative w-24 h-24 rounded-full bg-[#F8FAFC] border-2 border-dashed border-[#CBD5E1] flex items-center justify-center overflow-hidden hover:border-[#F97316] transition-colors group">
                  {wPhoto ? <img src={wPhoto} alt="Profile" className="w-full h-full object-cover" />
                    : <span className="text-[#94A3B8] group-hover:text-[#F97316] transition-colors"><CameraIcon size={28}/></span>}
                  {wPhoto && <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><CameraIcon size={22}/></div>}
                </button>
                <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files[0] && readFile(e.target.files[0], setWPhoto)} />
                <span className="text-xs text-[#94A3B8] mt-2">Profile photo (optional)</span>
              </div>

              <Input label="Full Name *" icon={<UserIcon size={17}/>} type="text" placeholder="Ramesh Kumar" value={wName} onChange={e => setWName(e.target.value)} />
              <Input label="Email Address *" icon={<MailIcon size={17}/>} type="email" placeholder="you@example.com" value={wEmail} onChange={e => setWEmail(e.target.value)} />

              <div>
                <label className="block text-xs font-semibold text-[#374151] uppercase tracking-wide mb-2">
                  Phone Number <span className="text-[#94A3B8] normal-case font-normal">(saved for clients)</span>
                </label>
                <div className="flex items-center bg-white border border-[#E2E8F0] rounded-xl overflow-hidden focus-within:border-[#F97316] focus-within:ring-2 focus-within:ring-[#F97316]/10 transition-all">
                  <div className="flex items-center gap-1.5 pl-4 pr-3 border-r border-[#E2E8F0] py-3.5 flex-shrink-0">
                    <PhoneIcon size={17}/><span className="text-sm font-bold text-[#0F172A]">+91</span>
                  </div>
                  <input type="tel" inputMode="numeric" maxLength={10} value={wPhone} onChange={e => setWPhone(e.target.value.replace(/\D/g,"").slice(0,10))} placeholder="98765 43210"
                    className="flex-1 px-4 py-3.5 bg-transparent text-sm text-[#0F172A] outline-none placeholder:text-[#CBD5E1]" />
                </div>
              </div>

              <div className="relative"><CityAutocomplete value={wCity} onChange={setWCity} label="Working Area *" placeholder="Search your city…" /></div>
              <PasswordInput label="Password *" value={wPass} onChange={e => setWPass(e.target.value)} placeholder="Min. 6 characters" autoComplete="new-password" />
              <PasswordInput label="Confirm Password *" value={wConfirm} onChange={e => setWConfirm(e.target.value)} placeholder="Repeat password" autoComplete="new-password" />

              {/* Section divider */}
              <div className="flex items-center gap-3 py-1">
                <div className="flex-1 h-px bg-[#E2E8F0]" />
                <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">Professional Details</span>
                <div className="flex-1 h-px bg-[#E2E8F0]" />
              </div>

              {/* Skills */}
              <div>
                <label className="block text-xs font-semibold text-[#374151] uppercase tracking-wide mb-3">
                  Your Skills * {wSkills.length > 0 && <span className="text-[#F97316] normal-case font-normal">({wSkills.length} selected)</span>}
                </label>
                <div className="flex flex-wrap gap-2">
                  {SERVICE_CATEGORIES.map(cat => (
                    <button key={cat.id} type="button" onClick={() => toggleSkill(cat.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 ${wSkills.includes(cat.id) ? "bg-[#0F172A] text-white" : "bg-white border border-[#E2E8F0] text-[#374151] hover:border-[#F97316] hover:text-[#F97316]"}`}>
                      <span>{cat.icon}</span> {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Experience pills */}
              <div>
                <label className="block text-xs font-semibold text-[#374151] uppercase tracking-wide mb-3">Experience *</label>
                <div className="flex gap-2 flex-wrap">
                  {["0-1 yr","1-3 yrs","3-5 yrs","5+ yrs"].map(exp => (
                    <button key={exp} type="button" onClick={() => setWExp(exp)}
                      className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-150 border ${wExp === exp ? "bg-[#0F172A] text-white border-[#0F172A]" : "bg-white text-[#374151] border-[#E2E8F0] hover:border-[#0F172A]"}`}>
                      {exp}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rate */}
              <div>
                <label className="block text-xs font-semibold text-[#374151] uppercase tracking-wide mb-2">Rate per Hour (₹) *</label>
                <div className="flex items-center bg-white border border-[#E2E8F0] rounded-xl overflow-hidden focus-within:border-[#F97316] focus-within:ring-2 focus-within:ring-[#F97316]/10 transition-all">
                  <span className="px-4 py-3.5 bg-[#F8FAFC] border-r border-[#E2E8F0] text-sm font-bold text-[#374151]">₹</span>
                  <input type="number" min="50" placeholder="250" value={wRate} onChange={e => setWRate(e.target.value)}
                    className="flex-1 px-4 py-3.5 bg-transparent text-sm text-[#0F172A] outline-none placeholder:text-[#CBD5E1]" />
                </div>
              </div>

              {/* Aadhaar */}
              <Input label="Aadhaar Number" icon={<BadgeIcon size={17}/>} type="text" inputMode="numeric" placeholder="12-digit Aadhaar" maxLength={12}
                value={wAadhaar} onChange={e => setWAadhaar(e.target.value.replace(/\D/g,"").slice(0,12))} />

              {/* Aadhaar photos */}
              <div className="grid grid-cols-2 gap-3">
                {[{ label:"Aadhaar Front", state: wAadhaarFront, setter: setWAadhaarFront }, { label:"Aadhaar Back", state: wAadhaarBack, setter: setWAadhaarBack }].map(({ label, state, setter }) => (
                  <div key={label}>
                    <label className="block text-xs font-semibold text-[#374151] uppercase tracking-wide mb-2">{label}</label>
                    <label className={`flex flex-col items-center justify-center h-24 rounded-xl border-2 border-dashed cursor-pointer transition-colors overflow-hidden ${state ? "border-[#F97316]" : "border-[#CBD5E1] hover:border-[#F97316]"}`}>
                      {state ? <img src={state} alt={label} className="w-full h-full object-cover" />
                        : <><span className="text-[#94A3B8]"><UploadIcon size={22}/></span><span className="text-[10px] text-[#94A3B8] mt-1">Tap to upload</span></>}
                      <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files[0] && readFile(e.target.files[0], setter)} />
                    </label>
                  </div>
                ))}
              </div>

              {/* Bio */}
              <div>
                <label className="block text-xs font-semibold text-[#374151] uppercase tracking-wide mb-2">About / Bio</label>
                <textarea value={wBio} onChange={e => setWBio(e.target.value)} rows={3}
                  placeholder="Describe your expertise and experience…"
                  className="w-full bg-white border border-[#E2E8F0] rounded-xl px-4 py-3.5 text-sm text-[#0F172A] outline-none focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/10 resize-none placeholder:text-[#CBD5E1] transition-all" />
              </div>

              <button type="submit" disabled={loading}
                className="w-full bg-[#0F172A] text-white py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#1E293B] active:scale-[0.98] transition-all disabled:opacity-50">
                {loading ? <><Spinner size={18}/>Creating…</> : <><span>Create Worker Account</span><ArrowRightIcon size={18}/></>}
              </button>
            </form>
          )}

          <p className="text-center text-xs text-[#94A3B8] mt-8">
            By registering you agree to our{" "}
            <Link href="/terms" className="underline underline-offset-2">Terms</Link> &amp;{" "}
            <Link href="/privacy" className="underline underline-offset-2">Privacy Policy</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
