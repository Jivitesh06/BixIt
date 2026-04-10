"use client";

import { useState, useEffect, useRef } from "react";
import { INDIAN_CITIES, getCurrentLocation } from "@/lib/location";
import { MapPinIcon, XIcon, Spinner } from "./Icons";

export default function LocationPicker({ value, onChange, label = "Location", required = false }) {
  const [tab,     setTab]     = useState("manual"); // "gps" | "manual"
  const [query,   setQuery]   = useState(value || "");
  const [open,    setOpen]    = useState(false);
  const [focused, setFocused] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError,   setGpsError]   = useState("");
  const wrapRef = useRef();

  const filtered = INDIAN_CITIES.filter(c =>
    !query || c.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 8);

  useEffect(() => {
    const fn = e => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  async function handleGps() {
    setGpsLoading(true); setGpsError("");
    try {
      const { city } = await getCurrentLocation();
      setQuery(city); onChange(city); setTab("manual");
    } catch {
      setGpsError("Could not detect location. Please enter manually.");
      setTab("manual");
    } finally { setGpsLoading(false); }
  }

  function select(city) {
    setQuery(city); onChange(city); setOpen(false);
  }

  function clear() {
    setQuery(""); onChange(""); setOpen(false);
  }

  return (
    <div ref={wrapRef}>
      {label && (
        <label className="block text-xs font-semibold text-[#374151] uppercase tracking-wide mb-2">
          {label}{required && " *"}
        </label>
      )}

      {/* GPS / Manual tabs */}
      <div className="flex bg-[#F8FAFC] rounded-xl p-1 border border-[#E2E8F0] mb-2">
        <button type="button" onClick={() => { setTab("gps"); handleGps(); }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[10px] text-xs font-semibold transition-all ${tab === "gps" ? "bg-white text-[#0F172A] shadow-sm" : "text-[#64748B] hover:text-[#0F172A]"}`}>
          {gpsLoading ? <Spinner size={13} color="#0F172A"/> : "📍"} Use My Location
        </button>
        <button type="button" onClick={() => setTab("manual")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[10px] text-xs font-semibold transition-all ${tab === "manual" ? "bg-white text-[#0F172A] shadow-sm" : "text-[#64748B] hover:text-[#0F172A]"}`}>
          ✏️ Enter Manually
        </button>
      </div>

      {gpsError && <p className="text-[#EF4444] text-xs mb-2">{gpsError}</p>}

      {/* Selected chip or input */}
      {query && !open ? (
        <div className="flex items-center gap-2 bg-[#FFF7ED] border border-[#FED7AA] rounded-xl px-4 py-3">
          <MapPinIcon size={15}/><span className="text-sm font-semibold text-[#C2410C] flex-1">{query}</span>
          <button type="button" onClick={clear} className="text-[#94A3B8] hover:text-[#EF4444]"><XIcon size={14}/></button>
        </div>
      ) : (
        <div className={`flex items-center bg-white border rounded-xl transition-all duration-200 ${focused ? "border-[#F97316] ring-2 ring-[#F97316]/10" : "border-[#E2E8F0]"}`}>
          <span className="pl-4 text-[#94A3B8]"><MapPinIcon size={16}/></span>
          <input type="text" value={query}
            onChange={e => { setQuery(e.target.value); onChange(e.target.value); setOpen(true); }}
            onFocus={() => { setFocused(true); setOpen(true); }}
            onBlur={() => setFocused(false)}
            placeholder="Search city…"
            className="flex-1 px-3 py-3.5 bg-transparent text-sm text-[#0F172A] outline-none placeholder:text-[#CBD5E1]"
          />
          {query && <button type="button" onMouseDown={clear} className="pr-4 text-[#94A3B8]"><XIcon size={14}/></button>}
        </div>
      )}

      {/* Dropdown */}
      {open && filtered.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-[#E2E8F0] rounded-xl shadow-lg overflow-hidden" style={{ maxHeight: 220, overflowY: "auto" }}>
          {filtered.map(city => (
            <button key={city} type="button" onMouseDown={() => select(city)}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#374151] hover:bg-[#FFF7ED] hover:text-[#F97316] transition-colors text-left">
              <MapPinIcon size={13}/>{city}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
