// All icons are inline SVG — zero Material Icons
const ic = (d, s = "0 0 24 24") => ({d, s});

function Svg({ size = 20, stroke = "currentColor", fill = "none", sw = "1.8", children, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke}
      strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" className={className}>
      {children}
    </svg>
  );
}

export const SearchIcon       = ({ size=20 }) => <Svg size={size}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></Svg>;
export const FilterIcon       = ({ size=20 }) => <Svg size={size}><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></Svg>;
export const MapPinIcon       = ({ size=20 }) => <Svg size={size}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></Svg>;
export const BellIcon         = ({ size=20 }) => <Svg size={size}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></Svg>;
export const UserIcon         = ({ size=20 }) => <Svg size={size}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></Svg>;
export const LogOutIcon       = ({ size=20 }) => <Svg size={size}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></Svg>;
export const ChevronDownIcon  = ({ size=20 }) => <Svg size={size} sw="2"><polyline points="6 9 12 15 18 9"/></Svg>;
export const ChevronRightIcon = ({ size=20 }) => <Svg size={size} sw="2"><polyline points="9 18 15 12 9 6"/></Svg>;
export const ChevronLeftIcon  = ({ size=20 }) => <Svg size={size} sw="2"><polyline points="15 18 9 12 15 6"/></Svg>;
export const StarIcon         = ({ size=20, fill="none" }) => <Svg size={size} fill={fill}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></Svg>;
export const CheckIcon        = ({ size=20 }) => <Svg size={size} sw="2.5"><polyline points="20 6 9 17 4 12"/></Svg>;
export const XIcon            = ({ size=20 }) => <Svg size={size} sw="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></Svg>;
export const PlusIcon         = ({ size=20 }) => <Svg size={size} sw="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></Svg>;
export const EyeIcon          = ({ size=20 }) => <Svg size={size}><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></Svg>;
export const EyeOffIcon       = ({ size=20 }) => <Svg size={size}><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" y1="2" x2="22" y2="22"/></Svg>;
export const MailIcon         = ({ size=20 }) => <Svg size={size}><rect x="2" y="4" width="20" height="16" rx="3"/><path d="m2 7 9.3 6.2a1 1 0 0 0 1.4 0L22 7"/></Svg>;
export const LockIcon         = ({ size=20 }) => <Svg size={size}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></Svg>;
export const PhoneIcon        = ({ size=20 }) => <Svg size={size}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.8a16 16 0 0 0 6.29 6.29l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></Svg>;
export const CameraIcon       = ({ size=20 }) => <Svg size={size}><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></Svg>;
export const UploadIcon       = ({ size=20 }) => <Svg size={size}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></Svg>;
export const SendIcon         = ({ size=20 }) => <Svg size={size}><path d="m22 2-7 20-4-9-9-4 20-7z"/><path d="M22 2 11 13"/></Svg>;
export const HomeIcon         = ({ size=20 }) => <Svg size={size}><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></Svg>;
export const CalendarIcon     = ({ size=20 }) => <Svg size={size}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></Svg>;
export const ChatIcon         = ({ size=20 }) => <Svg size={size}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></Svg>;
export const BriefcaseIcon    = ({ size=20 }) => <Svg size={size}><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></Svg>;
export const ArrowRightIcon   = ({ size=20 }) => <Svg size={size} sw="2"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></Svg>;
export const ArrowLeftIcon    = ({ size=20 }) => <Svg size={size} sw="2"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></Svg>;
export const ShieldIcon       = ({ size=20 }) => <Svg size={size}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></Svg>;
export const ClockIcon        = ({ size=20 }) => <Svg size={size}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></Svg>;
export const ZapIcon          = ({ size=20 }) => <Svg size={size}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></Svg>;
export const CreditCardIcon   = ({ size=20 }) => <Svg size={size}><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></Svg>;
export const CashIcon         = ({ size=20 }) => <Svg size={size}><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></Svg>;
export const AlertCircleIcon  = ({ size=20 }) => <Svg size={size}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></Svg>;
export const CheckCircleIcon  = ({ size=20 }) => <Svg size={size}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></Svg>;
export const EditIcon         = ({ size=20 }) => <Svg size={size}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></Svg>;
export const NavigationIcon   = ({ size=20 }) => <Svg size={size}><polygon points="3 11 22 2 13 21 11 13 3 11"/></Svg>;
export const WorkIcon         = ({ size=20 }) => <Svg size={size}><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></Svg>;
export const BadgeIcon        = ({ size=20 }) => <Svg size={size}><path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"/><path d="m9 12 2 2 4-4"/></Svg>;
export const BookOpenIcon     = ({ size=20 }) => <Svg size={size}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></Svg>;
export const TrendingUpIcon   = ({ size=20 }) => <Svg size={size}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></Svg>;
export const MenuIcon         = ({ size=20 }) => <Svg size={size} sw="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></Svg>;
export const MotorbikeIcon    = ({ size=20 }) => <Svg size={size}><circle cx="5.5" cy="17.5" r="2.5"/><circle cx="18.5" cy="17.5" r="2.5"/><path d="M15 6h2l3 3.5"/><path d="M6 17.5h6l2-5H9.5L8 9H5"/></Svg>;
export const ImageIcon        = ({ size=20 }) => <Svg size={size}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></Svg>;

export function Spinner({ size = 20, color = "white" }) {
  return (
    <svg className="animate-spin" width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="3" strokeOpacity="0.25"/>
      <path d="M12 2a10 10 0 0 1 10 10" stroke={color} strokeWidth="3" strokeLinecap="round"/>
    </svg>
  );
}
