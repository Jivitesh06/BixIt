import { AuthProvider } from "@/context/AuthContext";
import { Noto_Sans } from "next/font/google";
import "./globals.css";

const notoSans = Noto_Sans({ 
  subsets: ["latin", "devanagari"],
  weight: ["400", "500", "600", "700"]
});

export const metadata = {
  title: "Bixit — Find Trusted Workers Instantly",
  description: "On-demand platform connecting clients with verified skilled workers",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={notoSans.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
