import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ClientLayout from "@/components/ClientLayout";

// Initialize Inter font for the application
const inter = Inter({ subsets: ["latin"] });

// Application metadata configuration
export const metadata: Metadata = {
  title: "DRTime - Durham Region Transit",
  description: "Real-time bus tracking for Durham Region Transit",
};

// Root layout component that wraps the entire application
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
