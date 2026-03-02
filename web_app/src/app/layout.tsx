import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/auth-context";
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
    { media: "(prefers-color-scheme: dark)",  color: "#181B20" },
  ],
  width: "device-width",
  initialScale: 1,
};

// ─── Metadata ────────────────────────────────────────────

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://readyroad.be";
const OG_IMAGE = { url: "/images/og.png", width: 1200, height: 630, alt: "ReadyRoad" };

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),

  title: {
    default:  "ReadyRoad - Belgian Driving License Exam Prep",
    template: "%s | ReadyRoad",
  },
  description:
    "Master your Belgian driving license with comprehensive exam preparation, practice tests, and analytics.",
  keywords: ["Belgian driving license", "driving exam", "practice test", "traffic signs", "Belgium"],

  authors:   [{ name: "ReadyRoad Team" }],
  creator:   "ReadyRoad",
  publisher: "ReadyRoad",

  formatDetection: { email: false, address: false, telephone: false },

  icons: {
    icon: [
      { url: "/favicon.ico",                sizes: "any" },
      { url: "/favicon-16x16.png",          sizes: "16x16",  type: "image/png" },
      { url: "/favicon-32x32.png",          sizes: "32x32",  type: "image/png" },
      { url: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: [{ url: "/favicon.ico" }],
    apple:    [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },

  manifest: "/manifest.json",

  openGraph: {
    title:       "ReadyRoad - Belgian Driving License Exam Prep",
    description: "Master your Belgian driving license with comprehensive exam preparation, practice tests, and analytics.",
    type:        "website",
    locale:      "en_BE",
    images:      [OG_IMAGE],
  },

  twitter: {
    card:        "summary_large_image",
    title:       "ReadyRoad - Belgian Driving License Exam Prep",
    description: "Master your Belgian driving license with comprehensive exam preparation.",
    images:      [OG_IMAGE.url],
  },

  appleWebApp: {
    capable:         true,
    statusBarStyle:  "default",
    title:           "ReadyRoad",
  },
};

// ─── Layout ──────────────────────────────────────────────

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
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
                <Navbar />
                {children}
                <ConditionalFooter />
                <Toaster position="top-right" richColors />
              </AuthProvider>
            </LanguageProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
