"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, getDocs, orderBy, limit } from "firebase/firestore";

/**
 * Returns unread message count for the current user across all their bookings.
 * Counts messages in each active booking's chat where senderId !== userId.
 * Uses booking.lastMessageRole to avoid heavy per-booking queries — if the
 * last message was from the OTHER side we count it as potentially unread.
 */
export function useUnreadCount(userId, role) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!userId || !role) return;

    const field = role === "client" ? "clientId" : "workerId";
    const bQuery = query(
      collection(db, "bookings"),
      where(field, "==", userId),
      where("status", "not-in", ["cancelled", "completed"])
    );

    const unsub = onSnapshot(bQuery, async (snap) => {
      const otherRole = role === "client" ? "worker" : "client";
      let total = 0;
      for (const docSnap of snap.docs) {
        const b = docSnap.data();
        // Quick check: only bother querying messages if last msg was from other side
        if (b.lastMessageRole && b.lastMessageRole !== role) {
          // Count unread messages from the other person in this chat
          try {
            const msgQ = query(
              collection(db, "chats", docSnap.id, "messages"),
              where("senderRole", "==", otherRole),
            );
            const msgSnap = await getDocs(msgQ);
            total += msgSnap.size;
          } catch (_) {}
        }
      }
      setCount(total);
    }, () => {});

    return unsub;
  }, [userId, role]);

  return count;
}
