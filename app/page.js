"use client";

import { useState } from "react";
import Link from "next/link";
import { SERVICE_CATEGORIES, TRANSLATIONS } from "@/lib/constants";

/* ─── Material Symbol helper ───────────────────────────── */
function Icon({ name, size = 24, className = "" }) {
  return (
    <span
      className={`material-symbols-outlined select-none ${className}`}
      style={{ fontSize: size, lineHeight: 1 }}
    >
      {name}
    </span>
  );
}

/* ─── Map category id → Material Symbol name ───────────── */
const CAT_SYMBOL = {
  electrician:     "electrical_services",
  plumber:         "plumbing",
  carpenter:       "carpenter",
  painter:         "imagesearch_roller",
  mason:           "construction",
  ac_repair:       "ac_unit",
  appliance_repair:"home_repair_service",
  tile_fitter:     "grid_view",
  welder:          "whatshot",
  gardener:        "yard",
  pest_control:    "pest_control",
  house_cleaner:   "cleaning_services",
  packers_movers:  "local_shipping",
  mechanic:        "car_repair",
  ro_repair:       "water_drop",
  false_ceiling:   "roofing",
  flooring:        "texture",
};

const HOW_IT_WORKS = [
  {
    num: 1,
    titleKey: "Pick a Service",
    desc: "Browse 50+ categories and select exactly what you need done today.",
  },
  {
    num: 2,
    titleKey: "Connect with Pros",
    desc: "Chat with verified workers near you. Compare ratings and prices instantly.",
  },
  {
    num: 3,
    titleKey: "Get it Done",
    desc: "Pay securely through the app only after you are 100% satisfied with the work.",
  },
];

