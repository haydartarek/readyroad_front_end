import type { Metadata } from "next";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://readyroad.be";

export const metadata: Metadata = {
  title: "Belgian Traffic Signs in 4 Languages",
  description:
    "Study 184 Belgian traffic signs with explanations in English, Dutch, French, and Arabic, including danger, prohibition, mandatory, parking, and zone signs.",
  keywords: [
    "Belgian traffic signs",
    "traffic signs Belgium",
    "road signs Belgium",
    "verkeerstekens België",
    "verkeersborden leren",
    "gevaarsborden België",
    "panneaux signalisation belgique",
    "panneaux routiers belgique",
    "إشارات المرور بلجيكا",
    "علامات الطريق البلجيكية",
  ],
  alternates: {
    canonical: `${APP_URL}/traffic-signs`,
  },
  openGraph: {
    title: "184 Belgian Traffic Signs in 4 Languages | ReadyRoad",
    description:
      "All official Belgian road signs with explanations in English, Nederlands, Français & العربية. Essential for passing your driving license exam.",
    url: `${APP_URL}/traffic-signs`,
    siteName: "ReadyRoad",
    locale: "en_BE",
    alternateLocale: ["nl_BE", "fr_BE", "ar_BE"],
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Belgian Traffic Signs – ReadyRoad",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "184 Belgian Traffic Signs | ReadyRoad",
    description:
      "Study all official Belgian road signs. Essential for passing your driving exam.",
    images: ["/opengraph-image"],
  },
};

export default function TrafficSignsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">{children}</main>
    </div>
  );
}
