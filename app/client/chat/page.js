"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getBooking, sendMessage, listenToMessages } from "@/lib/firestore";
import { getStatusStyle, timeAgo } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";
import BottomNav from "@/components/BottomNav";

export default function ClientChat() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("bookingId");
  const router = useRouter();
  const { user } = useAuth();

  const [booking, setBooking]   = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText]         = useState("");
  const [loading, setLoading]   = useState(true);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!bookingId) return;
    getBooking(bookingId).then(b => { setBooking(b); setLoading(false); });
    const unsub = listenToMessages(bookingId, msgs => setMessages(msgs));
    return () => unsub();
  }, [bookingId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e) {
    e.preventDefault();
    if (!text.trim() || !user) return;
    const msg = text.trim();
    setText("");
    await sendMessage(bookingId, {
      senderId: user.uid,
      senderRole: "client",
      text: msg,
    });
  }

  if (!bookingId) {
    return (
      <div className="min-h-screen bg-[#f7f9fb] flex items-center justify-center">
        <p className="text-[#45464d]">No booking selected.</p>
      </div>
    );
  }

  const status = booking ? getStatusStyle(booking.status) : null;

  return (
    <div className="min-h-screen bg-[#f7f9fb] flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-[#f2f4f6] px-5 py-4 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => router.back()} className="w-9 h-9 rounded-xl bg-[#f2f4f6] flex items-center justify-center hover:bg-[#e0e3e5] transition-colors flex-shrink-0">
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_back</span>
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-headline font-bold text-[#0F172A] truncate">{booking?.workerName || "Worker"}</p>
          <p className="text-[10px] font-bold text-green-500 uppercase tracking-wider flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block animate-pulse" />
            ACTIVE NOW
          </p>
        </div>
        <div className="w-10 h-10 rounded-full bg-[#f2f4f6] overflow-hidden flex items-center justify-center flex-shrink-0">
          <span className="material-symbols-outlined text-[#76777d]" style={{ fontSize: 22 }}>person</span>
        </div>
      </div>

      {/* Job context card */}
      {booking && (
        <div className="mx-4 mt-4 bg-white rounded-2xl border-l-4 border-l-[#fd761a] border border-[#f2f4f6] p-4">
          <p className="text-[10px] font-bold text-[#45464d] uppercase tracking-widest mb-1">Ongoing Project</p>
          <h3 className="font-headline font-bold text-[#0F172A] text-base leading-tight mb-2">{booking.description}</h3>
          <div className="flex items-center gap-4 text-xs text-[#45464d]">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined" style={{ fontSize: 13 }}>calendar_today</span>
              {booking.date}
            </span>
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined" style={{ fontSize: 13 }}>payments</span>
              {formatCurrency(booking.offeredAmount)} Est.
            </span>
            {status && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${status.color}`}>{status.label}</span>
            )}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4 pb-32">
        {messages.length === 0 && !loading && (
          <div className="text-center py-10">
            <span className="material-symbols-outlined text-[#c6c6cd] block mb-2" style={{ fontSize: 40 }}>chat_bubble_outline</span>
            <p className="text-sm text-[#45464d]">No messages yet. Start the conversation!</p>
          </div>
        )}

        {messages.map(msg => {
          const isMine = msg.senderId === user?.uid;
          return (
            <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
              <div className="max-w-[78%]">
                <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  isMine
                    ? "bg-[#131b2e] text-white rounded-br-sm"
                    : "bg-[#f2f4f6] text-[#0F172A] rounded-bl-sm"
                }`}>
                  {msg.text}
                </div>
                <p className={`text-[10px] text-[#76777d] mt-1 ${isMine ? "text-right" : "text-left"}`}>
                  {timeAgo(msg.createdAt)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend}
        className="fixed bottom-16 left-0 right-0 md:bottom-0 bg-white border-t border-[#f2f4f6] px-4 py-3 flex items-center gap-3">
        <button type="button" className="w-9 h-9 rounded-full bg-[#f2f4f6] flex items-center justify-center text-[#45464d] hover:bg-[#e0e3e5] flex-shrink-0 transition-colors">
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>add</span>
        </button>
        <input type="text" value={text} onChange={e => setText(e.target.value)}
          placeholder="Type a message…"
          className="flex-1 bg-[#f2f4f6] rounded-2xl px-4 py-3 text-sm text-[#0F172A] outline-none placeholder:text-[#76777d]"
        />
        <button type="submit" disabled={!text.trim()}
          className="w-10 h-10 rounded-full bg-[#F97316] flex items-center justify-center text-white hover:bg-[#e8680a] disabled:opacity-50 flex-shrink-0 transition-colors active:scale-95">
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>send</span>
        </button>
      </form>

      <BottomNav role="client" />
    </div>
  );
}
