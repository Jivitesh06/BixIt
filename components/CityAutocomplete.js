"use client";

import { useState, useRef, useEffect } from "react";
import { MapPinIcon } from "./Icons";

export const INDIAN_CITIES = [
  "Mumbai","Delhi","Bangalore","Chennai","Hyderabad","Pune",
  "Kolkata","Ahmedabad","Jaipur","Chandigarh","Ludhiana","Bathinda",
  "Rohini","Dwarka","Noida","Gurgaon","Faridabad","Ghaziabad",
  "Surat","Vadodara","Nagpur","Indore","Bhopal","Patna",
  "Lucknow","Kanpur","Agra","Nashik","Rajkot","Meerut",
  "Varanasi","Srinagar","Aurangabad","Dhanbad","Amritsar",
  "Allahabad","Ranchi","Coimbatore","Jabalpur","Gwalior",
];

export default function CityAutocomplete({
  value, onChange, placeholder = "Select your city",
  label = "Location", required = false, error,
}) {
  const [query,   setQuery]   = useState(value || "");
  const [open,    setOpen]    = useState(false);
  const [focused, setFocused] = useState(false);
  const wrapRef = useRef();

  const filtered = INDIAN_CITIES.filter(c =>
    c.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 8);

  useEffect(() => {
    function handle(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  function select(city) {
    setQuery(city);
    onChange(city);
    setOpen(false);
  }

  return (
    <div ref={wrapRef}>
      {label && (
        <label className="block text-xs font-semibold text-[#374151] uppercase tracking-wide mb-2">
          {label}{required && " *"}
        </label>
      )}
      <div className={`relative flex items-center bg-white border rounded-xl transition-all duration-200 ${
        error ? "border-[#EF4444] ring-1 ring-[#EF4444]/20"
              : focused ? "border-[#F97316] ring-2 ring-[#F97316]/10"
              : "border-[#E2E8F0]"
      }`}>
        <span className="pl-4 text-[#94A3B8] flex-shrink-0"><MapPinIcon size={17} /></span>
        <input
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); onChange(e.target.value); setOpen(true); }}
          onFocus={() => { setFocused(true); setOpen(true); }}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          className="flex-1 px-3 py-3.5 bg-transparent text-sm text-[#0F172A] outline-none placeholder:text-[#CBD5E1]"
        />
        {query && (
          <button type="button" onClick={() => { setQuery(""); onChange(""); }}
            className="pr-4 text-[#94A3B8] hover:text-[#64748B]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        )}
      </div>
      {error && <p className="text-[#EF4444] text-xs mt-1.5">{error}</p>}

      {open && filtered.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-[#E2E8F0] rounded-xl shadow-lg overflow-hidden"
          style={{ maxHeight: 220, overflowY: "auto" }}>
          {query === "" && (
            <div className="px-4 py-2.5 text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider border-b border-[#F1F5F9]">
              Popular Cities
            </div>
          )}
          {filtered.map(city => (
            <button key={city} type="button" onMouseDown={() => select(city)}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#374151] hover:bg-[#FFF7ED] hover:text-[#F97316] transition-colors text-left">
              <MapPinIcon size={14} />
              <span>{city}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
