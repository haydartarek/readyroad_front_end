import { createPublicPageMetadata } from "@/lib/public-page-metadata";

export function generateMetadata() {
  return createPublicPageMetadata("privacy", "/privacy-policy");
}

export default function PrivacyPolicyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
