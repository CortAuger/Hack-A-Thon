/**
 * Root Layout Component
 * This is the main layout component that wraps the entire application.
 * It provides the basic HTML structure and includes essential configurations
 * such as fonts, metadata, and client-side layout wrapper.
 *
 * Features:
 * - Inter font integration
 * - Application metadata
 * - Client-side layout wrapper
 * - Language configuration
 */

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ClientLayout from "@/components/ClientLayout";

/**
 * Initialize Inter font for the application
 * This font will be used throughout the application for consistent typography
 */
const inter = Inter({ subsets: ["latin"] });

/**
 * Application metadata configuration
 * Defines the title and description that appear in browser tabs and search results
 */
export const metadata: Metadata = {
  title: "DRTime - Durham Region Transit",
  description: "Real-time bus tracking for Durham Region Transit",
};

/**
 * RootLayout Component
 * Wraps the entire application with necessary providers and configurations
 * @param children - Child components to be rendered within the layout
 * @returns The root layout structure with client-side wrapper
 */
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
