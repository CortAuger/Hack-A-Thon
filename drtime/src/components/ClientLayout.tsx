"use client";

import Navigation from "@/components/Navigation";
import ThemeRegistry from "@/components/ThemeRegistry";

// ClientLayout component wraps the application with theme and navigation
// This is a client component that provides the basic layout structure
export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeRegistry>
      <Navigation />
      <main>{children}</main>
    </ThemeRegistry>
  );
}
