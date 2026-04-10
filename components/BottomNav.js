"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HomeIcon, CalendarIcon, ChatIcon, UserIcon, BriefcaseIcon, TrendingUpIcon } from "./Icons";

const CLIENT_NAV = [
  { label: "Home",     href: "/client/dashboard", Icon: HomeIcon     },
  { label: "Bookings", href: "/client/bookings",  Icon: CalendarIcon },
  { label: "Chat",     href: "/client/chat",       Icon: ChatIcon     },
  { label: "Profile",  href: "/client/profile",    Icon: UserIcon     },
];

const WORKER_NAV = [
  { label: "Home",     href: "/worker/dashboard", Icon: HomeIcon      },
  { label: "Jobs",     href: "/worker/jobs",        Icon: BriefcaseIcon },
  { label: "Chat",     href: "/worker/chat",        Icon: ChatIcon      },
  { label: "Profile",  href: "/worker/profile",     Icon: UserIcon      },
];

export default function BottomNav({ role = "client" }) {
  const pathname = usePathname();
  const items = role === "worker" ? WORKER_NAV : CLIENT_NAV;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#E2E8F0]"
      style={{ boxShadow: "0 -4px 24px rgba(15,23,42,0.06)" }}>
      <div className="flex items-center justify-around px-2 pt-2 pb-safe-area">
        {items.map(({ label, href, Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + "?");
          return (
            <Link key={href} href={href}
              className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl min-w-[60px] transition-all duration-200 ${isActive ? "text-[#F97316]" : "text-[#94A3B8] hover:text-[#64748B]"}`}>
              <div className="relative">
                <Icon size={22} />
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#F97316] rounded-full" />
                )}
              </div>
              <span className={`text-[10px] font-semibold tracking-wide ${isActive ? "text-[#F97316]" : ""}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
