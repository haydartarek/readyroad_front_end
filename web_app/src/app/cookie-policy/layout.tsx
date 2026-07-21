import { createPublicPageMetadata } from "@/lib/public-page-metadata";

export function generateMetadata() {
  return createPublicPageMetadata("cookies", "/cookie-policy");
}

export default function CookiePolicyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
