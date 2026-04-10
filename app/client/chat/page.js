"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { sendMessage, listenToMessages, getBooking } from "@/lib/firestore";
import BottomNav from "@/components/BottomNav";
import { SendIcon, ArrowLeftIcon, Spinner } from "@/components/Icons";

export default function ClientChat() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const bookingId    = searchParams.get("bookingId");
  const { user }     = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText]         = useState("");
  const [booking, setBooking]   = useState(null);
  const [sending, setSending]   = useState(false);
  const bottomRef = useRef();

  useEffect(() => {
    if (!bookingId || !user) return;
    getBooking(bookingId).then(setBooking);
    const unsub = listenToMessages(bookingId, msgs => {
      setMessages(msgs);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    });
    return unsub;
  }, [bookingId, user]);

  async function handleSend(e) {
    e.preventDefault();
    if (!text.trim() || !bookingId) return;
    setSending(true);
    await sendMessage(bookingId, { senderId: user.uid, senderRole: "client", text: text.trim() });
    setText(""); setSending(false);
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col pb-16">
      {/* Header */}
      <div className="bg-white border-b border-[#E2E8F0] px-4 py-4 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="w-9 h-9 rounded-full bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center text-[#64748B]">
            <ArrowLeftIcon size={18}/>
          </button>
          <div className="flex-1">
            <p className="font-bold text-[#0F172A]">{booking?.workerName || "Worker"}</p>
            <p className="text-xs text-[#94A3B8]">{booking ? `Booking · ${booking.scheduledDate}` : "Loading…"}</p>
          </div>
          <div className="w-2.5 h-2.5 rounded-full bg-[#22C55E] ring-2 ring-[#DCFCE7]" />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-16">
            <div className="text-5xl mb-3">💬</div>
            <p className="font-bold text-[#0F172A] mb-1">Start the conversation</p>
            <p className="text-sm text-[#94A3B8]">Messages with {booking?.workerName || "your worker"}</p>
          </div>
        )}
        {messages.map((msg, i) => {
          const isMe = msg.senderRole === "client";
          return (
            <div key={msg.id || i} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[78%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${isMe ? "bg-[#0F172A] text-white rounded-br-md" : "bg-white border border-[#E2E8F0] text-[#0F172A] rounded-bl-md shadow-sm"}`}>
                {msg.text}
                <p className={`text-[10px] mt-1.5 ${isMe ? "text-white/50" : "text-[#94A3B8]"}`}>
                  {msg.createdAt?.toDate?.()?.toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" }) || ""}
                </p>
              </div>
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

      <BottomNav role="client" />
    </div>
  );
}
