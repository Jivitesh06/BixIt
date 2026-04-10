import { db } from "./firebase";
import {
  collection, doc, setDoc, getDoc,
  getDocs, updateDoc, query, where,
  orderBy, limit, addDoc, serverTimestamp,
  onSnapshot
} from "firebase/firestore";

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
    earnings: { today: 0, week: 0, month: 0 },
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
  await updateDoc(doc(db, "workers", uid), {
    ...data,
    updatedAt: serverTimestamp(),
  });
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

// ── BOOKINGS ─────────────────────────────

export async function createBooking(data) {
  const otp = Math.floor(1000 + Math.random() * 9000).toString();
  const ref = await addDoc(collection(db, "bookings"), {
    ...data,
    status: "pending",
    otp,
    createdAt: serverTimestamp(),
  });
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

export function listenToBooking(bookingId, callback) {
  return onSnapshot(doc(db, "bookings", bookingId), (snap) => {
    if (snap.exists()) callback({ id: snap.id, ...snap.data() });
  });
}

// ── REVIEWS ──────────────────────────────

export async function createReview(data) {
  const ref = await addDoc(collection(db, "reviews"), {
    ...data,
    createdAt: serverTimestamp(),
  });
  // Update worker average rating
  const workerReviews = await getDocs(
    query(collection(db, "reviews"), where("workerId", "==", data.workerId))
  );
  const ratings = workerReviews.docs.map(d => d.data().rating);
  const avg = (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1);
  await updateDoc(doc(db, "workers", data.workerId), {
    averageRating: parseFloat(avg),
    totalReviews: ratings.length,
  });
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
}

export function listenToMessages(bookingId, callback) {
  const q = query(
    collection(db, "chats", bookingId, "messages"),
    orderBy("createdAt", "asc")
  );
  return onSnapshot(q, (snap) => {
    const messages = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(messages);
  });
}
