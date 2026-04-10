"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { createClientProfile, createWorkerProfile } from "@/lib/firestore";
import { SERVICE_CATEGORIES } from "@/lib/constants";

function Spinner() {
  return <svg className="animate-spin h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>;
}

function Input({ label, icon, ...props }) {
  return (
    <div>
      {label && <label className="block text-xs font-semibold text-[#45464d] uppercase tracking-wider mb-1.5">{label}</label>}
      <div className="flex items-center bg-white border border-[#e0e3e5] rounded-xl px-4 py-3.5 focus-within:border-[#131b2e] transition-colors">
        {icon && <span className="material-symbols-outlined text-[#76777d] mr-2" style={{ fontSize: 18 }}>{icon}</span>}
        <input className="flex-1 bg-transparent text-[#0F172A] text-sm outline-none placeholder:text-[#c6c6cd]" {...props} />
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [tab, setTab]         = useState("client");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  /* ── Client form state ─────────────────── */
  const [cName, setCName]       = useState("");
  const [cEmail, setCEmail]     = useState("");
  const [cPhone, setCPhone]     = useState("");
  const [cPass, setCPass]       = useState("");
  const [cConfirm, setCConfirm] = useState("");
  const [cArea, setCArea]       = useState("");

  /* ── Worker form state ─────────────────── */
  const [wPhoto, setWPhoto]     = useState(null);
  const [wName, setWName]       = useState("");
  const [wPhone, setWPhone]     = useState("");
  const [wArea, setWArea]       = useState("");
  const [wSkills, setWSkills]   = useState([]);
  const [wExp, setWExp]         = useState("");
  const [wRate, setWRate]       = useState("");
  const [wAadhaar, setWAadhaar] = useState("");
  const [wAadhaarFront, setWAadhaarFront] = useState(null);
  const [wAadhaarBack, setWAadhaarBack]   = useState(null);
  const [wBio, setWBio]         = useState("");
  const [wOtpSent, setWOtpSent] = useState(false);
  const [wOtp, setWOtp]         = useState(["","","",""]);
  const [wConfirmResult, setWConfirmResult] = useState(null);
  const otpRefs = [useRef(), useRef(), useRef(), useRef()];
  const photoRef = useRef();

  function handlePhotoChange(e, setter) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setter(ev.target.result);
    reader.readAsDataURL(file);
  }

  function toggleSkill(id) {
    setWSkills(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  }

  /* ── Client Register ───────────────────── */
  async function handleClientRegister(e) {
    e.preventDefault();
    setError("");
    if (cPass !== cConfirm) { setError("Passwords do not match."); return; }
    if (cPass.length < 6)   { setError("Password must be at least 6 characters."); return; }
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, cEmail, cPass);
      await createClientProfile(cred.user.uid, {
        name: cName, email: cEmail, phone: cPhone, area: cArea,
      });
      router.push("/client/dashboard");
    } catch (err) {
      setError(
        err.code === "auth/email-already-in-use" ? "An account with this email already exists." :
        err.code === "auth/invalid-email"         ? "Invalid email address." :
        "Registration failed. Please try again."
      );
    } finally { setLoading(false); }
  }

  /* ── Worker: Send OTP ──────────────────── */
  async function handleWorkerSendOTP() {
    if (!wPhone || wPhone.length < 10) { setError("Enter a valid 10-digit phone number."); return; }
    if (!wName || !wArea || wSkills.length === 0 || !wExp || !wRate || !wAadhaar) {
      setError("Please fill all required fields before OTP verification."); return;
    }
    if (wAadhaar.length !== 12) { setError("Aadhaar number must be exactly 12 digits."); return; }
    setError(""); setLoading(true);
    try {
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, "w-recaptcha", { size: "invisible", callback: () => {} });
      }
      const result = await signInWithPhoneNumber(auth, `+91${wPhone}`, window.recaptchaVerifier);
      setWConfirmResult(result);
      setWOtpSent(true);
    } catch (err) {
      setError("Failed to send OTP. Please try again.");
      if (window.recaptchaVerifier) { window.recaptchaVerifier.clear(); window.recaptchaVerifier = null; }
    } finally { setLoading(false); }
  }

  /* ── Worker: Verify & Register ─────────── */
  async function handleWorkerVerify() {
    const otpStr = wOtp.join("");
    if (otpStr.length < 4) { setError("Enter the 4-digit OTP."); return; }
    setError(""); setLoading(true);
    try {
      const cred = await wConfirmResult.confirm(otpStr);
      await createWorkerProfile(cred.user.uid, {
        name: wName, phone: wPhone, area: wArea,
        skills: wSkills, experience: wExp,
        ratePerHour: Number(wRate),
        aadhaarNumber: wAadhaar,
        aadhaarFrontPhoto: wAadhaarFront || "",
        aadhaarBackPhoto: wAadhaarBack || "",
        bio: wBio,
        profilePhoto: wPhoto || "",
      });
      router.push("/worker/dashboard");
    } catch (err) {
      setError("Verification failed. Please try again.");
    } finally { setLoading(false); }
  }

  function handleOtpChange(i, val) {
    if (!/^\d?$/.test(val)) return;
    const next = [...wOtp]; next[i] = val; setWOtp(next);
    if (val && i < 3) otpRefs[i + 1].current?.focus();
    if (!val && i > 0) otpRefs[i - 1].current?.focus();
  }

  return (
    <div className="min-h-screen bg-[#f7f9fb] pb-10">
      <div id="w-recaptcha" />

      {/* Header */}
      <nav className="flex items-center justify-between px-5 h-14 bg-white border-b border-gray-100 sticky top-0 z-10">
        <Link href="/" className="font-headline font-black text-[#0F172A] text-xl">Bixit</Link>
        <Link href="/login" className="text-[#F97316] font-bold text-sm hover:underline">Login</Link>
      </nav>

      <div className="max-w-md mx-auto px-5 pt-8">
        <div className="text-center mb-7">
          <h1 className="font-headline font-bold text-2xl text-[#0F172A]">Create an account</h1>
          <p className="text-[#45464d] text-sm mt-1">Join Bixit today</p>
        </div>

        {/* Tab */}
        <div className="flex bg-[#f2f4f6] rounded-2xl p-1 mb-7">
          {["client","worker"].map(t => (
            <button key={t} onClick={() => { setTab(t); setError(""); setWOtpSent(false); }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${tab === t ? "bg-white text-[#0F172A] shadow-sm" : "text-[#45464d]"}`}
            >
              {t === "client" ? "I'm a Client" : "I'm a Worker"}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-5">
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>error</span>
            {error}
          </div>
        )}

        {/* ── CLIENT TAB ── */}
        {tab === "client" && (
          <form onSubmit={handleClientRegister} className="space-y-4">
            <Input label="Full Name" icon="person" type="text" placeholder="Rahul Sharma" value={cName} onChange={e => setCName(e.target.value)} required />
            <Input label="Email" icon="mail" type="email" placeholder="you@example.com" value={cEmail} onChange={e => setCEmail(e.target.value)} required />
            <div>
              <label className="block text-xs font-semibold text-[#45464d] uppercase tracking-wider mb-1.5">Phone</label>
              <div className="flex items-center bg-white border border-[#e0e3e5] rounded-xl overflow-hidden focus-within:border-[#131b2e] transition-colors">
                <span className="px-4 py-3.5 bg-[#f2f4f6] border-r border-[#e0e3e5] text-sm font-bold text-[#0F172A]">+91</span>
                <input type="tel" placeholder="9876543210" value={cPhone} onChange={e => setCPhone(e.target.value.replace(/\D/g,"").slice(0,10))}
                  className="flex-1 px-4 py-3.5 bg-transparent text-sm text-[#0F172A] outline-none placeholder:text-[#c6c6cd]" />
              </div>
            </div>
            <Input label="Area / Locality" icon="location_on" type="text" placeholder="e.g. Andheri West, Mumbai" value={cArea} onChange={e => setCArea(e.target.value)} required />
            <Input label="Password" icon="lock" type="password" placeholder="Min. 6 characters" value={cPass} onChange={e => setCPass(e.target.value)} required />
            <Input label="Confirm Password" icon="lock" type="password" placeholder="Repeat password" value={cConfirm} onChange={e => setCConfirm(e.target.value)} required />
            <button type="submit" disabled={loading}
              className="w-full bg-[#131b2e] text-white py-4 rounded-2xl font-headline font-bold text-base hover:bg-[#1e2a45] active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading && <Spinner />}
              {loading ? "Creating account…" : "Create Client Account"}
            </button>
          </form>
        )}

        {/* ── WORKER TAB ── */}
        {tab === "worker" && (
          <div className="space-y-5">
            {/* Profile Photo */}
            <div className="flex flex-col items-center">
              <button type="button" onClick={() => photoRef.current.click()}
                className="w-24 h-24 rounded-full bg-[#f2f4f6] border-2 border-dashed border-[#c6c6cd] flex items-center justify-center overflow-hidden hover:border-[#F97316] transition-colors"
              >
                {wPhoto
                  ? <img src={wPhoto} alt="Profile" className="w-full h-full object-cover" />
                  : <span className="material-symbols-outlined text-[#76777d]" style={{ fontSize: 32 }}>add_a_photo</span>
                }
              </button>
              <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={e => handlePhotoChange(e, setWPhoto)} />
              <span className="text-xs text-[#45464d] mt-2">Tap to add profile photo</span>
            </div>

            <Input label="Full Name *" icon="person" type="text" placeholder="Ramesh Kumar" value={wName} onChange={e => setWName(e.target.value)} required />

            <div>
              <label className="block text-xs font-semibold text-[#45464d] uppercase tracking-wider mb-1.5">Phone Number *</label>
              <div className="flex items-center bg-white border border-[#e0e3e5] rounded-xl overflow-hidden focus-within:border-[#131b2e]">
                <span className="px-4 py-3.5 bg-[#f2f4f6] border-r border-[#e0e3e5] text-sm font-bold text-[#0F172A]">+91</span>
                <input type="tel" placeholder="9876543210" value={wPhone} onChange={e => setWPhone(e.target.value.replace(/\D/g,"").slice(0,10))}
                  className="flex-1 px-4 py-3.5 bg-transparent text-sm text-[#0F172A] outline-none placeholder:text-[#c6c6cd]" />
              </div>
            </div>

            <Input label="Area / Locality *" icon="location_on" type="text" placeholder="e.g. Bandra, Mumbai" value={wArea} onChange={e => setWArea(e.target.value)} required />

            {/* Skills */}
            <div>
              <label className="block text-xs font-semibold text-[#45464d] uppercase tracking-wider mb-2">Your Skills * <span className="text-[#F97316]">({wSkills.length} selected)</span></label>
              <div className="flex flex-wrap gap-2">
                {SERVICE_CATEGORIES.map(cat => (
                  <button key={cat.id} type="button" onClick={() => toggleSkill(cat.id)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 ${wSkills.includes(cat.id) ? "bg-[#fd761a] text-white shadow-sm" : "bg-white border border-[#e0e3e5] text-[#45464d] hover:border-[#fd761a]"}`}
                  >
                    <span>{cat.icon}</span> {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Experience */}
            <div>
              <label className="block text-xs font-semibold text-[#45464d] uppercase tracking-wider mb-1.5">Experience *</label>
              <div className="bg-white border border-[#e0e3e5] rounded-xl px-4 py-3.5 focus-within:border-[#131b2e]">
                <select value={wExp} onChange={e => setWExp(e.target.value)} required
                  className="w-full bg-transparent text-sm text-[#0F172A] outline-none">
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
                <input type="number" placeholder="250" value={wRate} onChange={e => setWRate(e.target.value)} min="50"
                  className="flex-1 px-4 py-3.5 bg-transparent text-sm text-[#0F172A] outline-none placeholder:text-[#c6c6cd]" />
              </div>
            </div>

            {/* Aadhaar */}
            <div>
              <label className="block text-xs font-semibold text-[#45464d] uppercase tracking-wider mb-1.5">Aadhaar Number *</label>
              <div className="flex items-center bg-white border border-[#e0e3e5] rounded-xl px-4 py-3.5 focus-within:border-[#131b2e]">
                <span className="material-symbols-outlined text-[#76777d] mr-2" style={{ fontSize: 18 }}>badge</span>
                <input type="text" inputMode="numeric" placeholder="12-digit Aadhaar number" maxLength={12}
                  value={wAadhaar} onChange={e => setWAadhaar(e.target.value.replace(/\D/g,"").slice(0,12))}
                  className="flex-1 bg-transparent text-sm text-[#0F172A] outline-none placeholder:text-[#c6c6cd]" />
              </div>
            </div>

            {/* Aadhaar photos */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Aadhaar Front", state: wAadhaarFront, setter: setWAadhaarFront },
                { label: "Aadhaar Back",  state: wAadhaarBack,  setter: setWAadhaarBack  },
              ].map(({ label, state, setter }) => {
                const ref = { current: null };
                return (
                  <div key={label}>
                    <label className="block text-xs font-semibold text-[#45464d] uppercase tracking-wider mb-1.5">{label}</label>
                    <label className={`flex flex-col items-center justify-center h-24 rounded-xl border-2 border-dashed cursor-pointer transition-colors overflow-hidden ${state ? "border-[#fd761a]" : "border-[#c6c6cd] hover:border-[#fd761a]"}`}>
                      {state ? <img src={state} alt={label} className="w-full h-full object-cover" />
                        : <><span className="material-symbols-outlined text-[#76777d]" style={{ fontSize: 28 }}>upload_file</span><span className="text-[10px] text-[#45464d] mt-1">Upload</span></>
                      }
                      <input type="file" accept="image/*" className="hidden" onChange={e => handlePhotoChange(e, setter)} />
                    </label>
                  </div>
                );
              })}
            </div>

            {/* Bio */}
            <div>
              <label className="block text-xs font-semibold text-[#45464d] uppercase tracking-wider mb-1.5">About / Bio</label>
              <textarea placeholder="Describe your experience and expertise…" value={wBio} onChange={e => setWBio(e.target.value)} rows={3}
                className="w-full bg-white border border-[#e0e3e5] rounded-xl px-4 py-3.5 text-sm text-[#0F172A] outline-none focus:border-[#131b2e] resize-none placeholder:text-[#c6c6cd] transition-colors" />
            </div>

            {/* OTP section */}
            {wOtpSent ? (
              <div className="space-y-4">
                <label className="block text-xs font-semibold text-[#45464d] uppercase tracking-wider">OTP sent to +91{wPhone}</label>
                <div className="flex gap-3 justify-center">
                  {wOtp.map((d, i) => (
                    <input key={i} ref={otpRefs[i]} type="text" inputMode="numeric" maxLength={1} value={d}
                      onChange={e => handleOtpChange(i, e.target.value)}
                      onKeyDown={e => e.key === "Backspace" && !wOtp[i] && i > 0 && otpRefs[i-1].current?.focus()}
                      className="w-14 h-14 text-center text-2xl font-bold bg-white border-2 border-[#e0e3e5] rounded-2xl text-[#0F172A] outline-none focus:border-[#131b2e] transition-colors"
                    />
                  ))}
                </div>
                <button onClick={handleWorkerVerify} disabled={loading}
                  className="w-full bg-[#131b2e] text-white py-4 rounded-2xl font-headline font-bold text-base hover:bg-[#1e2a45] active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {loading && <Spinner />} {loading ? "Creating account…" : "Verify & Register"}
                </button>
              </div>
            ) : (
              <button onClick={handleWorkerSendOTP} disabled={loading}
                className="w-full bg-[#131b2e] text-white py-4 rounded-2xl font-headline font-bold text-base hover:bg-[#1e2a45] active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading && <Spinner />} {loading ? "Sending OTP…" : "Verify Phone & Register"}
              </button>
            )}
          </div>
        )}

        <p className="text-center text-sm text-[#45464d] mt-8">
          Already have an account?{" "}
          <Link href="/login" className="text-[#F97316] font-bold hover:underline">Login</Link>
        </p>
      </div>
    </div>
  );
}
