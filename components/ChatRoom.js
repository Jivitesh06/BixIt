"use client";

/**
 * Shared chat room + chat list used by both /client/chat and /worker/chat
 * Props:
 *   role       : "client" | "worker"
 *   bookingId  : string | null
 *   userId     : string
 *   userRole   : string
 *   profile    : { name, ... }
 */

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  sendMessage, listenToMessages, getBooking,
  getClientBookings, getWorkerBookings, createNotification
} from "@/lib/firestore";
import { SERVICE_CATEGORIES } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import BottomNav from "@/components/BottomNav";
import {
  ArrowLeftIcon, ArrowRightIcon, SendIcon,
  ChevronDownIcon, ChevronRightIcon, Spinner
} from "@/components/Icons";

// ─── Time helpers ───────────────────────────────────────────────
function timeAgo(ts) {
  if (!ts?.seconds) return "";
  const diff = Date.now() / 1000 - ts.seconds;
  if (diff < 60)     return "now";
  if (diff < 3600)   return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)  return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(ts.seconds * 1000).toLocaleDateString("en-IN", { day:"numeric", month:"short" });
}

function msgTime(ts) {
  if (!ts?.seconds) return "";
  return new Date(ts.seconds * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function dayLabel(ts) {
  if (!ts?.seconds) return "";
  const d = new Date(ts.seconds * 1000);
  const now = new Date();
  const diff = Math.floor((now - d) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return d.toLocaleDateString("en-IN", { day:"numeric", month:"short" });
}

// ─── Avatar initials ────────────────────────────────────────────
function Avatar({ name = "", size = 40 }) {
  const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "?";
  const colors   = ["#7C3AED","#0891B2","#059669","#DC2626","#D97706","#2563EB"];
  const bg       = colors[(name.charCodeAt(0) || 0) % colors.length];
  return (
    <div style={{ width: size, height: size, background: bg, borderRadius: "50%", flexShrink: 0 }}
      className="flex items-center justify-center text-white font-bold text-sm">
      {initials}
    </div>
  );
}

// ─── Status pill (minimal, no external dependency) ──────────────
function StatusPill({ status }) {
  const map = {
    pending:        "bg-amber-100 text-amber-700",
    counter_offered:"bg-orange-100 text-orange-700",
    accepted:       "bg-green-100 text-green-700",
    on_the_way:     "bg-blue-100 text-blue-700",
    arrived:        "bg-purple-100 text-purple-700",
    in_progress:    "bg-orange-100 text-orange-700",
    completed:      "bg-green-100 text-green-700",
    cancelled:      "bg-red-100 text-red-700",
  };
  const label = status?.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()) || "";
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${map[status] || "bg-gray-100 text-gray-600"}`}>
      {label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────
// CHAT LIST
// ─────────────────────────────────────────────────────────────────
export function ChatListView({ userId, role }) {
  const router  = useRouter();
  const [chats,   setChats]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    const fetchFn = role === "worker" ? getWorkerBookings : getClientBookings;
    fetchFn(userId).then(bookings => {
      // Show all non-cancelled bookings (not just ones with lastMessage)
      const active = bookings.filter(b => b.status !== "cancelled");
      setChats(active);
      setLoading(false);
    });
  }, [userId, role]);

  const chatPath = role === "worker" ? "/worker/chat" : "/client/chat";
  const otherName = (b) => role === "worker" ? (b.clientName || "Client") : (b.workerName || "Worker");

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      {/* Header */}
      <div className="bg-white border-b border-[#E2E8F0] px-4 py-5 sticky top-0 z-40">
        <h1 className="font-black text-2xl text-[#0F172A]">Messages</h1>
        {!loading && chats.length > 0 && (
          <p className="text-xs text-[#94A3B8] mt-0.5">{chats.length} conversation{chats.length !== 1 ? "s" : ""}</p>
        )}
      </div>

      <div className="px-4 py-4">
        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="skeleton h-20 rounded-2xl"/>)}
          </div>
        ) : chats.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-6xl mb-4">💬</div>
            <p className="font-bold text-[#0F172A] mb-1 text-lg">No conversations yet</p>
            <p className="text-sm text-[#94A3B8]">
              {role === "worker" ? "Accept a job to start chatting" : "Book a worker to start chatting"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {chats.map(b => {
              const cat    = SERVICE_CATEGORIES.find(c => (b.services||[]).includes(c.id));
              const other  = otherName(b);
              const hasNew = b.lastMessageRole && (
                (role === "client" && b.lastMessageRole === "worker") ||
                (role === "worker" && b.lastMessageRole === "client")
              );
              return (
                <button key={b.id}
                  onClick={() => router.push(`${chatPath}?bookingId=${b.id}`)}
                  className="w-full flex items-center gap-3 bg-white rounded-2xl border border-[#E2E8F0] p-4 hover:shadow-md hover:border-[#F97316]/30 transition-all text-left group">
                  {/* Avatar */}
                  <Avatar name={other} size={46} />
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className={`text-sm truncate ${hasNew ? "font-black text-[#0F172A]" : "font-bold text-[#0F172A]"}`}>
                        {other}
                      </p>
                      <span className="text-[10px] text-[#94A3B8] flex-shrink-0 ml-2">
                        {timeAgo(b.lastMessageAt)}
                      </span>
                    </div>
                    <p className={`text-xs truncate ${hasNew ? "text-[#0F172A] font-medium" : "text-[#64748B]"}`}>
                      {b.lastMessage || "No messages yet — say hello!"}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {cat && <span className="text-[10px] text-[#94A3B8]">{cat.icon} {cat.label}</span>}
                      <StatusPill status={b.status} />
                    </div>
                  </div>
                  {/* Unread dot */}
                  {hasNew && (
                    <div className="w-2.5 h-2.5 rounded-full bg-[#F97316] flex-shrink-0" />
                  )}
                  <ArrowRightIcon size={14} className="text-[#CBD5E1] flex-shrink-0 group-hover:text-[#F97316] transition-colors" />
                </button>
              );
            })}
          </div>
        )}
      </div>

      <BottomNav role={role} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// CHAT ROOM
// ─────────────────────────────────────────────────────────────────
export function ChatRoomView({ bookingId, userId, userRole, role, profile }) {
  const router     = useRouter();
  const [booking,  setBooking]  = useState(null);
  const [messages, setMessages] = useState([]);
  const [text,     setText]     = useState("");
  const [sending,  setSending]  = useState(false);
  const [jobOpen,  setJobOpen]  = useState(false); // collapsible job card
  const messagesEndRef = useRef();
  const inputRef       = useRef();
  const prevCountRef   = useRef(0);

  // Load booking + real-time messages
  useEffect(() => {
    if (!bookingId || !userId) return;
    getBooking(bookingId).then(setBooking);
    const unsub = listenToMessages(bookingId, msgs => {
      setMessages(msgs);
    });
    return unsub;
  }, [bookingId, userId]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (messages.length > prevCountRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: messages.length === 1 ? "instant" : "smooth" });
    }
    prevCountRef.current = messages.length;
  }, [messages]);

  // Scroll to bottom on initial load
  useEffect(() => {
    if (messages.length > 0 && prevCountRef.current === 0) {
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "instant" }), 50);
    }
  }, [messages.length]);

  const cat       = SERVICE_CATEGORIES.find(c => (booking?.services||[]).includes(c.id));
  const isCancelled = booking?.status === "cancelled";
  const otherName   = role === "worker" ? (booking?.clientName || "Client") : (booking?.workerName || "Worker");
  const otherId     = role === "worker" ? booking?.clientId : booking?.workerId;
  const chatPath    = role === "worker" ? "/worker/chat" : "/client/chat";
  const jobPath     = role === "worker" ? `/worker/jobs?bookingId=${bookingId}` : `/client/bookings`;
  const displayAmt  = booking?.finalAmount || booking?.counterAmount || booking?.offeredAmount || booking?.totalAmount || 0;

  // Group messages by day
  function groupedMessages() {
    const groups = [];
    let lastDay = null;
    messages.forEach(msg => {
      const day = msg.createdAt?.seconds
        ? new Date(msg.createdAt.seconds * 1000).toDateString()
        : "unknown";
      if (day !== lastDay) {
        groups.push({ type: "separator", label: dayLabel(msg.createdAt), key: `sep-${day}` });
        lastDay = day;
      }
      groups.push({ type: "message", msg });
    });
    return groups;
  }

  async function handleSend(e) {
    e?.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || sending || isCancelled) return;
    setSending(true);
    setText("");
    try {
      const senderName = profile?.name || (role === "client" ? "Client" : "Worker");
      await sendMessage(bookingId, {
        senderId:   userId,
        senderRole: role,
        senderName,
        text:       trimmed,
      });
      // Notify the other person
      if (otherId) {
        await createNotification(otherId, {
          title:     "New Message 💬",
          body:      `${senderName}: ${trimmed.length > 60 ? trimmed.slice(0, 60) + "…" : trimmed}`,
          type:      "message",
          bookingId,
          href:      `${chatPath}?bookingId=${bookingId}`,
        }).catch(() => {});
      }
    } catch { /* silently fail — message may still appear via listener */ }
    finally { setSending(false); inputRef.current?.focus(); }
  }

  return (
    <div className="flex flex-col h-screen bg-[#F8FAFC]">

      {/* ── Fixed header ── */}
      <div className="bg-white border-b border-[#E2E8F0] px-4 py-3 flex-shrink-0 z-40"
        style={{ boxShadow: "0 1px 12px rgba(15,23,42,0.06)" }}>
        <div className="flex items-center gap-3">
          <button onClick={() => router.push(chatPath)}
            className="w-9 h-9 rounded-full bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center text-[#64748B] flex-shrink-0 hover:border-[#CBD5E1]">
            <ArrowLeftIcon size={18}/>
          </button>
          <Avatar name={otherName} size={38} />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-[#0F172A] text-sm truncate">{otherName}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"/>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"/>
              </span>
              <span className="text-[10px] text-[#64748B]">online</span>
              {booking && <span className="text-[10px] text-[#94A3B8]">·</span>}
              {cat && <span className="text-[10px] text-[#94A3B8]">{cat.icon} {cat.label}</span>}
              {booking && <StatusPill status={booking.status} />}
            </div>
          </div>
        </div>
      </div>

      {/* ── Collapsible job context card ── */}
      {booking && (
        <div className="mx-3 mt-3 flex-shrink-0">
          <button
            onClick={() => setJobOpen(o => !o)}
            className="w-full bg-[#FFF7ED] border border-[#FED7AA] rounded-2xl px-4 py-3 flex items-center gap-3 hover:bg-[#FFF3E0] transition-colors">
            <span className="text-xl flex-shrink-0">{cat?.icon || "🔧"}</span>
            <div className="flex-1 text-left min-w-0">
              <p className="text-xs font-bold text-[#C2410C] truncate">{cat?.label || "Service"} · {booking.scheduledDate}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <StatusPill status={booking.status} />
                {displayAmt > 0 && <span className="text-[10px] text-[#D97706] font-bold">{formatCurrency(displayAmt)}</span>}
              </div>
            </div>
            {jobOpen ? <ChevronDownIcon size={14}/> : <ChevronRightIcon size={14}/>}
          </button>

          {jobOpen && (
            <div className="bg-white border border-[#FED7AA] border-t-0 rounded-b-2xl px-4 py-3 -mt-1 space-y-1.5">
              <div className="flex justify-between text-xs text-[#64748B]">
                <span>Worker</span><span className="font-semibold text-[#0F172A]">{booking.workerName || "—"}</span>
              </div>
              <div className="flex justify-between text-xs text-[#64748B]">
                <span>Client</span><span className="font-semibold text-[#0F172A]">{booking.clientName || "—"}</span>
              </div>
              <div className="flex justify-between text-xs text-[#64748B]">
                <span>Amount</span><span className="font-bold text-[#F97316]">{formatCurrency(displayAmt)}</span>
              </div>
              <div className="flex justify-between text-xs text-[#64748B]">
                <span>Payment</span><span className="font-semibold text-[#0F172A] capitalize">{booking.paymentMethod || "—"}</span>
              </div>
              <Link href={jobPath}
                className="mt-2 flex items-center justify-center gap-1.5 w-full py-2 rounded-xl bg-[#F97316] text-xs font-bold text-white hover:bg-[#EA580C] transition-colors">
                View Booking <ArrowRightIcon size={12}/>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* ── Scrollable messages ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {messages.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-3">👋</div>
            <p className="font-bold text-[#0F172A]">Say hello!</p>
            <p className="text-sm text-[#94A3B8] mt-1">
              {role === "worker" ? "Introduce yourself to the client" : "Start a conversation with your worker"}
            </p>
          </div>
        ) : (
          groupedMessages().map((item, idx) => {
            if (item.type === "separator") {
              return (
                <div key={item.key} className="flex items-center gap-3 py-2">
                  <div className="flex-1 h-px bg-[#E2E8F0]"/>
                  <span className="text-[10px] font-semibold text-[#94A3B8] px-2">{item.label}</span>
                  <div className="flex-1 h-px bg-[#E2E8F0]"/>
                </div>
              );
            }
            const { msg } = item;
            const isMe = msg.senderId === userId;
            return (
              <div key={msg.id || idx} className={`flex flex-col ${isMe ? "items-end" : "items-start"} mb-1`}>
                {/* Sender name for their messages */}
                {!isMe && msg.senderName && (
                  <span className="text-[10px] text-[#94A3B8] mb-1 ml-1">{msg.senderName}</span>
                )}
                <div className={`max-w-[78%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words ${
                  isMe
                    ? "bg-[#0F172A] text-white rounded-br-sm"
                    : "bg-white border border-[#E2E8F0] text-[#0F172A] rounded-bl-sm shadow-sm"
                }`}>
                  {msg.text}
                </div>
                <span className={`text-[9px] mt-1 ${isMe ? "text-[#94A3B8]" : "text-[#CBD5E1]"}`}>
                  {msgTime(msg.createdAt)}{isMe ? " · Sent" : ""}
                </span>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Fixed input bar ── */}
      <div className="bg-white border-t border-[#E2E8F0] px-3 py-3 flex-shrink-0"
        style={{ boxShadow: "0 -2px 16px rgba(15,23,42,0.06)" }}>
        {isCancelled ? (
          <p className="text-center text-xs text-[#94A3B8] py-2 font-medium">This booking was cancelled — chat is read-only</p>
        ) : (
          <form onSubmit={handleSend} className="flex gap-2 items-end">
            <div className="flex-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl px-4 py-2.5 focus-within:border-[#F97316] focus-within:ring-2 focus-within:ring-[#F97316]/10 transition-all">
              <textarea
                ref={inputRef}
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Type a message…"
                rows={1}
                onKeyDown={e => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
                }}
                className="w-full bg-transparent text-sm text-[#0F172A] outline-none resize-none placeholder:text-[#CBD5E1]"
                style={{ maxHeight: 96, overflowY: "auto" }}
              />
            </div>
            <button type="submit" disabled={!text.trim() || sending}
              className="w-11 h-11 rounded-2xl bg-[#F97316] flex items-center justify-center text-white hover:bg-[#EA580C] active:scale-90 transition-all disabled:opacity-40 flex-shrink-0">
              {sending ? <Spinner size={16}/> : <SendIcon size={16}/>}
            </button>
          </form>
        )}
      </div>

      <BottomNav role={role} />
    </div>
  );
}
