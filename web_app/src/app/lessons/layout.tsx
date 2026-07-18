import type { Metadata } from "next";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://readyroad.be";

export const metadata: Metadata = {
  title: "Belgian Driving Theory Lessons",
  description:
    "Structured Belgian driving theory lessons in English, العربية, Nederlands, and Français. Study road rules, right of way, signs, safety, and exam essentials with clear explanations.",
  keywords: [
    "Belgian driving theory lessons",
    "driving lessons Belgium",
    "rijbewijs lessen",
    "rijtheorie lessen België",
    "verkeersregels leren",
    "cours théorie permis conduire belgique",
    "leçons code de la route belgique",
    "دروس نظرية رخصة القيادة بلجيكا",
    "تعلم قواعد المرور بلجيكا",
  ],
  alternates: {
    canonical: `${APP_URL}/lessons`,
  },
  openGraph: {
    title: "Belgian Driving Theory Lessons | ReadyRoad",
    description:
      "Study Belgian road rules with clear, structured lessons in four languages.",
    url: `${APP_URL}/lessons`,
    siteName: "ReadyRoad",
    locale: "en_BE",
    alternateLocale: ["nl_BE", "fr_BE", "ar_BE"],
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Driving Theory Lessons – ReadyRoad",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Belgian Driving Theory Lessons | ReadyRoad",
    description:
      "Study Belgian road rules, signs, priority, and safe driving with clear theory lessons.",
    images: ["/opengraph-image"],
  },
};

export default function LessonsLayout({
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
