/**
 * Routes Page
 * This is a redirect page that automatically forwards users to the routes list.
 * Serves as the main entry point for the routes section of the application.
 *
 * Features:
 * - Automatic redirection to /routes/list
 * - Maintains clean URL structure
 * - Improves user navigation flow
 */

import { redirect } from "next/navigation";

/**
 * RoutesPage Component
 * Immediately redirects to the routes list page
 * @returns Redirect to /routes/list
 */
export default function RoutesPage() {
  redirect("/routes/list");
}
