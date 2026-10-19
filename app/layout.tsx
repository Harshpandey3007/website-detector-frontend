import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import AppShell from "@/components/AppShell";
import { LiveProvider } from "@/components/LiveProvider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Aegis Watch",
  description: "Monitor web pages and get alerted, with a visual diff, the moment they change.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans">
        <LiveProvider>
          <AppShell>{children}</AppShell>
        </LiveProvider>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "#17181b", color: "#f2f3f5", border: "1px solid #26282d",
              fontSize: "13px", borderRadius: "8px", padding: "8px 12px",
            },
          }}
        />
      </body>
    </html>
  );
}
