"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getWorkerProfile, getWorkerBookings, updateBookingStatus } from "@/lib/firestore";
import { formatCurrency, getStatusStyle, timeAgo } from "@/lib/utils";
import { JOB_STATUS, SERVICE_CATEGORIES } from "@/lib/constants";
import BottomNav from "@/components/BottomNav";

export default function WorkerDashboard() {
  const router = useRouter();
  const { user, userRole, loading: authLoading } = useAuth();
  const [profile, setProfile]   = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [lang, setLang]         = useState("en");
  const [counterJobId, setCounterJobId] = useState(null);
  const [counterAmount, setCounterAmount] = useState("");

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
    if (!authLoading && userRole === "client") router.replace("/client/dashboard");
  }, [user, userRole, authLoading]);

  useEffect(() => {
    if (!user) return;
    async function load() {
      const [w, bList] = await Promise.all([
        getWorkerProfile(user.uid),
        getWorkerBookings(user.uid),
      ]);
      setProfile(w);
      setBookings(bList);
      setLoading(false);
    }
    load();
  }, [user]);

  async function handleAccept(id)  { await updateBookingStatus(id, JOB_STATUS.ACCEPTED);  refresh(); }
  async function handleDecline(id) { await updateBookingStatus(id, JOB_STATUS.CANCELLED); refresh(); }
  async function handleCounter(id) {
    await updateBookingStatus(id, JOB_STATUS.PENDING, { counterOffer: Number(counterAmount) });
    setCounterJobId(null); setCounterAmount(""); refresh();
  }
  async function refresh() {
    const list = await getWorkerBookings(user.uid);
    setBookings(list);
  }

  const pending   = bookings.filter(b => b.status === "pending");
  const activeJob = bookings.find(b => ["accepted","on_the_way","arrived","in_progress"].includes(b.status));
  const recent    = bookings.filter(b => b.status === "completed").slice(0,5);

  if (authLoading || loading) return (
    <div className="min-h-screen bg-[#f7f9fb] flex items-center justify-center">
      <div className="animate-spin w-10 h-10 rounded-full border-4 border-[#131b2e] border-t-transparent" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f7f9fb] pb-28">
      {/* Top bar */}
      <div className="bg-white px-5 pt-5 pb-4 border-b border-[#f2f4f6]">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-[#76777d] uppercase tracking-wider font-medium">Welcome back</p>
            <h1 className="font-headline font-bold text-xl text-[#0F172A]">Hello {profile?.name?.split(" ")[0] || "Worker"} 👋</h1>
            <p className="text-xs text-[#45464d] mt-0.5">Ready for today's tasks?</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setLang(l => l === "en" ? "hi" : "en")} className="text-xs font-bold text-[#0F172A] px-2 py-1 bg-[#f2f4f6] rounded-lg hover:text-[#F97316]">
              {lang === "en" ? "EN | हिं" : "हिं | EN"}
            </button>
            <button className="w-9 h-9 rounded-xl bg-[#f2f4f6] flex items-center justify-center">
              <span className="material-symbols-outlined text-[#0F172A]" style={{ fontSize: 20 }}>notifications</span>
            </button>
          </div>
        </div>
      </div>

      <div className="px-5 pt-5 space-y-5">
        {/* Aadhaar verification banner */}
        {profile?.aadhaarStatus === "verified" ? (
          <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl px-4 py-3">
            <span className="material-symbols-outlined text-green-600" style={{ fontSize: 20 }}>verified_user</span>
            <p className="text-sm font-bold text-green-700">Aadhaar Verified — You're all set!</p>
          </div>
        ) : (
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
            <span className="material-symbols-outlined text-amber-600" style={{ fontSize: 20 }}>warning</span>
            <div className="flex-1">
              <p className="text-sm font-bold text-amber-700">Aadhaar Verification Pending</p>
              <p className="text-xs text-amber-600">Complete verification to get more bookings</p>
            </div>
            <Link href="/worker/profile" className="text-xs font-bold text-amber-700 bg-amber-100 px-3 py-1.5 rounded-full hover:bg-amber-200 transition-colors">
              Verify Now
            </Link>
          </div>
        )}

        {/* Earnings card */}
        <div className="bg-[#131b2e] rounded-3xl p-6 text-white relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-36 h-36 bg-[#fd761a]/10 rounded-full pointer-events-none" />
          <div className="absolute right-6 bottom-4 w-20 h-20 bg-white/5 rounded-full pointer-events-none" />
          <div className="relative z-10">
            <p className="text-[10px] text-[#7c839b] font-bold uppercase tracking-widest mb-2">Earnings Today</p>
            <p className="font-headline font-black text-4xl text-white mb-0.5">
              {formatCurrency(profile?.earnings?.today || 0)}
            </p>
            <p className="text-xs text-[#fd761a] font-bold mb-5">+12% vs yesterday</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] text-[#7c839b] uppercase tracking-wider">This Week</p>
                <p className="font-headline font-bold text-white">{formatCurrency(profile?.earnings?.week || 0)}</p>
              </div>
              <div>
                <p className="text-[10px] text-[#7c839b] uppercase tracking-wider">This Month</p>
                <p className="font-headline font-bold text-white">{formatCurrency(profile?.earnings?.month || 0)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* New Requests */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-headline font-bold text-base text-[#0F172A]">New Requests</h2>
            {pending.length > 0 && (
              <span className="bg-[#fd761a] text-white text-[10px] font-black px-2 py-1 rounded-full">{pending.length} NEW</span>
            )}
          </div>

          {pending.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 text-center border border-[#f2f4f6]">
              <span className="material-symbols-outlined text-[#c6c6cd] block mb-2" style={{ fontSize: 36 }}>work_off</span>
              <p className="text-sm text-[#45464d]">No new requests right now</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {pending.map(b => (
                <div key={b.id} className="bg-white rounded-2xl border border-[#f2f4f6] shadow-sm overflow-hidden">
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-headline font-bold text-[#0F172A]">{b.clientName || "Client"}</p>
                        <div className="flex items-center gap-1 text-xs text-[#45464d]">
                          <span className="material-symbols-outlined" style={{ fontSize: 12 }}>location_on</span>
                          {b.area || b.address}
                        </div>
                      </div>
                      <p className="text-2xl font-black text-[#F97316] font-headline">{formatCurrency(b.offeredAmount)}</p>
                    </div>
                    <p className="text-xs text-[#45464d] mb-2 line-clamp-2">{b.description}</p>
                    <div className="flex items-center gap-4 text-xs text-[#76777d] mb-4">
                      <span className="flex items-center gap-1"><span className="material-symbols-outlined" style={{ fontSize: 12 }}>calendar_today</span>{b.date}</span>
                      <span className="flex items-center gap-1"><span className="material-symbols-outlined" style={{ fontSize: 12 }}>schedule</span>{b.time}</span>
                      <span className="flex items-center gap-1"><span className="material-symbols-outlined" style={{ fontSize: 12 }}>near_me</span>~2.4 km</span>
                    </div>

                    {counterJobId === b.id ? (
                      <div className="flex gap-2 mb-2">
                        <div className="flex items-center bg-[#f2f4f6] rounded-xl overflow-hidden flex-1">
                          <span className="px-3 py-2.5 text-sm font-bold text-[#0F172A]">₹</span>
                          <input type="number" placeholder="Your offer" value={counterAmount} onChange={e => setCounterAmount(e.target.value)}
                            className="flex-1 py-2.5 pr-3 bg-transparent text-sm text-[#0F172A] outline-none" />
                        </div>
                        <button onClick={() => handleCounter(b.id)} className="px-4 py-2.5 bg-[#131b2e] text-white text-xs font-bold rounded-xl">Send</button>
                        <button onClick={() => setCounterJobId(null)} className="px-4 py-2.5 bg-[#f2f4f6] text-xs font-bold rounded-xl">✕</button>
                      </div>
                    ) : null}

                    <div className="flex gap-2">
                      <button onClick={() => handleAccept(b.id)}
                        className="flex-1 py-2.5 bg-[#131b2e] text-white text-xs font-bold rounded-xl hover:bg-[#1e2a45] transition-colors active:scale-95">
                        ✅ Accept
                      </button>
                      <button onClick={() => handleDecline(b.id)}
                        className="flex-1 py-2.5 bg-[#f2f4f6] text-[#45464d] text-xs font-bold rounded-xl hover:bg-red-50 hover:text-red-600 transition-colors active:scale-95">
                        ❌ Decline
                      </button>
                      <button onClick={() => setCounterJobId(b.id)}
                        className="flex-1 py-2.5 bg-[#fd761a]/10 text-[#9d4300] text-xs font-bold rounded-xl hover:bg-[#fd761a]/20 transition-colors active:scale-95">
                        💬 Counter
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active job */}
        {activeJob && (
          <div>
            <h2 className="font-headline font-bold text-base text-[#0F172A] mb-3">Active Job</h2>
            <div className="bg-white rounded-2xl border border-[#f2f4f6] shadow-sm p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-headline font-bold text-[#0F172A]">{activeJob.clientName || "Client"}</p>
                  <p className="text-xs text-[#45464d]">{activeJob.date} · {activeJob.time}</p>
                </div>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${getStatusStyle(activeJob.status).color}`}>
                  {getStatusStyle(activeJob.status).label}
                </span>
              </div>
              <p className="text-xs text-[#45464d] mb-3 line-clamp-2">{activeJob.description}</p>
              <Link href={`/worker/jobs?bookingId=${activeJob.id}`}
                className="block w-full bg-[#131b2e] text-white py-3 rounded-xl text-xs font-bold text-center hover:bg-[#1e2a45] transition-colors">
                View Job Details →
              </Link>
            </div>
          </div>
        )}

        {/* Recent activity */}
        {recent.length > 0 && (
          <div>
            <h2 className="font-headline font-bold text-base text-[#0F172A] mb-3">Recent Activity</h2>
            <div className="bg-white rounded-2xl border border-[#f2f4f6] shadow-sm divide-y divide-[#f2f4f6]">
              {recent.map(b => (
                <div key={b.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-bold text-[#0F172A]">{SERVICE_CATEGORIES.find(c => c.id === b.serviceType)?.label || b.serviceType}</p>
                    <p className="text-[10px] text-[#76777d]">{timeAgo(b.createdAt)}</p>
                  </div>
                  <p className="font-bold text-[#F97316]">{formatCurrency(b.finalAmount || b.offeredAmount)}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <BottomNav role="worker" />
    </div>
  );
}
