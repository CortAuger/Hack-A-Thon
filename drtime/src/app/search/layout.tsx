/**
 * Search Page Layout
 * Provides Google Maps context to all search-related pages.
 * Wraps child components with GoogleMapsProvider for map functionality.
 *
 * Features:
 * - Initializes Google Maps API
 * - Provides Google Maps context to child components
 * - Handles API loading and error states
 */

import GoogleMapsProvider from "@/components/GoogleMapsProvider";

/**
 * SearchLayout Component
 * @param children Child components to be wrapped with Google Maps context
 * @returns Layout component with Google Maps provider
 */
export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <GoogleMapsProvider>{children}</GoogleMapsProvider>;
}
