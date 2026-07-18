import type { Metadata } from "next";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://readyroad.be";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "ReadyRoad Terms of Service. Read our usage terms for the Belgian driving license exam preparation platform.",
  alternates: {
    canonical: `${APP_URL}/terms`,
  },
  openGraph: {
    title: "Terms of Service | ReadyRoad",
    description:
      "ReadyRoad terms of service for the Belgian driving license preparation platform.",
    url: `${APP_URL}/terms`,
    siteName: "ReadyRoad",
    locale: "en_BE",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "ReadyRoad Terms",
      },
    ],
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
