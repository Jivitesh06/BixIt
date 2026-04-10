"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { listenToNotifications, markNotificationRead, markAllNotificationsRead } from "@/lib/firestore";
import { useAuth } from "@/context/AuthContext";
import { BellIcon, XIcon, CheckIcon } from "./Icons";

function timeAgo(ts) {
  if (!ts?.seconds) return "";
  const diff = Date.now() / 1000 - ts.seconds;
  if (diff < 60)   return "just now";
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  return `${Math.floor(diff/86400)}d ago`;
}

const NOTIF_ICON = {
  new_booking:    "📋",
  booking_accepted: "✅",
  booking_declined: "❌",
  counter_offer:  "💬",
  on_the_way:     "🛵",
  arrived:        "📍",
  job_complete:   "🏆",
  new_message:    "💬",
  payment:        "💰",
};

export default function NotificationBell({ className = "" }) {
  const { user } = useAuth();
  const router   = useRouter();
  const [notifs, setNotifs]   = useState([]);
  const [open, setOpen]       = useState(false);
  const ref = useRef();

  useEffect(() => {
    if (!user) return;
    const unsub = listenToNotifications(user.uid, setNotifs);
    return unsub;
  }, [user]);

  useEffect(() => {
    const fn = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  async function handleClick(n) {
    await markNotificationRead(n.id);
    setOpen(false);
    if (n.href) router.push(n.href);
  }

  async function handleMarkAll() {
    if (user) await markAllNotificationsRead(user.uid);
  }

  const unread = notifs.filter(n => !n.read).length;

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button onClick={() => setOpen(o => !o)}
        className="relative w-9 h-9 rounded-full bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:border-[#CBD5E1] transition-colors">
        <BellIcon size={18}/>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 min-w-[18px] bg-[#EF4444] text-white text-[9px] font-black rounded-full flex items-center justify-center px-1">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 bg-white border border-[#E2E8F0] rounded-2xl shadow-2xl w-80 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#F1F5F9]">
            <h4 className="font-bold text-[#0F172A] text-sm">Notifications {unread > 0 && <span className="ml-1 bg-[#EF4444] text-white text-[9px] px-1.5 py-0.5 rounded-full">{unread}</span>}</h4>
            {unread > 0 && (
              <button onClick={handleMarkAll} className="text-xs text-[#F97316] font-semibold hover:underline flex items-center gap-1">
                <CheckIcon size={11}/> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifs.length === 0 ? (
              <div className="text-center py-10">
                <div className="text-3xl mb-2">🔔</div>
                <p className="text-sm text-[#94A3B8]">You're all caught up!</p>
              </div>
            ) : (
              notifs.map(n => (
                <button key={n.id} onClick={() => handleClick(n)}
                  className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-[#F8FAFC] transition-colors border-b border-[#F8FAFC] last:border-0 ${!n.read ? "bg-[#FFF7ED]/50" : ""}`}>
                  <span className="text-xl flex-shrink-0 mt-0.5">{NOTIF_ICON[n.type] || "🔔"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#0F172A] truncate">{n.title}</p>
                    <p className="text-xs text-[#64748B] mt-0.5 line-clamp-2">{n.body}</p>
                    <p className="text-[10px] text-[#94A3B8] mt-1">{timeAgo(n.createdAt)}</p>
                  </div>
                  {!n.read && <span className="w-2 h-2 bg-[#F97316] rounded-full flex-shrink-0 mt-2" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
