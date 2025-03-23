/**
 * Home Page Component
 * This is the root page component that handles the application's entry point.
 * It automatically redirects users to the search page, which serves as the
 * main interface for the application.
 *
 * Features:
 * - Automatic redirection to /search
 * - Clean URL structure
 * - Improved user navigation flow
 */

import { redirect } from "next/navigation";

/**
 * HomePage Component
 * Redirects users to the search page when they visit the root URL
 * @returns Redirects to /search
 */
export default function HomePage() {
  redirect("/search");
}
