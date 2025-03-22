import GoogleMapsProvider from "@/components/GoogleMapsProvider";

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <GoogleMapsProvider>{children}</GoogleMapsProvider>;
}
