import { createPublicPageMetadata } from "@/lib/public-page-metadata";

export function generateMetadata() {
  return createPublicPageMetadata("disclaimer", "/disclaimer");
}

export default function DisclaimerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
