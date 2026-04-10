"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SERVICE_CATEGORIES, TRANSLATIONS } from "@/lib/constants";
import { SearchIcon, MenuIcon, XIcon, ChevronRightIcon, CheckIcon, ArrowRightIcon, ShieldIcon, StarIcon, ZapIcon, MapPinIcon } from "@/components/Icons";

const CAT_SYMBOL = {
  electrician:"⚡", plumber:"🔧", carpenter:"🪚", painter:"🎨", mason:"🧱",
  ac_repair:"❄️", appliance_repair:"📱", tile_fitter:"⬜", welder:"🔥",
  gardener:"🌿", pest_control:"🐛", house_cleaner:"🧹", packers_movers:"📦",
  mechanic:"🚗", ro_repair:"💧", false_ceiling:"🏠", flooring:"🪵",
};

const HOW = [
  { n:1, title:"Choose a service", desc:"Browse 50+ categories and find exactly who you need.", icon:"🔍" },
  { n:2, title:"Book instantly",   desc:"Pick a time, confirm details—done in under 2 minutes.", icon:"⚡" },
  { n:3, title:"Get it done",      desc:"Pay securely only after you're satisfied. Guaranteed.", icon:"✅" },
];

export default function LandingPage() {
  const [lang, setLang]     = useState("en");
  const [menu, setMenu]     = useState(false);
  const t = TRANSLATIONS[lang];
  const isHi = lang === "hi";

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A]">
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        .fade-up { animation: fadeUp 0.5s ease forwards; }
        .fade-up-2 { animation: fadeUp 0.5s 0.1s ease both; }
        .fade-up-3 { animation: fadeUp 0.5s 0.2s ease both; }
      `}</style>

      {/* ── NAVBAR ── */}
      <nav className="bg-white/90 backdrop-blur-md border-b border-[#E2E8F0] sticky top-0 z-50 px-5 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => setMenu(true)} className="text-[#64748B] hover:text-[#0F172A] lg:hidden">
            <MenuIcon size={22}/>
          </button>
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#0F172A] rounded-xl flex items-center justify-center">
              <span className="text-white font-black text-sm">B</span>
            </div>
            <span className="font-black text-[#0F172A] text-xl tracking-tight">Bixit</span>
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setLang(l => l==="en"?"hi":"en")}
            className="text-xs font-bold text-[#64748B] hover:text-[#0F172A] border border-[#E2E8F0] hover:border-[#CBD5E1] px-3 py-1.5 rounded-full transition-all">
            {lang === "en" ? "EN | हिं" : "हिं | EN"}
          </button>
          <Link href="/login" className="hidden sm:block text-sm font-semibold text-[#374151] hover:text-[#0F172A] transition-colors">
            Sign in
          </Link>
          <Link href="/register" className="bg-[#0F172A] text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-[#1E293B] transition-colors">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Mobile slide menu */}
      {menu && (
        <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm" onClick={() => setMenu(false)}>
          <div className="bg-white w-72 h-full p-8 shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-10">
              <span className="font-black text-2xl text-[#0F172A]">Bixit</span>
              <button onClick={() => setMenu(false)} className="text-[#94A3B8] hover:text-[#0F172A]"><XIcon size={22}/></button>
            </div>
            <div className="space-y-1 flex-1">
              {[{label:"Home", href:"/"},{label:"Sign in", href:"/login"},{label:"Register", href:"/register"}].map(item => (
                <Link key={item.href} href={item.href} onClick={() => setMenu(false)}
                  className="flex items-center justify-between py-3 px-4 rounded-xl text-[#374151] font-medium hover:bg-[#FFF7ED] hover:text-[#F97316] transition-colors">
                  {item.label}<ChevronRightIcon size={16}/>
                </Link>
              ))}
            </div>
            <p className="text-xs text-[#94A3B8]">© 2025 Bixit Technologies</p>
          </div>
        </div>
      )}

      {/* ── HERO ── */}
      <section className="px-5 pt-16 pb-16 relative overflow-hidden max-w-5xl mx-auto">
        <div className="absolute -right-20 top-0 w-80 h-80 bg-[#F97316]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 bottom-0 w-60 h-60 bg-[#0F172A]/3 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-2xl fade-up">
          <div className="inline-flex items-center gap-2 bg-[#FFF7ED] border border-[#FED7AA] text-[#C2410C] text-xs font-bold px-3 py-1.5 rounded-full mb-6 uppercase tracking-wider">
            <ShieldIcon size={13}/> Aadhaar Verified Workers
          </div>
          <h1 className={`font-black text-5xl sm:text-6xl leading-[1.05] tracking-tight mb-6 ${isHi ? "text-4xl" : ""}`}>
            {t.findWorker || "Find Trusted\nWorkers, Instantly."}
          </h1>
          <p className="text-[#64748B] text-lg leading-relaxed mb-10 max-w-lg">
            {isHi
              ? "मिनटों में सत्यापित प्लंबर, इलेक्ट्रीशियन से जुड़ें। आपकी दहलीज पर कुशल श्रमिक।"
              : "Connect with verified plumbers, electricians & professionals in minutes. Skilled labor at your doorstep."}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-sm fade-up-2">
            <Link href="/login" id="cta-client"
              className="flex-1 bg-[#0F172A] text-white py-4 px-6 rounded-2xl font-bold text-base flex items-center justify-between hover:bg-[#1E293B] active:scale-[0.98] transition-all shadow-lg shadow-[#0F172A]/20">
              <span>{t.iNeedWorker || "I Need a Worker"}</span><ArrowRightIcon size={20}/>
            </Link>
            <Link href="/login?role=worker" id="cta-worker"
              className="flex-1 bg-white text-[#0F172A] py-4 px-6 rounded-2xl font-bold text-base flex items-center justify-between border-2 border-[#E2E8F0] hover:border-[#0F172A] active:scale-[0.98] transition-all">
              <span>{t.imWorker || "I'm a Worker"}</span><ArrowRightIcon size={20}/>
            </Link>
          </div>
        </div>

        {/* Trust badges */}
        <div className="flex items-center gap-6 mt-10 overflow-x-auto scrollbar-hide pb-1 fade-up-3">
          {[
            { icon:<ShieldIcon size={14}/>, label:"Aadhaar Verified" },
            { icon:<StarIcon size={14}/>, label:"Top Rated" },
            { icon:<CheckIcon size={14}/>, label:"100% Safe" },
            { icon:<ZapIcon size={14}/>, label:"Instant Booking" },
          ].map(b => (
            <div key={b.label} className="flex items-center gap-1.5 text-[#64748B] text-xs font-semibold flex-shrink-0">
              <span className="text-[#94A3B8]">{b.icon}</span>{b.label}
            </div>
          ))}
        </div>
      </section>

      {/* ── POPULAR SERVICES ── */}
      <section className="px-5 py-14 max-w-5xl mx-auto">
        <div className="flex items-end justify-between mb-8">
          <h2 className="font-black text-3xl text-[#0F172A]">Popular Services</h2>
          <Link href="/login" className="text-sm font-bold text-[#F97316] hover:underline flex items-center gap-1">
            View all <ChevronRightIcon size={16}/>
          </Link>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {SERVICE_CATEGORIES.map(cat => (
            <Link key={cat.id} href="/login"
              className="flex flex-col items-center justify-center p-3 bg-white rounded-2xl border border-[#E2E8F0] aspect-square hover:shadow-md hover:border-[#F97316]/40 hover:-translate-y-0.5 active:scale-95 transition-all duration-200 group">
              <span className="text-2xl mb-2 transition-transform group-hover:scale-110 duration-200">
                {CAT_SYMBOL[cat.id] || cat.icon || "🔧"}
              </span>
              <span className="text-[9.5px] font-bold text-center text-[#374151] leading-tight">{cat.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="bg-white border-y border-[#E2E8F0] px-5 py-16">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-black text-3xl text-[#0F172A]">How Bixit works</h2>
            <p className="text-[#64748B] mt-2">Book a skilled worker in 3 simple steps</p>
          </div>
          <div className="space-y-8">
            {HOW.map((step, i) => (
              <div key={step.n} className="flex gap-6 items-start">
                <div className="flex-shrink-0 w-14 h-14 bg-[#0F172A] text-white rounded-2xl flex items-center justify-center text-2xl shadow-lg shadow-[#0F172A]/20">
                  {step.icon}
                </div>
                <div className="pt-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-[#F97316] uppercase tracking-wider">Step {step.n}</span>
                  </div>
                  <h3 className="font-bold text-xl text-[#0F172A] mb-1.5">{step.title}</h3>
                  <p className="text-[#64748B] leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WORKER OF THE MONTH ── */}
      <section className="px-5 py-16 max-w-5xl mx-auto">
        <div className="bg-[#0F172A] rounded-3xl p-8 relative overflow-hidden">
          <div className="absolute -right-12 -top-12 w-52 h-52 bg-[#F97316]/10 rounded-full pointer-events-none" />
          <div className="absolute right-6 bottom-4 w-24 h-24 bg-white/5 rounded-full pointer-events-none" />
          <div className="relative">
            <span className="inline-block bg-[#F97316] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full mb-5">
              Worker of the Month
            </span>
            <h3 className="text-white font-black text-3xl mb-1">Ramesh Kumar</h3>
            <p className="text-[#475569] mb-6">Expert Electrician · Mumbai</p>
            <div className="flex gap-6 mb-7">
              {[{ val:"4.9★", sub:"Rating" },{ val:"250+", sub:"Jobs Done" },{ val:"✓", sub:"Aadhaar" }].map(s => (
                <div key={s.sub}>
                  <p className="text-white font-black text-xl">{s.val}</p>
                  <p className="text-[#475569] text-xs mt-0.5">{s.sub}</p>
                </div>
              ))}
            </div>
            <Link href="/login" className="inline-flex items-center gap-2 bg-white text-[#0F172A] px-6 py-3 rounded-xl font-bold text-sm hover:bg-[#F8FAFC] active:scale-95 transition-all">
              View Profile <ArrowRightIcon size={16}/>
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-white border-t border-[#E2E8F0] px-5 py-14 max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between gap-8 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-[#0F172A] rounded-xl flex items-center justify-center"><span className="text-white font-black text-sm">B</span></div>
              <span className="font-black text-[#0F172A] text-xl">Bixit</span>
            </div>
            <p className="text-[#64748B] text-sm max-w-xs leading-relaxed">Empowering skilled labor through technology and trust.</p>
          </div>
          <div className="grid grid-cols-2 gap-8">
            {[
              { title:"Company", links:["About Us","Careers","Press","Blog"] },
              { title:"Legal",   links:["Terms","Privacy","Cookies","Security"] },
            ].map(col => (
              <div key={col.title}>
                <h4 className="text-xs font-bold text-[#0F172A] uppercase tracking-widest mb-3">{col.title}</h4>
                <ul className="space-y-2">
                  {col.links.map(l => <li key={l}><Link href="#" className="text-sm text-[#64748B] hover:text-[#F97316] transition-colors">{l}</Link></li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="border-t border-[#F1F5F9] pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[#94A3B8]">© 2025 Bixit Technologies Pvt. Ltd. All rights reserved.</p>
          <button onClick={() => setLang(l => l==="en"?"hi":"en")} className="text-xs font-semibold text-[#64748B] hover:text-[#F97316] border border-[#E2E8F0] px-3 py-1.5 rounded-full transition-colors">
            {lang==="en"?"🇮🇳 हिन्दी में देखें":"🇺🇸 View in English"}
          </button>
        </div>
      </footer>

      {/* Mobile sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-t border-[#E2E8F0] px-4 py-3 flex gap-3 lg:hidden">
        <Link href="/login" className="flex-1 bg-[#0F172A] text-white py-3 rounded-xl font-bold text-sm text-center hover:bg-[#1E293B]">Find Workers</Link>
        <Link href="/register?role=worker" className="flex-1 border-2 border-[#0F172A] text-[#0F172A] py-3 rounded-xl font-bold text-sm text-center hover:bg-[#F8FAFC]">Join as Worker</Link>
      </div>
    </div>
  );
}