export default function LandingPage() {
  const [lang, setLang]       = useState("en");
  const [menuOpen, setMenuOpen] = useState(false);
  const t = TRANSLATIONS[lang];
  const isHi = lang === "hi";

  const toggleLang = () => setLang((l) => (l === "en" ? "hi" : "en"));

  return (
    <>
      {/* ── Global font imports ─────────────────────────── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800;900&family=Inter:wght@400;500;600&family=Noto+Sans+Devanagari:wght@400;500;700&display=swap');

        .material-symbols-outlined{font-family:'Material Symbols Outlined';font-style:normal;font-weight:normal;line-height:1;letter-spacing:normal;text-transform:none;display:inline-block;white-space:nowrap;word-wrap:normal;direction:ltr;-webkit-font-smoothing:antialiased;}
        .font-headline{font-family:'Manrope',sans-serif;}
        .font-deva{font-family:'Noto Sans Devanagari',sans-serif;}
        .scrollbar-hide::-webkit-scrollbar{display:none;}
        .scrollbar-hide{-ms-overflow-style:none;scrollbar-width:none;}
        body{background:#f7f9fb;}
      `}</style>

      <div className="bg-[#f7f9fb] min-h-screen text-[#191c1e] relative">

        {/* ════════════════════════════════════════════════
            NAVBAR
        ════════════════════════════════════════════════ */}
        <nav className="bg-[#f7f9fb] sticky top-0 z-50 flex justify-between items-center px-5 h-16 w-full border-b border-[#e0e3e5]/60 backdrop-blur-sm bg-[#f7f9fb]/90">
          <div className="flex items-center gap-3">
            <button
              id="hamburger-btn"
              onClick={() => setMenuOpen(true)}
              className="text-[#0F172A] hover:text-[#F97316] transition-colors p-1 -ml-1"
              aria-label="Open menu"
            >
              <Icon name="menu" size={26} />
            </button>
            <Link href="/" className="font-headline font-black text-[#0F172A] text-2xl tracking-tight">
              Bixit
            </Link>
          </div>

          <div className="flex items-center gap-5">
            <button
              id="lang-toggle"
              onClick={toggleLang}
              className="font-headline font-bold text-[#0F172A] text-sm hover:text-[#F97316] transition-colors px-2 py-1 rounded-lg hover:bg-[#F97316]/10"
            >
              {lang === "en" ? "EN | हिं" : "हिं | EN"}
            </button>
            <Link
              href="/login"
              id="nav-login"
              className="text-[#F97316] font-bold text-sm hover:opacity-75 transition-opacity"
            >
              Login
            </Link>
          </div>
        </nav>

        {/* ── Mobile slide-out menu ────────────────────── */}
        {menuOpen && (
          <div
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
          >
            <div
              className="bg-white w-72 h-full p-8 shadow-2xl flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-10">
                <span className="font-headline font-black text-2xl text-[#0F172A]">Bixit</span>
                <button onClick={() => setMenuOpen(false)} className="text-[#45464d] hover:text-[#F97316] transition-colors">
                  <Icon name="close" size={24} />
                </button>
              </div>
              <ul className="space-y-1 flex-1">
                {[
                  { label: "Home", href: "/" },
                  { label: "Login", href: "/login" },
                  { label: "Register", href: "/register" },
                ].map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 py-3 px-3 rounded-xl text-[#0F172A] font-medium hover:bg-[#F97316]/10 hover:text-[#F97316] transition-colors"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-[#76777d] mt-auto">© 2025 Bixit. All rights reserved.</p>
            </div>
          </div>
        )}

        <main className="w-full pb-28">

          {/* ════════════════════════════════════════════
              HERO SECTION
          ════════════════════════════════════════════ */}
          <section className="px-6 pt-12 pb-10 bg-[#f7f9fb] overflow-hidden relative">
            {/* Decorative blobs */}
            <div className="absolute -right-16 top-10 w-72 h-72 bg-[#fd761a]/8 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -left-10 bottom-0 w-48 h-48 bg-[#131b2e]/5 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 max-w-2xl">
              {/* Pill badge */}
              <div className="inline-flex items-center gap-1.5 bg-[#fd761a]/10 text-[#9d4300] text-xs font-bold px-3 py-1.5 rounded-full mb-5 font-headline uppercase tracking-wider">
                <Icon name="verified" size={14} />
                Aadhaar Verified Workers
              </div>

              <h1
                className={`font-headline font-extrabold text-[2.6rem] leading-[1.08] text-[#0F172A] tracking-tight mb-4 ${isHi ? "font-deva" : ""}`}
              >
                {t.findWorker}
              </h1>

              <p className="text-[#45464d] text-[1.05rem] mb-10 max-w-[88%] leading-relaxed">
                {isHi
                  ? "मिनटों में सत्यापित प्लंबर, इलेक्ट्रीशियन और पेशेवरों से जुड़ें। अपनी दहलीज पर कुशल मजदूर।"
                  : "Connect with verified plumbers, electricians, and professionals in minutes. Skilled labor at your doorstep."}
              </p>

              <div className="flex flex-col gap-3.5 max-w-sm">
                <Link
                  href="/login"
                  id="cta-need-worker"
                  className={`bg-[#131b2e] text-white py-4 px-7 rounded-2xl font-bold text-[1.05rem] flex items-center justify-between shadow-lg shadow-[#131b2e]/20 hover:bg-[#1e2a45] active:scale-[0.97] transition-all duration-150 ${isHi ? "font-deva" : "font-headline"}`}
                >
                  <span>{t.iNeedWorker}</span>
                  <Icon name="arrow_forward" size={22} />
                </Link>

                <Link
                  href="/login"
                  id="cta-im-worker"
                  className={`bg-white text-[#0F172A] border border-[#c6c6cd]/60 py-4 px-7 rounded-2xl font-bold text-[1.05rem] flex items-center justify-between hover:border-[#F97316]/50 hover:text-[#F97316] active:scale-[0.97] transition-all duration-150 ${isHi ? "font-deva" : "font-headline"}`}
                >
                  <span>{t.imWorker}</span>
                  <Icon name="engineering" size={22} />
                </Link>
              </div>
            </div>
          </section>

          {/* ════════════════════════════════════════════
              TRUST BADGES
          ════════════════════════════════════════════ */}
          <section className="bg-[#f2f4f6] py-5 px-6 overflow-x-auto scrollbar-hide">
            <div className="flex gap-7 items-center min-w-max">
              {[
                { icon: "verified_user", label: t.verified || "Aadhaar Verified" },
                { icon: "star", label: "Top Rated" },
                { icon: "shield", label: "100% Safe" },
                { icon: "payments", label: "Flexible Payment" },
              ].map((b) => (
                <div key={b.label} className="flex items-center gap-2 opacity-60 flex-shrink-0">
                  <Icon name={b.icon} size={16} className="text-[#0F172A]" />
                  <span className={`text-[10px] uppercase tracking-[0.12em] font-bold text-[#0F172A] ${isHi ? "font-deva" : ""}`}>
                    {b.label}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* ════════════════════════════════════════════
              POPULAR SERVICES
          ════════════════════════════════════════════ */}
          <section className="px-5 py-12">
            <div className="flex justify-between items-end mb-7">
              <h2 className="font-headline font-bold text-[1.45rem] text-[#0F172A]">
                Popular Services
              </h2>
              <Link
                href="/login"
                className="text-[#9d4300] font-bold text-sm hover:opacity-75 transition-opacity flex items-center gap-0.5"
              >
                View All <Icon name="chevron_right" size={18} />
              </Link>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
              {SERVICE_CATEGORIES.map((cat) => (
                <Link
                  key={cat.id}
                  href="/login"
                  className="flex flex-col items-center justify-center p-3 bg-white rounded-2xl aspect-square shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:border-[#F97316]/30 border border-transparent active:scale-95 transition-all duration-150 group"
                >
                  <span
                    className="material-symbols-outlined text-[#fd761a] mb-1.5 group-hover:scale-110 transition-transform duration-150"
                    style={{ fontSize: 22 }}
                  >
                    {CAT_SYMBOL[cat.id] || "home_repair_service"}
                  </span>
                  <span className="text-[9.5px] font-semibold text-center text-[#191c1e] leading-tight">
                    {cat.label}
                  </span>
                </Link>
              ))}
            </div>
          </section>

          {/* ════════════════════════════════════════════
              HOW IT WORKS
          ════════════════════════════════════════════ */}
          <section className="bg-[#f2f4f6] px-6 py-16">
            <h2 className="font-headline font-bold text-3xl mb-12 text-center text-[#0F172A]">
              How it works
            </h2>

            <div className="space-y-10 max-w-lg mx-auto">
              {HOW_IT_WORKS.map((step, i) => (
                <div key={step.num} className="flex gap-5 items-start">
                  <div className="flex-shrink-0 w-12 h-12 bg-[#0F172A] text-white rounded-full flex items-center justify-center font-headline font-bold text-xl shadow-lg shadow-[#0F172A]/20">
                    {step.num}
                  </div>
                  <div className="pt-1">
                    <h3 className="font-headline font-bold text-[1.15rem] mb-1.5 text-[#0F172A]">
                      {step.titleKey}
                    </h3>
                    <p className="text-[#45464d] leading-relaxed text-sm">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ════════════════════════════════════════════
              WORKER OF THE MONTH
          ════════════════════════════════════════════ */}
          <section className="px-5 py-14">
            <div className="bg-[#131b2e] rounded-[2rem] p-8 text-white relative overflow-hidden">
              {/* Decorative shapes */}
              <div className="absolute -right-8 -top-8 w-44 h-44 bg-[#fd761a]/10 rounded-full pointer-events-none" />
              <div className="absolute right-8 bottom-6 w-20 h-20 bg-white/5 rounded-full pointer-events-none" />
              <div className="absolute right-14 top-10 text-7xl opacity-[0.07] select-none pointer-events-none">⚡</div>

              <div className="relative z-10">
                <span className="bg-[#fd761a] text-white px-3.5 py-1.5 rounded-full text-[10px] uppercase font-headline font-black tracking-widest">
                  Worker of the Month
                </span>

                <h3 className="text-[2rem] font-headline font-bold mt-5 mb-1.5 leading-tight">
                  Ramesh Kumar
                </h3>
                <p className="text-[#7c839b] text-base mb-7">
                  Expert Electrician · 4.9 ★ · 250+ Jobs
                </p>

                {/* Stats row */}
                <div className="flex gap-5 mb-8">
                  {[
                    { icon: "star", val: "4.9", sub: "Rating" },
                    { icon: "work", val: "250+", sub: "Jobs" },
                    { icon: "verified_user", val: "Aadhaar", sub: "Verified" },
                  ].map((s) => (
                    <div key={s.sub} className="flex flex-col items-start">
                      <div className="flex items-center gap-1 text-[#fd761a] mb-0.5">
                        <Icon name={s.icon} size={14} />
                        <span className="font-headline font-bold text-sm text-white">{s.val}</span>
                      </div>
                      <span className="text-[10px] text-[#7c839b] uppercase tracking-wider">{s.sub}</span>
                    </div>
                  ))}
                </div>

                <Link
                  href="/login"
                  id="worker-profile-btn"
                  className="bg-white text-[#131b2e] px-7 py-3 rounded-xl font-headline font-bold inline-flex items-center gap-2 hover:bg-[#f2f4f6] active:scale-95 transition-all duration-150"
                >
                  View Profile
                  <Icon name="arrow_forward" size={18} className="text-[#131b2e]" />
                </Link>
              </div>
            </div>
          </section>

          {/* ════════════════════════════════════════════
              FOOTER
          ════════════════════════════════════════════ */}
          <footer className="bg-[#e0e3e5] px-6 pt-14 pb-8">
            <div className="mb-10">
              <Link href="/" className="font-headline font-black text-[#0F172A] text-3xl">
                Bixit
              </Link>
              <p className="text-[#45464d] mt-3 max-w-xs text-sm leading-relaxed">
                Empowering local skilled labor through technology and trust.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-8 mb-10">
              <div className="space-y-3">
                <h4 className="font-headline font-bold text-xs uppercase tracking-widest text-[#0F172A]">
                  Company
                </h4>
                <ul className="space-y-2 text-[#45464d] text-sm">
                  {["About Us", "Careers", "Terms of Service", "Privacy Policy"].map((item) => (
                    <li key={item}>
                      <Link href="#" className="hover:text-[#F97316] transition-colors">
                        {item}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="font-headline font-bold text-xs uppercase tracking-widest text-[#0F172A]">
                  Services
                </h4>
                <ul className="space-y-2 text-[#45464d] text-sm">
                  {["Home Repair", "Personal Care", "Events", "Transport"].map((item) => (
                    <li key={item}>
                      <Link href="#" className="hover:text-[#F97316] transition-colors">
                        {item}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                aria-label="Share"
                className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#0F172A] hover:bg-[#F97316] hover:text-white transition-colors shadow-sm"
              >
                <Icon name="share" size={18} />
              </button>
              <button
                aria-label="Toggle language"
                onClick={toggleLang}
                className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#0F172A] hover:bg-[#F97316] hover:text-white transition-colors shadow-sm"
              >
                <Icon name="language" size={18} />
              </button>
            </div>

            <p className="text-[#76777d] text-xs mt-10 text-center">
              © 2025 Bixit Technologies Pvt. Ltd. All rights reserved.
            </p>
          </footer>
        </main>

        {/* ════════════════════════════════════════════
            BOTTOM NAVIGATION BAR (mobile)
        ════════════════════════════════════════════ */}
        <nav
          id="bottom-nav"
          className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-5 pt-3 bg-white/85 backdrop-blur-xl shadow-[0px_-2px_24px_rgba(15,23,42,0.07)] rounded-t-3xl border-t border-[#e0e3e5]/50"
        >
          {[
            { icon: "home",       label: "Home",     href: "/",      active: true  },
            { icon: "event_note", label: "Bookings", href: "/login", active: false },
            { icon: "chat_bubble",label: "Chat",     href: "/login", active: false },
            { icon: "person",     label: "Profile",  href: "/login", active: false },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              id={`bottom-nav-${item.label.toLowerCase()}`}
              className={`flex flex-col items-center justify-center gap-0.5 transition-colors min-w-[3.5rem] ${
                item.active ? "text-[#0F172A]" : "text-slate-400 hover:text-[#F97316]"
              }`}
            >
              <Icon
                name={item.icon}
                size={24}
                className={item.active ? "text-[#0F172A]" : ""}
              />
              <span
                className={`text-[10px] font-medium tracking-wide ${
                  item.active ? "font-semibold text-[#0F172A]" : ""
                }`}
              >
                {item.label}
              </span>
              {item.active && (
                <span className="w-1 h-1 bg-[#F97316] rounded-full" />
              )}
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
}
