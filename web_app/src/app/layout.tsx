import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/auth-context";
import { LanguageProvider } from "@/contexts/language-context";
import { Toaster } from "@/components/ui/sonner";
import { Navbar } from "@/components/layout/navbar";
import { ErrorBoundary } from "@/components/error-boundary";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://readyroad.be'),
  title: {
    default: "ReadyRoad - Belgian Driving License Exam Prep",
    template: "%s | ReadyRoad"
  },
  description: "Master your Belgian driving license with comprehensive exam preparation, practice tests, and analytics.",
  keywords: ["Belgian driving license", "driving exam", "practice test", "traffic signs", "Belgium"],
  authors: [{ name: "ReadyRoad Team" }],
  creator: "ReadyRoad",
  publisher: "ReadyRoad",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: [{ url: '/favicon.ico' }],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/manifest.json',
  openGraph: {
    title: "ReadyRoad - Belgian Driving License Exam Prep",
    description: "Master your Belgian driving license with comprehensive exam preparation, practice tests, and analytics.",
    type: "website",
    locale: "en_BE",
    images: [
      {
        url: '/images/logo.png',
        width: 1200,
        height: 630,
        alt: 'ReadyRoad Logo',
      }
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ReadyRoad - Belgian Driving License Exam Prep",
    description: "Master your Belgian driving license with comprehensive exam preparation.",
    images: ['/images/logo.png'],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'ReadyRoad',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ErrorBoundary>
          <LanguageProvider>
            <AuthProvider>
              <Navbar />
              {children}
              <Toaster position="top-right" richColors />
            </AuthProvider>
          </LanguageProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
