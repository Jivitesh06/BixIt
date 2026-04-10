import { WORKER_BADGES } from "./constants";

// Get worker badge based on completed jobs
export function getWorkerBadge(completedJobs = 0) {
  if (completedJobs <= 10) return WORKER_BADGES.NEW;
  if (completedJobs <= 30) return WORKER_BADGES.TRUSTED;
  if (completedJobs <= 50) return WORKER_BADGES.EXPERT;
  return WORKER_BADGES.ELITE;
}

// Format currency in Indian format
export function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

// Generate 4 digit OTP
export function generateOTP() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// Get time ago string
export function timeAgo(timestamp) {
  if (!timestamp) return "";
  const now = new Date();
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const seconds = Math.floor((now - date) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

// Calculate average rating
export function calcAverageRating(ratings = []) {
  if (ratings.length === 0) return 0;
  return (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1);
}

// Get job status label and color
export function getStatusStyle(status) {
  const styles = {
    pending: { label: "Pending", color: "text-yellow-600 bg-yellow-100" },
    accepted: { label: "Accepted", color: "text-blue-600 bg-blue-100" },
    on_the_way: { label: "On the Way", color: "text-blue-600 bg-blue-100" },
    arrived: { label: "Arrived", color: "text-blue-600 bg-blue-100" },
    in_progress: { label: "In Progress", color: "text-orange-600 bg-orange-100" },
    completed: { label: "Completed", color: "text-green-600 bg-green-100" },
    cancelled: { label: "Cancelled", color: "text-red-600 bg-red-100" },
    disputed: { label: "Disputed", color: "text-red-600 bg-red-100" },
  };
  return styles[status] || styles.pending;
}
