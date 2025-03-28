import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ToastContainer } from "react-toastify";
import "./globals.css";
import "react-toastify/dist/ReactToastify.css";
import { AuthProvider } from "@/app/context/AuthContext";
import Nav from "@/components/navbar"; // Import the nav bar

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "raily.io",
  description: "Track Management System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          {/* Wrap everything in a flex container */}
          <div className="flex">
            {/* Nav is always visible */}
            <Nav />
            {/* Main content will be rendered next to Nav */}
            <main className="flex-1">
              {children}
            </main>
          </div>
          {children}
          <ToastContainer />
        </AuthProvider>
      </body>
    </html>
  );
}
