export const SERVICE_CATEGORIES = [
  { id: "electrician",    label: "Electrician",       icon: "⚡" },
  { id: "plumber",        label: "Plumber",            icon: "🔧" },
  { id: "carpenter",      label: "Carpenter",          icon: "🪚" },
  { id: "painter",        label: "Painter",            icon: "🎨" },
  { id: "mason",          label: "Mason/Mistry",       icon: "🧱" },
  { id: "ac_repair",      label: "AC Repair",          icon: "❄️" },
  { id: "appliance_repair", label: "Appliance Repair", icon: "📱" },
  { id: "tile_fitter",    label: "Tile Fitter",        icon: "⬛" },
  { id: "welder",         label: "Welder",             icon: "🔥" },
  { id: "gardener",       label: "Gardener",           icon: "🌿" },
  { id: "pest_control",   label: "Pest Control",       icon: "🐛" },
  { id: "house_cleaner",  label: "House Cleaner",      icon: "🧹" },
  { id: "packers_movers", label: "Packers & Movers",   icon: "📦" },
  { id: "mechanic",       label: "Vehicle Mechanic",   icon: "🚗" },
  { id: "ro_repair",      label: "RO Repair",          icon: "💧" },
  { id: "false_ceiling",  label: "False Ceiling",      icon: "🏠" },
  { id: "flooring",       label: "Flooring",           icon: "🪵" },
];

export const PLATFORM_COMMISSION = 0.10; // 10% platform fee

export const WORKER_BADGES = {
  NEW:     { label: "New Worker",    minJobs: 0,   maxJobs: 10,       icon: "🥉" },
  TRUSTED: { label: "Trusted Worker", minJobs: 11,  maxJobs: 30,       icon: "🥈" },
  EXPERT:  { label: "Expert Worker", minJobs: 31,  maxJobs: 50,       icon: "🥇" },
  ELITE:   { label: "Elite Worker",  minJobs: 51,  maxJobs: Infinity,  icon: "💎" },
};

export const JOB_STATUS = {
  PENDING:     "pending",
  ACCEPTED:    "accepted",
  ON_THE_WAY:  "on_the_way",
  ARRIVED:     "arrived",
  IN_PROGRESS: "in_progress",
  COMPLETED:   "completed",
  CANCELLED:   "cancelled",
  DISPUTED:    "disputed",
};

export const PAYMENT_METHODS = { ONLINE: "online", CASH: "cash" };

export const CANCEL_REASONS_CLIENT = [
  "Changed my mind",
  "Worker taking too long",
  "Found another worker",
  "Wrong details entered",
  "Emergency came up",
  "Other",
];

export const CANCEL_REASONS_WORKER = [
  "Cannot reach location",
  "Personal emergency",
  "Work outside my expertise",
  "Client unresponsive",
  "Other",
];

export const TRANSLATIONS = {
  en: {
    findWorker: "Find Trusted Workers, Instantly",
    iNeedWorker: "I Need a Worker",
    imWorker: "I'm a Worker",
    bookNow: "Book Now",
    verified: "Aadhaar Verified",
    hello: "Hello",
    searchPlaceholder: "What service do you need?",
    topRated: "Top Rated Near You",
    newRequests: "New Requests",
    earnings: "Earnings Today",
    accept: "Accept",
    decline: "Decline",
    counter: "Counter",
    onMyWay: "I'm on my way",
    arrived: "I've Arrived",
    startJob: "Start Job",
    markComplete: "Mark Work Complete",
    cashReceived: "Cash Received",
    myBookings: "My Bookings",
    active: "Active",
    completed: "Completed",
    cancelled: "Cancelled",
  },
  hi: {
    findWorker: "तुरंत विश्वसनीय कारीगर खोजें",
    iNeedWorker: "मुझे कारीगर चाहिए",
    imWorker: "मैं कारीगर हूं",
    bookNow: "अभी बुक करें",
    verified: "आधार सत्यापित",
    hello: "नमस्ते",
    searchPlaceholder: "आपको कौन सी सेवा चाहिए?",
    topRated: "आपके पास शीर्ष रेटेड",
    newRequests: "नई requests",
    earnings: "आज की कमाई",
    accept: "स्वीकार करें",
    decline: "अस्वीकार करें",
    counter: "काउंटर",
    onMyWay: "मैं आ रहा हूं",
    arrived: "मैं पहुंच गया",
    startJob: "काम शुरू करें",
    markComplete: "काम पूरा करें",
    cashReceived: "नकद प्राप्त हुआ",
    myBookings: "मेरी बुकिंग",
    active: "सक्रिय",
    completed: "पूर्ण",
    cancelled: "रद्द",
  },
};
