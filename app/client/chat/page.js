"use client";

import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ChatListView, ChatRoomView } from "@/components/ChatRoom";

export default function ClientChat() {
  const searchParams = useSearchParams();
  const bookingId    = searchParams.get("bookingId");
  const { user, profile, loading } = useAuth();

  if (loading || !user)
    return <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center"><div className="animate-spin w-10 h-10 rounded-full border-4 border-[#0F172A] border-t-transparent"/></div>;

  if (!bookingId)
    return <ChatListView userId={user.uid} role="client" />;

  return (
    <ChatRoomView
      bookingId={bookingId}
      userId={user.uid}
      userRole="client"
      role="client"
      profile={profile}
    />
  );
}
