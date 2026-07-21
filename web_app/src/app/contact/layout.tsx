import { createPublicPageMetadata } from "@/lib/public-page-metadata";

export function generateMetadata() {
  return createPublicPageMetadata("contact", "/contact");
}

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
