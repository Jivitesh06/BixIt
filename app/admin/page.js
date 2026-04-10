"use client";

import { useState, useEffect } from "react";
import {
  getPlatformStats, getPendingVerificationWorkers, getAllWorkers,
  getAllClients, getAllBookings, verifyWorker, rejectWorker
} from "@/lib/firestore";
import { SERVICE_CATEGORIES } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import { CheckIcon, XIcon, ShieldIcon, AlertCircleIcon, Spinner } from "@/components/Icons";

const ADMIN_PASSWORD = "bixit@admin2024";

function StatBox({ label, value, icon, color = "#0F172A" }) {
  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-2xl">{icon}</span>
        <span className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">{label}</span>
      </div>
      <p className="font-black text-3xl" style={{ color }}>{value}</p>
    </div>
  );
}

export default function AdminPanel() {
  const [authed,   setAuthed]   = useState(false);
  const [pw,       setPw]       = useState("");
  const [pwErr,    setPwErr]    = useState(false);
  const [tab,      setTab]      = useState("verify");
  const [stats,    setStats]    = useState(null);
  const [pending,  setPending]  = useState([]);
  const [workers,  setWorkers]  = useState([]);
  const [clients,  setClients]  = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [actMap,   setActMap]   = useState({});

  // Load data after auth
  useEffect(() => {
    if (!authed) return;
    setLoading(true);
    Promise.all([
      getPlatformStats(),
      getPendingVerificationWorkers(),
      getAllWorkers(),
      getAllClients(),
      getAllBookings(),
    ]).then(([s, p, w, c, b]) => {
      setStats(s); setPending(p); setWorkers(w); setClients(c); setBookings(b);
      setLoading(false);
    });
  }, [authed]);

  function handleLogin(e) {
    e.preventDefault();
    if (pw === ADMIN_PASSWORD) { setAuthed(true); setPwErr(false); }
    else setPwErr(true);
  }

  async function handleVerify(id) {
    setActMap(m => ({ ...m, [id]: "verifying" }));
    await verifyWorker(id);
    setPending(p => p.filter(w => w.id !== id));
    setActMap(m => ({ ...m, [id]: "done" }));
  }

  async function handleReject(id) {
    setActMap(m => ({ ...m, [id]: "rejecting" }));
    await rejectWorker(id);
    setPending(p => p.filter(w => w.id !== id));
    setActMap(m => ({ ...m, [id]: "done" }));
  }

  // ─── Login screen ───────────────────────────────────────────────
  if (!authed) return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center px-6">
      <div className="bg-white rounded-3xl p-8 w-full max-w-xs shadow-2xl">
        <div className="w-12 h-12 bg-[#F97316] rounded-2xl flex items-center justify-center mb-6">
          <ShieldIcon size={24}/>
        </div>
        <h1 className="font-black text-2xl text-[#0F172A] mb-1">Admin Access</h1>
        <p className="text-sm text-[#64748B] mb-6">Bixit internal panel</p>
        <form onSubmit={handleLogin} className="space-y-4">
          <input type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="Password"
            className={`w-full bg-[#F8FAFC] border rounded-xl px-4 py-3.5 text-sm text-[#0F172A] outline-none focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/10 transition-all ${pwErr ? "border-[#EF4444]" : "border-[#E2E8F0]"}`} />
          {pwErr && <p className="text-xs text-[#EF4444]">Incorrect password.</p>}
          <button type="submit" className="w-full bg-[#0F172A] text-white py-3.5 rounded-xl font-bold text-sm hover:bg-[#1E293B]">
            Sign In →
          </button>
        </form>
      </div>
    </div>
  );

  const TABS = [
    { id:"verify",   label:"Verification",  badge: pending.length },
    { id:"stats",    label:"Stats"          },
    { id:"workers",  label:"Workers"        },
    { id:"clients",  label:"Clients"        },
    { id:"bookings", label:"Bookings"       },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Topbar */}
      <div className="bg-[#0F172A] text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-[#F97316] rounded-lg flex items-center justify-center"><span className="font-black text-sm">B</span></div>
          <span className="font-black text-lg">Bixit Admin</span>
        </div>
        <button onClick={() => setAuthed(false)} className="text-xs text-[#475569] hover:text-white border border-[#1E293B] px-3 py-1.5 rounded-lg transition-colors">Sign out</button>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-[#E2E8F0] px-4 sticky top-0 z-30">
        <div className="flex gap-1 overflow-x-auto scrollbar-hide py-2">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all ${tab === t.id ? "bg-[#0F172A] text-white" : "text-[#64748B] hover:bg-[#F8FAFC]"}`}>
              {t.label}
              {t.badge > 0 && <span className="ml-1.5 bg-[#EF4444] text-white text-[9px] px-1.5 py-0.5 rounded-full">{t.badge}</span>}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Spinner size={32}/></div>
      ) : (
        <div className="max-w-4xl mx-auto px-4 py-6">

          {/* ─── STATS ─────────────── */}
          {tab === "stats" && stats && (
            <div>
              <h2 className="font-black text-xl text-[#0F172A] mb-5">Platform Statistics</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <StatBox label="Workers"     value={stats.totalWorkers}   icon="👷" />
                <StatBox label="Clients"     value={stats.totalClients}   icon="🧑" />
                <StatBox label="Bookings"    value={stats.totalBookings}  icon="📋" />
                <StatBox label="Revenue"     value={formatCurrency(stats.revenue.total || 0)} icon="💰" color="#F97316" />
              </div>
              <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5">
                <h3 className="font-bold text-[#0F172A] mb-4">Recent Bookings</h3>
                <div className="space-y-3">
                  {stats.recentBookings.map(b => (
                    <div key={b.id} className="flex items-center justify-between py-2.5 border-b border-[#F1F5F9] last:border-0">
                      <div>
                        <p className="text-sm font-semibold text-[#0F172A]">{b.workerName || "Worker"} → {b.clientName || "Client"}</p>
                        <p className="text-xs text-[#94A3B8]">{b.scheduledDate}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-[#F97316]">{formatCurrency(b.totalAmount || 0)}</p>
                        <span className={`text-[10px] capitalize px-2 py-0.5 rounded-full font-semibold ${b.status === "completed" ? "bg-[#F0FDF4] text-[#16A34A]" : "bg-[#FFF7ED] text-[#C2410C]"}`}>{b.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ─── VERIFICATION ─────── */}
          {tab === "verify" && (
            <div>
              <h2 className="font-black text-xl text-[#0F172A] mb-5">Aadhaar Verification Queue</h2>
              {pending.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-5xl mb-3">✅</div>
                  <p className="font-bold text-[#0F172A]">All workers verified!</p>
                  <p className="text-sm text-[#94A3B8] mt-1">No pending verification requests.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pending.map(w => {
                    const skills = (w.skills || []).map(id => SERVICE_CATEGORIES.find(c => c.id === id)?.label).filter(Boolean).join(", ");
                    const busy = actMap[w.id];
                    return (
                      <div key={w.id} className="bg-white rounded-2xl border border-[#E2E8F0] p-5">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div>
                            <p className="font-bold text-[#0F172A]">{w.name}</p>
                            <p className="text-xs text-[#64748B]">{w.email}</p>
                            <p className="text-xs text-[#64748B]">📍 {w.area} · 📞 +91 {w.phone}</p>
                            {skills && <p className="text-xs text-[#94A3B8] mt-1">Skills: {skills}</p>}
                          </div>
                          {w.aadhaarNumber && (
                            <div className="text-right">
                              <p className="text-xs text-[#94A3B8]">Aadhaar</p>
                              <p className="font-mono text-sm font-bold text-[#0F172A]">
                                XXXX XXXX {w.aadhaarNumber.slice(-4)}
                              </p>
                            </div>
                          )}
                        </div>
                        {/* Photo previews */}
                        {(w.aadhaarFront || w.aadhaarBack) && (
                          <div className="flex gap-3 mb-4">
                            {[{src:w.aadhaarFront,label:"Front"},{src:w.aadhaarBack,label:"Back"}].map(({src,label}) => src && (
                              <div key={label} className="flex-1">
                                <p className="text-[10px] text-[#94A3B8] mb-1">{label}</p>
                                <img src={src} alt={label} className="w-full h-28 object-cover rounded-xl border border-[#E2E8F0]" />
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="flex gap-3">
                          <button onClick={() => handleVerify(w.id)} disabled={!!busy}
                            className="flex-1 py-2.5 rounded-xl bg-[#22C55E] text-white text-sm font-bold flex items-center justify-center gap-1.5 hover:bg-[#16A34A] disabled:opacity-50 transition-colors">
                            {busy === "verifying" ? <Spinner size={15}/> : <CheckIcon size={15}/>} Verify
                          </button>
                          <button onClick={() => handleReject(w.id)} disabled={!!busy}
                            className="flex-1 py-2.5 rounded-xl bg-[#EF4444] text-white text-sm font-bold flex items-center justify-center gap-1.5 hover:bg-[#DC2626] disabled:opacity-50 transition-colors">
                            {busy === "rejecting" ? <Spinner size={15}/> : <XIcon size={15}/>} Reject
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ─── WORKERS ─────────── */}
          {tab === "workers" && (
            <div>
              <h2 className="font-black text-xl text-[#0F172A] mb-5">All Workers ({workers.length})</h2>
              <div className="space-y-3">
                {workers.map(w => (
                  <div key={w.id} className="bg-white rounded-2xl border border-[#E2E8F0] p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#F1F5F9] flex items-center justify-center font-bold text-[#374151] flex-shrink-0">{w.name?.[0] || "W"}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[#0F172A] text-sm truncate">{w.name}</p>
                      <p className="text-xs text-[#64748B] truncate">{w.email}</p>
                      <p className="text-xs text-[#94A3B8]">{w.area} · ⭐ {w.averageRating?.toFixed(1) || "—"} · {w.completedJobs || 0} jobs</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0 ${w.isVerified ? "bg-[#F0FDF4] text-[#16A34A]" : "bg-[#FFF7ED] text-[#C2410C]"}`}>
                      {w.isVerified ? "✓ Verified" : "Pending"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── CLIENTS ─────────── */}
          {tab === "clients" && (
            <div>
              <h2 className="font-black text-xl text-[#0F172A] mb-5">All Clients ({clients.length})</h2>
              <div className="space-y-3">
                {clients.map(c => (
                  <div key={c.id} className="bg-white rounded-2xl border border-[#E2E8F0] p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#F1F5F9] flex items-center justify-center font-bold text-[#374151] flex-shrink-0">{c.name?.[0] || "C"}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[#0F172A] text-sm truncate">{c.name || "—"}</p>
                      <p className="text-xs text-[#64748B] truncate">{c.email}</p>
                      <p className="text-xs text-[#94A3B8]">{c.area || "—"}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── BOOKINGS ─────────── */}
          {tab === "bookings" && (
            <div>
              <h2 className="font-black text-xl text-[#0F172A] mb-5">All Bookings ({bookings.length})</h2>
              <div className="space-y-3">
                {bookings.map(b => (
                  <div key={b.id} className="bg-white rounded-2xl border border-[#E2E8F0] p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-[#0F172A] text-sm">{b.workerName || "Worker"} → {b.clientName || "Client"}</p>
                        <p className="text-xs text-[#94A3B8]">{b.scheduledDate} · {b.scheduledTime}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-[#F97316]">{formatCurrency(b.totalAmount || 0)}</p>
                        {b.commission > 0 && <p className="text-[10px] text-[#94A3B8]">Fee: {formatCurrency(b.commission)}</p>}
                      </div>
                    </div>
                    <span className={`text-[10px] capitalize px-2 py-0.5 rounded-full font-bold ${b.status === "completed" ? "bg-[#F0FDF4] text-[#16A34A]" : b.status === "cancelled" ? "bg-[#FEF2F2] text-[#DC2626]" : "bg-[#FFF7ED] text-[#C2410C]"}`}>
                      {b.status?.replace(/_/g," ")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
