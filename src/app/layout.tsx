import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { AuthProvider } from "@/app/context/AuthContext";
import { ToastProvider } from "@/components/ui/ToastProvider";
import Nav from "@/components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Railly - Railway Risk, Dispatch & Track Operations",
  description:
    "Industrial railway monitoring platform for automated weather & infrastructure risk alerts, crew work-order dispatching, and field status tracking.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          rel="preconnect"
          href="https://a.tile.openstreetmap.org"
          crossOrigin="anonymous"
        />
        <link rel="dns-prefetch" href="https://b.tile.openstreetmap.org" />
        <link rel="dns-prefetch" href="https://c.tile.openstreetmap.org" />
      </head>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#0d1015] text-gray-200`}
      >
        <AuthProvider>
          <ToastProvider>
            <div className="flex min-h-screen flex-col md:flex-row">
              <Nav />
              <main className="flex-1 min-w-0 pb-20 md:pb-0">{children}</main>
            </div>
          </ToastProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
