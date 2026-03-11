import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/auth-context";
import { NotificationProvider } from "@/contexts/notification-context";
import { LanguageProvider } from "@/contexts/language-context";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { Navbar } from "@/components/layout/navbar";
import { ConditionalFooter } from "@/components/layout/conditional-footer";
import { ErrorBoundary } from "@/components/error-boundary";

// ─── Font ────────────────────────────────────────────────

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

// ─── Viewport ────────────────────────────────────────────

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#181B20" },
  ],
  width: "device-width",
  initialScale: 1,
};

// ─── Metadata ────────────────────────────────────────────

export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://readyroad.be";
const OG_IMAGE = {
  url: "/images/og.png",
  width: 1200,
  height: 630,
  alt: "ReadyRoad – Belgian Driving License Exam Prep",
};

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),

  title: {
    default: "ReadyRoad | Belgian Driving License Exam Prep",
    template: "%s | ReadyRoad",
  },

  description:
    "ReadyRoad – the #1 platform to prepare for the Belgian driving license theory exam. Practice tests, 250+ traffic signs, lessons and progress analytics. Available in 4 languages.",

  keywords: [
    // ── English ──────────────────────────────────────────────
    "Belgian driving license exam",
    "Belgian driving theory test",
    "Belgian highway code",
    "Belgium driving test questions",
    "traffic signs Belgium",
    "practice driving test Belgium",
    "how to get a driving license in Belgium",
    "Belgium road test preparation",
    "driving license Belgium English",
    // ── Nederlands ───────────────────────────────────────────
    "rijbewijs theorie examen",
    "rijexamen oefenen",
    "verkeerstekens België",
    "theorie examen vragen",
    "rijbewijs B theorie",
    "rijtheorie halen België",
    "rijbewijs oefenen online",
    "theoretisch rijexamen belgie",
    "rijbewijs leren",
    // ── Français ─────────────────────────────────────────────
    "permis de conduire belgique",
    "code de la route belgique",
    "examen théorique permis conduire",
    "panneaux signalisation belgique",
    "révision permis de conduire",
    "permis B belgique exercices",
    "questions examen théorique permis",
    "test permis de conduire belgique",
    // ── العربية ───────────────────────────────────────────────
    "رخصة القيادة في بلجيكا",
    "امتحان القيادة في بلجيكا",
    "اختبار نظري بلجيكا",
    "إشارات المرور البلجيكية",
    "استعداد امتحان قيادة بلجيكا",
    // ── Brand ────────────────────────────────────────────────
    "ReadyRoad",
    "readyroad.be",
  ],

  authors: [{ name: "ReadyRoad Team", url: APP_URL }],
  creator: "ReadyRoad",
  publisher: "ReadyRoad",
  category: "education",

  formatDetection: { email: false, address: false, telephone: false },

  alternates: {
    canonical: APP_URL,
    languages: {
      en: `${APP_URL}`,
      nl: `${APP_URL}`,
      fr: `${APP_URL}`,
      ar: `${APP_URL}`,
      "x-default": APP_URL,
    },
  },

  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/images/logo.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: [{ url: "/favicon.ico" }],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },

  manifest: "/manifest.json",

  openGraph: {
    title: "ReadyRoad | Belgian Driving License Exam Prep",
    description:
      "Practice Belgian theory tests, study 250+ traffic signs, and track your progress. Available in 4 languages.",
    type: "website",
    url: APP_URL,
    siteName: "ReadyRoad",
    locale: "en_BE",
    alternateLocale: ["nl_BE", "fr_BE", "ar"],
    images: [OG_IMAGE],
  },

  twitter: {
    card: "summary_large_image",
    site: "@ReadyRoad",
    creator: "@ReadyRoad",
    title: "ReadyRoad | Belgian Driving License Exam Prep",
    description:
      "Practice theory tests, study 250+ traffic signs & track your progress. Available in 4 languages.",
    images: [OG_IMAGE.url],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ReadyRoad",
  },

  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ?? "",
  },
};

// ─── JSON-LD Structured Data ─────────────────────────────

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${APP_URL}/#organization`,
  name: "ReadyRoad",
  url: APP_URL,
  logo: {
    "@type": "ImageObject",
    url: `${APP_URL}/images/logo.png`,
    width: 512,
    height: 512,
  },
  description:
    "ReadyRoad is the #1 platform to prepare for the Belgian driving license theory exam, available in 4 languages: English, Nederlands, Français & العربية.",
  sameAs: ["https://readyroad.be"],
  areaServed: {
    "@type": "Country",
    name: "Belgium",
  },
  availableLanguage: ["English", "Dutch", "French", "Arabic"],
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${APP_URL}/#website`,
  url: APP_URL,
  name: "ReadyRoad",
  description:
    "Belgian driving license exam preparation platform in 4 languages.",
  publisher: {
    "@id": `${APP_URL}/#organization`,
  },
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${APP_URL}/traffic-signs?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
  inLanguage: ["en", "nl", "fr", "ar"],
};

const educationalAppSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "ReadyRoad",
  applicationCategory: "EducationalApplication",
  operatingSystem: "Web",
  url: APP_URL,
  description:
    "Prepare for the Belgian driving license exam with practice tests, 250+ traffic signs, theory lessons and progress analytics.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "EUR",
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.8",
    ratingCount: "1200",
    bestRating: "5",
    worstRating: "1",
  },
  inLanguage: ["en", "nl", "fr", "ar"],
  availableOnDevice: "Desktop, Mobile",
  publisher: {
    "@id": `${APP_URL}/#organization`,
  },
};

// ─── Layout ──────────────────────────────────────────────

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(educationalAppSchema),
          }}
        />
      </head>
      <body
        className={`${inter.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        <ErrorBoundary>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem={false}
            disableTransitionOnChange
          >
            <LanguageProvider>
              <AuthProvider>
                <NotificationProvider>
                  <Navbar />
                  {children}
                  <ConditionalFooter />
                  <Toaster position="bottom-right" richColors />
                </NotificationProvider>
              </AuthProvider>
            </LanguageProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
