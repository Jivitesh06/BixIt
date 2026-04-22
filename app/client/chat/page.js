"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ChatListView, ChatRoomView } from "@/components/ChatRoom";

const Spinner = () => (
  <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
    <div className="w-10 h-10 rounded-full border-4 border-[#F97316] border-t-transparent animate-spin"/>
  </div>
);

export default function ClientChat() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const bookingId    = searchParams.get("bookingId");
  const { user, profile, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [user, authLoading]);

  // Still waiting for Firebase to tell us who the user is
  if (authLoading) return <Spinner />;

  // Auth done but no user — will redirect via useEffect, show spinner meanwhile
  if (!user) return <Spinner />;

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
