import type { Metadata } from "next";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://readyroad.be";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "ReadyRoad Privacy Policy. Learn how we protect your personal data. GDPR compliant.",
  alternates: {
    canonical: `${APP_URL}/privacy-policy`,
  },
  openGraph: {
    title: "Privacy Policy | ReadyRoad",
    description:
      "How ReadyRoad handles and protects your personal data. GDPR compliant.",
    url: `${APP_URL}/privacy-policy`,
    siteName: "ReadyRoad",
    locale: "en_BE",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "ReadyRoad Privacy Policy",
      },
    ],
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function PrivacyPolicyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
