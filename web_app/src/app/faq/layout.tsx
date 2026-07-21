import { createPublicPageMetadata } from "@/lib/public-page-metadata";

export function generateMetadata() {
  return createPublicPageMetadata("faq", "/faq");
}

export default function FaqLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
