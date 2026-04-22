import { db } from "./firebase";
import {
  collection, doc, setDoc, getDoc,
  getDocs, updateDoc, query, where,
  orderBy, limit, addDoc, serverTimestamp,
  onSnapshot, increment
} from "firebase/firestore";
import { PLATFORM_COMMISSION } from "./constants";

// ── WORKERS ──────────────────────────────

export async function createWorkerProfile(uid, data) {
  await setDoc(doc(db, "workers", uid), {
    ...data,
    uid,
    role: "worker",
    isVerified: false,
    verificationStatus: "pending",
    completedJobs: 0,
    averageRating: 0,
    totalReviews: 0,
    earnings: { today: 0, week: 0, month: 0, total: 0 },
    createdAt: serverTimestamp(),
  });
}

export async function getWorkerProfile(uid) {
  const snap = await getDoc(doc(db, "workers", uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function getWorkersByCategory(category, limitCount = 20) {
  const q = category === "all"
    ? query(collection(db, "workers"), orderBy("averageRating", "desc"), limit(limitCount))
    : query(
        collection(db, "workers"),
        where("skills", "array-contains", category),
        orderBy("averageRating", "desc"),
        limit(limitCount)
      );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function updateWorkerProfile(uid, data) {
  await updateDoc(doc(db, "workers", uid), { ...data, updatedAt: serverTimestamp() });
}

export async function getPendingVerificationWorkers() {
  const q = query(collection(db, "workers"), where("verificationStatus", "==", "pending"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function verifyWorker(uid) {
  await updateDoc(doc(db, "workers", uid), {
    isVerified: true,
    verificationStatus: "verified",
    verifiedAt: serverTimestamp(),
  });
}

export async function rejectWorker(uid) {
  await updateDoc(doc(db, "workers", uid), { verificationStatus: "rejected" });
}

// ── CLIENTS ──────────────────────────────

export async function createClientProfile(uid, data) {
  await setDoc(doc(db, "clients", uid), {
    ...data,
    uid,
    role: "client",
    createdAt: serverTimestamp(),
  });
}

export async function getClientProfile(uid) {
  const snap = await getDoc(doc(db, "clients", uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function updateClientProfile(uid, data) {
  await updateDoc(doc(db, "clients", uid), { ...data, updatedAt: serverTimestamp() });
}

export async function getAllClients(limitCount = 50) {
  const q = query(collection(db, "clients"), orderBy("createdAt", "desc"), limit(limitCount));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getAllWorkers(limitCount = 50) {
  const q = query(collection(db, "workers"), orderBy("createdAt", "desc"), limit(limitCount));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ── BOOKINGS ─────────────────────────────

export async function createBooking(data) {
  const arrivalOtp = Math.floor(1000 + Math.random() * 9000).toString();
  const ref = await addDoc(collection(db, "bookings"), {
    ...data,
    status: "pending",
    arrivalOtp,
    createdAt: serverTimestamp(),
  });
  // Notify worker of new job request
  try {
    const serviceLabel = (data.services || [])[0] || "service";
    await createNotification(data.workerId, {
      title: "New Job Request 🔔",
      body: `${data.clientName || "A client"} needs ${serviceLabel} — ₹${data.totalAmount || 0}`,
      type: "new_request",
      bookingId: ref.id,
      href: "/worker/dashboard",
    });
  } catch (_) {}
  return ref.id;
}

export async function getBooking(bookingId) {
  const snap = await getDoc(doc(db, "bookings", bookingId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function updateBookingStatus(bookingId, status, extraData = {}) {
  await updateDoc(doc(db, "bookings", bookingId), {
    status,
    ...extraData,
    updatedAt: serverTimestamp(),
  });
  // Auto-fire notifications based on status change
  try {
    const snap = await getDoc(doc(db, "bookings", bookingId));
    if (!snap.exists()) return;
    const b = snap.data();
    const notifMap = {
      accepted: {
        to: b.clientId,
        title: "Request Accepted ✅",
        body: `${b.workerName || "Worker"} accepted your request!`,
        type: "booking_accepted",
        href: "/client/bookings",
      },
      declined: {
        to: b.clientId,
        title: "Request Declined ❌",
        body: `${b.workerName || "Worker"} couldn't take this job.`,
        type: "booking_declined",
        href: "/client/bookings",
      },
      counter_offered: {
        to: b.clientId,
        title: "Counter Offer 💬",
        body: `${b.workerName || "Worker"} suggested ₹${extraData.counterAmount || ""}`,
        type: "counter_offer",
        href: "/client/bookings",
      },
      on_the_way: {
        to: b.clientId,
        title: "Worker on the way 🛵",
        body: `${b.workerName || "Worker"} is heading to your location`,
        type: "on_the_way",
        href: "/client/bookings",
      },
      arrived: {
        to: b.clientId,
        title: "Worker has arrived! 📍",
        body: "Show your OTP to start the job",
        type: "arrived",
        href: "/client/bookings",
      },
      in_progress: {
        to: b.clientId,
        title: "Job Started 🔧",
        body: `${b.workerName || "Worker"} has started the job`,
        type: "job_started",
        href: "/client/bookings",
      },
      completed: {
        to: b.clientId,
        title: "Job Completed ✔️",
        body: "Please confirm and leave a review!",
        type: "job_complete",
        href: "/client/bookings",
      },
      cancelled: {
        to: extraData.cancelledBy === "worker" ? b.clientId : b.workerId,
        title: "Booking Cancelled 🚫",
        body: `Booking was cancelled${extraData.cancelReason ? `: ${extraData.cancelReason}` : ""}`,
        type: "cancelled",
        href: extraData.cancelledBy === "worker" ? "/client/bookings" : "/worker/dashboard",
      },
    };
    const notif = notifMap[status];
    if (notif) await createNotification(notif.to, { title: notif.title, body: notif.body, type: notif.type, bookingId, href: notif.href });
  } catch (_) {}
}

export async function getClientBookings(clientId) {
  const q = query(
    collection(db, "bookings"),
    where("clientId", "==", clientId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getWorkerBookings(workerId) {
  const q = query(
    collection(db, "bookings"),
    where("workerId", "==", workerId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getAllBookings(limitCount = 100) {
  const q = query(collection(db, "bookings"), orderBy("createdAt", "desc"), limit(limitCount));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export function listenToBooking(bookingId, callback) {
  return onSnapshot(doc(db, "bookings", bookingId), (snap) => {
    if (snap.exists()) callback({ id: snap.id, ...snap.data() });
  });
}

// ── PAYMENT / COMMISSION ─────────────────

export async function processPayment(bookingId, totalAmount, workerId) {
  const commission   = Math.round(totalAmount * PLATFORM_COMMISSION);
  const workerAmount = totalAmount - commission;

  await updateDoc(doc(db, "bookings", bookingId), {
    totalAmount,
    commission,
    workerAmount,
    paymentProcessed: true,
    paymentProcessedAt: serverTimestamp(),
  });

  await updateDoc(doc(db, "workers", workerId), {
    "earnings.today":  increment(workerAmount),
    "earnings.week":   increment(workerAmount),
    "earnings.month":  increment(workerAmount),
    "earnings.total":  increment(workerAmount),
    completedJobs: increment(1),
  });

  await setDoc(doc(db, "platform", "revenue"), {
    total:        increment(commission),
    transactions: increment(1),
  }, { merge: true });

  return { commission, workerAmount };
}

export async function getPlatformStats() {
  const [workers, clients, bookings, revenue] = await Promise.all([
    getDocs(collection(db, "workers")),
    getDocs(collection(db, "clients")),
    getDocs(collection(db, "bookings")),
    getDoc(doc(db, "platform", "revenue")),
  ]);
  return {
    totalWorkers:   workers.size,
    totalClients:   clients.size,
    totalBookings:  bookings.size,
    revenue:        revenue.exists() ? revenue.data() : { total: 0, transactions: 0 },
    recentBookings: bookings.docs.slice(0, 10).map(d => ({ id: d.id, ...d.data() })),
  };
}

// ── REVIEWS ──────────────────────────────

export async function createReview(data) {
  const ref = await addDoc(collection(db, "reviews"), {
    ...data,
    createdAt: serverTimestamp(),
  });
  const workerReviews = await getDocs(
    query(collection(db, "reviews"), where("workerId", "==", data.workerId))
  );
  const ratings = workerReviews.docs.map(d => d.data().rating);
  const avg = (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1);
  await updateDoc(doc(db, "workers", data.workerId), {
    averageRating: parseFloat(avg),
    totalReviews: ratings.length,
  });
  await updateDoc(doc(db, "bookings", data.bookingId), { hasReview: true });
  return ref.id;
}

export async function getWorkerReviews(workerId) {
  const q = query(
    collection(db, "reviews"),
    where("workerId", "==", workerId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ── CHAT ─────────────────────────────────

export async function sendMessage(bookingId, data) {
  await addDoc(collection(db, "chats", bookingId, "messages"), {
    ...data,
    createdAt: serverTimestamp(),
  });
  // Update last message on booking for chat list
  await updateDoc(doc(db, "bookings", bookingId), {
    lastMessage:     data.text,
    lastMessageAt:   serverTimestamp(),
    lastMessageRole: data.senderRole,
  }).catch(() => {});
}

export function listenToMessages(bookingId, callback) {
  const q = query(
    collection(db, "chats", bookingId, "messages"),
    orderBy("createdAt", "asc")
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

// ── NOTIFICATIONS ─────────────────────────

export async function createNotification(userId, data) {
  await addDoc(collection(db, "notifications"), {
    userId,
    ...data,
    read: false,
    createdAt: serverTimestamp(),
  });
}

export function listenToNotifications(userId, callback) {
  const q = query(
    collection(db, "notifications"),
    where("userId", "==", userId),
    where("read", "==", false),
    orderBy("createdAt", "desc"),
    limit(20)
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

export async function markNotificationRead(notifId) {
  await updateDoc(doc(db, "notifications", notifId), { read: true });
}

export async function markAllNotificationsRead(userId) {
  const q    = query(collection(db, "notifications"), where("userId", "==", userId), where("read", "==", false));
  const snap = await getDocs(q);
  await Promise.all(snap.docs.map(d => updateDoc(d.ref, { read: true })));
}
