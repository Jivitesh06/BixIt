"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ChatListView, ChatRoomView } from "@/components/ChatRoom";

const Loader = () => (
  <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
    <div className="w-10 h-10 rounded-full border-4 border-[#F97316] border-t-transparent animate-spin"/>
  </div>
);

function WorkerChatInner() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const bookingId    = searchParams.get("bookingId");
  const { user, profile, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [user, authLoading]);

  if (authLoading) return <Loader />;
  if (!user)       return <Loader />;

  if (!bookingId)
    return <ChatListView userId={user.uid} role="worker" />;

  return (
    <ChatRoomView
      bookingId={bookingId}
      userId={user.uid}
      userRole="worker"
      role="worker"
      profile={profile}
    />
  );
}

export default function WorkerChat() {
  return (
    <Suspense fallback={<Loader />}>
      <WorkerChatInner />
    </Suspense>
  );
}
