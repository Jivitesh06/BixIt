"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { sendMessage, listenToMessages, getWorkerBookings, getBooking } from "@/lib/firestore";
import { SERVICE_CATEGORIES } from "@/lib/constants";
import { getStatusStyle } from "@/lib/utils";
import BottomNav from "@/components/BottomNav";
import { SendIcon, ArrowLeftIcon, ArrowRightIcon, Spinner } from "@/components/Icons";

function timeAgo(ts) {
  if (!ts?.seconds) return "";
  const diff = Date.now() / 1000 - ts.seconds;
  if (diff < 60)    return "now";
  if (diff < 3600)  return `${Math.floor(diff/60)}m`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h`;
  return `${Math.floor(diff/86400)}d`;
}

// ── Chat list for worker ───────────────────────────────────────
function ChatListView({ userId }) {
  const router = useRouter();
  const [chats,   setChats]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    getWorkerBookings(userId).then(bookings => {
      setChats(bookings.filter(b => b.lastMessage));
      setLoading(false);
    });
  }, [userId]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      <div className="bg-white border-b border-[#E2E8F0] px-4 py-5 sticky top-0 z-40">
        <h1 className="font-black text-2xl text-[#0F172A]">Messages</h1>
      </div>

      <div className="px-4 py-4">
        {loading ? (
          [1,2,3].map(i => <div key={i} className="skeleton h-20 rounded-2xl mb-2"/>)
        ) : chats.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">💬</div>
            <p className="font-bold text-[#0F172A] mb-1">No conversations yet</p>
            <p className="text-sm text-[#94A3B8]">Accepted jobs will show messages here</p>
          </div>
        ) : (
          <div className="space-y-2">
            {chats.map(b => {
              const cat = SERVICE_CATEGORIES.find(c => (b.services||[]).includes(c.id));
              return (
                <button key={b.id} onClick={() => router.push(`/worker/chat?bookingId=${b.id}`)}
                  className="w-full flex items-center gap-4 bg-white rounded-2xl border border-[#E2E8F0] p-4 hover:shadow-md hover:border-[#F97316]/30 transition-all text-left">
                  <div className="w-12 h-12 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center text-xl flex-shrink-0">
                    {cat?.icon || "🔧"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="font-bold text-[#0F172A] text-sm truncate">{b.clientName || "Client"}</p>
                      <span className="text-[10px] text-[#94A3B8] flex-shrink-0 ml-2">{timeAgo(b.lastMessageAt)}</span>
                    </div>
                    <p className="text-xs text-[#64748B] truncate">{b.lastMessage}</p>
                    <p className="text-[10px] text-[#94A3B8] mt-0.5">{cat?.label} · {b.scheduledDate}</p>
                  </div>
                  <ArrowRightIcon size={14} className="text-[#CBD5E1] flex-shrink-0"/>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <BottomNav role="worker" />
    </div>
  );
}

// ── Chat detail for worker ─────────────────────────────────────
export default function WorkerChat() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const bookingId    = searchParams.get("bookingId");
  const { user }     = useAuth();
  const [messages, setMessages] = useState([]);
  const [booking,  setBooking]  = useState(null);
  const [text,     setText]     = useState("");
  const [sending,  setSending]  = useState(false);
  const bottomRef = useRef();

  useEffect(() => {
    if (!bookingId || !user) return;
    getBooking(bookingId).then(setBooking);
    const unsub = listenToMessages(bookingId, msgs => {
      setMessages(msgs);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior:"smooth" }), 80);
    });
    return unsub;
  }, [bookingId, user]);

  if (!bookingId) return <ChatListView userId={user?.uid} />;

  async function handleSend(e) {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    await sendMessage(bookingId, { senderId: user.uid, senderRole: "worker", text: text.trim() });
    setText(""); setSending(false);
  }

  const cat = SERVICE_CATEGORIES.find(c => (booking?.services||[]).includes(c.id));

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col pb-16">
      {/* Header */}
      <div className="bg-white border-b border-[#E2E8F0] px-4 py-3 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/worker/chat")}
            className="w-9 h-9 rounded-full bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center text-[#64748B] flex-shrink-0">
            <ArrowLeftIcon size={18}/>
          </button>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-[#0F172A] text-sm truncate">{booking?.clientName || "Client"}</p>
            {booking && (
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-[#94A3B8]">{cat?.icon} {cat?.label}</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${getStatusStyle(booking.status)}`}>{booking.status?.replace(/_/g," ")}</span>
              </div>
            )}
          </div>
          <div className="w-2.5 h-2.5 rounded-full bg-[#22C55E] ring-2 ring-[#DCFCE7] flex-shrink-0" />
        </div>
      </div>

      {/* Job context card */}
      {booking && (
        <div className="mx-4 mt-3 bg-[#FFF7ED] border border-[#FED7AA] rounded-2xl px-4 py-3 flex items-center gap-3">
          <span className="text-lg">{cat?.icon || "🔧"}</span>
          <div className="flex-1">
            <p className="text-xs font-bold text-[#C2410C]">{cat?.label} · {booking.scheduledDate}</p>
            <p className="text-[10px] text-[#D97706] capitalize">{booking.status?.replace(/_/g," ")}</p>
          </div>
          <button onClick={() => router.push(`/worker/jobs?bookingId=${bookingId}`)} className="text-[10px] text-[#F97316] font-bold">Job →</button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <div className="text-5xl mb-3">👋</div>
            <p className="font-bold text-[#0F172A]">Say hello!</p>
            <p className="text-sm text-[#94A3B8] mt-1">Introduce yourself to the client</p>
          </div>
        )}
        {messages.map((msg, i) => {
          const isMe = msg.senderRole === "worker";
          return (
            <div key={msg.id || i} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
              <div className={`max-w-[78%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${isMe ? "bg-[#F97316] text-white rounded-br-sm" : "bg-white border border-[#E2E8F0] text-[#0F172A] rounded-bl-sm shadow-sm"}`}>
                {msg.text}
              </div>
              <span className={`text-[10px] mt-1 ${isMe ? "text-[#94A3B8]" : "text-[#CBD5E1]"}`}>
                {msg.createdAt?.toDate?.()?.toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" }) || ""}
                {isMe && " · Delivered"}
              </span>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-[#E2E8F0] px-4 py-3 sticky bottom-16 z-30">
        <form onSubmit={handleSend} className="flex gap-3 items-end">
          <div className="flex-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl px-4 py-3 focus-within:border-[#F97316] focus-within:ring-2 focus-within:ring-[#F97316]/10 transition-all">
            <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Type a message…" rows={1}
              onKeyDown={e => { if (e.key==="Enter" && !e.shiftKey) { e.preventDefault(); handleSend(e); } }}
              className="w-full bg-transparent text-sm text-[#0F172A] outline-none resize-none placeholder:text-[#CBD5E1]"
              style={{ maxHeight: 96, overflowY: "auto" }} />
          </div>
          <button type="submit" disabled={!text.trim() || sending}
            className="w-11 h-11 rounded-2xl bg-[#F97316] flex items-center justify-center text-white hover:bg-[#EA580C] active:scale-90 transition-all disabled:opacity-40 flex-shrink-0">
            {sending ? <Spinner size={16}/> : <SendIcon size={16}/>}
          </button>
        </form>
      </div>

      <BottomNav role="worker" />
    </div>
  );
}
