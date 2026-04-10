"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const clientItems = [
  { icon: "home",        label: "Home",     href: "/client/dashboard" },
  { icon: "event_note",  label: "Bookings", href: "/client/bookings"  },
  { icon: "chat_bubble", label: "Chat",     href: "/client/chat"      },
  { icon: "person",      label: "Profile",  href: "/client/profile"   },
];

const workerItems = [
  { icon: "home",        label: "Home",    href: "/worker/dashboard" },
  { icon: "work",        label: "Jobs",    href: "/worker/jobs"      },
  { icon: "chat_bubble", label: "Chat",    href: "/worker/chat"      },
  { icon: "person",      label: "Profile", href: "/worker/profile"   },
];

export default function BottomNav({ role = "client" }) {
  const pathname = usePathname();
  const items = role === "worker" ? workerItems : clientItems;

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-5 pt-3 bg-white/90 backdrop-blur-xl border-t border-gray-100 shadow-[0_-2px_24px_rgba(15,23,42,0.07)] md:hidden">
      {items.map((item) => {
        const active = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-0.5 min-w-[3rem] transition-colors duration-150 ${
              active ? "text-[#0F172A]" : "text-slate-400 hover:text-[#F97316]"
            }`}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 24 }}>
              {item.icon}
            </span>
            <span className={`text-[10px] tracking-wide ${active ? "font-semibold" : "font-medium"}`}>
              {item.label}
            </span>
            {active && <span className="w-1 h-1 bg-[#F97316] rounded-full mt-0.5" />}
          </Link>
        );
      })}
    </nav>
  );
}
