import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/components/Toast";
import { Noto_Sans } from "next/font/google";
import "./globals.css";

const notoSans = Noto_Sans({
  subsets: ["latin", "devanagari"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata = {
  title: "Bixit — Find Trusted Workers Instantly",
  description: "On-demand platform connecting clients with verified skilled workers in India.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={notoSans.className}>
        <AuthProvider>
          <ToastProvider>
            <div className="animate-page-in">
              {children}
            </div>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
